'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createLeadFromLanding } from '@/lib/actions/lead.actions'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'

const gold = '#f5c442'
const dark = '#0a1410'

function LeadForm({ compact }: { compact?: boolean }) {
  const [naam, setNaam] = useState('')
  const [telefoon, setTelefoon] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        await createLeadFromLanding({ naam, telefoon, herkomst: 'Thuisbatterij-actie', website })
        // Browser-side conversie-event (server-side gebeurt al in de actie)
        if (typeof window !== 'undefined' && window.ttq) window.ttq.track('SubmitForm')
        setSent(true)
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Er ging iets mis. Probeer het opnieuw.')
      }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 15px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.18)',
    fontSize: 15, outline: 'none', background: 'rgba(255,255,255,0.05)', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#fff',
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,196,66,0.15)', border: '1.5px solid rgba(245,196,66,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30, color: gold }}>✓</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Bedankt! Wij bellen u terug</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>Binnen één werkdag neemt een adviseur uit Friesland contact met u op.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!compact && <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Vraag gratis advies aan</h3>}
      {/* Honeypot */}
      <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      <input required value={naam} onChange={e => setNaam(e.target.value)} placeholder="Uw naam" style={inp} />
      <input required type="tel" value={telefoon} onChange={e => setTelefoon(e.target.value)} placeholder="Uw telefoonnummer" style={inp} />
      {error && <p style={{ fontSize: 13, color: '#fca5a5' }}>{error}</p>}
      <button type="submit" disabled={pending} style={{
        padding: '14px', borderRadius: 10, background: gold, color: '#052e1a', border: 'none',
        fontSize: 15.5, fontWeight: 800, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit',
      }}>
        {pending ? 'Versturen…' : 'Bel mij gratis terug →'}
      </button>
      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        Gratis & vrijblijvend · <a href="https://wa.me/31638922513" style={{ color: gold, textDecoration: 'none' }}>of app ons direct</a>
      </p>
    </form>
  )
}

export default function ThuisbatterijActie() {
  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: dark, minHeight: '100vh', color: '#fff' }}>

      {/* Header — geen menu, alleen logo + telefoon */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,18,13,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', background: '#fff', borderRadius: 9, padding: '5px 9px' }}>
            <Image src="/logo-bespaarhulp.jpg" alt="Bespaarhulp Friesland" width={120} height={30} priority style={{ display: 'block' }} />
          </span>
          <a href="https://wa.me/31638922513" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: gold, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 16 16"><path d="M14 11.3c0 .4-.1.8-.3 1.2-.2.4-.5.7-.8 1-.6.4-1.2.6-1.9.5-1-.1-2-.4-2.9-.9a12 12 0 01-2.6-1.9A12 12 0 013.6 8.6c-.5-.9-.8-1.9-.9-2.9-.1-.7.1-1.3.5-1.9.3-.3.6-.6 1-.8.4-.2.8-.3 1.2-.3.2 0 .3.1.4.3l1 2.1c.1.2.1.3 0 .5l-.6.9c-.1.2-.1.3 0 .5.3.6.7 1.1 1.2 1.6s1 .9 1.6 1.2c.2.1.3.1.5 0l.9-.6c.2-.1.3-.1.5 0l2.1 1c.2.1.3.2.3.4z" fill={gold}/></svg>
            06 38 92 25 13
          </a>
        </div>
      </header>

      {/* Hero — boven de vouw: hook + formulier */}
      <section style={{ background: 'radial-gradient(130% 110% at 80% 0%, rgba(14,122,72,0.45) 0%, rgba(5,20,14,0) 55%), linear-gradient(165deg, #061611 0%, #07261a 45%, #0a3a24 100%)', padding: 'clamp(36px,6vw,72px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 'clamp(28px,5vw,64px)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px', minWidth: 300 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 5, padding: '5px 14px', marginBottom: 20 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fca5a5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Salderingsregeling stopt in 2027</span>
            </div>
            <h1 style={{ fontSize: 'clamp(30px,5vw,50px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Bespaar tot <span style={{ color: gold }}>€1.400 per jaar</span> met een thuisbatterij
            </h1>
            <p style={{ fontSize: 'clamp(15px,1.8vw,17px)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 26, maxWidth: 460 }}>
              Sla uw zonnestroom op en gebruik hem ’s avonds — juist nu de saldering verdwijnt. Gratis advies van een installateur uit Friesland. Wij bellen u terug.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['Gratis en volledig vrijblijvend', 'Gecertificeerde installateurs in heel Friesland', 'Geleverd én geïnstalleerd, ±2 weken'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(245,196,66,0.15)', border: '1px solid rgba(245,196,66,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: gold, fontSize: 12 }}>✓</span>
                  <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.85)' }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'clamp(18px,4vw,40px)', flexWrap: 'wrap' }}>
              {[['2.400+', 'huishoudens geholpen'], ['10 jaar', 'garantie A-merk'], ['250+', 'installaties Friesland']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: gold }}>{v}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulier */}
          <div style={{ flex: '1 1 320px', minWidth: 300, maxWidth: 420 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${gold}`, borderRadius: 18, padding: 'clamp(22px,3vw,30px)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* Waarom nu */}
      <section style={{ background: '#08120d', padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>Waarom juist nú een thuisbatterij?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 520, margin: '0 auto 36px' }}>De spelregels voor zonnestroom veranderen. Een batterij beschermt u tegen de gevolgen.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { t: 'Saldering verdwijnt (2027)', d: 'Straks krijgt u nog maar ±€0,07 per teruggeleverde kWh, terwijl inkopen ±€0,28 kost. Met een batterij gebruikt u uw stroom zelf.' },
              { t: 'Terugleverkosten stijgen', d: 'Steeds meer leveranciers rekenen kosten voor teruglevering. Sla op in plaats van terugleveren en vermijd die kosten.' },
              { t: 'Slim verdienen met EMS', d: 'Met een energiemanagementsysteem handelt uw batterij automatisch op de onbalansmarkt — extra opbrengst bovenop uw besparing.' },
            ].map(c => (
              <div key={c.t} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '22px 22px' }}>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{c.t}</h3>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 }}>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financiering — drempel weghalen */}
      <section style={{ background: dark, padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Betaalbaar</span>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, marginTop: 8, marginBottom: 14, letterSpacing: '-0.02em' }}>Al vanaf €35 per maand</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
            Via het <strong style={{ color: '#fff' }}>Nationaal Warmtefonds</strong> leent u rentevrij bij een inkomen tot €60.000 — en boetevrij aflossen mag altijd. Wij rekenen het in het gratis adviesgesprek precies voor u uit.
          </p>
        </div>
      </section>

      {/* Afsluitend formulier */}
      <section style={{ background: 'radial-gradient(120% 100% at 50% 0%, rgba(14,122,72,0.35) 0%, #07120d 60%), #07120d', padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Ontdek wat u kunt besparen</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 28 }}>Laat uw nummer achter — geen verkooppraatjes, gewoon een eerlijke berekening voor uw situatie.</p>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${gold}`, borderRadius: 18, padding: 'clamp(22px,3vw,30px)', textAlign: 'left' }}>
            <LeadForm compact />
          </div>
        </div>
      </section>

      {/* Footer — verkenning bewust subtiel/verstopt */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '22px clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland · KVK 71128174</p>
          <div style={{ display: 'flex', gap: 14 }}>
            {[['Meer weten', '/'], ['Producten', '/producten'], ['Privacy', '/privacy']].map(([l, h]) => (
              <Link key={l} href={h} style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  )
}
