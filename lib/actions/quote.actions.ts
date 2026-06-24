'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { calculateQuoteTotals } from '@/lib/utils'
import { verifySession, quoteAccessFilter } from '@/lib/dal'
import { withQuoteNumber } from '@/lib/quote-number'
import { QuoteType, FinancingType, HouseType } from '@prisma/client'

// ── Types ────────────────────────────────────────────────────────────────────

export type QuoteLineInput = {
  productId?: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export type EnergyProfile = {
  quoteType: QuoteType
  financingType?: FinancingType | null
  loanInterestRate: number
  loanTermYears: number
  subsidyAmount: number
  hasBtwReturn: boolean
  hasSolarPanels: boolean
  solarPanelKwp?: number | null
  solarProductionKwh?: number | null
  electricityUsageKwh?: number | null
  electricityFeedbackKwh?: number | null
  gasUsageM3?: number | null
  electricityTariff: number
  feedbackTariff: number
  gasTariff: number
  feedInCostTariff: number
  emsAnnualRevenueEur: number
  currentMonthlyBill: number
  hasHeatPump: boolean
  includeBatteryAdvice: boolean
  numPersons?: number | null
  houseType?: HouseType | null
  buildYear?: number | null
  houseSizeSqm?: number | null
}

export type CreateQuoteInput = {
  customerId: string
  title: string
  notes?: string
  includedItems?: string
  validUntil?: string
  discountAmount: number
  lines: QuoteLineInput[]
  energy: EnergyProfile
}

export type AcceptQuoteInput = {
  firstName: string
  lastName: string
  dateOfBirth: string
  iban?: string
  agreedToTerms: boolean
  signatureData: string
  ipAddress?: string
  acceptanceType?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Stuurt een interne notificatie naar maker + toegewezen verkoper. Mag nooit
// de acceptatie/afwijzing zelf laten falen.
async function notifyQuoteOutcome(quoteId: string, outcome: 'accepted' | 'rejected') {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: {
        title: true,
        quoteNumber: true,
        total: true,
        customer: { select: { firstName: true, lastName: true } },
        createdBy: { select: { email: true } },
        assignedTo: { select: { email: true } },
      },
    })
    if (!quote) return

    const to = [...new Set([quote.createdBy.email, quote.assignedTo?.email].filter((e): e is string => !!e))]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'

    const { sendQuoteStatusNotification } = await import('@/lib/email')
    await sendQuoteStatusNotification({
      to,
      outcome,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      quoteTitle: quote.title,
      quoteNumber: quote.quoteNumber,
      quoteTotal: new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(quote.total),
      dashboardUrl: `${baseUrl}/quotes/${quoteId}`,
    })
  } catch (e) {
    console.error('Notificatie-mail versturen mislukt:', e)
  }
}

