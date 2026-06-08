'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth.actions'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

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
        Account aanmaken
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', marginBottom: 24 }}>
        Maak een nieuw account aan om te beginnen.
      </p>

      <form action={action}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Naam
            </label>
            <input
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jan de Vries"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              E-mailadres <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="naam@bedrijf.nl"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Wachtwoord <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Minimaal 8 tekens"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Wachtwoord bevestigen <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              name="passwordConfirm"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Herhaal wachtwoord"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Registratiecode <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              name="registrationCode"
              type="text"
              required
              maxLength={4}
              pattern="\d{4}"
              inputMode="numeric"
              placeholder="4-cijferige code"
              style={{ ...inputStyle, letterSpacing: '0.25em', textAlign: 'center', fontSize: 18 }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 5 }}>
              Vraag deze code op bij de beheerder
            </p>
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
            {pending ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </div>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 20 }}>
        Al een account?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Inloggen
        </Link>
      </p>
    </div>
  )
}
