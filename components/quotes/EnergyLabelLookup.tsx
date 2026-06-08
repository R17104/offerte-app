'use client'

import { useState } from 'react'

type LabelResult = {
  label: string
  gebouwtype: string | null
  registratiedatum: string | null
  geldigTot: string | null
  opnametype: string | null
}

const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
  'A++++': { bg: '#005a00', text: '#fff' },
  'A+++':  { bg: '#007a00', text: '#fff' },
  'A++':   { bg: '#009900', text: '#fff' },
  'A+':    { bg: '#33b200', text: '#fff' },
  'A':     { bg: '#4cc300', text: '#fff' },
  'B':     { bg: '#8bc400', text: '#fff' },
  'C':     { bg: '#c8d400', text: '#111' },
  'D':     { bg: '#f5d800', text: '#111' },
  'E':     { bg: '#f5a800', text: '#111' },
  'F':     { bg: '#f57000', text: '#fff' },
  'G':     { bg: '#e83000', text: '#fff' },
}

function fmt(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function EnergyLabelLookup({ defaultPostcode, defaultHuisnummer }: {
  defaultPostcode?: string
  defaultHuisnummer?: string
}) {
  const [postcode,   setPostcode]   = useState(defaultPostcode ?? '')
  const [huisnummer, setHuisnummer] = useState(defaultHuisnummer ?? '')
  const [toevoeging, setToevoeging] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<LabelResult | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const params = new URLSearchParams({ postcode, huisnummer })
      if (toevoeging) params.set('toevoeging', toevoeging)
      const res = await fetch(`/api/energielabel?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Opzoeken mislukt')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    padding: '8px 11px', borderRadius: 8,
    border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', fontSize: 13.5, outline: 'none',
    fontFamily: 'var(--font-sans)',
  }

  const colors = result ? (LABEL_COLORS[result.label] ?? { bg: '#6b7280', text: '#fff' }) : null

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 22px', marginBottom: 16,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Energielabel opzoeken
      </p>

      <form onSubmit={handleLookup} style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)' }}>Postcode</label>
          <input
            style={{ ...inp, width: 100 }}
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="1234AB"
            maxLength={7}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)' }}>Huisnummer</label>
          <input
            style={{ ...inp, width: 80 }}
            value={huisnummer}
            onChange={(e) => setHuisnummer(e.target.value)}
            placeholder="12"
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)' }}>Toevoeging</label>
          <input
            style={{ ...inp, width: 70 }}
            value={toevoeging}
            onChange={(e) => setToevoeging(e.target.value)}
            placeholder="A"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !postcode || !huisnummer}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 13.5,
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !postcode || !huisnummer ? 0.6 : 1,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {loading ? 'Zoeken…' : 'Opzoeken'}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)' }}>✕ {error}</p>
      )}

      {result && colors && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Label badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 12,
            background: colors.bg, color: colors.text,
            fontSize: 28, fontWeight: 800, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            position: 'relative',
          }}>
            {result.label}
            {/* Arrow */}
            <div style={{
              position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)',
              width: 0, height: 0,
              borderTop: '14px solid transparent',
              borderBottom: '14px solid transparent',
              borderLeft: `14px solid ${colors.bg}`,
            }} />
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {result.gebouwtype && (
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                {result.gebouwtype}
              </p>
            )}
            {result.registratiedatum && (
              <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                Geregistreerd: {fmt(result.registratiedatum)}
              </p>
            )}
            {result.geldigTot && (
              <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                Geldig tot: {fmt(result.geldigTot)}
              </p>
            )}
            {result.opnametype && (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Type: {result.opnametype}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