// Stuurt de klant een bevestiging met de getekende offerte; vraagt om foto's
// als die nog ontbreken. Mag de acceptatie nooit laten falen.
async function notifyCustomerAccepted(quoteId: string, token: string) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: {
        title: true,
        quoteNumber: true,
        total: true,
        meterkastPhotoUrl: true,
        batterijLocatiePhotoUrl: true,
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    })
    if (!quote?.customer.email) return

    const missingPhotos: string[] = []
    if (!quote.meterkastPhotoUrl) missingPhotos.push('een foto van de meterkast')
    if (!quote.batterijLocatiePhotoUrl) missingPhotos.push('een foto van de batterijlocatie')

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'
    const { sendSignedQuoteEmail } = await import('@/lib/email')
    await sendSignedQuoteEmail({
      to: quote.customer.email,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      quoteTitle: quote.title,
      quoteNumber: quote.quoteNumber,
      quoteTotal: new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(quote.total),
      quoteUrl: `${baseUrl}/offerte/${token}`,
      missingPhotos,
    })
  } catch (e) {
    console.error('Klant-bevestigingsmail versturen mislukt:', e)
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createQuote(input: CreateQuoteInput): Promise<{ id: string }> {
  const { userId } = await verifySession()
  const { customerId, title, notes, includedItems, validUntil, discountAmount, lines, energy } = input

  if (!title || lines.length === 0) {
    throw new Error('Titel en minimaal één productregel zijn verplicht')
  }

  const { subtotal, vatTotal, total } = calculateQuoteTotals(lines, discountAmount)

  const quote = await withQuoteNumber((quoteNumber) => prisma.quote.create({
    data: {
      quoteNumber,
      title,
      notes: notes || null,
      includedItems: includedItems || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      discountAmount,
      subtotal,
      vatTotal,
      total,
      status: 'DRAFT',
      customerId,
      createdById: userId,
      // Energieprofiel
      ...energy,
      lines: {
        create: lines.map((l, i) => ({
          sortOrder: i,
          name: l.name,
          description: l.description || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
          lineTotal: l.quantity * l.unitPrice * (1 + l.vatRate / 100),
          productId: l.productId || null,
        })),
      },
    },
  }))

  return { id: quote.id }
}

export type UpdateQuoteInput = {
  title: string
  notes?: string
  introText?: string
  includedItems?: string
  termsText?: string
  validUntil?: string
  discountAmount: number
  reservationOptionEnabled?: boolean
  lines: QuoteLineInput[]
  energy?: Partial<EnergyProfile>
}

export async function updateQuote(quoteId: string, input: UpdateQuoteInput): Promise<void> {
  const session = await verifySession()
  const { title, notes, introText, includedItems, termsText, validUntil, discountAmount, reservationOptionEnabled, lines, energy } = input

  if (!title || lines.length === 0) {
    throw new Error('Titel en minimaal één productregel zijn verplicht')
  }

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, ...quoteAccessFilter(session) },
    select: { id: true, status: true },
  })
  if (!quote) throw new Error('Offerte niet gevonden')
  if (quote.status === 'ACCEPTED') throw new Error('Geaccepteerde offertes kunnen niet worden gewijzigd')

  const { subtotal, vatTotal, total } = calculateQuoteTotals(lines, discountAmount)

  await prisma.$transaction([
    prisma.quoteLine.deleteMany({ where: { quoteId } }),
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        title,
        notes: notes || null,
        introText: introText || null,
        includedItems: includedItems || null,
        termsText: termsText || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        discountAmount,
        reservationOptionEnabled: reservationOptionEnabled ?? false,
        subtotal,
        vatTotal,
        total,
        ...(energy ?? {}),
        lines: {
          create: lines.map((l, i) => ({
            sortOrder: i,
            name: l.name,
            description: l.description || null,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            lineTotal: l.quantity * l.unitPrice * (1 + l.vatRate / 100),
            productId: l.productId || null,
          })),
        },
      },
    }),
  ])

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  redirect(`/quotes/${quoteId}`)
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  const session = await verifySession()

  const allowed = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
  if (!allowed.includes(status)) throw new Error('Ongeldige status')

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, ...quoteAccessFilter(session) },
    select: { id: true, status: true },
  })
  if (!quote) throw new Error('Offerte niet gevonden')
  if (quote.status === 'ACCEPTED') throw new Error('Geaccepteerde offertes kunnen niet worden gewijzigd')

  const data: Record<string, unknown> = { status }
  if (status === 'SENT')     data.sentAt     = new Date()
  if (status === 'ACCEPTED') data.acceptedAt = new Date()
  if (status === 'REJECTED') data.rejectedAt = new Date()

  await prisma.quote.update({ where: { id: quoteId }, data })

  revalidatePath(`/quotes/${quoteId}`)
  redirect(`/quotes/${quoteId}`)
}

export async function acceptQuoteByToken(token: string, input: AcceptQuoteInput) {
  if (!input.agreedToTerms) {
    throw new Error('Je moet akkoord gaan met de algemene voorwaarden')
  }
  if (!input.signatureData) {
    throw new Error('Een handtekening is verplicht')
  }

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true, validUntil: true },
  })

  if (!quote) throw new Error('Offerte niet gevonden')
  if (quote.status === 'ACCEPTED') throw new Error('Offerte is al geaccepteerd')
  if (quote.status === 'REJECTED') throw new Error('Offerte is al afgewezen')
  if (quote.status === 'EXPIRED')  throw new Error('Offerte is verlopen')
  if (quote.validUntil && quote.validUntil < new Date()) {
    throw new Error('Deze offerte is verlopen. Neem contact met ons op voor een nieuwe offerte.')
  }

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    }),
    prisma.quoteAcceptance.create({
      data: {
        quoteId:        quote.id,
        firstName:      input.firstName,
        lastName:       input.lastName,
        dateOfBirth:    new Date(input.dateOfBirth),
        iban:           input.iban || null,
        agreedToTerms:  input.agreedToTerms,
        signatureData:  input.signatureData,
        ipAddress:      input.ipAddress || null,
        acceptanceType: input.acceptanceType || null,
      },
    }),
  ])

  await notifyQuoteOutcome(quote.id, 'accepted')
  await notifyCustomerAccepted(quote.id, token)

  redirect(`/offerte/${token}/bevestiging?type=accepted`)
}

// ── Archive / unarchive ───────────────────────────────────────────────────────

export async function archiveQuote(id: string) {
  const session = await verifySession()
  await prisma.quote.updateMany({
    where: { id, ...quoteAccessFilter(session) },
    data: { archivedAt: new Date() },
  })
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
}

