'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setReminderDays, sendQuoteReminder } from '@/lib/actions/quote.actions'

export default function QuoteReminder({
  quoteId, reminderDays, reminderSentAt, sentAt, hasEmail,
}: {
  quoteId: string
  reminderDays: number | null
  reminderSentAt: string | null
  sentAt: string | null
  hasEmail: boolean
}) {
  const router = useRouter()
  const [days, setDays] = useState<string>(reminderDays != null ? String(reminderDays) : '')
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function save() {
    setMsg(null)
    startTransition(async () => {
      try {
        const n = days.trim() === '' ? null : parseInt(days, 10)
        await setReminderDays(quoteId, n)
        setMsg({ ok: true, text: n ? `Herinnering ingesteld op ${n} dagen` : 'Herinnering uitgezet' })
        router.refresh()
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : 'Mislukt' })
      }
    })
  }

  function sendNow() {
    setMsg(null)
    startTransition(async () => {
      const r = await sendQuoteReminder(quoteId)
      setMsg(r.ok ? { ok: true, text: 'Herinnering verstuurd' } : { ok: false, text: r.error ?? 'Mislukt' })
      if (r.ok) router.refresh()
    })
  }

  // Geplande datum tonen
  let plannedLabel: string | null = null
  if (reminderDays != null && sentAt) {
    const due = new Date(sentAt)
    due.setDate(due.getDate() + reminderDays)
    plannedLabel = due.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
  }

  const inp: React.CSSProperties = {
    width: 64, padding: '7px 8px', borderRadius: 8, border: '1px solid var(--border-strong)',
    background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13.5, fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Na</span>
        <input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} placeholder="bijv. 3" style={inp} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>dagen</span>
        <button
          onClick={save}
          disabled={pending}
          style={{ padding: '7px 12px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          Opslaan
        </button>
      </div>

      {plannedLabel && !reminderSentAt && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>📅 Herinnering wordt automatisch verstuurd rond <strong>{plannedLabel}</strong> (als nog niet getekend).</p>
      )}
      {reminderSentAt && (
        <p style={{ fontSize: 12, color: '#16a34a' }}>✓ Herinnering verstuurd op {new Date(reminderSentAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</p>
      )}
      {!sentAt && reminderDays != null && (
        <p style={{ fontSize: 12, color: '#d97706' }}>Wordt actief zodra de offerte is verstuurd.</p>
      )}

      {hasEmail && (
        <button
          onClick={sendNow}
          disabled={pending}
          style={{ padding: '7px 12px', borderRadius: 8, background: 'transparent', color: 'var(--accent)', border: '1px solid var(--border-strong)', fontSize: 12.5, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          Herinnering nu sturen
        </button>
      )}
      {msg && <p style={{ fontSize: 12, color: msg.ok ? '#16a34a' : 'var(--danger)' }}>{msg.ok ? '✓ ' : '✕ '}{msg.text}</p>}
    </div>
  )
}
