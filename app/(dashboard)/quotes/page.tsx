import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  PageContainer, PageHeader, PrimaryButton,
  Card, Table, Thead, Tbody, Tr, Th, Td, EmptyState, Badge,
} from '@/components/ui'
import ConfirmButton from '@/components/ui/ConfirmButton'
import { archiveQuote, unarchiveQuote } from '@/lib/actions/quote.actions'
import { formatDate, formatCurrency, STATUS_META } from '@/lib/utils'

type Props = { searchParams: Promise<{ archived?: string }> }

export default async function QuotesPage({ searchParams }: Props) {
  const { archived } = await searchParams
  const showArchived = archived === '1'

  const [quotes, archivedCount] = await Promise.all([
    prisma.quote.findMany({
      where: showArchived ? { archivedAt: { not: null } } : { archivedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        _count: { select: { lines: true } },
      },
    }),
    prisma.quote.count({ where: { archivedAt: { not: null } } }),
  ])

  return (
    <PageContainer>
      <PageHeader
        title="Offertes"
        description={`${quotes.length} offerte${quotes.length !== 1 ? 's' : ''}`}
        action={<PrimaryButton href="/quotes/new">+ Nieuwe offerte</PrimaryButton>}
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { label: 'Actief', href: '/quotes', active: !showArchived },
          { label: `Gearchiveerd${archivedCount > 0 ? ` (${archivedCount})` : ''}`, href: '/quotes?archived=1', active: showArchived },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: tab.active ? 500 : 400,
              background: tab.active ? 'var(--bg-active)' : 'transparent',
              color: tab.active ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: '1px solid',
              borderColor: tab.active ? 'var(--border-strong)' : 'transparent',
              transition: 'all .1s',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {showArchived && (
        <div style={{
          background: 'var(--warning-muted)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '9px 14px',
          fontSize: 13,
          color: 'var(--warning)',
          marginBottom: 16,
        }}>
          Je bekijkt gearchiveerde offertes. Gebruik "Terugzetten" om een offerte te herstellen.
        </div>
      )}

      <Card padding={0}>
        {quotes.length === 0 ? (
          <EmptyState
            title={showArchived ? 'Geen gearchiveerde offertes' : 'Nog geen offertes'}
            description={showArchived ? 'Er zijn geen gearchiveerde offertes.' : 'Maak je eerste offerte aan voor een klant.'}
            action={!showArchived ? <PrimaryButton href="/quotes/new">Offerte aanmaken</PrimaryButton> : undefined}
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Nummer</Th>
                <Th>Titel</Th>
                <Th>Klant</Th>
                <Th>Status</Th>
                <Th right>Totaal</Th>
                <Th>{showArchived ? 'Gearchiveerd op' : 'Aangemaakt'}</Th>
                <Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {quotes.map((q) => {
                const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT
                const archiveAction = showArchived
                  ? unarchiveQuote.bind(null, q.id)
                  : archiveQuote.bind(null, q.id)

                return (
                  <Tr key={q.id} href={`/quotes/${q.id}`}>
                    <Td muted style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {q.quoteNumber}
                    </Td>
                    <Td>
                      <span style={{ fontWeight: 500 }}>{q.title}</span>
                    </Td>
                    <Td muted>
                      {q.customer.firstName} {q.customer.lastName}
                    </Td>
                    <Td>
                      <Badge label={meta.label} color={meta.color} bg={meta.bg} />
                    </Td>
                    <Td right>{formatCurrency(q.total)}</Td>
                    <Td muted>{formatDate(showArchived ? q.archivedAt : q.createdAt)}</Td>
                    <Td>
                      <ConfirmButton
                        action={archiveAction}
                        label={showArchived ? 'Terugzetten' : 'Archiveren'}
                        confirmMessage={
                          showArchived
                            ? `Offerte "${q.quoteNumber}" terugzetten uit archief?`
                            : `Offerte "${q.quoteNumber}" archiveren? De offerte verdwijnt uit de normale lijst.`
                        }
                        variant={showArchived ? 'default' : 'warning'}
                        size="sm"
                      />
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </PageContainer>
  )
}
