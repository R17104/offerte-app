export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { PageContainer, PageHeader, Card, CardHeader, Badge, Divider } from '@/components/ui'
import { formatCurrency, formatDate, STATUS_META } from '@/lib/utils'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import SalesTodoPanel from '@/components/dashboard/SalesTodoPanel'

function StatCard({ label, value, sub, color, href }: { label: string; value: string | number; sub?: string; color?: string; href?: string }) {
  const inner = (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
      borderLeft: color ? `3px solid ${color}` : undefined,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color ?? 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 6 }}>{sub}</p>}
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

export default async function DashboardPage() {
  const { userId, role } = await verifySession()

  const now = new Date()
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd    = new Date(todayStart.getTime() + 86400000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const tenDaysAgo    = new Date(now.getTime() - 10 * 86400000)

  const [
    quoteStats, recentQuotes,
    leadStats, followUpToday,
    newLeads30, sentLast10Agg,
    closedDealsAgg,
    quotes30, perVerkoper,
    todos, users,
  ] = await Promise.all([
    prisma.quote.groupBy({ by: ['status'], _count: true, _sum: { total: true }, where: { archivedAt: null } }),
    prisma.quote.findMany({
      take: 5, orderBy: { createdAt: 'desc' }, where: { archivedAt: null },
      include: { customer: true, assignedTo: { select: { name: true } } },
    }),
    prisma.lead.groupBy({ by: ['status'], _count: true, where: { archivedAt: null } }),
    prisma.lead.findMany({
      where: { archivedAt: null, followUpAt: { gte: todayStart, lt: todayEnd } },
      orderBy: { followUpAt: 'asc' },
      select: { id: true, firstName: true, lastName: true, followUpAt: true, status: true, assignedTo: { select: { name: true } } },
    }),
    prisma.lead.count({ where: { archivedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
    // offertes verstuurd afgelopen 10 dagen
    prisma.quote.aggregate({
      _sum: { total: true }, _count: true,
      where: { archivedAt: null, sentAt: { gte: tenDaysAgo } },
    }),
    prisma.quote.aggregate({ _sum: { total: true }, where: { archivedAt: null, status: 'ACCEPTED' } }),
    // last 30 days: accepted + sent + rejected (for conversion rate)
    prisma.quote.groupBy({
      by: ['status'], _count: true,
      where: { archivedAt: null, createdAt: { gte: thirtyDaysAgo }, status: { in: ['SENT', 'ACCEPTED', 'REJECTED'] } },
    }),
    prisma.user.findMany({
      select: {
        id: true, name: true, email: true,
        quotes: { where: { archivedAt: null }, select: { status: true, total: true } },
        assignedLeads: { where: { archivedAt: null }, select: { status: true } },
      },
    }),
    prisma.salesTodo.findMany({
      orderBy: [{ done: 'asc' }, { createdAt: 'desc' }],
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
  ])

  const totalLeads      = leadStats.reduce((s, r) => s + r._count, 0)
  const sentLast10Value = sentLast10Agg._sum.total ?? 0
  const sentLast10Count = sentLast10Agg._count ?? 0
  const closedValue     = closedDealsAgg._sum.total ?? 0

  // 30-day conversion
  const accepted30 = quotes30.find((r) => r.status === 'ACCEPTED')?._count ?? 0
  const sent30     = quotes30.find((r) => r.status === 'SENT')?._count ?? 0
  const rejected30 = quotes30.find((r) => r.status === 'REJECTED')?._count ?? 0
  const total30    = accepted30 + sent30 + rejected30
  const conv30     = total30 > 0 ? Math.round((accepted30 / total30) * 100) : 0

  const STATUS_LEAD_COLOR: Record<string, string> = {
    NEW: '#2563eb', CONTACTED: '#d97706', INTERESTED: '#7c3aed',
    QUOTE_SENT: '#0891b2', WON: '#16a34a', LOST: '#9ca3af',
  }
  const STATUS_LEAD_LABEL: Record<string, string> = {
    NEW: 'Nieuw', CONTACTED: 'Benaderd', INTERESTED: 'Geïnteresseerd',
    QUOTE_SENT: 'Offerte verstuurd', WON: 'Gewonnen', LOST: 'Verloren',
  }

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Overzicht van je platform" />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard
          label="Geclosede deals"
          value={formatCurrency(closedValue)}
          sub="totale waarde geaccepteerd"
          color="#16a34a"
          href="/quotes"
        />
        <StatCard
          label="Conversie (30 dagen)"
          value={`${conv30}%`}
          sub={`${accepted30} gesloten van ${total30} verstuurd`}
          color="#2563eb"
        />
        <StatCard
          label="Nieuwe leads (30 dgn)"
          value={newLeads30}
          sub="binnengekomen leads"
          color="#7c3aed"
          href="/leads"
        />
        <StatCard
          label="Potentiële waarde (10 dgn)"
          value={formatCurrency(sentLast10Value)}
          sub={`${sentLast10Count} offertes verstuurd`}
          color="#0a5c35"
          href="/quotes"
        />
        <StatCard
          label="Leads totaal"
          value={totalLeads}
          sub="actieve leads"
          href="/leads"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }} className="r-grid-detail">

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Follow-up vandaag */}
          {followUpToday.length > 0 && (
            <Card style={{ borderLeft: '3px solid #f59e0b' }}>
              <CardHeader title={`📅 Follow-up vandaag (${followUpToday.length})`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {followUpToday.map((lead) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)',
                    textDecoration: 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {lead.firstName} {lead.lastName}
                      </p>
                      {lead.assignedTo && (
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{lead.assignedTo.name}</p>
                      )}
                    </div>
                    <span style={{
                      fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 12,
                      background: `${STATUS_LEAD_COLOR[lead.status]}18`,
                      color: STATUS_LEAD_COLOR[lead.status],
                    }}>
                      {STATUS_LEAD_LABEL[lead.status]}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Recente offertes */}
          <Card padding={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Recente offertes</span>
              <Link href="/quotes" style={{ fontSize: 12.5, color: 'var(--text-link)' }}>Alle offertes →</Link>
            </div>
            {recentQuotes.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '20px' }}>Nog geen offertes.</p>
            ) : recentQuotes.map((q, i) => {
              const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT
              return (
                <div key={q.id}>
                  {i > 0 && <Divider />}
                  <Link href={`/quotes/${q.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', gap: 12, textDecoration: 'none' }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 13.5, color: 'var(--text-primary)' }}>{q.title}</p>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>
                        {q.customer.firstName} {q.customer.lastName}
                        {q.assignedTo && ` · ${q.assignedTo.name}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{formatCurrency(q.total)}</span>
                      <Badge label={meta.label} color={meta.color} bg={meta.bg} />
                    </div>
                  </Link>
                </div>
              )
            })}
          </Card>
        </div>

        {/* Rechterkolom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Sales todos */}
          <Card>
            <CardHeader title="Taken & notities" />
            <SalesTodoPanel todos={todos} users={users} />
          </Card>

          {/* Per verkoper */}
          <Card>
            <CardHeader title="Per verkoper" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {perVerkoper.map((u) => {
                const qTotal    = u.quotes.length
                const qAccepted = u.quotes.filter((q) => q.status === 'ACCEPTED').length
                const qValue    = u.quotes.reduce((s, q) => s + q.total, 0)
                const lTotal    = u.assignedLeads.length
                const conv      = qTotal > 0 ? Math.round((qAccepted / qTotal) * 100) : 0
                const displayName = u.name ?? u.email.split('@')[0]
                const initials    = displayName.slice(0, 2).toUpperCase()
                return (
                  <div key={u.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent-muted)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                    }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{displayName}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
                        {[
                          ['Leads', lTotal],
                          ['Offertes', qTotal],
                          ['Conversie', `${conv}%`],
                          ['Waarde', formatCurrency(qValue)],
                        ].map(([l, v]) => (
                          <p key={String(l)} style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {l}: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Lead pipeline */}
          <Card>
            <CardHeader title="Lead pipeline" action={<Link href="/leads" style={{ fontSize: 12.5, color: 'var(--text-link)' }}>Alle leads →</Link>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leadStats.filter(r => r._count > 0).map((r) => (
                <div key={r.status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_LEAD_COLOR[r.status] ?? '#ccc', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{STATUS_LEAD_LABEL[r.status] ?? r.status}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r._count}</span>
                  <div style={{
                    height: 6, borderRadius: 3, background: STATUS_LEAD_COLOR[r.status] ?? '#ccc', opacity: 0.7,
                    width: Math.max(4, Math.round((r._count / Math.max(totalLeads, 1)) * 80)),
                  }} />
                </div>
              ))}
            </div>
          </Card>

          {/* Snelle acties */}
          <Card>
            <CardHeader title="Snelle acties" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: '/quotes/new', label: '+ Nieuwe offerte' },
                { href: '/customers/new', label: '+ Nieuwe klant' },
                { href: '/leads', label: '→ Leads beheren' },
              ].map((a) => (
                <Link key={a.href} href={a.href} style={{
                  display: 'block', padding: '9px 12px', borderRadius: 8,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)',
                  textDecoration: 'none',
                }}>
                  {a.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
