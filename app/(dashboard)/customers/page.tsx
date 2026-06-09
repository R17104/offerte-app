export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import Link from 'next/link'
import { PageContainer, PageHeader, PrimaryButton, Card, EmptyState } from '@/components/ui'
import { verifySession } from '@/lib/dal'
import CustomersList from '@/components/customers/CustomersList'

type Props = { searchParams: Promise<{ archived?: string }> }

export default async function CustomersPage({ searchParams }: Props) {
  const { userId } = await verifySession()
  const { archived } = await searchParams
  const showArchived = archived === '1'

  const [customers, archivedCount] = await Promise.all([
    prisma.customer.findMany({
      where: showArchived
        ? { userId, archivedAt: { not: null } }
        : { userId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        addresses: { where: { type: 'CORRESPONDENCE' }, take: 1 },
        _count: { select: { quotes: true } },
      },
    }),
    prisma.customer.count({ where: { userId, archivedAt: { not: null } } }),
  ])

  return (
    <PageContainer>
      <PageHeader
        title="Klanten"
        description={`${customers.length} klant${customers.length !== 1 ? 'en' : ''}`}
        action={<PrimaryButton href="/customers/new">+ Nieuwe klant</PrimaryButton>}
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { label: 'Actief', href: '/customers', active: !showArchived },
          { label: `Gearchiveerd${archivedCount > 0 ? ` (${archivedCount})` : ''}`, href: '/customers?archived=1', active: showArchived },
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
          borderRadius: 'var(--radius-md)', padding: '9px 14px', fontSize: 13,
          color: 'var(--warning)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>Je bekijkt gearchiveerde klanten. Gebruik "Terugzetten" om een klant te herstellen.</span>
        </div>
      )}

      <Card padding={0}>
        {customers.length === 0 ? (
          <EmptyState
            title={showArchived ? 'Geen gearchiveerde klanten' : 'Nog geen klanten'}
            description={showArchived ? 'Er zijn geen gearchiveerde klanten.' : 'Voeg je eerste klant toe om te beginnen.'}
            action={!showArchived ? <PrimaryButton href="/customers/new">Klant toevoegen</PrimaryButton> : undefined}
          />
        ) : (
          <CustomersList customers={customers} showArchived={showArchived} />
        )}
      </Card>
    </PageContainer>
  )
}
