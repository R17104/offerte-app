'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth.actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 28px',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>
        Inloggen
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', marginBottom: 24 }}>
        Voer je gegevens in om verder te gaan.
      </p>

      <form action={action}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              E-mailadres
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="naam@bedrijf.nl"
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Wachtwoord
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {state?.error && (
            <div
              style={{
                background: 'var(--danger-muted)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 12px',
                fontSize: 13,
                color: 'var(--danger)',
              }}
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: pending ? 'var(--accent-muted)' : 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 600,
              cursor: pending ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              marginTop: 4,
            }}
          >
            {pending ? 'Bezig...' : 'Inloggen'}
          </button>
        </div>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 20 }}>
        Nog geen account?{' '}
        <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Registreren
        </Link>
      </p>
    </div>
  )
}
