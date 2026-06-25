'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifySession, leadAccessFilter } from '@/lib/dal'
import { LeadStatus, HouseType } from '@prisma/client'
import { calculateQuoteTotals } from '@/lib/utils'
import { withQuoteNumber } from '@/lib/quote-number'
import { checkPublicForm, isValidEmail } from '@/lib/public-form-guard'
import { sendTikTokEvent } from '@/lib/tiktok-capi'
import { headers, cookies } from 'next/headers'
import crypto from 'crypto'

// Stuurt een TikTok Lead-event (Events API), alleen met marketingtoestemming
// en als de access token is ingesteld. Mag de aanvraag nooit laten falen.
async function sendTikTokLeadSafe(opts: { email?: string | null; phone?: string | null; eventId?: string }) {
  try {
    if (!process.env.TIKTOK_ACCESS_TOKEN) return
    const c = await cookies()
    if (c.get('marketing_consent')?.value !== '1') return
    const h = await headers()
    await sendTikTokEvent({
      // Hetzelfde event_id als de browser-pixel → TikTok dedupliceert de conversie.
      eventId: opts.eventId || crypto.randomUUID(),
      email: opts.email ?? undefined,
      phone: opts.phone ?? undefined,
      ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || undefined,
      userAgent: h.get('user-agent') || undefined,
      url: h.get('referer') || undefined,
    })
  } catch (e) {
    console.error('TikTok lead-event mislukt:', e)
  }
}

// Bevestiging naar de aanvrager; mag de aanvraag zelf nooit laten falen.
async function sendConfirmationSafe(to: string, name: string, quoteNumber?: string) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return
    const { sendLeadConfirmationEmail } = await import('@/lib/email')
    await sendLeadConfirmationEmail({ to, name, quoteNumber })
  } catch (e) {
    console.error('Bevestigingsmail versturen mislukt:', e)
  }
}

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

export type ImportDuplicate = {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  reason: string
}
export type ImportResult = { imported: number; duplicates: ImportDuplicate[] }

export async function importLeads(rows: LeadImportRow[], source: string): Promise<ImportResult> {
  const { userId } = await verifySession()
  const normPhone = (p?: string | null) => (p ?? '').replace(/\D/g, '')

  // Bestaande leads ophalen om dubbele e-mails/telefoons te herkennen
  const existing = await prisma.lead.findMany({ where: { archivedAt: null }, select: { email: true, phone: true } })
  const existEmails = new Set(existing.map((l) => (l.email ?? '').toLowerCase()).filter(Boolean))
  const existPhones = new Set(existing.map((l) => normPhone(l.phone)).filter(Boolean))

  const seenEmails = new Set<string>()
  const seenPhones = new Set<string>()
  const toCreate: LeadImportRow[] = []
  const duplicates: ImportDuplicate[] = []

  for (const r of rows) {
    const email = (r.email ?? '').toLowerCase()
    const phone = normPhone(r.phone)
    const dupEmail = !!email && (existEmails.has(email) || seenEmails.has(email))
    const dupPhone = !!phone && (existPhones.has(phone) || seenPhones.has(phone))
    if (dupEmail || dupPhone) {
      duplicates.push({
        firstName: r.firstName, lastName: r.lastName, email: r.email, phone: r.phone,
        reason: dupEmail && dupPhone ? 'e-mail én telefoon bestaan al' : dupEmail ? 'e-mail bestaat al' : 'telefoon bestaat al',
      })
      continue
    }
    if (email) seenEmails.add(email)
    if (phone) seenPhones.add(phone)
    toCreate.push(r)
  }

  if (toCreate.length) {
    await prisma.lead.createMany({
      data: toCreate.map((r) => ({
        firstName:   r.firstName,
        lastName:    r.lastName,
        email:       r.email    || null,
        phone:       r.phone    || null,
        street:      r.street   || null,
        houseNumber: r.houseNumber || null,
        postalCode:  r.postalCode  || null,
        city:        r.city        || null,
        source:      r.source || source,
        createdById:  userId,
        assignedToId: userId, // geïmporteerde leads blijven op het account dat ze importeerde
      })),
    })
  }

  revalidatePath('/leads')
  revalidatePath('/dashboard')
  return { imported: toCreate.length, duplicates }
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
    data: { status },
  })
  if (result.count === 0) throw new Error('Lead niet gevonden of geen toegang')
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

// Logt dat er een WhatsApp-bericht naar de lead is gestuurd (vanuit de knop).
export async function logWhatsAppContact(leadId: string) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
    data: {}, // alleen toegang controleren
  })
  if (result.count === 0) return
  await prisma.leadNote.create({
    data: { content: '📱 WhatsApp-bericht gestuurd', leadId, authorId: session.userId },
  })
  revalidatePath(`/leads/${leadId}`)
}

