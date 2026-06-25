'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeadStatus, addLeadNote, deleteLeadNote, archiveLead, updateFollowUp, convertLeadToQuote, setAppointmentPlanner, logWhatsAppContact, logVoicemail, writeOffInvalidNumber } from '@/lib/actions/lead.actions'
import { LeadStatus } from '@prisma/client'
import AssignSalesperson from '@/components/ui/AssignSalesperson'

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW',                label: 'Nieuw',                color: '#2563eb' },
  { value: 'CONTACTED',          label: 'Benaderd',             color: '#d97706' },
  { value: 'AFSPRAAK_INGEPLAND', label: 'Afspraak ingepland',   color: '#7c3aed' },
  { value: 'QUOTE_SENT',         label: 'Offerte verstuurd',    color: '#0891b2' },
  { value: 'INSTALLATIE_GEPLAND',label: 'Installatie gepland',  color: '#ea580c' },
  { value: 'BETALING_50',        label: '50% betaald',          color: '#16a34a' },
  { value: 'INSTALLATIE_GEDAAN', label: 'Installatie gedaan',   color: '#059669' },
  { value: 'BETALING_100',       label: '100% betaald',         color: '#065f46' },
  { value: 'LOST',               label: 'Verloren',             color: '#9ca3af' },
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
  appointmentPlannedBy: SalesUser | null
}

// Datum naar lokale 'YYYY-MM-DDTHH:mm' voor een datetime-local input
function toLocalDatetimeInput(d: Date | string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
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

  // WhatsApp: open chat met voorgevulde tekst + log een notitie
  function waLink(): string {
    const d = (lead.phone ?? '').replace(/\D/g, '')
    const intl = d.startsWith('0031') ? d.slice(2) : d.startsWith('31') ? d : d.startsWith('0') ? '31' + d.slice(1) : '31' + d
    const text = `Hallo ${lead.firstName}, met Bespaarhulp Friesland. Je hebt al zonnepanelen — met een thuisbatterij sla je je eigen stroom op en gebruik je hem 's avonds, juist nu de salderingsregeling verdwijnt. Heb je een momentje om te kijken wat dat voor jou oplevert?`
    return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`
  }

  function handleWhatsApp() {
    startTransition(async () => {
      await logWhatsAppContact(lead.id)
      setNotes((prev) => [{ id: Date.now().toString(), content: '📱 WhatsApp-bericht gestuurd', createdAt: new Date(), author: { name: 'Jij' } }, ...prev])
    })
  }

  function handleVoicemail() {
    startTransition(async () => {
      await logVoicemail(lead.id)
      setNotes((prev) => [{ id: Date.now().toString(), content: '📞 Voicemail ingesproken (belpoging)', createdAt: new Date(), author: { name: 'Jij' } }, ...prev])
    })
  }

  const voicemailCount = notes.filter((n) => n.content.startsWith('📞 Voicemail')).length

  function handleWriteOff() {
    if (!confirm(`Lead "${lead.firstName} ${lead.lastName}" afboeken wegens foutief nummer?\n\nDe lead wordt op "Verloren" gezet en gearchiveerd (uit de actieve lijst).`)) return
    startTransition(() => writeOffInvalidNumber(lead.id))
  }

  return (
    <div className="r-grid-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Contactgegevens
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleVoicemail}
              disabled={isPending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 8, background: 'transparent',
                color: '#d97706', border: '1px solid #f59e0b66',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              📞 Voicemail{voicemailCount > 0 ? ` (${voicemailCount})` : ''}
            </button>
            <button
              type="button"
              onClick={handleWriteOff}
              disabled={isPending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 8, background: 'transparent',
                color: '#dc2626', border: '1px solid #dc262644',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              📵 Foutief nummer
            </button>
            {lead.phone && (
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsApp}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 8, background: '#25D366', color: '#fff',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 32 32" fill="none">
                  <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.67 4.61 1.832 6.5L4 29l7.742-1.807A11.94 11.94 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#fff"/>
                  <path d="M22 18.6c-.3-.15-1.8-.9-2.1-1-.28-.1-.48-.15-.69.15-.2.3-.79 1-.97 1.2-.18.2-.36.22-.66.07-.3-.15-1.3-.48-2.47-1.52-.91-.81-1.53-1.82-1.7-2.12-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.54-.08-.15-.69-1.66-.95-2.27-.25-.6-.5-.52-.69-.53l-.58-.01a1.13 1.13 0 00-.82.38c-.28.3-1.07 1.05-1.07 2.56s1.1 2.97 1.25 3.17c.15.2 2.16 3.3 5.24 4.63.73.32 1.3.5 1.75.65.74.23 1.4.2 1.94.12.59-.09 1.81-.74 2.07-1.46.26-.72.26-1.33.18-1.46-.07-.13-.27-.2-.57-.35z" fill="#25D366"/>
                </svg>
                App {lead.firstName}
              </a>
            )}
            </div>
          </div>
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
            Follow-up datum &amp; tijd
          </p>
          <input
            type="datetime-local"
            defaultValue={toLocalDatetimeInput(lead.followUpAt)}
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
              Verkoper (closer)
            </p>
            <AssignSalesperson
              entityType="lead"
              entityId={lead.id}
              currentId={lead.assignedTo?.id ?? null}
              users={users}
            />
          </div>
        )}

        {/* Ingepland door */}
        {isAdmin && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Ingepland door (planner)
            </p>
            <select
              defaultValue={lead.appointmentPlannedBy?.id ?? ''}
              onChange={(e) => startTransition(() => setAppointmentPlanner(lead.id, e.target.value || null))}
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 8,
                border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)',
                color: 'var(--text-primary)', fontSize: 13.5,
                fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const,
              }}
            >
              <option value="">- Niet ingesteld -</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
              ))}
            </select>
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
