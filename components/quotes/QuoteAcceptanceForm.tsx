'use client'

import { useRef, useState } from 'react'
import { acceptQuoteByToken, rejectQuoteByToken } from '@/lib/actions/quote.actions'
import { SignaturePad, type SignaturePadHandle } from '@/components/signature/SignaturePad'

type Props = {
  token: string
  customerName?: string
}

export default function QuoteAcceptanceForm({ token, customerName }: Props) {
  const sigRef = useRef<SignaturePadHandle>(null)
  const [mode, setMode] = useState<'idle' | 'accept' | 'reject'>('idle')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    iban: '',
  })

  async function handleAccept(e: React.FormEvent) {
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
      })
    } catch (err: unknown) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.')
    }
  }

  async function handleReject() {
    if (!confirm('Weet je zeker dat je deze offerte wilt afwijzen?')) return
    setLoading(true)
    try {
      await rejectQuoteByToken(token)
    } catch (err: unknown) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.')
    }
  }

  if (mode === 'idle') {
    return (
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setMode('accept')}
            style={{
              padding: '12px 28px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            ✓ Offerte accepteren
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#fff',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {loading ? 'Bezig...' : '✕ Offerte afwijzen'}
          </button>
        </div>
        {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}
      </div>
    )
  }

  return (
    <div className="no-print">
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
          Offerte accepteren
        </h3>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          Vul je gegevens in en zet een handtekening om de offerte te accepteren.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <Field label="IBAN (optioneel)">
              <input
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                placeholder="NL00 BANK 0000 0000 00"
                style={pubInput}
              />
            </Field>
          </div>

          {/* Terms checkbox */}
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
                <a
                  href="#algemene-voorwaarden"
                  style={{ color: '#15803d', fontWeight: 600, textDecoration: 'underline' }}
                >
                  algemene voorwaarden
                </a>
                {' '}gelezen en ga hiermee akkoord.
              </span>
            </label>
          </div>

          {/* Signature */}
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
                padding: '12px 28px',
                background: loading ? '#9ca3af' : '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {loading ? 'Bezig...' : 'Accepteren & ondertekenen'}
            </button>
            <button
              type="button"
              onClick={() => setMode('idle')}
              style={{
                padding: '12px 20px',
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
