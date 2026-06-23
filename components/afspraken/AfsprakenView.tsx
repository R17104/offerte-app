'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, Badge } from '@/components/ui'
import {
  createAppointment, assignAppointment, claimAppointment,
  updateAppointmentStatus, deleteAppointment,
} from '@/lib/actions/appointment.actions'

type UserRef = { id: string; name: string | null; email: string }
type LeadRef = { id: string; firstName: string; lastName: string; phone: string | null; street: string | null; houseNumber: string | null; postalCode: string | null; city: string | null } | null
type Appt = {
  id: string
  scheduledAt: string
  notes: string | null
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED'
  lead: LeadRef
  plannedBy: UserRef
  assignedTo: UserRef | null
}
type LeadOpt = { id: string; firstName: string; lastName: string; city: string | null }

const ST: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED:   { label: 'Gepland',     color: '#2563eb', bg: '#2563eb18' },
  COMPLETED: { label: 'Afgerond',    color: '#16a34a', bg: '#16a34a18' },
  CANCELLED: { label: 'Geannuleerd', color: '#9ca3af', bg: '#9ca3af18' },
}

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

const userName = (u: UserRef | null) => u ? (u.name ?? u.email.split('@')[0]) : null

export default function AfsprakenView({
  appointments, isPlanner, leads, users, currentUserId, preselectLeadId,
}: {
  appointments: Appt[]
  isPlanner: boolean
  leads: LeadOpt[]
  users: UserRef[]
  currentUserId: string
  preselectLeadId: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // formulier-state
  const [leadId, setLeadId] = useState(preselectLeadId ?? '')
  const [scheduledAt, setScheduledAt] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function run(fn: () => Promise<void>) {
    setError('')
    startTransition(async () => {
      try { await fn(); router.refresh() }
      catch (e) { setError(e instanceof Error ? e.message : 'Er ging iets mis') }
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    run(async () => {
      await createAppointment({ leadId: leadId || null, scheduledAt, assignedToId: assignedToId || null, notes })
      setScheduledAt(''); setNotes(''); setAssignedToId(''); setLeadId('')
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border)',
    fontSize: 13.5, fontFamily: 'inherit', background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {isPlanner && (
        <Card>
          <CardHeader title="Nieuwe afspraak inplannen" />
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'end' }}>
            <div>
              <label style={lbl}>Lead / klant</label>
              <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={inp}>
                <option value="">Geen lead (losse afspraak)</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.lastName}, {l.firstName}{l.city ? ` — ${l.city}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Datum &amp; tijd</label>
              <input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Toewijzen aan</label>
              <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} style={inp}>
                <option value="">Open — voor iedereen zichtbaar</option>
                {users.map((u) => <option key={u.id} value={u.id}>{userName(u)}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Notitie (optioneel)</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bijv. tijdstip bevestigd, intercom kapot…" style={inp} />
            </div>
            <div>
              <button type="submit" disabled={pending} style={{
                padding: '9px 18px', borderRadius: 8, background: 'var(--accent)', color: '#fff',
                border: 'none', fontSize: 13.5, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit',
              }}>
                {pending ? 'Bezig…' : '+ Afspraak inplannen'}
              </button>
            </div>
          </form>
          {error && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 10 }}>{error}</p>}
        </Card>
      )}

      {!isPlanner && error && <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>}

      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
          Afspraken ({appointments.length})
        </div>
        {appointments.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '20px' }}>Er zijn nog geen afspraken.</p>
        ) : (
          <div>
            {appointments.map((a, i) => {
              const meta = ST[a.status]
              const open = !a.assignedTo
              const mineToComplete = isPlanner || a.plannedBy.id === currentUserId || a.assignedTo?.id === currentUserId
              const addr = a.lead ? [a.lead.street, a.lead.houseNumber].filter(Boolean).join(' ') + (a.lead.postalCode || a.lead.city ? `, ${[a.lead.postalCode, a.lead.city].filter(Boolean).join(' ')}` : '') : ''
              return (
                <div key={a.id} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid var(--border)' : undefined, display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', opacity: a.status === 'CANCELLED' ? 0.6 : 1 }}>
                  {/* Links: info */}
                  <div style={{ flex: '1 1 320px', minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{fmtWhen(a.scheduledAt)}</span>
                      <Badge label={meta.label} color={meta.color} bg={meta.bg} />
                    </div>
                    {a.lead ? (
                      <p style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>
                        <Link href={`/leads/${a.lead.id}`} style={{ color: 'var(--text-link)', textDecoration: 'none' }}>
                          {a.lead.firstName} {a.lead.lastName}
                        </Link>
                        {a.lead.phone && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> · <a href={`tel:${a.lead.phone}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{a.lead.phone}</a></span>}
                      </p>
                    ) : <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>Geen lead gekoppeld</p>}
                    {addr && <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{addr}</p>}
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                      Ingepland door {userName(a.plannedBy)} ·{' '}
                      {open
                        ? <span style={{ color: '#d97706', fontWeight: 600 }}>Open — voor iedereen</span>
                        : <>Toegewezen aan <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{userName(a.assignedTo)}</span></>}
                    </p>
                    {a.notes && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>“{a.notes}”</p>}
                  </div>

                  {/* Rechts: acties */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    {/* Open afspraak overnemen (iedereen) */}
                    {open && a.status === 'PLANNED' && !isPlanner && (
                      <button onClick={() => run(() => claimAppointment(a.id))} disabled={pending} style={btnPrimary(pending)}>Neem over</button>
                    )}
                    {/* Planner: (her)toewijzen */}
                    {isPlanner && a.status !== 'CANCELLED' && (
                      <select
                        value={a.assignedTo?.id ?? ''}
                        onChange={(e) => run(() => assignAppointment(a.id, e.target.value || null))}
                        disabled={pending}
                        style={{ ...inp, width: 'auto', fontSize: 12.5, padding: '6px 8px' }}
                      >
                        <option value="">Open — voor iedereen</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{userName(u)}</option>)}
                      </select>
                    )}
                    {/* Status */}
                    {a.status === 'PLANNED' && mineToComplete && (
                      <button onClick={() => run(() => updateAppointmentStatus(a.id, 'COMPLETED'))} disabled={pending} style={btnGhost(pending, '#16a34a')}>Markeer afgerond</button>
                    )}
                    {isPlanner && a.status === 'PLANNED' && (
                      <button onClick={() => run(() => updateAppointmentStatus(a.id, 'CANCELLED'))} disabled={pending} style={btnGhost(pending, '#9ca3af')}>Annuleren</button>
                    )}
                    {isPlanner && (
                      <button onClick={() => run(() => deleteAppointment(a.id))} disabled={pending} style={btnGhost(pending, '#dc2626')}>Verwijderen</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function btnPrimary(pending: boolean): React.CSSProperties {
  return { padding: '7px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap' }
}
function btnGhost(pending: boolean, color: string): React.CSSProperties {
  return { padding: '6px 12px', borderRadius: 8, background: 'transparent', color, border: `1px solid ${color}55`, fontSize: 12.5, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap' }
}
