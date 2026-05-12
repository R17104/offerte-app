export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/ui'
import QuoteEditForm from '@/components/quotes/QuoteEditForm'

type Props = { params: Promise<{ id: string }> }

const STATUS_WARNINGS: Record<string, { text: string; color: string; bg: string; border: string }> = {
  SENT: {
    text: 'Deze offerte heeft status Verstuurd. Wijzigingen zijn direct zichtbaar op de publieke offertepagina van de klant.',
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
  },
  ACCEPTED: {
    text: '⚠️ Deze offerte is geaccepteerd en ondertekend door de klant. Bewerk alleen als je zeker weet wat je doet — wijzigingen zijn direct zichtbaar op de publieke offertepagina.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  REJECTED: {
    text: 'Deze offerte is afgewezen. Je kunt de inhoud nog bewerken.',
    color: '#9ca3af',
    bg: 'var(--bg-elevated)',
    border: 'var(--border)',
  },
  EXPIRED: {
    text: 'Deze offerte is verlopen. Je kunt de inhoud nog bewerken.',
    color: '#9ca3af',
    bg: 'var(--bg-elevated)',
    border: 'var(--border)',
  },
}

export default async function QuoteEditPage({ params }: Props) {
  const { id } = await params

  const [quote, products] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!quote) notFound()

  const warning = STATUS_WARNINGS[quote.status]

  return (
    <PageContainer>
      <PageHeader
        title="Offerte bewerken"
        back={{ href: `/quotes/${id}`, label: quote.quoteNumber }}
      />

      {warning && (
        <div style={{
          background: warning.bg,
          border: `1px solid ${warning.border}`,
          borderRadius: 8,
          padding: '10px 16px',
          fontSize: 13,
          color: warning.color,
          marginBottom: 20,
        }}>
          {warning.text}
        </div>
      )}

      <QuoteEditForm
        quoteId={id}
        initialData={{
          title: quote.title,
          notes: quote.notes,
          includedItems: quote.includedItems,
          termsText: quote.termsText,
          validUntil: quote.validUntil,
          discountAmount: quote.discountAmount,
          lines: quote.lines.map((l) => ({
            name: l.name,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            productId: l.productId,
          })),
        }}
        products={products}
      />
    </PageContainer>
  )
}
