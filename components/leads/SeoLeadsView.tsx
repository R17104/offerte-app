'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { assignLead, updateLeadStatus } from '@/lib/actions/lead.actions'
import type { LeadStatus } from '@prisma/client'

type Lead = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  postalCode: string | null
  city: string | null
  source: string | null
  status: string
  createdAt: Date
  assignedTo: { id: string; name: string | null; email: string } | null
  _count: { notes: number }
  quote: {
    id: string
    quoteNumber: string
    total: number
    status: string
    lines: { name: string }[]
  } | null
}

type User = { id: string; name: string | null; email: string }

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  NEW:        { label: 'Nieuw',              color: '#2563eb', bg: '#eff6ff' },
  CONTACTED:  { label: 'Benaderd',           color: '#d97706', bg: '#fffbeb' },
  INTERESTED: { label: 'Geïnteresseerd',     color: '#7c3aed', bg: '#f5f3ff' },
  QUOTE_SENT: { label: 'Offerte verstuurd',  color: '#0891b2', bg: '#ecfeff' },
  WON:        { label: 'Gewonnen',           color: '#16a34a', bg: '#f0fdf4' },
  LOST:       { label: 'Verloren',           color: '#9ca3af', bg: '#f9fafb' },
}

const SOURCE_META: Record<string, { label: string; color: string; bg: string }> = {
  'Website':                    { label: 'Adviesaanvraag',    color: '#2563eb', bg: '#eff6ff' },
  'Website – offerte aanvraag': { label: 'Webshop bestelling', color: '#7c3aed', bg: '#f5f3ff' },
  'thuisbatterij':              { label: 'Batterijcheck',      color: '#0a5c35', bg: '#f0fdf4' },
}

function displayName(u: User) {
  return u.name ?? u.email.split('@')[0]
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SeoLeadsView({ leads, users }: { leads: Lead[]; users: User[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [pending, startTransition] = useTransition()

  // Eén keer vastleggen bij mount: Date.now() tijdens render is niet puur.
  const [now] = useState(() => Date.now())
  const weekAgo = now - 7 * 86400000

  const filtered = leads.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    if (search.trim()) {
      const s = search.toLowerCase()
      return (
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(s) ||
        (l.email ?? '').toLowerCase().includes(s) ||
        (l.phone ?? '').includes(s) ||
        (l.postalCode ?? '').includes(s)
      )
    }
    return true
  })

  const newCount      = leads.filter((l) => l.status === 'NEW').length
  const unassigned    = leads.filter((l) => !l.assignedTo).length
  const thisWeek      = leads.filter((l) => new Date(l.createdAt).getTime() >= weekAgo).length
  const withQuote     = leads.filter((l) => l.quote).length

  function handleAssign(leadId: string, userId: string) {
    startTransition(async () => {
      await assignLead(leadId, userId || null)
      router.refresh()
    })
  }

  function handleStatus(leadId: string, status: string) {
    startTransition(async () => {
      await updateLeadStatus(leadId, status as LeadStatus)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Totaal',            value: leads.length,  color: '#6b7280' },
          { label: 'Nieuw',             value: newCount,      color: '#2563eb' },
          { label: 'Niet toegewezen',   value: unassigned,    color: '#d97706' },
          { label: 'Deze week',         value: thisWeek,      color: '#7c3aed' },
          { label: 'Met offerte',       value: withQuote,     color: '#0a5c35' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', borderLeft: `3px solid ${color}` }}>
            <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam, e-mail, telefoon…"
          style={{ flex: 1, minWidth: 200, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="all">Alle statussen</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            Geen SEO leads gevonden{search ? ` voor "${search}"` : ''}.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {['Naam & contact', 'Bron', 'Interesse', 'Status', 'Toegewezen aan', 'Datum', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => {
                const sm = STATUS_META[lead.status] ?? STATUS_META.NEW
                const srcMeta = SOURCE_META[lead.source ?? ''] ?? { label: lead.source ?? '–', color: '#6b7280', bg: '#f9fafb' }
                const interest = lead.quote?.lines[0]?.name ?? (lead.source === 'thuisbatterij' ? 'Thuisbatterij' : 'Adviesgesprek')

                return (
                  <tr key={lead.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {/* Naam + contact */}
                    <td style={{ padding: '12px 14px' }}>
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 3 }}>
                        {lead.firstName} {lead.lastName}
                        {lead.status === 'NEW' && !lead.assignedTo && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: '#fef2f2', color: '#dc2626' }}>Nieuw</span>
                        )}
                      </p>
                      {lead.email && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{lead.email}</p>}
                      {lead.phone && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{lead.phone}</p>}
                      {lead.postalCode && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{lead.postalCode}{lead.city ? ` ${lead.city}` : ''}</p>}
                    </td>

                    {/* Bron */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 12, background: srcMeta.bg, color: srcMeta.color, whiteSpace: 'nowrap' }}>
                        {srcMeta.label}
                      </span>
                    </td>

                    {/* Interesse */}
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 160 }}>
                      {interest}
                      {lead.quote && (
                        <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {lead.quote.quoteNumber}
                        </p>
                      )}
                      {lead._count.notes > 0 && (
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>💬 {lead._count.notes} notitie{lead._count.notes !== 1 ? 's' : ''}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatus(lead.id, e.target.value)}
                        disabled={pending}
                        style={{ fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: sm.bg, color: sm.color, outline: 'none' }}
                      >
                        {Object.entries(STATUS_META).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Toegewezen aan */}
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={lead.assignedTo?.id ?? ''}
                        onChange={(e) => handleAssign(lead.id, e.target.value)}
                        disabled={pending}
                        style={{ fontSize: 12.5, padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: lead.assignedTo ? 'var(--text-primary)' : '#d97706', cursor: 'pointer', outline: 'none', maxWidth: 130 }}
                      >
                        <option value="">Niet toegewezen</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{displayName(u)}</option>
                        ))}
                      </select>
                    </td>

                    {/* Datum */}
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* Actie */}
                    <td style={{ padding: '12px 14px' }}>
                      <Link
                        href={`/leads/${lead.id}`}
                        style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
