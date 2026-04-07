import { prisma } from '@/lib/db'
import { PageContainer, PageHeader, Stat, Card, CardHeader, Badge, Divider } from '@/components/ui'
import { formatCurrency, formatDate, STATUS_META } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const [customerCount, productCount, quoteStats, recentQuotes] = await Promise.all([
    prisma.customer.count({ where: { archivedAt: null } }),
    prisma.product.count({ where: { active: true } }),
    prisma.quote.groupBy({ by: ['status'], _count: true, where: { archivedAt: null } }),
    prisma.quote.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      where: { archivedAt: null },
      include: { customer: true },
    }),
  ])

  const quoteCount = quoteStats.reduce((s, r) => s + r._count, 0)
  const acceptedCount = quoteStats.find((r) => r.status === 'ACCEPTED')?._count ?? 0
  const draftCount = quoteStats.find((r) => r.status === 'DRAFT')?._count ?? 0

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overzicht van je offerteplatform"
      />

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <Stat label="Klanten" value={customerCount} />
        <Stat label="Actieve producten" value={productCount} />
        <Stat label="Offertes totaal" value={quoteCount} />
        <Stat label="Geaccepteerd" value={acceptedCount} sub={`${draftCount} concept${draftCount !== 1 ? 'en' : ''}`} />
      </div>

      {/* Recent quotes */}
      <Card>
        <CardHeader
          title="Recente offertes"
          action={
            <Link
              href="/quotes"
              style={{ fontSize: 12.5, color: 'var(--text-link)' }}
            >
              Alle offertes →
            </Link>
          }
        />

        {recentQuotes.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '16px 0' }}>
            Nog geen offertes aangemaakt.
          </p>
        ) : (
          <div>
            {recentQuotes.map((q, i) => {
              const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT
              return (
                <div key={q.id}>
                  {i > 0 && <Divider />}
                  <Link
                    href={`/quotes/${q.id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      gap: 12,
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 13.5 }}>{q.title}</p>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>
                        {q.quoteNumber} · {q.customer.firstName} {q.customer.lastName}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formatCurrency(q.total)}
                      </span>
                      <Badge label={meta.label} color={meta.color} bg={meta.bg} />
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {formatDate(q.createdAt)}
                      </span>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginTop: 28,
        }}
      >
        {[
          { href: '/customers/new', label: 'Nieuwe klant', desc: 'Klant toevoegen aan het systeem' },
          { href: '/products/new', label: 'Nieuw product', desc: 'Product aan catalogus toevoegen' },
          { href: '/quotes/new', label: 'Nieuwe offerte', desc: 'Offerte aanmaken voor een klant' },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            style={{
              display: 'block',
              padding: '16px 18px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              transition: 'border-color .12s, background .12s',
            }}
            className="hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]"
          >
            <p style={{ fontWeight: 600, fontSize: 13.5 }}>{a.label}</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12.5, marginTop: 4 }}>{a.desc}</p>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
