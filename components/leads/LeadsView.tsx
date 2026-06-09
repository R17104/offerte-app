'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_CONFIG = [
  { key: 'NEW',        label: 'Nieuw',             color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  { key: 'CONTACTED',  label: 'Benaderd',          color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  { key: 'INTERESTED', label: 'Geïnteresseerd',    color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  { key: 'QUOTE_SENT', label: 'Offerte verstuurd', color: '#0891b2', bg: 'rgba(8,145,178,0.08)' },
  { key: 'WON',        label: 'Gewonnen',          color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  { key: 'LOST',       label: 'Verloren',          color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
]

type LeadRow = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  postalCode: string | null
  city: string | null
  status: string
  source: string | null
  createdAt: Date
  followUpAt: Date | null
  _count: { notes: number }
}

function isOverdue(d: Date | null): boolean {
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(d) < today
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default function LeadsView({ leads }: { leads: LeadRow[] }) {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const counts = Object.fromEntries(
    STATUS_CONFIG.map((s) => [s.key, leads.filter((l) => l.status === s.key).length])
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUS_CONFIG.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20,
                background: s.bg, border: `1px solid ${s.color}30`,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: s.color, fontWeight: 700 }}>{counts[s.key]}</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, flexShrink: 0 }}>
          {(['list', 'kanban'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 500,
                background: view === v ? 'var(--bg-surface)' : 'transparent',
                color: view === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {v === 'list' ? 'Lijst' : 'Kanban'}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' ? <ListView leads={leads} /> : <KanbanView leads={leads} />}
    </div>
  )
}

function ListView({ leads }: { leads: LeadRow[] }) {
  const router = useRouter()

  if (leads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
        Nog geen leads. Importeer een CSV of voeg handmatig een lead toe.
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Naam', 'Telefoon', 'E-mail', 'Plaats', 'Status', 'Follow-up', 'Notities', 'Toegevoegd'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 14px', fontSize: 11.5, fontWeight: 600,
                  color: 'var(--text-tertiary)', textAlign: 'left',
                  textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const s = STATUS_CONFIG.find((s) => s.key === lead.status)!
            const overdue = isOverdue(lead.followUpAt)
            return (
              <tr
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontWeight: 500, fontSize: 13.5 }}>{lead.firstName} {lead.lastName}</span>
                  {lead.postalCode && (
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-tertiary)' }}>{lead.postalCode}</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{lead.phone ?? '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{lead.email ?? '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{lead.city ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    fontSize: 12, fontWeight: 500, color: s.color, background: s.bg,
                  }}>
                    {s.label}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                  {lead.followUpAt ? (
                    <span style={{
                      fontSize: 12.5, fontWeight: overdue ? 600 : 400,
                      color: overdue ? '#dc2626' : 'var(--text-secondary)',
                    }}>
                      {overdue && '! '}{fmtDate(lead.followUpAt)}
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {lead._count.notes > 0 ? lead._count.notes : '—'}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {new Date(lead.createdAt).toLocaleDateString('nl-NL')}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KanbanView({ leads }: { leads: LeadRow[] }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
      {STATUS_CONFIG.map((s) => {
        const colLeads = leads.filter((l) => l.status === s.key)
        return (
          <div key={s.key} style={{ flexShrink: 0, width: 220 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', marginBottom: 10,
              background: s.bg, borderRadius: 8,
              border: `1px solid ${s.color}25`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 700, color: s.color }}>{colLeads.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colLeads.map((lead) => {
                const overdue = isOverdue(lead.followUpAt)
                return (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    style={{
                      display: 'block', textDecoration: 'none',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '12px 14px',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = s.color
                      el.style.boxShadow = `0 2px 8px ${s.color}20`
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'var(--border)'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {lead.firstName} {lead.lastName}
                    </p>
                    {lead.phone && (
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 2 }}>{lead.phone}</p>
                    )}
                    {(lead.postalCode || lead.city) && (
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {[lead.postalCode, lead.city].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {lead.followUpAt && (
                      <div style={{
                        marginTop: 8, padding: '4px 8px', borderRadius: 4,
                        background: overdue ? 'rgba(220,38,38,0.08)' : 'rgba(0,0,0,0.04)',
                      }}>
                        <span style={{ fontSize: 11.5, color: overdue ? '#dc2626' : 'var(--text-tertiary)', fontWeight: overdue ? 600 : 400 }}>
                          {overdue ? '! ' : ''}Follow-up: {fmtDate(lead.followUpAt)}
                        </span>
                      </div>
                    )}
                    {lead._count.notes > 0 && (
                      <p style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                        {lead._count.notes} {lead._count.notes === 1 ? 'notitie' : 'notities'}
                      </p>
                    )}
                  </Link>
                )
              })}
              {colLeads.length === 0 && (
                <div style={{
                  padding: '20px 12px', textAlign: 'center', fontSize: 12,
                  color: 'var(--border-strong)', borderRadius: 8,
                  border: '1px dashed var(--border)',
                }}>
                  Leeg
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
