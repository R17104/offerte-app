'use client'

import { useRef, useState } from 'react'

type Slot = { kind: 'meterkast' | 'batterij'; label: string; hint: string }
const SLOTS: Slot[] = [
  { kind: 'meterkast', label: 'Foto van de meterkast', hint: 'Maak een duidelijke foto van de hele meterkast.' },
  { kind: 'batterij',  label: 'Foto van de batterijlocatie', hint: 'De plek waar de thuisbatterij komt te hangen/staan.' },
]

function PhotoSlot({ token, slot, initialUrl }: { token: string; slot: Slot; initialUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', slot.kind)
      const res = await fetch(`/api/offerte/${token}/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload mislukt')
      setUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ flex: '1 1 240px', minWidth: 220, border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, background: '#fff' }}>
      <p style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{slot.label}</p>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{slot.hint}</p>

      <div style={{
        position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: 8, overflow: 'hidden',
        background: '#f3f4f6', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 28 }}>📷</span>
        )}
        {url && (
          <span style={{ position: 'absolute', top: 8, right: 8, background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12 }}>✓ geüpload</span>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: 'none' }} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{
          width: '100%', padding: '10px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
          background: url ? '#fff' : '#0a5c35', color: url ? '#0a5c35' : '#fff',
          border: url ? '1.5px solid #0a5c35' : 'none', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-sans)',
        }}
      >
        {loading ? 'Uploaden…' : url ? 'Andere foto kiezen' : 'Foto uploaden'}
      </button>
      {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{error}</p>}
    </div>
  )
}

export default function SchouwPhotoUpload({ token, meterkast, batterij }: { token: string; meterkast: string | null; batterij: string | null }) {
  const initial: Record<string, string | null> = { meterkast, batterij }
  return (
    <div className="no-print">
      <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
        Foto&apos;s voor de schouw <span style={{ fontWeight: 500, color: '#6b7280' }}>(optioneel)</span>
      </p>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, maxWidth: 560 }}>
        Help ons de installatie goed voorbereiden. U kunt deze foto&apos;s nu toevoegen, of later via deze pagina. Het is niet verplicht om te ondertekenen.
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {SLOTS.map((s) => <PhotoSlot key={s.kind} token={token} slot={s} initialUrl={initial[s.kind]} />)}
      </div>
    </div>
  )
}
