'use client'

import { useState, useRef } from 'react'

const CATEGORY_ICONS: Record<string, string> = {
  BATTERY:        '🔋',
  SOLAR:          '☀️',
  HEAT_PUMP:      '♨️',
  CHARGER:        '⚡',
  EMERGENCY_POWER:'🔌',
}

interface Props {
  name: string
  defaultValue?: string | null
  category?: string
}

export default function ImageUpload({ name, defaultValue, category }: Props) {
  const [url, setUrl] = useState(defaultValue ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload mislukt')
      setUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt')
    } finally {
      setUploading(false)
    }
  }

  const icon = category ? CATEGORY_ICONS[category] ?? '📦' : '📦'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Hidden field carries the URL to the form */}
      <input type="hidden" name={name} value={url} />

      {/* Preview / placeholder */}
      <div
        style={{
          width: '100%',
          height: 180,
          borderRadius: 10,
          border: `2px dashed ${url ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: url ? 'transparent' : 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
        }}
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          <img
            src={url}
            alt="Product afbeelding"
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
            <p style={{ fontSize: 12.5 }}>Klik om foto te uploaden</p>
            <p style={{ fontSize: 11, marginTop: 2 }}>JPG, PNG of WebP</p>
          </div>
        )}

        {uploading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: 'var(--accent)', fontWeight: 500,
          }}>
            Uploaden…
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {/* URL manual override */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Of plak een afbeelding-URL…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 10px',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
        {url && (
          <button
            type="button"
            onClick={() => setUrl('')}
            style={{
              padding: '7px 10px',
              fontSize: 12,
              color: 'var(--danger)',
              background: 'var(--danger-muted)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Wissen
          </button>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>
      )}
    </div>
  )
}
