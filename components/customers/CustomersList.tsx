'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { bulkArchiveCustomers, bulkUnarchiveCustomers, bulkDeleteCustomers } from '@/lib/actions/customer.actions'
import { archiveCustomer, unarchiveCustomer } from '@/lib/actions/customer.actions'
import { formatDate } from '@/lib/utils'
import ConfirmButton from '@/components/ui/ConfirmButton'

type Address = { postalCode: string; city: string }
type CustomerRow = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  createdAt: Date
  archivedAt: Date | null
  addresses: Address[]
  _count: { quotes: number }
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

function exportCustomersCSV(customers: CustomerRow[]) {
  const headers = ['Voornaam', 'Achternaam', 'E-mail', 'Telefoon', 'Woonplaats', 'Offertes', 'Aangemaakt']
  const rows = customers.map((c) => {
    const addr = c.addresses[0]
    return [c.firstName, c.lastName, c.email ?? '', c.phone ?? '', addr ? `${addr.postalCode} ${addr.city}` : '', String(c._count.quotes), new Date(c.createdAt).toLocaleDateString('nl-NL')]
  })
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `klanten-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
}

const bulkBtnStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface)', color: 'var(--text-secondary)',
  fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
}

export default function CustomersList({ customers: initialCustomers, showArchived }: { customers: CustomerRow[]; showArchived: boolean }) {
  const router = useRouter()
  const [customers, setCustomers] = useState(initialCustomers)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  // Sync met nieuwe server-data tijdens render (officieel React-patroon),
  // zonder extra render-cyclus via een effect.
  const [prevInitialCustomers, setPrevInitialCustomers] = useState(initialCustomers)
  if (prevInitialCustomers !== initialCustomers) {
    setPrevInitialCustomers(initialCustomers)
    setCustomers(initialCustomers)
    setSelected(new Set())
  }

  const filtered = search.trim()
    ? customers.filter((c) => {
        const s = search.toLowerCase()
        return `${c.firstName} ${c.lastName}`.toLowerCase().includes(s)
          || (c.email ?? '').toLowerCase().includes(s)
          || (c.phone ?? '').toLowerCase().includes(s)
          || c.addresses.some((a) => `${a.postalCode} ${a.city}`.toLowerCase().includes(s))
      })
    : customers

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id))
  const someSelected = filtered.some((c) => selected.has(c.id)) && !allSelected

  function toggleAll() {
    const ids = filtered.map((c) => c.id)
    setSelected((p) => { const n = new Set(p); if (allSelected) ids.forEach((id) => n.delete(id)); else ids.forEach((id) => n.add(id)); return n })
  }
  function toggle(id: string) { setSelected((p) => { const n = new Set(p); if (n.has(id)) { n.delete(id) } else { n.add(id) } return n }) }

  function run(action: () => Promise<void>, removeIds?: string[]) {
    startTransition(async () => {
      if (removeIds) setCustomers((p) => p.filter((c) => !removeIds.includes(c.id)))
      setSelected(new Set())
      await action()
      router.refresh()
    })
  }

  if (customers.length === 0) {
    return <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>{showArchived ? 'Geen gearchiveerde klanten.' : 'Nog geen klanten.'}</div>
  }

  return (
    <div>
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0a5c35', marginRight: 4 }}>{selected.size} geselecteerd</span>
          {showArchived ? (
            <button onClick={() => { const ids = [...selected]; run(() => bulkUnarchiveCustomers(ids), ids) }} disabled={isPending} style={bulkBtnStyle}>Terugzetten</button>
          ) : (
            <button onClick={() => { const ids = [...selected]; run(() => bulkArchiveCustomers(ids), ids) }} disabled={isPending} style={bulkBtnStyle}>Archiveer</button>
          )}
          <button onClick={() => exportCustomersCSV(customers.filter((c) => selected.has(c.id)))} style={bulkBtnStyle}>Exporteer CSV</button>
          <button onClick={() => { if (!confirm(`${selected.size} klant(en) en al hun offertes definitief verwijderen?`)) return; const ids = [...selected]; run(() => bulkDeleteCustomers(ids), ids) }} disabled={isPending} style={{ ...bulkBtnStyle, color: '#dc2626', borderColor: '#fca5a5' }}>Verwijder</button>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>Deselecteer alles</button>
        </div>
      )}

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
            {['Naam', 'Email', 'Telefoon', 'Woonplaats', 'Offertes', showArchived ? 'Gearchiveerd op' : 'Aangemaakt', ''].map((h) => (
              <th key={h} style={{ padding: '10px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)', textAlign: h === 'Offertes' ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13.5 }}>Geen resultaten voor &quot;{search}&quot;</td></tr>
          )}
          {filtered.map((c) => {
            const addr = c.addresses[0]
            const isSelected = selected.has(c.id)
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: isSelected ? 'rgba(10,92,53,0.04)' : undefined }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(10,92,53,0.04)' : '' }}
              >
                <td style={{ padding: '10px 14px' }}>
                  <Cb checked={isSelected} onChange={() => toggle(c.id)} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Link href={`/customers/${c.id}`} style={{ fontWeight: 500, textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13.5 }}>{c.firstName} {c.lastName}</Link>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{addr ? `${addr.postalCode} ${addr.city}` : '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right' }}>{c._count.quotes}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{formatDate(showArchived ? c.archivedAt : c.createdAt)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Link
                      href={`/customers/${c.id}/edit`}
                      style={{ padding: '4px 10px', fontSize: 12.5, fontWeight: 500, borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      Bewerken
                    </Link>
                    <ConfirmButton
                      action={showArchived ? unarchiveCustomer.bind(null, c.id) : archiveCustomer.bind(null, c.id)}
                      label={showArchived ? 'Terugzetten' : 'Archiveren'}
                      confirmMessage={showArchived ? `"${c.firstName} ${c.lastName}" terugzetten?` : `"${c.firstName} ${c.lastName}" archiveren?`}
                      variant={showArchived ? 'default' : 'warning'}
                      size="sm"
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
