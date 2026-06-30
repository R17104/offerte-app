'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { completeFollowUp } from '@/lib/actions/lead.actions'
import { completeAppointment } from '@/lib/actions/appointment.actions'

export type Task = {
  kind: 'appointment' | 'followup'
  id: string
  when: string // ISO
  leadId: string | null
  name: string
  phone: string | null
  city: string | null
  note: string | null
  owner: string | null
}

type Bucket = { key: string; label: string; color: string; tasks: Task[] }

function dayIndex(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return Math.floor(x.getTime() / 86400000)
}

function telLink(phone: string): string {
  const d = phone.replace(/\D/g, '')
  const intl = d.startsWith('0031') ? d.slice(2) : d.startsWith('31') ? d : d.startsWith('0') ? '31' + d.slice(1) : '31' + d
  return `tel:+${intl}`
}

export default function TakenView({ tasks: initial }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initial)
  const [openId, setOpenId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [isPending, startTransition] = useTransition()

  const buckets = useMemo<Bucket[]>(() => {
    const today = dayIndex(new Date())
    const defs: Bucket[] = [
      { key: 'overdue', label: 'Te laat', color: '#dc2626', tasks: [] },
      { key: 'today', label: 'Vandaag', color: '#0a5c35', tasks: [] },
      { key: 'tomorrow', label: 'Morgen', color: '#2563eb', tasks: [] },
      { key: 'later', label: 'Later', color: '#6b7280', tasks: [] },
    ]
    for (const t of tasks) {
      const diff = dayIndex(new Date(t.when)) - today
      const b = diff < 0 ? defs[0] : diff === 0 ? defs[1] : diff === 1 ? defs[2] : defs[3]
      b.tasks.push(t)
    }
    return defs.filter((b) => b.tasks.length > 0)
  }, [tasks])

  function startComplete(t: Task) {
    setOpenId(`${t.kind}:${t.id}`)
    setNewDate('')
  }

  function confirmComplete(t: Task) {
    const date = newDate || null
    startTransition(async () => {
      if (t.kind === 'followup') {
        await completeFollowUp(t.id, date)
      } else {
        await completeAppointment(t.id, date)
      }
      // Lokaal verwijderen (of verplaatsen als er een nieuwe datum is)
      setTasks((prev) => {
        const rest = prev.filter((x) => !(x.kind === t.kind && x.id === t.id))
        if (date) {
          rest.push({ ...t, kind: 'followup', id: t.leadId ?? t.id, leadId: t.leadId ?? t.id, when: new Date(date).toISOString(), note: null })
        }
        return rest.sort((a, b) => a.when.localeCompare(b.when))
      })
      setOpenId(null)
    })
  }

  if (tasks.length === 0) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Geen openstaande taken</p>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Er staan geen afspraken of opvolgingen met een tijd gepland.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {buckets.map((b) => (
        <div key={b.key}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{b.label}</h2>
            <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>({b.tasks.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {b.tasks.map((t) => {
              const when = new Date(t.when)
              const isApt = t.kind === 'appointment'
              const showDate = b.key === 'overdue' || b.key === 'later'
              const rowKey = `${t.kind}:${t.id}`
              const open = openId === rowKey
              return (
                <div key={rowKey} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, borderLeft: `3px solid ${b.color}`, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', flexWrap: 'wrap' }}>
                    {/* Tijd */}
                    <div style={{ minWidth: 56, flexShrink: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                        {when.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {showDate && (
                        <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {when.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>

                    {/* Type */}
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, whiteSpace: 'nowrap', flexShrink: 0,
                      background: isApt ? '#7c3aed18' : '#0891b218',
                      color: isApt ? '#7c3aed' : '#0891b2',
                    }}>
                      {isApt ? '📅 Afspraak' : '🔔 Opvolging'}
                    </span>

                    {/* Naam + details */}
                    <div style={{ flex: 1, minWidth: 150 }}>
                      {t.leadId ? (
                        <Link href={`/leads/${t.leadId}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{t.name}</Link>
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                      )}
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {[t.city, t.owner && `→ ${t.owner}`].filter(Boolean).join(' · ')}
                        {t.note ? `${t.city || t.owner ? ' · ' : ''}${t.note}` : ''}
                      </p>
                    </div>

                    {/* Acties */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {t.phone && (
                        <a href={telLink(t.phone)} title="Bellen" style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 34, height: 34, borderRadius: 8, background: '#0a5c35', color: '#fff', textDecoration: 'none',
                        }}>
                          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M5.5 2.5l1.2 2.8-1.4 1.1a8 8 0 003.3 3.3l1.1-1.4 2.8 1.2v2.4c0 .6-.5 1.1-1.1 1A11.5 11.5 0 012.2 4.6c-.1-.6.4-1.1 1-1.1h2.3z" fill="#fff"/></svg>
                        </a>
                      )}
                      <button type="button" onClick={() => (open ? setOpenId(null) : startComplete(t))} disabled={isPending} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
                        background: open ? 'var(--bg-elevated)' : 'transparent', color: '#16a34a', border: '1px solid #16a34a55',
                        fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      }}>
                        ✓ Afronden
                      </button>
                    </div>
                  </div>

                  {/* Afrond-paneel */}
                  {open && (
                    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Nieuwe opvolging (optioneel):</span>
                      <input
                        type="datetime-local"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit' }}
                      />
                      <button type="button" onClick={() => confirmComplete(t)} disabled={isPending} style={{
                        padding: '7px 16px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none',
                        fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}>
                        {newDate ? 'Afronden + opnieuw plannen' : 'Afronden'}
                      </button>
                      <button type="button" onClick={() => setOpenId(null)} disabled={isPending} style={{
                        padding: '7px 12px', borderRadius: 8, background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--border)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        Annuleer
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
