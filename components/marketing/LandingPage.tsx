'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createLeadFromLanding } from '@/lib/actions/lead.actions'

// ── Calculator logic ──────────────────────────────────────────────────────────

function calcSavings(gas: number, kwh: number, hasHeatPump: boolean, hasSolar: boolean) {
  const solarSavings = hasSolar ? 0 : Math.round(kwh * 0.85 * 0.28 * 0.7)
  const heatPumpSavings = hasHeatPump ? 0 : Math.round(gas * 0.65 * 1.10)
  const batterySavings = Math.round(kwh * 0.27)
  return { solarSavings, heatPumpSavings, batterySavings, total: solarSavings + heatPumpSavings + batterySavings, hasSolar }
}

const HOUSE_TYPES = [
  { key: 'APARTMENT', label: 'Appartement',  icon: '🏢', gas: 700,  kwh: 2200 },
  { key: 'TERRACED',  label: 'Tussenwoning', icon: '🏠', gas: 1400, kwh: 3200 },
  { key: 'CORNER',    label: 'Hoekwoning',   icon: '🏡', gas: 1700, kwh: 3600 },
  { key: 'DETACHED',  label: 'Vrijstaand',   icon: '🏘️', gas: 2500, kwh: 4500 },
]

// ── Inline style helpers ──────────────────────────────────────────────────────

const btn = (color = '#0a5c35', txt = '#fff'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '13px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
  background: color, color: txt, fontWeight: 700, fontSize: 15,
  fontFamily: 'inherit', textDecoration: 'none',
  boxShadow: `0 4px 14px ${color}55`,
})

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 16,
  boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb',
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="30" viewBox="0 0 36 34" fill="none">
            <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill="#f5c442"/>
            <path d="M0 15L18 2L36 15H0Z" fill="#f5c442"/>
            <rect x="2" y="15" width="32" height="19" rx="1.5" fill="#0a5c35"/>
            <rect x="5" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.28"/>
            <rect x="5" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.28"/>
            <rect x="14" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.28"/>
            <rect x="14" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.28"/>
            <circle cx="28" cy="22" r="4.5" fill="#f5c442"/>
            <circle cx="26.5" cy="20.5" r="3" fill="#0a5c35"/>
          </svg>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>
              <span style={{ color: '#0a5c35' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            </div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Friesland</div>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[['Werkwijze', '#werkwijze'], ['Diensten', '#diensten'], ['Ervaringen', '#ervaringen']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13.5, color: '#4b5563', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 500 }}>{l}</a>
          ))}
          <a href="#contact" style={{ ...btn('#0a5c35', '#fff'), padding: '8px 18px', fontSize: 13.5, marginLeft: 6, boxShadow: 'none' }}>
            Gratis advies
          </a>
          <Link href="/login" style={{ fontSize: 12.5, color: '#9ca3af', textDecoration: 'none', padding: '8px 12px' }}>
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}

// ── Hero + Calculator combined ────────────────────────────────────────────────

