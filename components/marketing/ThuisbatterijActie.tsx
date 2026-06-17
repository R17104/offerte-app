'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createLeadFromLanding } from '@/lib/actions/lead.actions'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'
import { useWindowWidth } from '@/lib/hooks/useWindowWidth'

const gold = '#f5c442'
const dark = '#0a1410'

function LeadForm({ compact }: { compact?: boolean }) {
  const [naam, setNaam] = useState('')
  const [telefoon, setTelefoon] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        await createLeadFromLanding({ naam, telefoon, email, herkomst: 'Thuisbatterij-actie', website })
        // Browser-side conversie-event (server-side gebeurt al in de actie)
        if (typeof window !== 'undefined' && window.ttq) window.ttq.track('SubmitForm')
        setSent(true)
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Er ging iets mis. Probeer het opnieuw.')
      }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 15px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.25)',
    fontSize: 15, outline: 'none', background: 'rgba(255,255,255,0.08)', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#fff',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6,
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
      <div>
        <label style={lbl}>Naam *</label>
        <input required value={naam} onChange={e => setNaam(e.target.value)} placeholder="Bijv. Jan de Vries" style={inp} />
      </div>
      <div>
        <label style={lbl}>Telefoonnummer *</label>
        <input required type="tel" value={telefoon} onChange={e => setTelefoon(e.target.value)} placeholder="Bijv. 06 12 34 56 78" style={inp} />
      </div>
      <div>
        <label style={lbl}>E-mailadres <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}>(optioneel)</span></label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Bijv. jan@voorbeeld.nl" style={inp} />
      </div>
      {error && <p style={{ fontSize: 13, color: '#fca5a5' }}>{error}</p>}
      <button type="submit" disabled={pending} style={{
        padding: '14px', borderRadius: 10, background: gold, color: '#052e1a', border: 'none',
        fontSize: 15.5, fontWeight: 800, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit',
      }}>
        {pending ? 'Versturen…' : 'Bel mij gratis terug →'}
      </button>
      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.6 }}>
        Geen verkooppraatjes · u zit nergens aan vast · reactie binnen 1 werkdag<br />
        <a href="https://wa.me/31638922513" style={{ color: gold, textDecoration: 'none' }}>of app ons direct →</a>
      </p>
    </form>
  )
}

export default function ThuisbatterijActie() {
  const w = useWindowWidth()
  const isMobile = w < 768
  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: dark, minHeight: '100vh', color: '#fff', paddingBottom: isMobile ? 64 : 0 }}>

      {/* Header — geen menu, alleen logo + telefoon */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,18,13,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image src="/logo-bespaarhulp-wit.png" alt="Bespaarhulp Friesland" width={77} height={52} priority style={{ display: 'block' }} />
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
            <p style={{ fontSize: 14, fontWeight: 700, color: gold, marginBottom: 24 }}>
              Elke maand wachten kost u geld nu de saldering afloopt.
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

      {/* Trust-strip */}
      <section style={{ background: '#08120d', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(16px,3vw,40px)', flexWrap: 'wrap' }}>
          {['KVK 71128174', 'Gecertificeerde installateurs', '10 jaar garantie', 'Geen voorrijkosten'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: gold, fontSize: 13 }}>✓</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{t}</span>
            </div>
          ))}
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

      {/* Social proof */}
      <section style={{ background: dark, padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ color: gold, fontSize: 16, letterSpacing: 2 }}>★★★★★</span>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}>Klanten in Friesland gingen u voor</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { img: 'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-003_1.png', name: 'Dhr. Dijkstra', city: 'Franeker', stars: 5, quote: 'Vlot geïnstalleerd en goed uitgelegd. Doe er nu geen omkijken meer naar.' },
              { img: 'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-002.png', name: 'Familie Hoekstra', city: 'Leeuwarden', stars: 5, quote: 'De installatie ging vlotter dan verwacht en ik merk het nu terug op mijn rekening.' },
              { img: 'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-005.png', name: 'Dhr. de Jong', city: 'Drachten', stars: 4, quote: 'Een paar maanden terug onze Alpha ESS laten plaatsen — bleek achteraf net iets te klein. Inmiddels makkelijk een extra module laten bijzetten, fijn dat dat zo kan.' },
            ].map(r => (
              <div key={r.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: 150, background: '#0e1a14' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.img} alt={`Installatie ${r.city}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <span style={{ fontSize: 13, letterSpacing: 1.5 }}>
                    <span style={{ color: gold }}>{'★'.repeat(r.stars)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.25)' }}>{'★'.repeat(5 - r.stars)}</span>
                  </span>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '8px 0 10px', fontStyle: 'italic' }}>&ldquo;{r.quote}&rdquo;</p>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{r.name} · <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>{r.city}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mini-FAQ */}
      <section style={{ background: '#08120d', padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, textAlign: 'center', marginBottom: 28, letterSpacing: '-0.02em' }}>Veelgestelde vragen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { q: 'Hoe snel hoor ik iets na mijn aanvraag?', a: 'Binnen één werkdag belt een adviseur uit Friesland u persoonlijk terug — geen callcenter.' },
              { q: 'Hoe lang duurt de installatie?', a: 'Gemiddeld 2 tot 4 weken van aanvraag tot werkende installatie. De plaatsing zelf is meestal binnen een dag klaar.' },
              { q: 'Werkt een thuisbatterij samen met mijn zonnepanelen?', a: 'Ja — de batterij slaat uw overschot van overdag op zodat u het ’s avonds gebruikt. Heeft u nog geen panelen, dan adviseren we de combinatie.' },
              { q: 'Is een thuisbatterij iets voor mij?', a: 'Vooral interessant als u zonnepanelen heeft en nu de saldering afloopt. In het gratis gesprek rekenen we het eerlijk voor uw situatie door.' },
            ].map(f => (
              <div key={f.q} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '18px 20px' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.q}</p>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>{f.a}</p>
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
      <section id="aanvraag" style={{ background: 'radial-gradient(120% 100% at 50% 0%, rgba(14,122,72,0.35) 0%, #07120d 60%), #07120d', padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,40px)', scrollMarginTop: 70 }}>
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
      {/* Sticky CTA — alleen mobiel */}
      {isMobile && (
        <a href="#aanvraag" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: gold, color: '#052e1a', textDecoration: 'none',
          padding: '15px', fontSize: 15.5, fontWeight: 800,
          boxShadow: '0 -6px 24px rgba(0,0,0,0.4)',
        }}>
          📞 Bel mij gratis terug
        </a>
      )}

      <WhatsAppButton />
    </div>
  )
}
