export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { PageContainer, PageHeader, Table, Thead, Tbody, Th, Tr, Td, Badge, EmptyState } from '@/components/ui'
import LeadImportButton from '@/components/leads/LeadImportButton'
import Link from 'next/link'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  NEW:        { label: 'Nieuw',         color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  CONTACTED:  { label: 'Benaderd',      color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  INTERESTED: { label: 'Geïnteresseerd',color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  QUOTE_SENT: { label: 'Offerte verstuurd', color: '#0891b2', bg: 'rgba(8,145,178,0.08)' },
  WON:        { label: 'Gewonnen',      color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  LOST:       { label: 'Verloren',      color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
}

export default async function LeadsPage() {
  const { userId } = await verifySession()

  const leads = await prisma.lead.findMany({
    where: { createdById: userId, archivedAt: null },
    include: { _count: { select: { notes: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const counts = Object.fromEntries(
    Object.keys(STATUS_LABEL).map((s) => [s, leads.filter((l) => l.status === s).length])
  )

  return (
    <PageContainer>
      <PageHeader
        title="Leads"
        description={`${leads.length} actieve leads`}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <LeadImportButton />
            <Link
              href="/leads/nieuw"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 8,
                background: 'var(--accent)', color: '#fff',
                fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
              }}
            >
              + Lead toevoegen
            </Link>
          </div>
        }
      />

      {/* Status overzicht */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
        {Object.entries(STATUS_LABEL).map(([key, s]) => (
          <div key={key} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 14px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{counts[key]}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="Nog geen leads"
          description="Importeer een CSV-bestand of voeg handmatig een lead toe."
        />
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <Table>
            <Thead>
              <tr>
                <Th>Naam</Th>
                <Th>Telefoon</Th>
                <Th>E-mail</Th>
                <Th>Plaats</Th>
                <Th>Status</Th>
                <Th>Notities</Th>
                <Th>Bron</Th>
                <Th>Toegevoegd</Th>
              </tr>
            </Thead>
            <Tbody>
              {leads.map((lead) => {
                const s = STATUS_LABEL[lead.status]
                return (
                  <Tr key={lead.id} href={`/leads/${lead.id}`}>
                    <Td>
                      <span style={{ fontWeight: 500 }}>
                        {lead.firstName} {lead.lastName}
                      </span>
                      {lead.postalCode && (
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {lead.postalCode}
                        </span>
                      )}
                    </Td>
                    <Td muted>{lead.phone ?? '—'}</Td>
                    <Td muted>{lead.email ?? '—'}</Td>
                    <Td muted>{lead.city ?? '—'}</Td>
                    <Td>
                      <Badge label={s.label} color={s.color} bg={s.bg} />
                    </Td>
                    <Td muted>{lead._count.notes > 0 ? `${lead._count.notes}` : '—'}</Td>
                    <Td muted style={{ fontSize: 12 }}>{lead.source ?? '—'}</Td>
                    <Td muted style={{ fontSize: 12 }}>
                      {lead.createdAt.toLocaleDateString('nl-NL')}
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </div>
      )}
    </PageContainer>
  )
}