function HeroSection() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [houseType, setHouseType] = useState('')
  const [hasSolar, setHasSolar] = useState(false)
  const [hasHeatPump, setHasHeatPump] = useState(false)
  const [gas, setGas] = useState('')
  const [kwh, setKwh] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calcSavings> | null>(null)

  function toStep2() {
    const def = HOUSE_TYPES.find(h => h.key === houseType)
    if (def) { if (!gas) setGas(String(def.gas)); if (!kwh) setKwh(String(def.kwh)) }
    setStep(2)
  }

  function calculate() {
    const def = HOUSE_TYPES.find(h => h.key === houseType) ?? HOUSE_TYPES[1]
    setResult(calcSavings(parseFloat(gas) || def.gas, parseFloat(kwh) || def.kwh, hasHeatPump, hasSolar))
    setStep(3)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 9,
    border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
    background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827',
  }

  return (
    <section style={{
      background: 'linear-gradient(160deg, #052e1a 0%, #0a5c35 55%, #0e7a48 100%)',
      paddingTop: 'clamp(88px, 12vw, 120px)',
      paddingBottom: 'clamp(48px, 8vw, 80px)',
      paddingLeft: 'clamp(16px, 4vw, 48px)',
      paddingRight: 'clamp(16px, 4vw, 48px)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* background decoration */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(245,196,66,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, rgba(5,46,26,0.3))', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', gap: 'clamp(32px, 6vw, 72px)', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Left: hero text */}
        <div style={{ flex: '1 1 340px', minWidth: 280 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(245,196,66,0.15)', border: '1px solid rgba(245,196,66,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5c442', flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#f5c442', letterSpacing: '0.04em' }}>Salderingsregeling eindigt in 2027 — handel nú</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 900, color: '#fff', lineHeight: 1.08, marginBottom: 18, letterSpacing: '-0.025em' }}>
            Stop met te veel<br />
            betalen voor<br />
            <span style={{ color: '#f5c442' }}>energie</span>
          </h1>

          <p style={{ fontSize: 'clamp(14px, 1.8vw, 16.5px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 30, maxWidth: 440 }}>
            Gratis en onafhankelijk advies voor heel Friesland. Bereken direct hoeveel u kunt besparen met zonnepanelen, een thuisbatterij of warmtepomp.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
            {[
              'Gratis advies, altijd vrijblijvend',
              'Geen verkoopdruk, eerlijk advies',
              'Gecertificeerde installateurs in uw regio',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(245,196,66,0.2)', border: '1.5px solid rgba(245,196,66,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#f5c442', fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'clamp(20px, 4vw, 48px)', flexWrap: 'wrap' }}>
            {[['2.400+', 'huishoudens geholpen'], ['18', 'Friese gemeenten'], ['€3.2M', 'subsidies verwerkt']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: '#f5c442' }}>{v}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: calculator card */}
        <div style={{ flex: '1 1 340px', minWidth: 300, maxWidth: 460 }}>
          <div style={{ ...card, overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ background: 'linear-gradient(135deg, #0a5c35, #0e7a48)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Besparingscalculator</p>
                <p style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                  {step === 1 ? 'Uw woonsituatie' : step === 2 ? 'Uw energieverbruik' : 'Uw besparing'}
                </p>
              </div>
              {/* Step dots */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3].map(n => (
                  <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: step >= n ? '#f5c442' : 'rgba(255,255,255,0.25)' }} />
                ))}
              </div>
            </div>

            <div style={{ padding: '22px 24px' }}>

              {/* Step 1 */}
              {step === 1 && (
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>Type woning</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {HOUSE_TYPES.map(h => (
                      <button key={h.key} onClick={() => setHouseType(h.key)} style={{
                        padding: '11px 8px', borderRadius: 9, cursor: 'pointer', textAlign: 'center',
                        border: `2px solid ${houseType === h.key ? '#0a5c35' : '#e5e7eb'}`,
                        background: houseType === h.key ? '#f0fdf4' : '#fafafa',
                        transition: 'all 0.12s',
                      }}>
                        <div style={{ fontSize: 22 }}>{h.icon}</div>
                        <div style={{ fontSize: 11.5, fontWeight: houseType === h.key ? 700 : 500, color: houseType === h.key ? '#0a5c35' : '#4b5563', marginTop: 4 }}>{h.label}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    {[
                      { label: 'Al zonnepanelen?', val: hasSolar, set: setHasSolar },
                      { label: 'Al warmtepomp?',   val: hasHeatPump, set: setHasHeatPump },
                    ].map(({ label, val, set }) => (
                      <div key={label}>
                        <p style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>{label}</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {['Ja', 'Nee'].map(opt => (
                            <button key={opt} onClick={() => set(opt === 'Ja')} style={{
                              flex: 1, padding: '7px 4px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                              border: `2px solid ${(opt === 'Ja') === val ? '#0a5c35' : '#e5e7eb'}`,
                              background: (opt === 'Ja') === val ? '#f0fdf4' : '#fafafa',
                              color: (opt === 'Ja') === val ? '#0a5c35' : '#6b7280',
                            }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={toStep2} style={{ ...btn(), width: '100%' }}>
                    Volgende →
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div>
                  <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12.5, color: '#166534', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>✓</span>
                    <span>{HOUSE_TYPES.find(h => h.key === houseType)?.label ?? 'Woning'} · {hasSolar ? 'Zonnepanelen aanwezig' : 'Geen zonnepanelen'}</span>
                  </div>

                  <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 14 }}>We hebben gemiddelden ingevuld — aanpassen mag.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Gas (m³/jaar)</label>
                      <input type="number" value={gas} onChange={e => setGas(e.target.value)} placeholder="1.500" style={inp} min="0" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Stroom (kWh/jaar)</label>
                      <input type="number" value={kwh} onChange={e => setKwh(e.target.value)} placeholder="3.200" style={inp} min="0" />
                    </div>
                  </div>

                  <button onClick={calculate} style={{ ...btn(), width: '100%', marginBottom: 10 }}>
                    Bereken mijn besparing →
                  </button>
                  <button onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#9ca3af', fontFamily: 'inherit' }}>
                    ← Terug
                  </button>
                </div>
              )}

              {/* Step 3: Results */}
              {step === 3 && result && (
                <div>
                  <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Uw besparingspotentieel</p>
                    <div style={{ fontSize: 56, fontWeight: 900, color: '#0a5c35', lineHeight: 1 }}>
                      €{result.total.toLocaleString('nl-NL')}
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>per jaar</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                    {[
                      result.solarSavings > 0 && { icon: '☀️', label: 'Zonnepanelen', val: result.solarSavings },
                      result.heatPumpSavings > 0 && { icon: '🌡️', label: 'Warmtepomp', val: result.heatPumpSavings },
                      result.batterySavings > 0 && { icon: '🔋', label: 'Thuisbatterij', val: result.batterySavings },
                    ].filter(Boolean).map((item: any) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 13px', background: '#f0fdf4', borderRadius: 9, border: '1px solid #bbf7d0' }}>
                        <span style={{ fontSize: 13.5, color: '#111827' }}>{item.icon} {item.label}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0a5c35' }}>€{item.val.toLocaleString('nl-NL')}/jaar</span>
                      </div>
                    ))}
                  </div>

                  <a href="#contact" style={{ ...btn('#0a5c35', '#fff'), width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}>
                    Gratis adviesgesprek aanvragen →
                  </a>
                  <button onClick={() => { setStep(1); setResult(null) }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', fontFamily: 'inherit', marginTop: 8 }}>
                    Opnieuw berekenen
                  </button>
                </div>
              )}

            </div>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 10 }}>
            Indicatieve berekening · Gratis en vrijblijvend
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Trust bar ─────────────────────────────────────────────────────────────────

function TrustBar() {
  const items = [
    { icon: '🏅', label: 'Gecertificeerde installateurs' },
    { icon: '🎯', label: 'Onafhankelijk advies' },
    { icon: '📍', label: 'Heel Friesland' },
    { icon: '✅', label: 'Geen verplichtingen' },
  ]
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(20px, 4vw, 56px)', flexWrap: 'wrap' }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Werkwijze ─────────────────────────────────────────────────────────────────

function Werkwijze() {
  const steps = [
    { n: '01', icon: '📝', title: 'Aanvraag',      desc: 'Vul het formulier in. Binnen één werkdag nemen wij contact op.' },
    { n: '02', icon: '🤝', title: 'Adviesgesprek', desc: 'Onze adviseur analyseert uw woning vrijblijvend en eerlijk.' },
    { n: '03', icon: '🔧', title: 'Installatie',   desc: 'Gecertificeerde installateurs in uw regio regelen alles.' },
    { n: '04', icon: '💰', title: 'Besparen',      desc: 'Geniet van een lagere energierekening en meer comfort.' },
  ]
  return (
    <section id="werkwijze" style={{ background: '#f9fafb', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ZO WERKT HET</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, color: '#111827', marginTop: 8, letterSpacing: '-0.025em' }}>
            Van aanvraag tot besparing
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ position: 'relative', padding: '0 24px', textAlign: 'center' }}>
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', top: 36, right: -8, left: '50%', height: 2, background: 'linear-gradient(90deg, #0a5c35 0%, #bbf7d0 100%)', zIndex: 0 }} />
              )}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', border: '2.5px solid #0a5c35', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, position: 'relative', zIndex: 1, boxShadow: '0 4px 16px rgba(10,92,53,0.12)' }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0a5c35', letterSpacing: '0.1em', marginBottom: 6 }}>STAP {s.n}</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Diensten ──────────────────────────────────────────────────────────────────

function Diensten() {
  const list = [
    { icon: '☀️', title: 'Zonnepanelen',  sub: 'Populair', subStyle: { background: '#dbeafe', color: '#1e40af' }, desc: 'Opwek op uw eigen dak. Terugverdientijd 5-8 jaar, 25 jaar garantie op de panelen.' },
    { icon: '🔋', title: 'Thuisbatterij', sub: 'Nieuw',    subStyle: { background: '#dcfce7', color: '#166534' }, desc: "Sla uw zelf opgewekte stroom op en gebruik die 's avonds. Tot €1.400/jaar extra besparing." },
    { icon: '🌡️', title: 'Warmtepomp',   sub: null,       subStyle: {}, desc: 'Vervang uw cv-ketel en verbruik 60-70% minder gas. Volledig gecertificeerde installatie.' },
    { icon: '🏠', title: 'Woningadvies', sub: 'Gratis',   subStyle: { background: '#fef9c3', color: '#854d0e' }, desc: 'Onafhankelijk advies over isolatie, subsidies en de optimale verduurzamingsvolgorde.' },
  ]

  return (
    <section id="diensten" style={{ background: '#fff', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ONZE DIENSTEN</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, color: '#111827', marginTop: 8, letterSpacing: '-0.025em' }}>
            Alles voor een duurzaam huis
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
          {list.map(d => (
            <div key={d.title} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #e5e7eb', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}>
              {d.sub && (
                <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 12, ...d.subStyle }}>
                  {d.sub}
                </span>
              )}
              <div style={{ fontSize: 36, marginBottom: 16 }}>{d.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 10 }}>{d.title}</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 }}>{d.desc}</p>
              <a href="#contact" style={{ fontSize: 13.5, fontWeight: 700, color: '#0a5c35', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Meer info <span style={{ fontSize: 12 }}>→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  const reviews = [
    { quote: 'Na het gratis adviesgesprek waren al onze vragen beantwoord. Geen enkele verkoopdruk. Nu besparen we meer dan €1.100 per jaar op onze energierekening.', name: 'Familie Bouma', city: 'Leeuwarden', stars: 5 },
    { quote: 'Binnen een week was de warmtepomp al geïnstalleerd. Ons gasverbruik is met meer dan 60% gedaald. Wat een verschil op de maandelijkse rekening!', name: 'Dhr. Dijkstra', city: 'Franeker', stars: 5 },
    { quote: 'Eindelijk eerlijk en onafhankelijk advies. Niet de duurste oplossing, maar de beste voor onze situatie. Dat waardeer je enorm.', name: 'Familie van der Berg', city: 'Sneek', stars: 5 },
  ]

  return (
    <section id="ervaringen" style={{ background: '#f9fafb', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ERVARINGEN</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, color: '#111827', marginTop: 8, letterSpacing: '-0.025em' }}>
            Wat klanten zeggen
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {reviews.map(r => (
            <div key={r.name} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {Array.from({ length: r.stars }).map((_, i) => (
                  <span key={i} style={{ color: '#f5c442', fontSize: 18 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic' }}>
                "{r.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0a5c35, #0e7a48)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
                  {r.name.charAt(r.name.indexOf(' ') + 1)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.name}</div>
                  <div style={{ fontSize: 12.5, color: '#9ca3af' }}>{r.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Contact ───────────────────────────────────────────────────────────────────

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
      try { await createLeadFromLanding({ naam, email, telefoon, postcode, bericht }); setSent(true) }
      catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 9, border: '1.5px solid #d1d5db',
    fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#111827',
  }

  return (
    <section id="contact" style={{ background: 'linear-gradient(160deg, #052e1a 0%, #0a5c35 100%)', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>

        <div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(245,196,66,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>GRATIS ADVIESGESPREK</span>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, color: '#fff', marginTop: 10, marginBottom: 16, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Wij bellen<br />u terug
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 28 }}>
            Laat uw gegevens achter. Eén van onze adviseurs neemt binnen één werkdag contact op voor een gratis en volledig vrijblijvend gesprek.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Gratis en vrijblijvend advies', 'Binnen 1 werkdag reactie', 'Onafhankelijk, geen verkoopdruk', 'Wij kennen de Friese markt'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(245,196,66,0.2)', border: '1.5px solid rgba(245,196,66,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#f5c442', fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, padding: 'clamp(22px, 4vw, 36px)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 30, color: '#16a34a', fontWeight: 700 }}>✓</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Aanvraag ontvangen!</h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>We nemen binnen 1 werkdag contact met u op.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Naam *</label>
                  <input required value={naam} onChange={e => setNaam(e.target.value)} placeholder="Jan de Vries" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Postcode</label>
                  <input value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="8888 AB" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>E-mailadres *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Telefoonnummer</label>
                <input type="tel" value={telefoon} onChange={e => setTelefoon(e.target.value)} placeholder="06-12345678" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Bericht (optioneel)</label>
                <textarea value={bericht} onChange={e => setBericht(e.target.value)} rows={3} placeholder="Bijv. interesse in zonnepanelen en een thuisbatterij…" style={{ ...inp, resize: 'vertical' }} />
              </div>
              {error && <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>}
              <button type="submit" disabled={isPending} style={{ ...btn(), width: '100%', opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: 15 }}>
                {isPending ? 'Verzenden…' : 'Stuur aanvraag →'}
              </button>
              <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center' }}>Uw gegevens worden vertrouwelijk behandeld</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: '#03180d', padding: 'clamp(32px, 5vw, 52px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 36 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>
              <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', marginLeft: 7, textTransform: 'uppercase' }}>Friesland</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
              Onafhankelijk energieadvies voor heel Friesland. Gratis, vrijblijvend en zonder verkoopdruk.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Diensten</p>
              {['Zonnepanelen', 'Thuisbatterij', 'Warmtepomp', 'Woningadvies'].map(item => (
                <a key={item} href="#diensten" style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', marginBottom: 7, fontWeight: 500 }}>{item}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Informatie</p>
              {[['Werkwijze', '#werkwijze'], ['Ervaringen', '#ervaringen'], ['Contact', '#contact']].map(([l, h]) => (
                <a key={l} href={h} style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', marginBottom: 7, fontWeight: 500 }}>{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland</p>
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Medewerker login</Link>
        </div>
      </div>
    </footer>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Header />
      <HeroSection />
      <TrustBar />
      <Werkwijze />
      <Diensten />
      <Testimonials />
      <ContactForm />
      <Footer />
    </div>
  )
}