export async function unarchiveQuote(id: string) {
  const session = await verifySession()
  await prisma.quote.updateMany({
    where: { id, ...quoteAccessFilter(session) },
    data: { archivedAt: null },
  })
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteQuote(id: string) {
  const session = await verifySession()

  const quote = await prisma.quote.findFirst({
    where: { id, ...quoteAccessFilter(session) },
    select: { id: true, status: true },
  })
  if (!quote) throw new Error('Offerte niet gevonden')
  if (quote.status === 'ACCEPTED') throw new Error('Geaccepteerde offertes kunnen niet worden verwijderd')

  await prisma.$transaction([
    prisma.quoteAcceptance.deleteMany({ where: { quoteId: id } }),
    prisma.quoteLine.deleteMany({ where: { quoteId: id } }),
    prisma.quote.delete({ where: { id } }),
  ])

  revalidatePath('/quotes')
  redirect('/quotes')
}

// ── Bulk actions ─────────────────────────────────────────────────────────────

export async function bulkArchiveQuotes(ids: string[]): Promise<void> {
  const session = await verifySession()
  if (!ids.length) return
  await prisma.quote.updateMany({ where: { id: { in: ids }, ...quoteAccessFilter(session) }, data: { archivedAt: new Date() } })
  revalidatePath('/quotes')
}

export async function bulkUnarchiveQuotes(ids: string[]): Promise<void> {
  const session = await verifySession()
  if (!ids.length) return
  await prisma.quote.updateMany({ where: { id: { in: ids }, ...quoteAccessFilter(session) }, data: { archivedAt: null } })
  revalidatePath('/quotes')
}

export async function bulkExpireQuotes(ids: string[]): Promise<void> {
  const session = await verifySession()
  if (!ids.length) return
  await prisma.quote.updateMany({ where: { id: { in: ids }, ...quoteAccessFilter(session), status: { not: 'ACCEPTED' } }, data: { status: 'EXPIRED' } })
  revalidatePath('/quotes')
}

export async function bulkDeleteQuotes(ids: string[]): Promise<void> {
  const session = await verifySession()
  if (!ids.length) return
  const owned = await prisma.quote.findMany({ where: { id: { in: ids }, ...quoteAccessFilter(session), status: { not: 'ACCEPTED' } }, select: { id: true } })
  const ownedIds = owned.map((q) => q.id)
  if (!ownedIds.length) return
  await prisma.$transaction([
    prisma.quoteAcceptance.deleteMany({ where: { quoteId: { in: ownedIds } } }),
    prisma.quoteLine.deleteMany({ where: { quoteId: { in: ownedIds } } }),
    prisma.quote.deleteMany({ where: { id: { in: ownedIds } } }),
  ])
  revalidatePath('/quotes')
}

// ── Public token actions ──────────────────────────────────────────────────────

export async function rejectQuoteByToken(token: string) {
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true },
  })

  if (!quote) throw new Error('Offerte niet gevonden')
  if (quote.status === 'ACCEPTED') throw new Error('Offerte is al geaccepteerd')
  if (quote.status === 'REJECTED') throw new Error('Offerte is al afgewezen')

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: 'REJECTED', rejectedAt: new Date() },
  })

  await notifyQuoteOutcome(quote.id, 'rejected')

  redirect(`/offerte/${token}/bevestiging?type=rejected`)
}

export async function assignQuote(quoteId: string, assignedToId: string | null) {
  const session = await verifySession()
  const result = await prisma.quote.updateMany({
    where: { id: quoteId, ...quoteAccessFilter(session) },
    data: { assignedToId },
  })
  if (result.count === 0) throw new Error('Offerte niet gevonden of geen toegang')
  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
}

