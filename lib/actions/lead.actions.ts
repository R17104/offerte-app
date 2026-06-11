'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { LeadStatus, HouseType } from '@prisma/client'
import { calculateQuoteTotals } from '@/lib/utils'

export type LeadImportRow = {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  street?: string
  houseNumber?: string
  postalCode?: string
  city?: string
  source?: string
}

export async function importLeads(rows: LeadImportRow[], source: string) {
  const { userId } = await verifySession()
  await prisma.lead.createMany({
    data: rows.map((r) => ({
      firstName:   r.firstName,
      lastName:    r.lastName,
      email:       r.email    || null,
      phone:       r.phone    || null,
      street:      r.street   || null,
      houseNumber: r.houseNumber || null,
      postalCode:  r.postalCode  || null,
      city:        r.city        || null,
      source:      r.source || source,
      createdById: userId,
    })),
    skipDuplicates: false,
  })
  revalidatePath('/leads')
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { userId } = await verifySession()
  await prisma.lead.update({
    where: { id: leadId, createdById: userId },
    data: { status },
  })
  revalidatePath('/leads')
  revalidatePath(`/leads/${leadId}`)
}

export async function addLeadNote(leadId: string, content: string) {
  const { userId } = await verifySession()
  await prisma.leadNote.create({
    data: { content, leadId, authorId: userId },
  })
  revalidatePath(`/leads/${leadId}`)
}

export async function deleteLeadNote(noteId: string, leadId: string) {
  const { userId } = await verifySession()
  await prisma.leadNote.delete({
    where: { id: noteId, authorId: userId },
  })
  revalidatePath(`/leads/${leadId}`)
}

export async function archiveLead(leadId: string) {
  const { userId } = await verifySession()
  await prisma.lead.update({
    where: { id: leadId, createdById: userId },
    data: { archivedAt: new Date() },
  })
  revalidatePath('/leads')
  redirect('/leads')
}

export async function updateLead(leadId: string, data: LeadImportRow) {
  const { userId } = await verifySession()
  await prisma.lead.update({
    where: { id: leadId, createdById: userId },
    data: {
      firstName:   data.firstName,
      lastName:    data.lastName,
      email:       data.email    || null,
      phone:       data.phone    || null,
      street:      data.street   || null,
      houseNumber: data.houseNumber || null,
      postalCode:  data.postalCode  || null,
      city:        data.city        || null,
    },
  })
  revalidatePath('/leads')
  revalidatePath(`/leads/${leadId}`)
  redirect(`/leads/${leadId}`)
}

export async function deleteLead(leadId: string) {
  const { userId } = await verifySession()
  await prisma.lead.delete({
    where: { id: leadId, createdById: userId },
  })
  revalidatePath('/leads')
  redirect('/leads')
}

export async function updateFollowUp(leadId: string, date: string | null) {
  await verifySession()
  await prisma.lead.update({
    where: { id: leadId },
    data: { followUpAt: date ? new Date(date) : null },
  })
  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/')
}

export async function assignLead(leadId: string, assignedToId: string | null) {
  await verifySession()
  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId },
  })
  revalidatePath(`/leads/${leadId}`)
}

export async function createLead(data: LeadImportRow) {
  const { userId } = await verifySession()
  const lead = await prisma.lead.create({
    data: {
      firstName:   data.firstName,
      lastName:    data.lastName,
      email:       data.email    || null,
      phone:       data.phone    || null,
      street:      data.street   || null,
      houseNumber: data.houseNumber || null,
      postalCode:  data.postalCode  || null,
      city:        data.city        || null,
      source:      'handmatig',
      createdById: userId,
    },
  })
  revalidatePath('/leads')
  redirect(`/leads/${lead.id}`)
}

export async function createLeadFromLanding({
  naam, email, telefoon, postcode, bericht, herkomst,
}: {
  naam: string
  email: string
  telefoon?: string
  postcode?: string
  bericht?: string
  herkomst?: string
}) {
  const parts = naam.trim().split(' ')
  const firstName = parts[0] ?? naam
  const lastName  = parts.slice(1).join(' ') || '-'

  // Find first admin/system user to assign as creator
  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
    ?? await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!systemUser) return

  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName,
      email:    email || null,
      phone:    telefoon || null,
      postalCode: postcode || null,
      source:   herkomst ? `Website – ${herkomst}` : 'Website',
      status:   'NEW',
      createdById: systemUser.id,
    },
  })

  if (bericht?.trim()) {
    await prisma.leadNote.create({
      data: { leadId: lead.id, content: bericht.trim(), authorId: systemUser.id },
    })
  }

  revalidatePath('/leads')
  revalidatePath('/dashboard')
}

