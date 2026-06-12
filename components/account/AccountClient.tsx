'use client'

import { useState, useTransition } from 'react'
import { updateProfile, updatePassword } from '@/lib/actions/user.actions'

type Props = {
  userId: string
  name: string | null
  email: string
  role: string
}

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Beheerder', SALES: 'Verkoper' }

export default function AccountClient({ name, email, role }: Props) {
  const [isPending, startTransition] = useTransition()
  const [nameVal, setNameVal] = useState(name ?? '')
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const initials = (name || email).slice(0, 2).toUpperCase()

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setNameMsg(null)
    startTransition(async () => {
      try {
        await updateProfile(nameVal)
        setNameMsg({ ok: true, text: 'Naam opgeslagen' })
      } catch {
        setNameMsg({ ok: false, text: 'Opslaan mislukt' })
      }
    })
  }

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (pw.next !== pw.confirm) {
      setPwMsg({ ok: false, text: 'Wachtwoorden komen niet overeen' })
      return
    }
    startTransition(async () => {
      try {
        await updatePassword(pw.current, pw.next)
        setPwMsg({ ok: true, text: 'Wachtwoord gewijzigd' })
        setPw({ current: '', next: '', confirm: '' })
      } catch (err) {
        setPwMsg({ ok: false, text: err instanceof Error ? err.message : 'Mislukt' })
      }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, display: 'block',
  }
  const card: React.CSSProperties = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '28px 32px',
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Hero card */}
      <div style={{
        ...card,
        background: 'linear-gradient(135deg, #0a5c35 0%, #166534 100%)',
        border: 'none', display: 'flex', alignItems: 'center', gap: 24, padding: '32px 36px',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {name || email.split('@')[0]}
          </p>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{email}</p>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 20,
            background: 'rgba(255,255,255,0.18)', color: '#fff',
            fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em',
          }}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="r-grid-2">

        {/* Profiel */}
        <form onSubmit={handleProfileSave}>
          <div style={card}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 20 }}>
              Profiel
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={label}>Weergavenaam</label>
                <input
                  style={inp}
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  placeholder="Jouw naam"
                />
              </div>
              <div>
                <label style={label}>E-mailadres</label>
                <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={email} readOnly />
                <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  E-mail kan niet worden gewijzigd
                </p>
              </div>
              {nameMsg && (
                <p style={{ fontSize: 13, color: nameMsg.ok ? '#16a34a' : 'var(--danger)' }}>
                  {nameMsg.ok ? '✓ ' : '✕ '}{nameMsg.text}
                </p>
              )}
              <button
                type="submit"
                disabled={isPending}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--accent)', color: '#fff', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', opacity: isPending ? 0.6 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {isPending ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          </div>
        </form>

        {/* Wachtwoord */}
        <form onSubmit={handlePasswordSave}>
          <div style={card}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 20 }}>
              Wachtwoord wijzigen
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={label}>Huidig wachtwoord</label>
                <input style={inp} type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
              </div>
              <div>
                <label style={label}>Nieuw wachtwoord</label>
                <input style={inp} type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={8} />
              </div>
              <div>
                <label style={label}>Bevestig nieuw wachtwoord</label>
                <input style={inp} type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
              </div>
              {pwMsg && (
                <p style={{ fontSize: 13, color: pwMsg.ok ? '#16a34a' : 'var(--danger)' }}>
                  {pwMsg.ok ? '✓ ' : '✕ '}{pwMsg.text}
                </p>
              )}
              <button
                type="submit"
                disabled={isPending}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: '#1e293b', color: '#fff', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', opacity: isPending ? 0.6 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {isPending ? 'Wijzigen…' : 'Wachtwoord wijzigen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