// Boekt een lead af wegens een foutief/niet-werkend telefoonnummer:
// status -> Verloren, notitie met reden, en uit de actieve lijst (gearchiveerd).
export async function writeOffInvalidNumber(leadId: string) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
    data: { status: 'LOST', archivedAt: new Date() },
  })
  if (result.count === 0) throw new Error('Lead niet gevonden of geen toegang')
  await prisma.leadNote.create({
    data: { content: '📵 Foutief nummer (niet in gebruik) — afgeboekt', leadId, authorId: session.userId },
  })
  revalidatePath('/leads')
  redirect('/leads')
}

// Logt een belpoging / voicemail bij de lead (om belpogingen te tellen).
export async function logVoicemail(leadId: string) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
    data: {},
  })
  if (result.count === 0) return
  await prisma.leadNote.create({
    data: { content: '📞 Voicemail ingesproken (belpoging)', leadId, authorId: session.userId },
  })
  revalidatePath(`/leads/${leadId}`)
}

export async function deleteLeadNote(noteId: string, leadId: string) {
  const session = await verifySession()
  // Auteur mag eigen notities verwijderen; admin mag alle notities verwijderen.
  await prisma.leadNote.deleteMany({
    where: { id: noteId, ...(session.role === 'ADMIN' ? {} : { authorId: session.userId }) },
  })
  revalidatePath(`/leads/${leadId}`)
}

export async function archiveLead(leadId: string) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
    data: { archivedAt: new Date() },
  })
  if (result.count === 0) throw new Error('Lead niet gevonden of geen toegang')
  revalidatePath('/leads')
  redirect('/leads')
}

export async function updateLead(leadId: string, data: LeadImportRow) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
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
  if (result.count === 0) throw new Error('Lead niet gevonden of geen toegang')
  revalidatePath('/leads')
  revalidatePath(`/leads/${leadId}`)
  redirect(`/leads/${leadId}`)
}

export async function deleteLead(leadId: string) {
  const session = await verifySession()
  const result = await prisma.lead.deleteMany({
    where: { id: leadId, ...leadAccessFilter(session) },
  })
  if (result.count === 0) throw new Error('Lead niet gevonden of geen toegang')
  revalidatePath('/leads')
  redirect('/leads')
}

export async function updateFollowUp(leadId: string, date: string | null) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
    data: { followUpAt: date ? new Date(date) : null },
  })
  if (result.count === 0) throw new Error('Lead niet gevonden of geen toegang')
  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/')
}

export async function assignLead(leadId: string, assignedToId: string | null) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
    data: { assignedToId },
  })
  if (result.count === 0) throw new Error('Lead niet gevonden of geen toegang')
  revalidatePath(`/leads/${leadId}`)
}

export async function setAppointmentPlanner(leadId: string, appointmentPlannedById: string | null) {
  const session = await verifySession()
  const result = await prisma.lead.updateMany({
    where: { id: leadId, ...leadAccessFilter(session) },
    data: { appointmentPlannedById },
  })
  if (result.count === 0) throw new Error('Lead niet gevonden of geen toegang')
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
  naam, email, telefoon, postcode, bericht, herkomst, website, eventId,
}: {
  naam: string
  email?: string
  telefoon?: string
  postcode?: string
  bericht?: string
  herkomst?: string
  website?: string // honeypot, hoort leeg te blijven
  eventId?: string // gedeeld met browser-pixel voor deduplicatie
}) {
  const guard = await checkPublicForm(website)
  if (!guard.allowed) {
    if (guard.silent) return
    throw new Error(guard.error)
  }
  if (!naam.trim()) throw new Error('Vul je naam in')
  // E-mail óf telefoon volstaat (landingspagina vraagt vaak alleen telefoon)
  const hasEmail = !!email && isValidEmail(email)
  const hasPhone = !!telefoon && telefoon.replace(/\D/g, '').length >= 8
  if (!hasEmail && !hasPhone) throw new Error('Vul een telefoonnummer of e-mailadres in')

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

  if (hasEmail) await sendConfirmationSafe(email!, firstName)
  await sendTikTokLeadSafe({ email, phone: telefoon, eventId })

  revalidatePath('/leads')
  revalidatePath('/dashboard')
}

export type WebhookLeadInput = {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  postalCode?: string
  street?: string
  houseNumber?: string
  city?: string
  message?: string
  source: string
}

