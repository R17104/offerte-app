export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { PageContainer, PageHeader, Card, CardHeader, Badge, Divider } from '@/components/ui'
import { formatCurrency, STATUS_META } from '@/lib/utils'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'

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

const STATUS_LEAD_COLOR: Record<string, string> = {
  NEW: '#2563eb', CONTACTED: '#d97706', INTERESTED: '#7c3aed',
  QUOTE_SENT: '#0891b2', WON: '#16a34a', LOST: '#9ca3af',
}
const STATUS_LEAD_LABEL: Record<string, string> = {
  NEW: 'Nieuw', CONTACTED: 'Benaderd', INTERESTED: 'Geïnteresseerd',
  QUOTE_SENT: 'Offerte verstuurd', WON: 'Gewonnen', LOST: 'Verloren',
}

export default async function DashboardPage() {
  const session = await verifySession()
  const userId = session.userId
  // Persoonlijke scope: offertes die deze gebruiker aanmaakte of die aan hem zijn toegewezen
  const myQuotes = { OR: [{ createdById: userId }, { assignedToId: userId }] }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

  const [
    closedDealsAgg,   // persoonlijk: alleen eigen geclosede deals
    quotes30,         // persoonlijk: alleen eigen conversie
    assignedLeadsCount, assignedLeads,           // persoonlijk
    pipelineAgg,                                 // persoonlijk
    sentOpenAgg, sentOpenList,                   // persoonlijk
  ] = await Promise.all([
    prisma.quote.aggregate({ _sum: { total: true }, where: { archivedAt: null, status: 'ACCEPTED', ...myQuotes } }),
    prisma.quote.groupBy({
      by: ['status'], _count: true,
      where: { archivedAt: null, createdAt: { gte: thirtyDaysAgo }, status: { in: ['SENT', 'ACCEPTED', 'REJECTED'] }, ...myQuotes },
    }),
    // Toegewezen leads (persoonlijk)
    prisma.lead.count({ where: { archivedAt: null, assignedToId: userId } }),
    prisma.lead.findMany({
      where: { archivedAt: null, assignedToId: userId, status: { notIn: ['WON', 'LOST'] } },
      orderBy: [{ followUpAt: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, firstName: true, lastName: true, status: true, followUpAt: true },
      take: 8,
    }),
    // Potentiële waarde + aantal offertes (persoonlijk, openstaand = concept + verstuurd)
    prisma.quote.aggregate({
      _sum: { total: true }, _count: true,
      where: { archivedAt: null, status: { in: ['DRAFT', 'SENT'] }, ...myQuotes },
    }),
    // Nog niet afgeronde verstuurde offertes (persoonlijk, status verstuurd)
    prisma.quote.aggregate({
      _sum: { total: true }, _count: true,
      where: { archivedAt: null, status: 'SENT', ...myQuotes },
    }),
    prisma.quote.findMany({
      where: { archivedAt: null, status: 'SENT', ...myQuotes },
      orderBy: { sentAt: 'desc' },
      include: { customer: { select: { firstName: true, lastName: true } } },
      take: 8,
    }),
  ])

  const closedValue = closedDealsAgg._sum.total ?? 0

  // 30-daagse conversie (persoonlijk)
  const accepted30 = quotes30.find((r) => r.status === 'ACCEPTED')?._count ?? 0
  const sent30     = quotes30.find((r) => r.status === 'SENT')?._count ?? 0
  const rejected30 = quotes30.find((r) => r.status === 'REJECTED')?._count ?? 0
  const total30    = accepted30 + sent30 + rejected30
  const conv30     = total30 > 0 ? Math.round((accepted30 / total30) * 100) : 0

  const pipelineValue = pipelineAgg._sum.total ?? 0
  const pipelineCount = pipelineAgg._count ?? 0
  const sentOpenValue = sentOpenAgg._sum.total ?? 0
  const sentOpenCount = sentOpenAgg._count ?? 0

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Jouw persoonlijke overzicht" />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard
          label="Mijn geclosede deals"
          value={formatCurrency(closedValue)}
          sub="jouw geaccepteerde waarde"
          color="#16a34a"
          href="/quotes"
        />
        <StatCard
          label="Mijn conversie (30 dagen)"
          value={`${conv30}%`}
          sub={`${accepted30} gesloten van ${total30} verstuurd`}
          color="#2563eb"
        />
        <StatCard
          label="Toegewezen leads"
          value={assignedLeadsCount}
          sub="aan jou toegewezen"
          color="#7c3aed"
          href="/leads"
        />
        <StatCard
          label="Potentiële waarde"
          value={formatCurrency(pipelineValue)}
          sub={`${pipelineCount} ${pipelineCount === 1 ? 'openstaande offerte' : 'openstaande offertes'}`}
          color="#0a5c35"
          href="/quotes"
        />
        <StatCard
          label="Verstuurd, nog niet afgerond"
          value={sentOpenCount}
          sub={`${formatCurrency(sentOpenValue)} wacht op reactie`}
          color="#d97706"
          href="/quotes"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }} className="r-grid-detail">

        {/* Mijn toegewezen leads */}
        <Card>
          <CardHeader title={`Mijn toegewezen leads (${assignedLeadsCount})`} action={<Link href="/leads" style={{ fontSize: 12.5, color: 'var(--text-link)' }}>Alle leads →</Link>} />
          {assignedLeads.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '8px 0' }}>Er zijn nog geen leads aan jou toegewezen.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assignedLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', textDecoration: 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{lead.firstName} {lead.lastName}</p>
                    {lead.followUpAt && (
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Opvolgen: {new Date(lead.followUpAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 12,
                    background: `${STATUS_LEAD_COLOR[lead.status] ?? '#9ca3af'}18`,
                    color: STATUS_LEAD_COLOR[lead.status] ?? '#9ca3af',
                  }}>
                    {STATUS_LEAD_LABEL[lead.status] ?? lead.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Verstuurde offertes, nog niet afgerond */}
        <Card padding={0}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Verstuurde offertes (nog niet afgerond)</span>
            <Link href="/quotes" style={{ fontSize: 12.5, color: 'var(--text-link)' }}>Alle offertes →</Link>
          </div>
          {sentOpenList.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '20px' }}>Je hebt geen openstaande verstuurde offertes.</p>
          ) : sentOpenList.map((q, i) => {
            const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT
            return (
              <div key={q.id}>
                {i > 0 && <Divider />}
                <Link href={`/quotes/${q.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', gap: 12, textDecoration: 'none' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 13.5, color: 'var(--text-primary)' }}>{q.title}</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>
                      {q.customer.firstName} {q.customer.lastName}
                      {q.sentAt && ` · verstuurd ${new Date(q.sentAt).toLocaleDateString('nl-NL')}`}
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
    </PageContainer>
  )
}