export type IntakeFormData = {
  // Persoonlijk
  firstName: string
  lastName: string
  email: string
  phone: string
  street?: string
  houseNumber?: string
  postalCode: string
  city?: string
  // Energieprofiel
  currentMonthlyBill: number
  electricityUsageKwh: number
  hasSolarPanels: boolean
  solarPanelKwp?: number
  electricityFeedbackKwh?: number
  gasUsageM3?: number
  hasHeatPump: boolean
  houseType?: HouseType
  numPersons?: number
  electricityTariff?: number
  feedbackTariff?: number
  // Product
  productId: string
  includeInstallation: boolean
  opmerkingen?: string
}

export async function createLeadWithQuote(data: IntakeFormData): Promise<{ success: boolean; quoteNumber?: string; error?: string }> {
  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
    ?? await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!systemUser) return { success: false, error: 'Geen systeemgebruiker gevonden' }

  const product = await prisma.product.findUnique({ where: { id: data.productId } })
  if (!product) return { success: false, error: 'Product niet gevonden' }

  // Quote number
  const year = new Date().getFullYear()
  const count = await prisma.quote.count({ where: { quoteNumber: { startsWith: `OFT-${year}-` } } })
  const quoteNumber = `OFT-${year}-${String(count + 1).padStart(4, '0')}`

  const lines: { productId?: string; name: string; description?: string; quantity: number; unitPrice: number; vatRate: number }[] = [
    { productId: product.id, name: product.name, description: product.description ?? undefined, quantity: 1, unitPrice: product.unitPrice, vatRate: product.vatRate },
    ...(data.includeInstallation ? [{ name: 'Vakkundige installatie', description: 'Professionele montage en inbedrijfstelling door gecertificeerd installateur', quantity: 1, unitPrice: 1250, vatRate: 21 }] : []),
  ]
  const { subtotal, vatTotal, total } = calculateQuoteTotals(lines, 0)

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)

  // Customer aanmaken
  const customer = await prisma.customer.create({
    data: {
      firstName: data.firstName,
      lastName:  data.lastName,
      email:     data.email,
      phone:     data.phone,
      userId:    systemUser.id,
      addresses: data.postalCode ? {
        create: {
          type:        'DELIVERY',
          street:      data.street      || '',
          houseNumber: data.houseNumber || '',
          postalCode:  data.postalCode,
          city:        data.city        || '',
        },
      } : undefined,
    },
  })

  // Quote aanmaken
  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      title:      `Offerte – ${product.name} – ${data.firstName} ${data.lastName}`,
      status:     'DRAFT',
      validUntil,
      subtotal,
      vatTotal,
      total,
      customerId:   customer.id,
      createdById:  systemUser.id,
      // Energieprofiel
      currentMonthlyBill:    data.currentMonthlyBill,
      electricityUsageKwh:   data.electricityUsageKwh,
      hasSolarPanels:        data.hasSolarPanels,
      solarPanelKwp:         data.solarPanelKwp         ?? null,
      electricityFeedbackKwh: data.electricityFeedbackKwh ?? null,
      gasUsageM3:            data.gasUsageM3            ?? null,
      hasHeatPump:           data.hasHeatPump,
      houseType:             data.houseType             ?? null,
      numPersons:            data.numPersons            ?? null,
      electricityTariff:     data.electricityTariff     ?? 0.28,
      feedbackTariff:        data.feedbackTariff        ?? 0.07,
      includeBatteryAdvice:  product.category === 'BATTERY',
      lines: {
        create: lines.map((l, i) => ({
          sortOrder:   i,
          name:        l.name,
          description: l.description ?? null,
          quantity:    l.quantity,
          unitPrice:   l.unitPrice,
          vatRate:     l.vatRate,
          lineTotal:   l.quantity * l.unitPrice,
          productId:   l.productId,
        })),
      },
    },
  })

  // Lead aanmaken
  const houseTypeLabel: Record<string, string> = { APARTMENT: 'Appartement', TERRACED: 'Tussenwoning', CORNER: 'Hoekwoning', DETACHED: 'Vrijstaand' }
  const lead = await prisma.lead.create({
    data: {
      firstName:   data.firstName,
      lastName:    data.lastName,
      email:       data.email,
      phone:       data.phone,
      street:      data.street      || null,
      houseNumber: data.houseNumber || null,
      postalCode:  data.postalCode,
      city:        data.city        || null,
      source:      'Website – offerte aanvraag',
      status:      'NEW',
      createdById: systemUser.id,
      quoteId:     quote.id,
    },
  })

  // LeadNote met samenvatting
  const noteLines = [
    `📋 Offerte aanvraag via website`,
    ``,
    `Product: ${product.name} (€${product.unitPrice.toLocaleString('nl-NL')} excl. BTW)`,
    data.includeInstallation ? `Installatie: ja (+€1.250 excl. BTW)` : `Installatie: nee (alleen product)`,
    `Offertenummer: ${quoteNumber}`,
    ``,
    `Huidig maandtermijn: €${data.currentMonthlyBill}/mnd`,
    `Stroomverbruik: ${data.electricityUsageKwh} kWh/jaar`,
    data.hasSolarPanels
      ? `Zonnepanelen: ja – ${data.solarPanelKwp ?? '?'} kWp, ${data.electricityFeedbackKwh ?? '?'} kWh teruglevering/jaar`
      : `Zonnepanelen: nee`,
    data.gasUsageM3 ? `Gasverbruik: ${data.gasUsageM3} m³/jaar` : null,
    `Warmtepomp: ${data.hasHeatPump ? 'ja' : 'nee'}`,
    data.houseType ? `Type woning: ${houseTypeLabel[data.houseType] ?? data.houseType}` : null,
    data.numPersons ? `Aantal personen: ${data.numPersons}` : null,
    data.opmerkingen ? `\nOpmerking: ${data.opmerkingen}` : null,
  ].filter(Boolean).join('\n')

  await prisma.leadNote.create({
    data: { leadId: lead.id, content: noteLines, authorId: systemUser.id },
  })

  revalidatePath('/leads')
  revalidatePath('/dashboard')
  return { success: true, quoteNumber }
}