export async function sendQuoteByEmail(quoteId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await verifySession()
    const sender = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } })

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, ...quoteAccessFilter(session) },
      include: { customer: true },
    })
    if (!quote) return { ok: false, error: 'Offerte niet gevonden' }
    if (!quote.customer.email) return { ok: false, error: 'Klant heeft geen e-mailadres' }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return { ok: false, error: 'E-mail niet geconfigureerd, voeg GMAIL_USER en GMAIL_APP_PASSWORD toe in Vercel' }

    const { sendQuoteEmail } = await import('@/lib/email')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'

    await sendQuoteEmail({
      to: quote.customer.email,
      cc: sender?.email ?? undefined,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      senderName: sender?.name ?? sender?.email ?? 'Bespaarhulp Friesland',
      quoteTitle: quote.title,
      quoteNumber: quote.quoteNumber,
      quoteUrl: `${baseUrl}/offerte/${quote.publicToken}`,
    })

    await prisma.quote.update({ where: { id: quoteId }, data: { sentAt: new Date() } })
    revalidatePath(`/quotes/${quoteId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Versturen mislukt' }
  }
}

// ── Dupliceren ─────────────────────────────────────────────────────────────────

export async function duplicateQuote(quoteId: string) {
  const session = await verifySession()
  const orig = await prisma.quote.findFirst({
    where: { id: quoteId, ...quoteAccessFilter(session) },
    include: { lines: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!orig) throw new Error('Offerte niet gevonden of geen toegang')

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)

  const copy = await withQuoteNumber((quoteNumber) => prisma.quote.create({
    data: {
      quoteNumber,
      title: `${orig.title} (kopie)`,
      notes: orig.notes,
      introText: orig.introText,
      includedItems: orig.includedItems,
      termsText: orig.termsText,
      reservationOptionEnabled: orig.reservationOptionEnabled,
      status: 'DRAFT',
      validUntil,
      discountAmount: orig.discountAmount,
      subtotal: orig.subtotal,
      vatTotal: orig.vatTotal,
      total: orig.total,
      customerId: orig.customerId,
      createdById: session.userId,
      assignedToId: orig.assignedToId,
      // Energieprofiel meekopiëren
      currentMonthlyBill: orig.currentMonthlyBill,
      electricityUsageKwh: orig.electricityUsageKwh,
      hasSolarPanels: orig.hasSolarPanels,
      solarPanelKwp: orig.solarPanelKwp,
      electricityFeedbackKwh: orig.electricityFeedbackKwh,
      gasUsageM3: orig.gasUsageM3,
      hasHeatPump: orig.hasHeatPump,
      houseType: orig.houseType,
      numPersons: orig.numPersons,
      electricityTariff: orig.electricityTariff,
      feedbackTariff: orig.feedbackTariff,
      includeBatteryAdvice: orig.includeBatteryAdvice,
      lines: {
        create: orig.lines.map((l) => ({
          sortOrder: l.sortOrder,
          name: l.name,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
          lineTotal: l.lineTotal,
          productId: l.productId,
        })),
      },
    },
  }))

  revalidatePath('/quotes')
  redirect(`/quotes/${copy.id}/edit`)
}

// ── Geldigheid verlengen ─────────────────────────────────────────────────────

export async function extendQuoteValidity(quoteId: string, days = 30) {
  const session = await verifySession()
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, ...quoteAccessFilter(session) }, select: { validUntil: true } })
  if (!quote) throw new Error('Offerte niet gevonden of geen toegang')
  const base = quote.validUntil && quote.validUntil > new Date() ? quote.validUntil : new Date()
  const newDate = new Date(base)
  newDate.setDate(newDate.getDate() + days)
  await prisma.quote.update({ where: { id: quoteId }, data: { validUntil: newDate } })
  revalidatePath(`/quotes/${quoteId}`)
}

// ── Herinnering ──────────────────────────────────────────────────────────────

export async function setReminderDays(quoteId: string, days: number | null) {
  const session = await verifySession()
  const result = await prisma.quote.updateMany({
    where: { id: quoteId, ...quoteAccessFilter(session) },
    // Bij wijzigen reset de "verzonden"-markering zodat de herinnering opnieuw kan afgaan
    data: { reminderDays: days && days > 0 ? Math.round(days) : null, reminderSentAt: null },
  })
  if (result.count === 0) throw new Error('Offerte niet gevonden of geen toegang')
  revalidatePath(`/quotes/${quoteId}`)
}

// Stuurt nu direct een herinnering naar de klant (handmatig vanaf de knop).
export async function sendQuoteReminder(quoteId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await verifySession()
    const sender = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } })
    const quote = await prisma.quote.findFirst({ where: { id: quoteId, ...quoteAccessFilter(session) }, include: { customer: true } })
    if (!quote) return { ok: false, error: 'Offerte niet gevonden' }
    if (!quote.customer.email) return { ok: false, error: 'Klant heeft geen e-mailadres' }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return { ok: false, error: 'E-mail niet geconfigureerd' }

    const { sendQuoteReminderEmail } = await import('@/lib/email')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'
    await sendQuoteReminderEmail({
      to: quote.customer.email,
      cc: sender?.email ?? undefined,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      quoteTitle: quote.title,
      quoteNumber: quote.quoteNumber,
      quoteUrl: `${baseUrl}/offerte/${quote.publicToken}`,
    })
    await prisma.quote.update({ where: { id: quoteId }, data: { reminderSentAt: new Date() } })
    revalidatePath(`/quotes/${quoteId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Versturen mislukt' }
  }
}
