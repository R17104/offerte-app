'use client'

import { useTransition, useState } from 'react'
import { sendQuoteByEmail } from '@/lib/actions/quote.actions'

export default function SendEmailButton({ quoteId, customerEmail }: { quoteId: string; customerEmail: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (!customerEmail) return (
    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '6px 0', display: 'block' }}>
      Geen e-mail bekend bij klant
    </span>
  )

  function handleSend() {
    setMsg(null)
    startTransition(async () => {
      const result = await sendQuoteByEmail(quoteId)
      if (result.ok) {
        setMsg({ ok: true, text: `Verstuurd naar ${customerEmail}` })
      } else {
        setMsg({ ok: false, text: result.error ?? 'Versturen mislukt' })
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={handleSend}
        disabled={isPending}
        style={{
          width: '100%', padding: '8px 14px', borderRadius: 8,
          background: isPending ? 'var(--bg-elevated)' : 'var(--accent)',
          color: isPending ? 'var(--text-secondary)' : '#fff',
          border: 'none', fontSize: 13.5, fontWeight: 500,
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {isPending ? 'Versturen…' : '✉ Stuur via e-mail'}
      </button>
      {msg && (
        <p style={{ fontSize: 12, color: msg.ok ? '#16a34a' : 'var(--danger)' }}>
          {msg.ok ? '✓ ' : '✕ '}{msg.text}
        </p>
      )}
    </div>
  )
}