// ── Bulk actions ──────────────────────────────────────────────────────────────

export async function bulkDeleteLeads(ids: string[]): Promise<void> {
  const { userId } = await verifySession()
  if (!ids.length) return
  await prisma.leadNote.deleteMany({ where: { leadId: { in: ids } } })
  await prisma.lead.deleteMany({ where: { id: { in: ids }, createdById: userId } })
  revalidatePath('/leads')
}

export async function bulkArchiveLeads(ids: string[]): Promise<void> {
  const { userId } = await verifySession()
  if (!ids.length) return
  await prisma.lead.updateMany({ where: { id: { in: ids }, createdById: userId }, data: { archivedAt: new Date() } })
  revalidatePath('/leads')
}

export async function bulkUpdateLeadStatus(ids: string[], status: LeadStatus): Promise<void> {
  const { userId } = await verifySession()
  if (!ids.length) return
  await prisma.lead.updateMany({ where: { id: { in: ids }, createdById: userId }, data: { status } })
  revalidatePath('/leads')
}

export async function convertLeadToQuote(leadId: string): Promise<{ quoteId: string }> {
  const { userId } = await verifySession()

  const lead = await prisma.lead.findUnique({ where: { id: leadId } })
  if (!lead) throw new Error('Lead niet gevonden')

  // Already linked — return existing quote
  if (lead.quoteId) return { quoteId: lead.quoteId }

  // Find or create customer
  const existingCustomer = lead.email
    ? await prisma.customer.findFirst({ where: { email: lead.email } })
    : null

  let customerId: string
  if (existingCustomer) {
    customerId = existingCustomer.id
  } else {
    const customer = await prisma.customer.create({
      data: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email ?? null,
        phone: lead.phone ?? null,
        userId,
        ...(lead.postalCode ? {
          addresses: {
            create: {
              type: 'CORRESPONDENCE' as const,
              street: lead.street ?? '',
              houseNumber: lead.houseNumber ?? '',
              postalCode: lead.postalCode,
              city: lead.city ?? '',
            },
          },
        } : {}),
      },
    })
    customerId = customer.id
  }

  // Generate quote number
  const year = new Date().getFullYear()
  const count = await prisma.quote.count({ where: { quoteNumber: { startsWith: `OFT-${year}-` } } })
  const quoteNumber = `OFT-${year}-${String(count + 1).padStart(4, '0')}`

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      title: `Offerte ${lead.firstName} ${lead.lastName}`,
      status: 'DRAFT',
      customerId,
      createdById: userId,
      validUntil,
      subtotal: 0,
      vatTotal: 0,
      total: 0,
      discountAmount: 0,
    },
  })

  await prisma.lead.update({
    where: { id: leadId },
    data: { quoteId: quote.id },
  })

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/quotes')
  revalidatePath('/dashboard')

  return { quoteId: quote.id }
}
