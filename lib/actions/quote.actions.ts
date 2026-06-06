'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { calculateQuoteTotals } from '@/lib/utils'
import { verifySession } from '@/lib/dal'
import { QuoteType, FinancingType, HouseType } from '@prisma/client'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.quote.count({
    where: { quoteNumber: { startsWith: `OFT-${year}-` } },
  })
  const seq = String(count + 1).padStart(4, '0')
  return `OFT-${year}-${seq}`
}

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
  solarProductionKwh?: number | null
  electricityUsageKwh?: number | null
  electricityFeedbackKwh?: number | null
  gasUsageM3?: number | null
  electricityTariff: number
  feedbackTariff: number
  gasTariff: number
  feedInCostTariff: number
  emsAnnualRevenueEur: number
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
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createQuote(input: CreateQuoteInput): Promise<{ id: string }> {
  const { userId } = await verifySession()
  const { customerId, title, notes, includedItems, validUntil, discountAmount, lines, energy } = input

  if (!title || lines.length === 0) {
    throw new Error('Titel en minimaal één productregel zijn verplicht')
  }

  const { subtotal, vatTotal, total } = calculateQuoteTotals(lines, discountAmount)
  const quoteNumber = await generateQuoteNumber()

  const quote = await prisma.quote.create({
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
  })

  return { id: quote.id }
}

export type UpdateQuoteInput = {
  title: string
  notes?: string
  includedItems?: string
  termsText?: string
  validUntil?: string
  discountAmount: number
  lines: QuoteLineInput[]
  energy?: Partial<EnergyProfile>
}

export async function updateQuote(quoteId: string, input: UpdateQuoteInput): Promise<void> {
  const { userId } = await verifySession()
  const { title, notes, includedItems, termsText, validUntil, discountAmount, lines, energy } = input

  if (!title || lines.length === 0) {
    throw new Error('Titel en minimaal één productregel zijn verplicht')
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, createdById: userId },
    select: { id: true },
  })
  if (!quote) throw new Error('Offerte niet gevonden')

  const { subtotal, vatTotal, total } = calculateQuoteTotals(lines, discountAmount)

  await prisma.$transaction([
    prisma.quoteLine.deleteMany({ where: { quoteId } }),
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        title,
        notes: notes || null,
        includedItems: includedItems || null,
        termsText: termsText || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        discountAmount,
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
  const { userId } = await verifySession()

  const allowed = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
  if (!allowed.includes(status)) throw new Error('Ongeldige status')

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, createdById: userId },
    select: { id: true },
  })
  if (!quote) throw new Error('Offerte niet gevonden')

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
    select: { id: true, status: true },
  })

  if (!quote) throw new Error('Offerte niet gevonden')
  if (quote.status === 'ACCEPTED') throw new Error('Offerte is al geaccepteerd')
  if (quote.status === 'REJECTED') throw new Error('Offerte is al afgewezen')
  if (quote.status === 'EXPIRED')  throw new Error('Offerte is verlopen')

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    }),
    prisma.quoteAcceptance.create({
      data: {
        quoteId:       quote.id,
        firstName:     input.firstName,
        lastName:      input.lastName,
        dateOfBirth:   new Date(input.dateOfBirth),
        iban:          input.iban || null,
        agreedToTerms: input.agreedToTerms,
        signatureData: input.signatureData,
        ipAddress:     input.ipAddress || null,
      },
    }),
  ])

  redirect(`/offerte/${token}/bevestiging?type=accepted`)
}

// ── Archive / unarchive ───────────────────────────────────────────────────────

export async function archiveQuote(id: string) {
  const { userId } = await verifySession()
  await prisma.quote.update({
    where: { id, createdById: userId },
    data: { archivedAt: new Date() },
  })
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
}

export async function unarchiveQuote(id: string) {
  const { userId } = await verifySession()
  await prisma.quote.update({
    where: { id, createdById: userId },
    data: { archivedAt: null },
  })
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteQuote(id: string) {
  const { userId } = await verifySession()

  const quote = await prisma.quote.findUnique({
    where: { id, createdById: userId },
    select: { id: true },
  })
  if (!quote) throw new Error('Offerte niet gevonden')

  await prisma.quoteAcceptance.deleteMany({ where: { quoteId: id } })
  await prisma.quoteLine.deleteMany({ where: { quoteId: id } })
  await prisma.quote.delete({ where: { id } })

  revalidatePath('/quotes')
  redirect('/quotes')
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

  redirect(`/offerte/${token}/bevestiging?type=rejected`)
}
