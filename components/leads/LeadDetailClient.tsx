'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeadStatus, addLeadNote, deleteLeadNote, archiveLead, updateFollowUp, convertLeadToQuote } from '@/lib/actions/lead.actions'
import { LeadStatus } from '@prisma/client'
import AssignSalesperson from '@/components/ui/AssignSalesperson'

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW',        label: 'Nieuw',               color: '#2563eb' },
  { value: 'CONTACTED',  label: 'Benaderd',            color: '#d97706' },
  { value: 'INTERESTED', label: 'Geïnteresseerd',      color: '#7c3aed' },
  { value: 'QUOTE_SENT', label: 'Offerte verstuurd',   color: '#0891b2' },
  { value: 'WON',        label: 'Gewonnen',            color: '#16a34a' },
  { value: 'LOST',       label: 'Verloren',            color: '#9ca3af' },
]

type Note = { id: string; content: string; createdAt: Date; author: { name: string | null } }
type SalesUser = { id: string; name: string | null; email: string }
type Lead = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  street: string | null
  houseNumber: string | null
  postalCode: string | null
  city: string | null
  status: LeadStatus
  source: string | null
  createdAt: Date
  followUpAt: Date | null
  quoteId: string | null
  quote: { id: string; quoteNumber: string; title: string; total: number; status: string } | null
  notes: Note[]
  assignedTo: SalesUser | null
}

const row = (label: string, value: string | null) =>
  value ? (
    <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>
      <span style={{ width: 120, color: 'var(--text-tertiary)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  ) : null

export default function LeadDetailClient({ lead, users, isAdmin }: { lead: Lead; users: SalesUser[]; isAdmin: boolean }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [notes, setNotes] = useState<Note[]>(lead.notes)
  const [noteText, setNoteText] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleConvertToQuote() {
    startTransition(async () => {
      const { quoteId } = await convertLeadToQuote(lead.id)
      router.push(`/quotes/${quoteId}/edit`)
    })
  }

  function handleStatusChange(val: LeadStatus) {
    setStatus(val)
    startTransition(() => updateLeadStatus(lead.id, val))
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteText.trim()) return
    const text = noteText.trim()
    setNoteText('')
    startTransition(async () => {
      await addLeadNote(lead.id, text)
      // Optimistic: server will revalidate; for now just show it optimistically
      setNotes((prev) => [{
        id: Date.now().toString(),
        content: text,
        createdAt: new Date(),
        author: { name: 'Jij' },
      }, ...prev])
    })
  }

  function handleDeleteNote(noteId: string) {
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    startTransition(() => deleteLeadNote(noteId, lead.id))
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status)!

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

      {/* Links: info + notities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Pre-gemaakte offerte banner */}
        {lead.quote && (
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0a5c35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📄</div>
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Automatisch gegenereerde offerte</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lead.quote.quoteNumber}</p>
                <p style={{ fontSize: 12.5, color: '#374151' }}>{lead.quote.title}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`/quotes/${lead.quote.id}`} style={{ padding: '8px 18px', borderRadius: 8, background: '#0a5c35', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                Offerte bekijken →
              </a>
            </div>
          </div>
        )}

        {/* Contactgegevens */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            Contactgegevens
          </p>
          {row('E-mail', lead.email)}
          {row('Telefoon', lead.phone)}
          {row('Adres', lead.street && lead.houseNumber ? `${lead.street} ${lead.houseNumber}` : lead.street)}
          {row('Postcode', lead.postalCode)}
          {row('Stad', lead.city)}
          {row('Bron', lead.source)}
          {row('Toegevoegd', lead.createdAt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }))}
        </div>

        {/* Notities */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Notities
          </p>

          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Notitie toevoegen…"
              rows={3}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                borderRadius: 8, padding: '9px 12px', fontSize: 13.5,
                color: 'var(--text-primary)', resize: 'vertical', outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!noteText.trim() || isPending}
              style={{
                alignSelf: 'flex-end', padding: '6px 14px', borderRadius: 8,
                background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer', opacity: !noteText.trim() ? 0.5 : 1,
              }}
            >
              Opslaan
            </button>
          </form>

          {notes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
              Nog geen notities
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notes.map((note) => (
                <div key={note.id} style={{
                  background: 'var(--bg-elevated)', borderRadius: 8,
                  padding: '12px 14px', position: 'relative',
                }}>
                  <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {note.content}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                      {note.author.name ?? 'Onbekend'} · {new Date(note.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ fontSize: 11.5, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                    >
                      Verwijder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rechts: status + acties */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Status */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Status
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, border: '1px solid',
                  borderColor: status === opt.value ? opt.color : 'var(--border)',
                  background: status === opt.value ? `${opt.color}12` : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: status === opt.value ? opt.color : 'var(--border-strong)',
                }} />
                <span style={{ fontSize: 13.5, fontWeight: status === opt.value ? 600 : 400, color: status === opt.value ? opt.color : 'var(--text-secondary)' }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Follow-up */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Follow-up datum
          </p>
          <input
            type="date"
            defaultValue={lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 10) : ''}
            onChange={(e) => startTransition(() => updateFollowUp(lead.id, e.target.value || null))}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 8,
              border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)',
              color: 'var(--text-primary)', fontSize: 13.5,
              fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const,
            }}
          />
          {lead.followUpAt && (
            <button
              onClick={() => startTransition(() => updateFollowUp(lead.id, null))}
              style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Wissen
            </button>
          )}
        </div>

        {/* Verkoper */}
        {isAdmin && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Verkoper
            </p>
            <AssignSalesperson
              entityType="lead"
              entityId={lead.id}
              currentId={lead.assignedTo?.id ?? null}
              users={users}
            />
          </div>
        )}

        {/* Acties */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Acties
          </p>
          {!lead.quote && (
            <button
              onClick={handleConvertToQuote}
              disabled={isPending}
              style={{
                display: 'block', width: '100%', padding: '8px 14px', borderRadius: 8,
                background: '#0a5c35', color: '#fff', fontSize: 13.5, fontWeight: 600,
                border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', textAlign: 'center',
                marginBottom: 8, boxSizing: 'border-box', opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? 'Bezig…' : '+ Maak offerte'}
            </button>
          )}
          <a
            href={`/leads/${lead.id}/bewerken`}
            style={{
              display: 'block', width: '100%', padding: '8px 14px', borderRadius: 8,
              background: 'var(--accent)', color: '#fff', fontSize: 13.5, fontWeight: 500,
              border: 'none', cursor: 'pointer', textAlign: 'center',
              textDecoration: 'none', marginBottom: 8, boxSizing: 'border-box',
            }}
          >
            Bewerken
          </a>
          <form action={archiveLead.bind(null, lead.id)}>
            <button
              type="submit"
              style={{
                width: '100%', padding: '8px 14px', borderRadius: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                color: 'var(--text-secondary)', fontSize: 13.5, cursor: 'pointer',
              }}
            >
              Archiveren
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
