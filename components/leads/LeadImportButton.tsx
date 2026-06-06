'use client'

import { useRef, useState } from 'react'
import { importLeads, type LeadImportRow } from '@/lib/actions/lead.actions'

const FIELD_MAP: Record<string, keyof LeadImportRow> = {
  voornaam: 'firstName', firstname: 'firstName', first_name: 'firstName', naam: 'firstName',
  achternaam: 'lastName', lastname: 'lastName', last_name: 'lastName', familienaam: 'lastName',
  email: 'email', 'e-mail': 'email', emailadres: 'email',
  telefoon: 'phone', phone: 'phone', tel: 'phone', mobiel: 'phone', telefoonnummer: 'phone',
  straat: 'street', street: 'street', adres: 'street',
  huisnummer: 'houseNumber', house_number: 'houseNumber', nr: 'houseNumber',
  postcode: 'postalCode', postal_code: 'postalCode', zip: 'postalCode',
  stad: 'city', city: 'city', plaats: 'city', woonplaats: 'city',
}

function parseCSV(text: string): LeadImportRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  // Detect separator: semicolon or comma
  const sep = lines[0].includes(';') ? ';' : ','

  const headers = lines[0].split(sep).map((h) =>
    h.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_')
  )

  const mapped = headers.map((h) => FIELD_MAP[h] ?? null)

  return lines.slice(1).flatMap((line) => {
    if (!line.trim()) return []
    // Handle quoted fields
    const cols: string[] = []
    let cur = '', inQ = false
    for (const ch of line + sep) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === sep && !inQ) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }

    const row: Partial<LeadImportRow> = {}
    mapped.forEach((field, i) => {
      if (field && cols[i]) row[field] = cols[i]
    })

    if (!row.firstName && !row.lastName) return []
    return [{ firstName: row.firstName ?? '', lastName: row.lastName ?? '', ...row }]
  })
}

export default function LeadImportButton() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; count?: number; error?: string } | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setResult({ ok: false, error: 'Geen geldige rijen gevonden. Controleer de kolomnamen (voornaam, achternaam, email, telefoon, postcode, stad…).' })
        return
      }
      await importLeads(rows, file.name)
      setResult({ ok: true, count: rows.length })
    } catch {
      setResult({ ok: false, error: 'Upload mislukt. Probeer opnieuw.' })
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
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

      {result && (
        <span style={{ fontSize: 13, color: result.ok ? '#16a34a' : '#dc2626' }}>
          {result.ok ? `✓ ${result.count} leads geïmporteerd` : result.error}
        </span>
      )}
    </div>
  )
}
