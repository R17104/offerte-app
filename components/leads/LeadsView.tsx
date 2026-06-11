'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  bulkDeleteLeads,
  bulkArchiveLeads,
  bulkUpdateLeadStatus,
} from '@/lib/actions/lead.actions'
import { LeadStatus } from '@prisma/client'

const STATUS_CONFIG = [
  { key: 'NEW',                 label: 'Nieuw',               color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  { key: 'CONTACTED',           label: 'Benaderd',            color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  { key: 'AFSPRAAK_INGEPLAND',  label: 'Afspraak ingepland',  color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  { key: 'QUOTE_SENT',          label: 'Offerte verstuurd',   color: '#0891b2', bg: 'rgba(8,145,178,0.08)' },
  { key: 'INSTALLATIE_GEPLAND', label: 'Installatie gepland', color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
  { key: 'BETALING_50',         label: '50% betaald',         color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  { key: 'INSTALLATIE_GEDAAN',  label: 'Installatie gedaan',  color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  { key: 'BETALING_100',        label: '100% betaald',        color: '#065f46', bg: 'rgba(6,95,70,0.08)' },
  { key: 'LOST',                label: 'Verloren',            color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
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
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return new Date(d) < today
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function exportLeadsCSV(leads: LeadRow[]) {
  const headers = ['Voornaam', 'Achternaam', 'E-mail', 'Telefoon', 'Postcode', 'Stad', 'Status', 'Bron', 'Toegevoegd']
  const rows = leads.map((l) => [
    l.firstName, l.lastName, l.email ?? '', l.phone ?? '',
    l.postalCode ?? '', l.city ?? '', l.status, l.source ?? '',
    new Date(l.createdAt).toLocaleDateString('nl-NL'),
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function Cb({ checked, indeterminate, onChange }: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange() }}
      style={{
        width: 17, height: 17, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
        border: `2px solid ${checked || indeterminate ? '#0a5c35' : '#b4ccbc'}`,
        background: checked ? '#0a5c35' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.1s',
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {!checked && indeterminate && (
        <div style={{ width: 8, height: 2, background: '#0a5c35', borderRadius: 1 }} />
      )}
    </div>
  )
}

export default function LeadsView({ leads: initialLeads }: { leads: LeadRow[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [view, setView] = useState<'list' | 'kanban'>('list')

  useEffect(() => { setLeads(initialLeads) }, [initialLeads])

  const counts = Object.fromEntries(
    STATUS_CONFIG.map((s) => [s.key, leads.filter((l) => l.status === s.key).length])
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUS_CONFIG.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: s.bg, border: `1px solid ${s.color}30` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: s.color, fontWeight: 700 }}>{counts[s.key]}</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, flexShrink: 0 }}>
          {(['list', 'kanban'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12.5, fontWeight: 500,
              background: view === v ? 'var(--bg-surface)' : 'transparent',
              color: view === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
              {v === 'list' ? 'Lijst' : 'Kanban'}
            </button>
          ))}
        </div>
      </div>
      {view === 'list' ? <ListView leads={leads} setLeads={setLeads} /> : <KanbanView leads={leads} />}
    </div>
  )
}

const bulkBtnStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface)', color: 'var(--text-secondary)',
  fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
}

function ListView({ leads, setLeads }: { leads: LeadRow[]; setLeads: (fn: (prev: LeadRow[]) => LeadRow[]) => void }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  const filtered = search.trim()
    ? leads.filter((l) => {
        const s = search.toLowerCase()
        return `${l.firstName} ${l.lastName}`.toLowerCase().includes(s)
          || (l.email ?? '').toLowerCase().includes(s)
          || (l.phone ?? '').toLowerCase().includes(s)
          || (l.city ?? '').toLowerCase().includes(s)
          || (l.postalCode ?? '').toLowerCase().includes(s)
      })
    : leads

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id))
  const someSelected = filtered.some((l) => selected.has(l.id)) && !allSelected

  function toggleAll() {
    const ids = filtered.map((l) => l.id)
    setSelected((p) => { const n = new Set(p); if (allSelected) ids.forEach((id) => n.delete(id)); else ids.forEach((id) => n.add(id)); return n })
  }
  function toggle(id: string) { setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  function run(action: () => Promise<void>, removeIds?: string[]) {
    startTransition(async () => {
      if (removeIds) setLeads((p) => p.filter((l) => !removeIds.includes(l.id)))
      setSelected(new Set())
      await action()
      router.refresh()
    })
  }

  if (leads.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Nog geen leads. Importeer een CSV of voeg handmatig een lead toe.</div>
  }

  return (
    <div>
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0a5c35', marginRight: 4 }}>{selected.size} geselecteerd</span>
          <button onClick={() => { const ids = [...selected]; run(() => bulkArchiveLeads(ids), ids) }} disabled={isPending} style={bulkBtnStyle}>Archiveer</button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setStatusMenuOpen((v) => !v)} disabled={isPending} style={bulkBtnStyle}>Status wijzigen ▾</button>
            {statusMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180 }}>
                {STATUS_CONFIG.map((s) => (
                  <button key={s.key}
                    onClick={() => {
                      const ids = [...selected]; setStatusMenuOpen(false)
                      startTransition(async () => { setLeads((p) => p.map((l) => ids.includes(l.id) ? { ...l, status: s.key } : l)); setSelected(new Set()); await bulkUpdateLeadStatus(ids, s.key as LeadStatus); router.refresh() })
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => exportLeadsCSV(leads.filter((l) => selected.has(l.id)))} style={bulkBtnStyle}>Exporteer CSV</button>
          <button onClick={() => { if (!confirm(`${selected.size} lead(s) definitief verwijderen?`)) return; const ids = [...selected]; run(() => bulkDeleteLeads(ids), ids) }} disabled={isPending} style={{ ...bulkBtnStyle, color: '#dc2626', borderColor: '#fca5a5' }}>Verwijder</button>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>Deselecteer alles</button>
        </div>
      )}

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, email, telefoon of woonplaats…"
            style={{ width: '100%', padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 14px', width: 44 }}>
                <Cb checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
              </th>
              {['Naam', 'Telefoon', 'E-mail', 'Plaats', 'Status', 'Follow-up', 'Notities', 'Toegevoegd'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13.5 }}>Geen resultaten voor "{search}"</td></tr>
            )}
            {filtered.map((lead) => {
              const s = STATUS_CONFIG.find((s) => s.key === lead.status)!
              const overdue = isOverdue(lead.followUpAt)
              const isSelected = selected.has(lead.id)
              return (
                <tr key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'rgba(10,92,53,0.04)' : undefined }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(10,92,53,0.04)' : '' }}
                >
                  <td style={{ padding: '10px 14px' }} onClick={(e) => e.stopPropagation()}>
                    <Cb checked={isSelected} onChange={() => toggle(lead.id)} />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 500, fontSize: 13.5 }}>{lead.firstName} {lead.lastName}</span>
                    {lead.postalCode && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-tertiary)' }}>{lead.postalCode}</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{lead.phone ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{lead.email ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{lead.city ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, color: s.color, background: s.bg }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    {lead.followUpAt ? (
                      <span style={{ fontSize: 12.5, fontWeight: overdue ? 600 : 400, color: overdue ? '#dc2626' : 'var(--text-secondary)' }}>{overdue && '! '}{fmtDate(lead.followUpAt)}</span>
                    ) : <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{lead._count.notes > 0 ? lead._count.notes : '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(lead.createdAt).toLocaleDateString('nl-NL')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', marginBottom: 10, background: s.bg, borderRadius: 8, border: `1px solid ${s.color}25` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 700, color: s.color }}>{colLeads.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colLeads.map((lead) => {
                const overdue = isOverdue(lead.followUpAt)
                return (
                  <Link key={lead.id} href={`/leads/${lead.id}`}
                    style={{ display: 'block', textDecoration: 'none', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = s.color; el.style.boxShadow = `0 2px 8px ${s.color}20` }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = 'none' }}
                  >
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{lead.firstName} {lead.lastName}</p>
                    {lead.phone && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 2 }}>{lead.phone}</p>}
                    {(lead.postalCode || lead.city) && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{[lead.postalCode, lead.city].filter(Boolean).join(' · ')}</p>}
                    {lead.followUpAt && (
                      <div style={{ marginTop: 8, padding: '4px 8px', borderRadius: 4, background: overdue ? 'rgba(220,38,38,0.08)' : 'rgba(0,0,0,0.04)' }}>
                        <span style={{ fontSize: 11.5, color: overdue ? '#dc2626' : 'var(--text-tertiary)', fontWeight: overdue ? 600 : 400 }}>{overdue ? '! ' : ''}Follow-up: {fmtDate(lead.followUpAt)}</span>
                      </div>
                    )}
                    {lead._count.notes > 0 && <p style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-tertiary)' }}>{lead._count.notes} {lead._count.notes === 1 ? 'notitie' : 'notities'}</p>}
                  </Link>
                )
              })}
              {colLeads.length === 0 && <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: 'var(--border-strong)', borderRadius: 8, border: '1px dashed var(--border)' }}>Leeg</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
