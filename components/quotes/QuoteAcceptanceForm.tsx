'use client'

import { useRef, useState } from 'react'
import { acceptQuoteByToken } from '@/lib/actions/quote.actions'
import { SignaturePad, type SignaturePadHandle } from '@/components/signature/SignaturePad'

type AcceptanceOption = {
  type: string
  label: string
  description: string
  style: 'primary' | 'secondary'
}

const OPTION_ACCEPT: AcceptanceOption = {
  type: 'accept',
  label: 'Accepteren',
  description: 'Ik ga akkoord met de offerte en wil de installatie inplannen.',
  style: 'primary',
}

const OPTION_RESERVATION: AcceptanceOption = {
  type: 'reserve_financing',
  label: 'Reserveer onder voorbehoud van financiering',
  description: 'Ik reserveer dit aanbod terwijl ik de financiering nog regel. Eenmalige reserveringsvergoeding van €250.',
  style: 'secondary',
}

type Props = {
  token: string
  customerName?: string
  reservationOptionEnabled?: boolean
}

export default function QuoteAcceptanceForm({ token, customerName, reservationOptionEnabled = false }: Props) {
  const OPTIONS = reservationOptionEnabled
    ? [OPTION_ACCEPT, OPTION_RESERVATION]
    : [OPTION_ACCEPT]

  const sigRef = useRef<SignaturePadHandle>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: customerName?.split(' ')[0] ?? '',
    lastName: customerName?.split(' ').slice(1).join(' ') ?? '',
    dateOfBirth: '',
    iban: '',
  })

  const selectedOption = OPTIONS.find(o => o.type === selectedType)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!agreed) {
      setError('Je moet akkoord gaan met de algemene voorwaarden.')
      return
    }
    if (sigRef.current?.isEmpty()) {
      setError('Een handtekening is verplicht.')
      return
    }

    setLoading(true)
    try {
      await acceptQuoteByToken(token, {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        iban: form.iban || undefined,
        agreedToTerms: agreed,
        signatureData: sigRef.current!.toDataURL(),
        acceptanceType: selectedType ?? 'accept',
      })
    } catch (err: unknown) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.')
    }
  }

  if (!selectedType) {
    return (
      <div className="no-print">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setSelectedType(opt.type)}
              style={{
                flex: 1,
                minWidth: 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '18px 16px',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'var(--font-sans)',
                transition: 'opacity 0.15s',
                ...(opt.style === 'primary' ? {
                  background: '#0a5c35',
                  color: '#fff',
                  border: 'none',
                } : {
                  background: '#f0fdf4',
                  color: '#0a5c35',
                  border: '1.5px solid #86efac',
                }),
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{opt.label}</span>
              <span style={{ fontSize: 11.5, opacity: 0.65, lineHeight: 1.45 }}>{opt.description}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="no-print">
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Gekozen optie</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{selectedOption?.label}</p>
        </div>
        <button
          onClick={() => { setSelectedType(null); setError('') }}
          style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '6px 10px' }}
        >
          Wijzigen
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Voornaam" required>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="Jan"
              required
              style={pubInput}
            />
          </Field>
          <Field label="Achternaam" required>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="de Vries"
              required
              style={pubInput}
            />
          </Field>
          <Field label="Geboortedatum" required>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              required
              style={pubInput}
            />
          </Field>
          {selectedType === 'reserve_financing' && (
            <Field label="IBAN (voor reserveringsvergoeding €250)" required>
              <input
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                placeholder="NL00 BANK 0000 0000 00"
                required
                style={pubInput}
              />
            </Field>
          )}
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '14px 16px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 17, height: 17, accentColor: '#16a34a', marginTop: 2, flexShrink: 0 }}
            />
            <span style={{ fontSize: 14, color: '#166534', lineHeight: 1.5 }}>
              Ik heb de{' '}
              <a href="#algemene-voorwaarden" style={{ color: '#15803d', fontWeight: 600, textDecoration: 'underline' }}>
                algemene voorwaarden
              </a>
              {' '}gelezen en ga hiermee akkoord.
            </span>
          </label>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>
              Handtekening <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <button
              type="button"
              onClick={() => sigRef.current?.clear()}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              Wissen
            </button>
          </div>
          <SignaturePad ref={sigRef} width={560} height={160} />
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Teken met je muis of vinger in het vak hierboven
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px 28px',
              background: loading ? '#9ca3af' : '#0a5c35',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {loading ? 'Bezig...' : 'Ondertekenen & bevestigen'}
          </button>
          <button
            type="button"
            onClick={() => { setSelectedType(null); setError('') }}
            style={{
              padding: '13px 20px',
              background: '#fff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const pubInput: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  color: '#111827',
  background: '#fff',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  width: '100%',
  boxSizing: 'border-box',
}
