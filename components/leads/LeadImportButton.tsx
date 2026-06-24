'use client'

import { useRef, useState } from 'react'
import { importLeads, type LeadImportRow, type ImportDuplicate } from '@/lib/actions/lead.actions'

const FIELD_MAP: Record<string, keyof LeadImportRow> = {
  voornaam: 'firstName', firstname: 'firstName', first_name: 'firstName',
  achternaam: 'lastName', lastname: 'lastName', last_name: 'lastName', familienaam: 'lastName',
  email: 'email', 'e-mail': 'email', emailadres: 'email',
  telefoon: 'phone', phone: 'phone', tel: 'phone', mobiel: 'phone', telefoonnummer: 'phone',
  straat: 'street', street: 'street', adres: 'street',
  huisnummer: 'houseNumber', house_number: 'houseNumber', nr: 'houseNumber',
  postcode: 'postalCode', postal_code: 'postalCode', zip: 'postalCode',
  stad: 'city', city: 'city', plaats: 'city', woonplaats: 'city',
}

function splitLine(line: string, sep: string): string[] {
  const cols: string[] = []
  let cur = '', inQ = false
  for (const ch of line + sep) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === sep && !inQ) { cols.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  return cols
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

// Nederlandse telefoonnummers normaliseren (leidende 0 toevoegen waar nodig)
function normPhone(raw?: string): string | undefined {
  const d = (raw ?? '').replace(/[^\d]/g, '')
  if (!d) return undefined
  if (d.startsWith('0031')) return '0' + d.slice(4)
  if (d.startsWith('31') && d.length === 11) return '0' + d.slice(2)
  if (d.length === 9) return '0' + d          // mobiel/vast zonder leidende 0
  return d                                     // 10 cijfers (met 0) of overig
}

const isEmail = (s: string) => /.+@.+\..+/.test(s)
const isPostcode = (s: string) => /^\d{4}\s?[a-z]{2}$/i.test(s)

function parseCSV(text: string): LeadImportRow[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return []

  const sep = lines[0].includes(';') ? ';' : ','
  const firstCols = splitLine(lines[0], sep).map((c) =>
    c.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_')
  )

  // Detect header row: if any column matches a known field name
  const hasHeader = firstCols.some((c) => c in FIELD_MAP)

  if (hasHeader) {
    const mapped = firstCols.map((h) => FIELD_MAP[h] ?? null)
    return lines.slice(1).flatMap((line) => {
      const cols = splitLine(line, sep)
      const row: Partial<LeadImportRow> = {}
      mapped.forEach((field, i) => { if (field && cols[i]) row[field] = cols[i] })
      if (row.phone) row.phone = normPhone(row.phone)
      if (!row.firstName && !row.lastName) return []
      return [{ firstName: row.firstName ?? '', lastName: row.lastName ?? '', ...row }]
    })
  }

  // Geen kopregel: herken eerst het 'Friesland'-export-formaat, anders het
  // oude positionele formaat.
  return lines.flatMap((line): LeadImportRow[] => {
    const cols = splitLine(line, sep)
    if (cols.length < 2) return []

    // Friesland-export: voornaam, achternaam, geb.datum, email, straat,
    // huisnr, postcode, plaats, eigenaar, woningtype, telefoon
    if (cols.length >= 11 && isEmail(cols[3] ?? '') && isPostcode(cols[6] ?? '')) {
      if (!cols[0] && !cols[1]) return []
      return [{
        firstName:   cols[0] || '',
        lastName:    cols[1] || '',
        email:       cols[3] || undefined,
        street:      cols[4] || undefined,
        houseNumber: cols[5] || undefined,
        postalCode:  cols[6] || undefined,
        city:        cols[7] || undefined,
        phone:       normPhone(cols[10]),
      }]
    }

    // Oud positioneel formaat: bron, volledige naam, email, telefoon,
    // postcode, huisnummer, stad
    const { firstName, lastName } = splitFullName(cols[1] ?? '')
    if (!firstName) return []
    return [{
      source:      cols[0] || undefined,
      firstName,
      lastName,
      email:       cols[2] || undefined,
      phone:       normPhone(cols[3]),
      postalCode:  cols[4] || undefined,
      houseNumber: cols[5] || undefined,
      city:        cols[6] || undefined,
    }]
  })
}

type Result =
  | { ok: true; imported: number; duplicates: ImportDuplicate[] }
  | { ok: false; error: string }

function downloadDuplicatesCSV(dups: ImportDuplicate[]) {
  const headers = ['Voornaam', 'Achternaam', 'E-mail', 'Telefoon', 'Reden']
  const rows = dups.map((d) => [d.firstName, d.lastName, d.email ?? '', d.phone ?? '', d.reason])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `duplicaten-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function LeadImportButton() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [showDups, setShowDups] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    setShowDups(false)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setResult({ ok: false, error: 'Geen geldige rijen gevonden in het CSV bestand.' })
        return
      }
      const res = await importLeads(rows, file.name)
      setResult({ ok: true, imported: res.imported, duplicates: res.duplicates })
    } catch {
      setResult({ ok: false, error: 'Upload mislukt. Probeer opnieuw.' })
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
            <path d="M7 1v8M4 5l3-4 3 4M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {loading ? 'Importeren…' : 'CSV importeren'}
        </button>

        {result?.ok === false && (
          <span style={{ fontSize: 13, color: '#dc2626' }}>{result.error}</span>
        )}
        {result?.ok === true && (
          <span style={{ fontSize: 13, color: '#16a34a' }}>
            ✓ {result.imported} geïmporteerd
            {result.duplicates.length > 0 && (
              <>
                {' · '}
                <button
                  onClick={() => setShowDups((v) => !v)}
                  style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'inherit' }}
                >
                  {result.duplicates.length} dubbel {showDups ? '▲' : '▼'}
                </button>
              </>
            )}
          </span>
        )}
      </div>

      {/* Duplicaten-overzicht */}
      {result?.ok === true && result.duplicates.length > 0 && showDups && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10,
          padding: 14, maxWidth: 560, boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {result.duplicates.length} dubbele leads overgeslagen (al aanwezig)
            </p>
            <button
              onClick={() => downloadDuplicatesCSV(result.duplicates)}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ↓ Download CSV
            </button>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.duplicates.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, padding: '6px 8px', borderRadius: 6, background: 'var(--bg-elevated)' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {d.firstName} {d.lastName}
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> · {d.email || d.phone || '—'}</span>
                </span>
                <span style={{ color: '#d97706', flexShrink: 0 }}>{d.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
