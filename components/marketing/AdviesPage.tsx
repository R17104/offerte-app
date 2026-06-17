'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createLeadFromLanding } from '@/lib/actions/lead.actions'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #d1d5db',
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
  fontFamily: 'inherit', color: '#111827',
}

export default function AdviesPage({ product }: { product?: string }) {
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [telefoon, setTelefoon] = useState('')
  const [postcode, setPostcode] = useState('')
  const [bericht, setBericht] = useState(product ? `Interesse in: ${product}` : '')
  const [website, setWebsite] = useState('') // honeypot
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        await createLeadFromLanding({ naam, email, telefoon, postcode, bericht, website })
        setSent(true)
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Er ging iets mis. Probeer het opnieuw.')
      }
    })
  }

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo-bespaarhulp.png" alt="Bespaarhulp Friesland" width={103} height={58} priority style={{ display: 'block' }} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/producten" style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '7px 14px' }}>Producten</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #052e1a 0%, #0a5c35 100%)', padding: 'clamp(48px,8vw,88px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(245,196,66,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Gratis & vrijblijvend</span>
          <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, color: '#fff', marginTop: 10, marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Gratis adviesgesprek
          </h1>
          <p style={{ fontSize: 'clamp(14px,1.5vw,17px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
            Laat uw gegevens achter. Eén van onze adviseurs neemt binnen één werkdag contact op voor een gratis en volledig vrijblijvend gesprek.
          </p>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,48px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>

        {/* Left: USPs */}
        <div>
          {product && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔋</span>
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0a5c35', marginBottom: 2 }}>Uw geselecteerde product</p>
                <p style={{ fontSize: 13, color: '#374151' }}>{product}</p>
              </div>
            </div>
          )}

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Wat kunt u verwachten?</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { icon: '📞', title: 'Wij bellen u terug', desc: 'Binnen één werkdag neemt een adviseur contact op, op een moment dat u schikt.' },
              { icon: '🧮', title: 'Persoonlijk berekening', desc: 'We berekenen precies wat uw besparing zou zijn op basis van uw situatie.' },
              { icon: '📍', title: 'Heel Friesland', desc: 'Wij zijn actief door heel Friesland en kennen de lokale markt.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(24px,4vw,36px)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>✓</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 10 }}>Aanvraag ontvangen!</h3>
              <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.65, marginBottom: 24 }}>
                Bedankt! We nemen binnen 1 werkdag contact met u op.
              </p>
              <Link href="/producten" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 10, background: '#0a5c35', color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>
                ← Terug naar producten
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Uw gegevens</h3>

              {/* Honeypot: onzichtbaar voor bezoekers, bots vullen het in */}
              <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Naam *</label>
                  <input required value={naam} onChange={e => setNaam(e.target.value)} placeholder="Jan de Vries" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Postcode</label>
                  <input value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="8888 AB" style={inp} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>E-mailadres *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" style={inp} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Telefoonnummer</label>
                <input type="tel" value={telefoon} onChange={e => setTelefoon(e.target.value)} placeholder="06-12345678" style={inp} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Bericht</label>
                <textarea
                  value={bericht}
                  onChange={e => setBericht(e.target.value)}
                  rows={3}
                  placeholder="Bijv. interesse in zonnepanelen en een thuisbatterij…"
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>

              {error && <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>}

              <button
                type="submit"
                disabled={isPending}
                style={{ padding: '13px 20px', borderRadius: 10, background: isPending ? '#6b9e7e' : '#0a5c35', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {isPending ? 'Aanvraag versturen…' : 'Gratis advies aanvragen →'}
              </button>

              <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
                Uw gegevens worden uitsluitend gebruikt voor het adviesgesprek. Geen spam.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#03180d', marginTop: 64, padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', marginLeft: 7, textTransform: 'uppercase' }}>Friesland</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland · Onafhankelijk energieadvies</p>
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Medewerker login</Link>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  )
}