// Maakt een lead aan vanuit een externe bron (bv. TikTok via webhook).
// Wordt aangeroepen door de webhook-route, die zelf de authenticatie regelt.
export async function createLeadFromWebhook(data: WebhookLeadInput): Promise<{ success: boolean; leadId?: string; error?: string }> {
  if (!data.firstName.trim() && !data.email && !data.phone) {
    return { success: false, error: 'Geen bruikbare leadgegevens ontvangen' }
  }

  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
    ?? await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!systemUser) return { success: false, error: 'Geen systeemgebruiker gevonden' }

  const lead = await prisma.lead.create({
    data: {
      firstName:   data.firstName.trim() || 'Onbekend',
      lastName:    data.lastName.trim() || '-',
      email:       data.email || null,
      phone:       data.phone || null,
      street:      data.street || null,
      houseNumber: data.houseNumber || null,
      postalCode:  data.postalCode || null,
      city:        data.city || null,
      source:      data.source,
      status:      'NEW',
      createdById: systemUser.id,
    },
  })

  if (data.message?.trim()) {
    await prisma.leadNote.create({
      data: { leadId: lead.id, content: data.message.trim(), authorId: systemUser.id },
    })
  }

  if (data.email && isValidEmail(data.email)) {
    await sendConfirmationSafe(data.email, data.firstName.trim() || 'klant')
  }

  revalidatePath('/leads')
  revalidatePath('/tiktok-leads')
  revalidatePath('/dashboard')
  return { success: true, leadId: lead.id }
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
  website?: string // honeypot, hoort leeg te blijven
}

export async function createLeadWithQuote(data: IntakeFormData): Promise<{ success: boolean; quoteNumber?: string; error?: string }> {
  const guard = await checkPublicForm(data.website)
  if (!guard.allowed) {
    // Honeypot-hit: doe alsof het gelukt is zodat bots niets leren.
    if (guard.silent) return { success: true }
    return { success: false, error: guard.error }
  }
  if (!data.firstName?.trim() || !data.lastName?.trim()) return { success: false, error: 'Vul je naam in' }
  if (!isValidEmail(data.email)) return { success: false, error: 'Vul een geldig e-mailadres in' }

  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
    ?? await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!systemUser) return { success: false, error: 'Geen systeemgebruiker gevonden' }

  const product = await prisma.product.findUnique({ where: { id: data.productId } })
  if (!product) return { success: false, error: 'Product niet gevonden' }

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
  const quote = await withQuoteNumber((quoteNumber) => prisma.quote.create({
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
          lineTotal:   l.quantity * l.unitPrice * (1 + l.vatRate / 100),
          productId:   l.productId,
        })),
      },
    },
  }))

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
    `Offertenummer: ${quote.quoteNumber}`,
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

  await sendConfirmationSafe(data.email, data.firstName, quote.quoteNumber)
  await sendTikTokLeadSafe({ email: data.email, phone: data.phone })

  revalidatePath('/leads')
  revalidatePath('/dashboard')
  return { success: true, quoteNumber: quote.quoteNumber }
}

// ── Bulk actions ──────────────────────────────────────────────────────────────

export async function bulkDeleteLeads(ids: string[]): Promise<void> {
  const session = await verifySession()
  if (!ids.length) return
  // Notities verdwijnen automatisch via onDelete: Cascade op LeadNote.
  await prisma.lead.deleteMany({ where: { id: { in: ids }, ...leadAccessFilter(session) } })
  revalidatePath('/leads')
}

export async function bulkArchiveLeads(ids: string[]): Promise<void> {
  const session = await verifySession()
  if (!ids.length) return
  await prisma.lead.updateMany({ where: { id: { in: ids }, ...leadAccessFilter(session) }, data: { archivedAt: new Date() } })
  revalidatePath('/leads')
}

export async function bulkUpdateLeadStatus(ids: string[], status: LeadStatus): Promise<void> {
  const session = await verifySession()
  if (!ids.length) return
  await prisma.lead.updateMany({ where: { id: { in: ids }, ...leadAccessFilter(session) }, data: { status } })
  revalidatePath('/leads')
}

export async function convertLeadToQuote(leadId: string): Promise<{ quoteId: string }> {
  const session = await verifySession()
  const { userId } = session

  const lead = await prisma.lead.findFirst({ where: { id: leadId, ...leadAccessFilter(session) } })
  if (!lead) throw new Error('Lead niet gevonden of geen toegang')

  // Already linked, return existing quote
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

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)

  const quote = await withQuoteNumber((quoteNumber) => prisma.quote.create({
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
  }))

  await prisma.lead.update({
    where: { id: leadId },
    data: { quoteId: quote.id },
  })

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/quotes')
  revalidatePath('/dashboard')

  return { quoteId: quote.id }
}
