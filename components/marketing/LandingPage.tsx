'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createLeadFromLanding } from '@/lib/actions/lead.actions'

// ── Calculator logic ─────────────────────────────────────────────────────────

function calcSavings(gas: number, kwh: number, hasHeatPump: boolean, hasSolar: boolean) {
  const gasTariff = 1.10
  const elecTariff = 0.28

  // Zonnepanelen: alleen tonen als ze er nog niet zijn
  const solarSavings = hasSolar ? 0 : Math.round(kwh * 0.85 * elecTariff * 0.7)

  // Warmtepomp: 60-70% gasreductie
  const heatPumpSavings = hasHeatPump ? 0 : Math.round(gas * 0.65 * gasTariff)

  // Batterij: bij bestaande zonnepanelen hogere besparing (meer surplus om op te slaan)
  const batteryBase = hasSolar ? kwh * 0.30 : kwh * 0.15
  const batterySavings = Math.round(batteryBase * elecTariff)

  const total = solarSavings + heatPumpSavings + batterySavings
  return { solarSavings, heatPumpSavings, batterySavings, total, hasSolar }
}

const HOUSE_DEFAULTS: Record<string, { gas: number; kwh: number }> = {
  APARTMENT:  { gas: 700,  kwh: 2200 },
  TERRACED:   { gas: 1400, kwh: 3200 },
  CORNER:     { gas: 1700, kwh: 3600 },
  DETACHED:   { gas: 2500, kwh: 4500 },
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function Header() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(20px, 5vw, 80px)', height: 64,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
          <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill="#f5c442"/>
          <path d="M0 15L18 2L36 15H0Z" fill="#f5c442"/>
          <rect x="2" y="15" width="32" height="19" rx="1.5" fill="#0a5c35"/>
          <rect x="5" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.25"/>
          <rect x="5" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.25"/>
          <rect x="14" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.25"/>
          <rect x="14" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.25"/>
          <circle cx="28" cy="22" r="4.5" fill="#f5c442"/>
          <circle cx="26.5" cy="20.5" r="3" fill="#0a5c35"/>
        </svg>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
            <span style={{ color: '#0a5c35' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Friesland</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <a href="#calculator" style={{ fontSize: 13.5, color: '#374151', textDecoration: 'none', padding: '6px 12px', borderRadius: 8 }}>Calculator</a>
        <a href="#diensten" style={{ fontSize: 13.5, color: '#374151', textDecoration: 'none', padding: '6px 12px', borderRadius: 8 }}>Diensten</a>
        <a href="#contact" style={{ fontSize: 13.5, color: '#374151', textDecoration: 'none', padding: '6px 12px', borderRadius: 8 }}>Contact</a>
        <Link href="/login" style={{
          fontSize: 13.5, fontWeight: 600, color: '#0a5c35',
          border: '1.5px solid #0a5c35', borderRadius: 8,
          padding: '6px 16px', textDecoration: 'none', marginLeft: 4,
        }}>
          Inloggen
        </Link>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #0a5c35 0%, #0e7a48 50%, #0a5c35 100%)',
      paddingTop: 'clamp(100px, 15vw, 140px)',
      paddingBottom: 'clamp(60px, 8vw, 100px)',
      paddingLeft: 'clamp(20px, 5vw, 80px)',
      paddingRight: 'clamp(20px, 5vw, 80px)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(245,196,66,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: '40%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,196,66,0.15)', border: '1px solid rgba(245,196,66,0.3)',
          borderRadius: 20, padding: '5px 14px', marginBottom: 24,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f5c442', letterSpacing: '0.05em' }}>✦ ONAFHANKELIJK ENERGIEADVIES FRIESLAND</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 800,
          color: '#fff', lineHeight: 1.1, marginBottom: 20,
          letterSpacing: '-0.02em',
        }}>
          Bespaar slim,<br />
          <span style={{ color: '#f5c442' }}>woon beter</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.85)', maxWidth: 560, lineHeight: 1.6, marginBottom: 36 }}>
          Gratis en onafhankelijk advies over zonnepanelen, thuisbatterijen en warmtepompen
          voor heel Friesland. Bereken direct uw besparing.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="#calculator" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#f5c442', color: '#0a3d20', fontWeight: 700,
            fontSize: 15, padding: '13px 28px', borderRadius: 10,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(245,196,66,0.4)',
          }}>
            Bereken mijn besparing →
          </a>
          <a href="#contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600,
            fontSize: 15, padding: '13px 28px', borderRadius: 10,
            textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.25)',
          }}>
            Gratis adviesgesprek
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 'clamp(24px, 4vw, 48px)', marginTop: 48, flexWrap: 'wrap' }}>
          {[
            { value: '2.400+', label: 'huishoudens geholpen' },
            { value: '€3.2M', label: 'subsidies verwerkt' },
            { value: '18', label: 'Friese gemeenten' },
            { value: 'Gratis', label: 'onafhankelijk advies' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: '#f5c442' }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Calculator() {
  const [gas, setGas] = useState('')
  const [kwh, setKwh] = useState('')
  const [houseType, setHouseType] = useState('')
  const [hasHeatPump, setHasHeatPump] = useState(false)
  const [hasSolar, setHasSolar] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof calcSavings> | null>(null)

  function handleEstimate() {
    const defaults = HOUSE_DEFAULTS[houseType] ?? { gas: 1500, kwh: 3200 }
    const g = parseFloat(gas) || defaults.gas
    const k = parseFloat(kwh) || defaults.kwh
    setResult(calcSavings(g, k, hasHeatPump, hasSolar))
  }

  function useDefaults() {
    if (!houseType) return
    const d = HOUSE_DEFAULTS[houseType]
    setGas(String(d.gas))
    setKwh(String(d.kwh))
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
    background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
    color: '#111827',
  }

  return (
    <section id="calculator" style={{ background: '#f9fafb', padding: 'clamp(48px, 8vw, 96px) clamp(20px, 5vw, 80px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.08em', textTransform: 'uppercase' }}>BESPARINGSCALCULATOR</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#111827', marginTop: 8, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Hoeveel kunt u besparen?
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>
            Vul uw energieverbruik in en zie direct uw besparingspotentieel
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Input card */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Uw situatie</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Type woning</label>
                <select value={houseType} onChange={(e) => { setHouseType(e.target.value) }} style={{ ...inp, appearance: 'none' }}>
                  <option value="">— Kies type woning —</option>
                  <option value="APARTMENT">Appartement</option>
                  <option value="TERRACED">Tussenwoning</option>
                  <option value="CORNER">Hoekwoning</option>
                  <option value="DETACHED">Vrijstaande woning</option>
                </select>
                {houseType && (
                  <button onClick={useDefaults} style={{ fontSize: 11.5, color: '#0a5c35', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
                    Gebruik gemiddeld verbruik voor dit type →
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Gasverbruik (m³/jaar)</label>
                  <input type="number" placeholder="1.500" value={gas} onChange={(e) => setGas(e.target.value)} style={inp} min="0" />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Stroomverbruik (kWh/jaar)</label>
                  <input type="number" placeholder="3.200" value={kwh} onChange={(e) => setKwh(e.target.value)} style={inp} min="0" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#374151' }}>
                  <input type="checkbox" checked={hasSolar} onChange={(e) => setHasSolar(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#0a5c35' }} />
                  Ik heb al zonnepanelen
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#374151' }}>
                  <input type="checkbox" checked={hasHeatPump} onChange={(e) => setHasHeatPump(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#0a5c35' }} />
                  Ik heb al een warmtepomp
                </label>
              </div>

              <button onClick={handleEstimate} style={{
                width: '100%', padding: '12px', borderRadius: 10,
                background: '#0a5c35', color: '#fff', fontSize: 15, fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Bereken besparing
              </button>
            </div>
          </div>

          {/* Result card */}
          <div style={{
            background: result ? 'linear-gradient(135deg, #0a5c35, #0e7a48)' : '#fff',
            borderRadius: 16, padding: 28,
            border: result ? 'none' : '1.5px dashed #d1d5db',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            transition: 'background 0.3s',
          }}>
            {!result ? (
              <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
                <p style={{ fontSize: 14 }}>Vul uw verbruik in en klik op<br />"Bereken besparing"</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>UW BESPARINGSPOTENTIEEL</p>
                <div style={{ fontSize: 52, fontWeight: 900, color: '#f5c442', lineHeight: 1, marginBottom: 4 }}>
                  €{result.total.toLocaleString('nl-NL')}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>geschatte besparing per jaar</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.solarSavings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#fff' }}>☀️ Zonnepanelen</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f5c442' }}>€{result.solarSavings.toLocaleString('nl-NL')}/jaar</span>
                    </div>
                  )}
                  {result.hasSolar && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>☀️ Zonnepanelen</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>al aanwezig</span>
                    </div>
                  )}
                  {result.heatPumpSavings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#fff' }}>🌡️ Warmtepomp</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f5c442' }}>€{result.heatPumpSavings.toLocaleString('nl-NL')}/jaar</span>
                    </div>
                  )}
                  {result.batterySavings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#fff' }}>🔋 Thuisbatterij</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f5c442' }}>€{result.batterySavings.toLocaleString('nl-NL')}/jaar</span>
                    </div>
                  )}
                </div>

                <a href="#contact" style={{
                  display: 'block', textAlign: 'center', marginTop: 20,
                  background: '#f5c442', color: '#0a3d20', fontWeight: 700,
                  fontSize: 14, padding: '12px', borderRadius: 10, textDecoration: 'none',
                }}>
                  Vraag gratis adviesgesprek aan →
                </a>
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8 }}>
                  * Indicatieve berekening op basis van gemiddelde tarieven
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Diensten() {
  const diensten = [
    { icon: '☀️', title: 'Zonnepanelen', desc: 'Opwek op eigen dak — terugverdientijd 5-8 jaar, 25 jaar garantie op panelen.', tag: 'Populair' },
    { icon: '🔋', title: 'Thuisbatterij', desc: 'Sla zelf opgewekte stroom op en gebruik die \'s avonds. Tot €1.400/jaar extra besparing.', tag: 'Nieuw' },
    { icon: '🌡️', title: 'Warmtepomp', desc: 'Vervang uw cv-ketel door een warmtepomp. 60-70% minder gasverbruik.', tag: null },
    { icon: '🏠', title: 'Woningadvies', desc: 'Volledig onafhankelijk advies over isolatie, subsidies en de beste verduurzamingsroute.', tag: 'Gratis' },
  ]

  return (
    <section id="diensten" style={{ background: '#fff', padding: 'clamp(48px, 8vw, 96px) clamp(20px, 5vw, 80px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ONZE DIENSTEN</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#111827', marginTop: 8, letterSpacing: '-0.02em' }}>
            Alles voor een duurzaam huis
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {diensten.map((d) => (
            <div key={d.title} style={{ background: '#f9fafb', borderRadius: 14, padding: '24px 20px', border: '1px solid #e5e7eb', position: 'relative' }}>
              {d.tag && (
                <span style={{
                  position: 'absolute', top: 14, right: 14,
                  fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                  background: d.tag === 'Nieuw' ? '#dcfce7' : d.tag === 'Gratis' ? '#fef9c3' : '#dbeafe',
                  color: d.tag === 'Nieuw' ? '#166534' : d.tag === 'Gratis' ? '#854d0e' : '#1e40af',
                }}>
                  {d.tag}
                </span>
              )}
              <div style={{ fontSize: 32, marginBottom: 12 }}>{d.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{d.title}</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6 }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactForm() {
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [telefoon, setTelefoon] = useState('')
  const [postcode, setPostcode] = useState('')
  const [bericht, setBericht] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        await createLeadFromLanding({ naam, email, telefoon, postcode, bericht })
        setSent(true)
      } catch (err) {
        setError('Er ging iets mis. Probeer het opnieuw.')
      }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
    background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827',
  }

  return (
    <section id="contact" style={{ background: '#f9fafb', padding: 'clamp(48px, 8vw, 96px) clamp(20px, 5vw, 80px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'start' }}>

        {/* Left */}
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.08em', textTransform: 'uppercase' }}>GRATIS ADVIESGESPREK</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, color: '#111827', marginTop: 8, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Wij bellen u terug
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 }}>
            Laat uw gegevens achter en één van onze adviseurs neemt binnen één werkdag contact met u op voor een gratis en vrijblijvend gesprek.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Gratis en vrijblijvend advies', 'Binnen 1 werkdag reactie', 'Onafhankelijk — geen druk'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#16a34a' }}>✓</span>
                </div>
                <span style={{ fontSize: 14, color: '#374151' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Bedankt!</h3>
              <p style={{ fontSize: 14, color: '#6b7280' }}>We nemen binnen 1 werkdag contact met u op.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Naam *</label>
                  <input required value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Jan de Vries" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Postcode</label>
                  <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="8888AB" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>E-mailadres *</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Telefoonnummer</label>
                <input type="tel" value={telefoon} onChange={(e) => setTelefoon(e.target.value)} placeholder="06-12345678" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Bericht (optioneel)</label>
                <textarea value={bericht} onChange={(e) => setBericht(e.target.value)} rows={3} placeholder="Bijv. interesse in zonnepanelen + warmtepomp…"
                  style={{ ...inp, resize: 'vertical' }} />
              </div>
              {error && <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>}
              <button type="submit" disabled={isPending} style={{
                padding: '12px', background: '#0a5c35', color: '#fff',
                fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 10,
                cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1,
                fontFamily: 'inherit',
              }}>
                {isPending ? 'Verzenden…' : 'Stuur aanvraag →'}
              </button>
              <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center' }}>
                Uw gegevens worden vertrouwelijk behandeld
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#0a5c35', padding: 'clamp(32px, 5vw, 48px) clamp(20px, 5vw, 80px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.1em', marginLeft: 6, textTransform: 'uppercase' }}>Friesland</span>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
          © {new Date().getFullYear()} Bespaarhulp Friesland — Onafhankelijk energieadvies
        </p>
        <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
          Medewerker login
        </Link>
      </div>
    </footer>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Header />
      <Hero />
      <Calculator />
      <Diensten />
      <ContactForm />
      <Footer />
    </div>
  )
}
