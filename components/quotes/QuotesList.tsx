'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bulkArchiveQuotes, bulkUnarchiveQuotes, bulkExpireQuotes, bulkDeleteQuotes } from '@/lib/actions/quote.actions'
import { archiveQuote, unarchiveQuote } from '@/lib/actions/quote.actions'
import { formatDate, formatCurrency, STATUS_META } from '@/lib/utils'
import ConfirmButton from '@/components/ui/ConfirmButton'

type QuoteRow = {
  id: string
  quoteNumber: string
  title: string
  status: string
  total: number
  createdAt: Date
  archivedAt: Date | null
  validUntil: Date | null
  customer: { firstName: string; lastName: string }
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

function exportQuotesCSV(quotes: QuoteRow[]) {
  const headers = ['Nummer', 'Titel', 'Klant', 'Status', 'Totaal', 'Aangemaakt']
  const rows = quotes.map((q) => [q.quoteNumber, q.title, `${q.customer.firstName} ${q.customer.lastName}`, q.status, String(q.total), new Date(q.createdAt).toLocaleDateString('nl-NL')])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `offertes-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
}

const bulkBtnStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface)', color: 'var(--text-secondary)',
  fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
}

const PERIOD_OPTIONS = [
  { value: 'all',   label: 'Alle periodes' },
  { value: '7',     label: 'Afgelopen 7 dagen' },
  { value: '30',    label: 'Afgelopen 30 dagen' },
  { value: '90',    label: 'Afgelopen 90 dagen' },
  { value: 'year',  label: 'Dit jaar' },
]

export default function QuotesList({ quotes: initialQuotes, showArchived }: { quotes: QuoteRow[]; showArchived: boolean }) {
  const router = useRouter()
  const [quotes, setQuotes] = useState(initialQuotes)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('all')
  const [isPending, startTransition] = useTransition()

  // Sync met nieuwe server-data tijdens render (officieel React-patroon),
  // zonder extra render-cyclus via een effect.
  const [prevInitialQuotes, setPrevInitialQuotes] = useState(initialQuotes)
  if (prevInitialQuotes !== initialQuotes) {
    setPrevInitialQuotes(initialQuotes)
    setQuotes(initialQuotes)
    setSelected(new Set())
  }

  // Eén keer vastleggen bij mount: Date.now() tijdens render is niet puur.
  const [now] = useState(() => Date.now())

  const periodStart: number | null = (() => {
    if (period === '7')    return now - 7  * 86400000
    if (period === '30')   return now - 30 * 86400000
    if (period === '90')   return now - 90 * 86400000
    if (period === 'year') return new Date(new Date().getFullYear(), 0, 1).getTime()
    return null
  })()

  const filtered = quotes.filter((q) => {
    if (search.trim()) {
      const s = search.toLowerCase()
      const matchesSearch = q.quoteNumber.toLowerCase().includes(s)
        || q.title.toLowerCase().includes(s)
        || `${q.customer.firstName} ${q.customer.lastName}`.toLowerCase().includes(s)
      if (!matchesSearch) return false
    }
    if (periodStart !== null) {
      const date = showArchived ? q.archivedAt : q.createdAt
      if (!date || new Date(date).getTime() < periodStart) return false
    }
    return true
  })

  const allSelected = filtered.length > 0 && filtered.every((q) => selected.has(q.id))
  const someSelected = filtered.some((q) => selected.has(q.id)) && !allSelected

  function toggleAll() {
    const allFilteredIds = filtered.map((q) => q.id)
    setSelected((p) => {
      const n = new Set(p)
      if (allSelected) allFilteredIds.forEach((id) => n.delete(id))
      else allFilteredIds.forEach((id) => n.add(id))
      return n
    })
  }
  function toggle(id: string) { setSelected((p) => { const n = new Set(p); if (n.has(id)) { n.delete(id) } else { n.add(id) } return n }) }

  function run(action: () => Promise<void>, removeIds?: string[]) {
    startTransition(async () => {
      if (removeIds) setQuotes((p) => p.filter((q) => !removeIds.includes(q.id)))
      setSelected(new Set())
      await action()
      router.refresh()
    })
  }

  function daysRemaining(validUntil: Date | null | undefined) {
    if (!validUntil) return null
    return Math.ceil((new Date(validUntil).getTime() - now) / 86400000)
  }

  if (quotes.length === 0) {
    return <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>{showArchived ? 'Geen gearchiveerde offertes.' : 'Nog geen offertes.'}</div>
  }

  return (
    <div>
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0a5c35', marginRight: 4 }}>{selected.size} geselecteerd</span>
          {showArchived ? (
            <button onClick={() => { const ids = [...selected]; run(() => bulkUnarchiveQuotes(ids), ids) }} disabled={isPending} style={bulkBtnStyle}>Terugzetten</button>
          ) : (
            <>
              <button onClick={() => { const ids = [...selected]; run(() => bulkArchiveQuotes(ids), ids) }} disabled={isPending} style={bulkBtnStyle}>Archiveer</button>
              <button onClick={() => { const ids = [...selected]; run(() => bulkExpireQuotes(ids)) }} disabled={isPending} style={bulkBtnStyle}>Laten verlopen</button>
            </>
          )}
          <button onClick={() => exportQuotesCSV(quotes.filter((q) => selected.has(q.id)))} style={bulkBtnStyle}>Exporteer CSV</button>
          <button onClick={() => { if (!confirm(`${selected.size} offerte(s) definitief verwijderen?`)) return; const ids = [...selected]; run(() => bulkDeleteQuotes(ids), ids) }} disabled={isPending} style={{ ...bulkBtnStyle, color: '#dc2626', borderColor: '#fca5a5' }}>Verwijder</button>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>Deselecteer alles</button>
        </div>
      )}

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op nummer, titel of klant…"
          style={{ flex: 1, minWidth: 200, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
        />
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '10px 14px', width: 44 }}>
              <Cb checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
            </th>
            {['Nummer', 'Titel', 'Klant', 'Status', 'Totaal', showArchived ? 'Gearchiveerd op' : 'Aangemaakt', ''].map((h) => (
              <th key={h} style={{ padding: '10px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)', textAlign: h === 'Totaal' ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13.5 }}>Geen resultaten voor &quot;{search}&quot;</td></tr>
          )}
          {filtered.map((q) => {
            const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT
            const isSelected = selected.has(q.id)
            const days = daysRemaining(q.validUntil)
            const daysLabel = days === null ? null
              : days < 0 ? { text: `${Math.abs(days)}d verlopen`, color: '#dc2626', bg: '#fef2f2' }
              : days <= 7 ? { text: `${days}d geldig`, color: '#d97706', bg: '#fffbeb' }
              : { text: `${days}d geldig`, color: '#6b7280', bg: 'var(--bg-elevated)' }
            return (
              <tr key={q.id}
                onClick={() => router.push(`/quotes/${q.id}`)}
                style={{ borderBottom: '1px solid var(--border)', background: isSelected ? 'rgba(10,92,53,0.04)' : undefined, cursor: 'pointer' }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(10,92,53,0.04)' : '' }}
              >
                <td style={{ padding: '10px 14px' }} onClick={(e) => e.stopPropagation()}>
                  <Cb checked={isSelected} onChange={() => toggle(q.id)} />
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{q.quoteNumber}</td>
                <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>{q.title}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{q.customer.firstName} {q.customer.lastName}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 500, color: meta.color, background: meta.bg }}>{meta.label}</span>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(q.total)}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {formatDate(showArchived ? q.archivedAt : q.createdAt)}
                  {!showArchived && daysLabel && (
                    <span style={{ display: 'inline-block', marginLeft: 6, padding: '1px 6px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: daysLabel.color, background: daysLabel.bg }}>{daysLabel.text}</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px' }} onClick={(e) => e.stopPropagation()}>
                  <ConfirmButton
                    action={showArchived ? unarchiveQuote.bind(null, q.id) : archiveQuote.bind(null, q.id)}
                    label={showArchived ? 'Terugzetten' : 'Archiveren'}
                    confirmMessage={showArchived ? `Offerte "${q.quoteNumber}" terugzetten?` : `Offerte "${q.quoteNumber}" archiveren?`}
                    variant={showArchived ? 'default' : 'warning'}
                    size="sm"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
