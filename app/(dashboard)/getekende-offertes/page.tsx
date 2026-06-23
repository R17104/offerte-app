export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import {
  PageContainer,
  PageHeader,
  Card,
  Table,
  Thead,
  Tbody,
  Th,
  Td,
  Tr,
  EmptyState,
} from '@/components/ui'
import { formatDate, formatCurrency } from '@/lib/utils'
import { verifySession } from '@/lib/dal'

export default async function GetekendeOffertesPage() {
  const { userId, role } = await verifySession()

  const quotes = await prisma.quote.findMany({
    where: {
      status: 'ACCEPTED',
      ...(role !== 'ADMIN' && { createdById: userId }),
    },
    include: {
      customer: true,
      acceptance: true,
    },
    orderBy: { acceptedAt: 'desc' },
  })

  return (
    <PageContainer>
      <PageHeader
        title="Getekende offertes"
        description={`${quotes.length} ondertekende offerte${quotes.length !== 1 ? 's' : ''}`}
      />

      <Card>
        {quotes.length === 0 ? (
          <EmptyState
            title="Nog geen getekende offertes"
            description="Wanneer een klant een offerte accepteert en ondertekent, verschijnt die hier."
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Offertenummer</Th>
                <Th>Klant</Th>
                <Th>Ondertekend door</Th>
                <Th>Geaccepteerd op</Th>
                <Th>Totaal</Th>
                <Th>Handtekening</Th>
              </tr>
            </Thead>
            <Tbody>
              {quotes.map((q) => (
                <Tr key={q.id} href={`/quotes/${q.id}`}>
                  <Td>
                    <span style={{ fontWeight: 600 }}>{q.quoteNumber}</span>
                  </Td>
                  <Td>
                    {q.customer.firstName} {q.customer.lastName}
                  </Td>
                  <Td>
                    {q.acceptance ? `${q.acceptance.firstName} ${q.acceptance.lastName}` : '-'}
                  </Td>
                  <Td>{formatDate(q.acceptedAt)}</Td>
                  <Td>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(q.total)}
                    </span>
                  </Td>
                  <Td>
                    {q.acceptance?.signatureData ? (
                      <a
                        href={`/offerte/${q.publicToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 13,
                          color: 'var(--accent)',
                          fontWeight: 500,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        Bekijk & download PDF
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>-</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {quotes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {quotes
            .filter((q) => q.acceptance?.signatureData)
            .map((q) => (
              <SignedQuotePreview key={q.id} q={q} />
            ))}
        </div>
      )}
    </PageContainer>
  )
}

type QuoteWithAcceptance = Awaited<ReturnType<typeof prisma.quote.findMany<{
  include: { customer: true; acceptance: true }
}>>>[number]

function SignedQuotePreview({ q }: { q: QuoteWithAcceptance }) {
  if (!q.acceptance?.signatureData) return null

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
          {q.quoteNumber}, {q.customer.firstName} {q.customer.lastName}
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
          Ondertekend door {q.acceptance.firstName} {q.acceptance.lastName} op {formatDate(q.acceptedAt)}
        </p>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
        }}
      >
        <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Handtekening
        </p>
        <img
          src={q.acceptance.signatureData}
          alt={`Handtekening ${q.acceptance.firstName} ${q.acceptance.lastName}`}
          style={{ display: 'block', maxWidth: 240, height: 'auto', maxHeight: 80 }}
        />
      </div>

      <a
        href={`/offerte/${q.publicToken}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '8px 18px',
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontSize: 13.5,
          fontWeight: 500,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Volledige offerte & PDF
      </a>
    </div>
  )
}
