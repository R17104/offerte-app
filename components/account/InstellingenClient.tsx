'use client'

import { useState, useTransition } from 'react'
import { adminCreateUser, adminDeleteUser, adminUpdateRole } from '@/lib/actions/user.actions'

type User = { id: string; name: string | null; email: string; role: string; createdAt: Date }

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Beheerder', SALES: 'Verkoper' }
const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: '#dcfce7', text: '#166534' },
  SALES: { bg: '#dbeafe', text: '#1e40af' },
}

export default function InstellingenClient({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SALES' as 'ADMIN' | 'SALES' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function handleDelete(userId: string) {
    if (confirmId !== userId) { setConfirmId(userId); return }
    setConfirmId(null)
    startTransition(async () => {
      try {
        await adminDeleteUser(userId)
        setUsers((prev) => prev.filter((u) => u.id !== userId))
      } catch (err) {
        setMsg({ ok: false, text: err instanceof Error ? err.message : 'Verwijderen mislukt' })
      }
    })
  }

  function handleRoleToggle(user: User) {
    const newRole = user.role === 'ADMIN' ? 'SALES' : 'ADMIN'
    startTransition(async () => {
      try {
        await adminUpdateRole(user.id, newRole)
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u))
      } catch (err) {
        setMsg({ ok: false, text: err instanceof Error ? err.message : 'Mislukt' })
      }
    })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      try {
        await adminCreateUser(form.email, form.name, form.password, form.role)
        setMsg({ ok: true, text: `${form.name || form.email} toegevoegd` })
        setForm({ name: '', email: '', password: '', role: 'SALES' })
        setShowAdd(false)
      } catch (err) {
        setMsg({ ok: false, text: err instanceof Error ? err.message : 'Aanmaken mislukt' })
      }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 8,
    border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', fontSize: 13.5, outline: 'none',
    fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Gebruikersbeheer */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Gebruikers</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {users.length} account{users.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            style={{
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 13.5,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            + Gebruiker toevoegen
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>Nieuw account</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Naam</label>
                <input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jan de Vries" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>E-mail <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input style={inp} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="jan@offerte.app" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Wachtwoord <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input style={inp} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} placeholder="Min. 8 tekens" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Rol</label>
                <select style={inp} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'ADMIN' | 'SALES' })}>
                  <option value="SALES">Verkoper</option>
                  <option value="ADMIN">Beheerder</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={isPending} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Aanmaken
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Annuleren
              </button>
            </div>
          </form>
        )}

        {msg && (
          <div style={{ padding: '12px 28px', background: msg.ok ? '#f0fdf4' : '#fef2f2', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: msg.ok ? '#16a34a' : 'var(--danger)' }}>{msg.ok ? '✓ ' : '✕ '}{msg.text}</p>
          </div>
        )}

        {/* User list */}
        {users.map((user, i) => {
          const rc = ROLE_COLOR[user.role] ?? ROLE_COLOR.SALES
          const initials = (user.name || user.email).slice(0, 2).toUpperCase()
          return (
            <div
              key={user.id}
              style={{
                padding: '16px 28px',
                borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--accent-muted)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--accent)',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.name ?? <span style={{ color: 'var(--text-tertiary)' }}>Geen naam</span>}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{user.email}</p>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                background: rc.bg, color: rc.text,
              }}>
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
              <button
                onClick={() => handleRoleToggle(user)}
                disabled={isPending}
                style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 12,
                  border: '1px solid var(--border-strong)', background: 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {user.role === 'ADMIN' ? 'Maak verkoper' : 'Maak beheerder'}
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={isPending}
                style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 12,
                  border: `1px solid ${confirmId === user.id ? 'var(--danger)' : 'var(--border-strong)'}`,
                  background: confirmId === user.id ? 'var(--danger-muted)' : 'transparent',
                  color: confirmId === user.id ? 'var(--danger)' : 'var(--text-tertiary)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {confirmId === user.id ? 'Zeker weten?' : 'Verwijderen'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
