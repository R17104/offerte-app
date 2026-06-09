'use client'

import { useState, useTransition, useEffect } from 'react'
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

export default function QuotesList({ quotes: initialQuotes, showArchived }: { quotes: QuoteRow[]; showArchived: boolean }) {
  const router = useRouter()
  const [quotes, setQuotes] = useState(initialQuotes)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setQuotes(initialQuotes); setSelected(new Set()) }, [initialQuotes])

  const allSelected = quotes.length > 0 && selected.size === quotes.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() { setSelected(allSelected ? new Set() : new Set(quotes.map((q) => q.id))) }
  function toggle(id: string) { setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  function run(action: () => Promise<void>, removeIds?: string[]) {
    startTransition(async () => {
      if (removeIds) setQuotes((p) => p.filter((q) => !removeIds.includes(q.id)))
      setSelected(new Set())
      await action()
      router.refresh()
    })
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
          {quotes.map((q) => {
            const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT
            const isSelected = selected.has(q.id)
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
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{formatDate(showArchived ? q.archivedAt : q.createdAt)}</td>
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
