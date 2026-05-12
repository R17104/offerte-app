export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/ui'
import QuoteEditForm from '@/components/quotes/QuoteEditForm'

type Props = { params: Promise<{ id: string }> }

const EDITABLE_STATUSES = ['DRAFT', 'SENT']

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
  if (!EDITABLE_STATUSES.includes(quote.status)) notFound()

  return (
    <PageContainer>
      <PageHeader
        title="Offerte bewerken"
        back={{ href: `/quotes/${id}`, label: quote.quoteNumber }}
      />

      {quote.status === 'SENT' && (
        <div style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 8,
          padding: '10px 16px',
          fontSize: 13,
          color: '#60a5fa',
          marginBottom: 20,
        }}>
          Let op: deze offerte heeft status <strong>Verstuurd</strong>. Wijzigingen zijn direct zichtbaar op de publieke offertepagina van de klant.
        </div>
      )}

      <QuoteEditForm
        quoteId={id}
        initialData={{
          title: quote.title,
          notes: quote.notes,
          includedItems: quote.includedItems,
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
