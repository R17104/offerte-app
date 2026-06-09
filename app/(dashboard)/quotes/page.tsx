export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import Link from 'next/link'
import { PageContainer, PageHeader, PrimaryButton, Card, EmptyState } from '@/components/ui'
import { verifySession } from '@/lib/dal'
import QuotesList from '@/components/quotes/QuotesList'

type Props = { searchParams: Promise<{ archived?: string }> }

export default async function QuotesPage({ searchParams }: Props) {
  const { userId } = await verifySession()
  const { archived } = await searchParams
  const showArchived = archived === '1'

  const [quotes, archivedCount] = await Promise.all([
    prisma.quote.findMany({
      where: showArchived
        ? { createdById: userId, archivedAt: { not: null } }
        : { createdById: userId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
    prisma.quote.count({ where: { createdById: userId, archivedAt: { not: null } } }),
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
              padding: '5px 12px', borderRadius: 'var(--radius-md)', fontSize: 13,
              fontWeight: tab.active ? 500 : 400,
              background: tab.active ? 'var(--bg-active)' : 'transparent',
              color: tab.active ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: '1px solid', borderColor: tab.active ? 'var(--border-strong)' : 'transparent',
              transition: 'all .1s',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {showArchived && (
        <div style={{
          background: 'var(--warning-muted)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 'var(--radius-md)', padding: '9px 14px',
          fontSize: 13, color: 'var(--warning)', marginBottom: 16,
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
          <QuotesList quotes={quotes} showArchived={showArchived} />
        )}
      </Card>
    </PageContainer>
  )
}
