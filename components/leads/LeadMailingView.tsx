'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui'
import { sendBulkLeadEmail } from '@/lib/actions/lead.actions'

type LeadRow = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  city: string | null
  status: string
  lastMailedAt: string | null
}

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Nieuw', CONTACTED: 'Benaderd', AFSPRAAK_INGEPLAND: 'Afspraak ingepland',
  QUOTE_SENT: 'Offerte verstuurd', INSTALLATIE_GEPLAND: 'Installatie gepland',
  BETALING_50: '50% betaald', INSTALLATIE_GEDAAN: 'Installatie gedaan', BETALING_100: '100% betaald',
}

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : null
}

export default function LeadMailingView({ leads, senderName, batchLimit }: { leads: LeadRow[]; senderName: string; batchLimit: number }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [onlyNotMailed, setOnlyNotMailed] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ sent: number; failed: number; skipped: number; error?: string } | null>(null)

  const notMailedCount = leads.filter((l) => !l.lastMailedAt).length
  const mailedCount = leads.length - notMailedCount

  const filtered = leads.filter((l) => {
    if (onlyNotMailed && l.lastMailedAt) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (search.trim()) {
      const s = search.toLowerCase()
      if (!`${l.firstName} ${l.lastName}`.toLowerCase().includes(s) && !(l.email ?? '').toLowerCase().includes(s) && !(l.city ?? '').toLowerCase().includes(s)) return false
    }
    return true
  })

  const overLimit = selected.size > batchLimit

  function toggle(id: string) {
    setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function selectFirstBatch() {
    setSelected(new Set(filtered.slice(0, batchLimit).map((l) => l.id)))
  }
  function clearSel() { setSelected(new Set()) }

  function send() {
    if (selected.size === 0 || overLimit) return
    setResult(null)
    startTransition(async () => {
      const r = await sendBulkLeadEmail([...selected])
      setResult(r)
      if (!r.error) { setSelected(new Set()); router.refresh() }
    })
  }

  const statusOptions = Array.from(new Set(leads.map((l) => l.status)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Veiligheidsmelding */}
      <div style={{ background: 'var(--warning-muted)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--warning)', lineHeight: 1.6 }}>
        Verstuur in batches van <strong>max {batchLimit} per dag</strong> om je e-mailreputatie te beschermen (Gmail-limiet). Al gemailde leads worden standaard verborgen, zodat je morgen makkelijk de volgende {batchLimit} pakt.
      </div>

      {/* Samenvatting */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { label: 'Mailbare leads', value: leads.length, color: 'var(--text-primary)' },
          { label: 'Nog niet gemaild', value: notMailedCount, color: '#0a5c35' },
          { label: 'Al gemaild', value: mailedCount, color: 'var(--text-tertiary)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="r-grid-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>

        {/* Links: selectie + lijst */}
        <Card padding={0}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op naam, e-mail of plaats…"
              style={{ flex: 1, minWidth: 180, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <option value="all">Alle statussen</option>
              {statusOptions.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={onlyNotMailed} onChange={(e) => setOnlyNotMailed(e.target.checked)} style={{ accentColor: '#0a5c35' }} />
              Alleen nog niet gemaild
            </label>
          </div>

          <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={selectFirstBatch} style={btn('outline')}>Selecteer eerste {batchLimit}</button>
            {selected.size > 0 && <button onClick={clearSel} style={btn('ghost')}>Deselecteer ({selected.size})</button>}
            <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{filtered.length} leads in selectielijst</span>
          </div>

          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '28px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13.5 }}>Geen leads in deze selectie.</p>
            ) : filtered.map((l) => {
              const isSel = selected.has(l.id)
              return (
                <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSel ? 'rgba(10,92,53,0.05)' : undefined }}>
                  <input type="checkbox" checked={isSel} onChange={() => toggle(l.id)} style={{ accentColor: '#0a5c35', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{l.firstName} {l.lastName}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.email}{l.city ? ` · ${l.city}` : ''}
                    </p>
                  </div>
                  {l.lastMailedAt && (
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, whiteSpace: 'nowrap' }}>✉ {fmtDate(l.lastMailedAt)}</span>
                  )}
                </label>
              )
            })}
          </div>
        </Card>

        {/* Rechts: preview + verzenden */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader title="Verzenden" />
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Geselecteerd: <strong style={{ color: 'var(--text-primary)' }}>{selected.size}</strong> / {batchLimit}
            </p>
            {overLimit && <p style={{ fontSize: 12.5, color: 'var(--danger)', marginBottom: 8 }}>Maximaal {batchLimit} per keer. Verwijder er {selected.size - batchLimit}.</p>}
            <button
              onClick={send}
              disabled={pending || selected.size === 0 || overLimit}
              style={{
                width: '100%', padding: '10px', borderRadius: 8, marginTop: 6,
                background: (pending || selected.size === 0 || overLimit) ? 'var(--bg-elevated)' : 'var(--accent)',
                color: (pending || selected.size === 0 || overLimit) ? 'var(--text-tertiary)' : '#fff',
                border: 'none', fontSize: 14, fontWeight: 600, cursor: (pending || selected.size === 0 || overLimit) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {pending ? 'Versturen…' : `Verstuur naar ${selected.size} ${selected.size === 1 ? 'lead' : 'leads'}`}
            </button>
            {result && (
              <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
                {result.error ? (
                  <p style={{ color: 'var(--danger)' }}>✕ {result.error}</p>
                ) : (
                  <p style={{ color: '#16a34a' }}>
                    ✓ {result.sent} verstuurd{result.skipped ? ` · ${result.skipped} overgeslagen (geen geldig e-mail)` : ''}{result.failed ? ` · ${result.failed} mislukt` : ''}
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Voorbeeld van de mail" />
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>Onderwerp: <span style={{ color: 'var(--text-secondary)' }}>Informatie over het stoppen van de salderingsregeling</span></p>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
{`Hallo {voornaam},

Ik stuur je even een bericht omdat veel huishoudens vragen hebben over het stoppen van de salderingsregeling.

Wij geven momenteel vrijblijvend informatie over wat dit betekent in jouw situatie. Je ontvangt daarbij direct een persoonlijk advies en een berekening op maat.

Zou je het prettig vinden als we hiervoor een afspraak inplannen? Dat kan gewoon vrijblijvend.

Groet,

${senderName}
BespaarhulpFriesland.nl
📞 06 38 92 25 13
✉️ info@bespaarhulpfriesland.nl`}
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 8 }}>{'{voornaam}'} en je naam worden automatisch ingevuld. Er staat een afmeldregel onderaan.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function btn(variant: 'outline' | 'ghost'): React.CSSProperties {
  if (variant === 'ghost') return { padding: '6px 12px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }
  return { padding: '6px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
}
