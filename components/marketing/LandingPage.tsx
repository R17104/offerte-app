'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { createLeadFromLanding } from '@/lib/actions/lead.actions'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'
import { useWindowWidth } from '@/lib/hooks/useWindowWidth'

const InstallationGallery = dynamic(() => import('@/components/marketing/InstallationGallery'))
const BatterijCheck = dynamic(() => import('@/components/marketing/BatterijCheck'))

// ── Calculator logic ──────────────────────────────────────────────────────────

function calcSavings(gas: number, kwh: number, hasHeatPump: boolean, hasSolar: boolean) {
  const solarSavings = hasSolar ? 0 : Math.round(kwh * 0.85 * 0.28 * 0.7)
  const heatPumpSavings = hasHeatPump ? 0 : Math.round(gas * 0.65 * 1.10)
  const batterySavings = Math.round(kwh * 0.27)
  return { solarSavings, heatPumpSavings, batterySavings, total: solarSavings + heatPumpSavings + batterySavings, hasSolar }
}

const HOUSE_TYPES = [
  { key: 'APARTMENT', label: 'Appartement',  gas: 700,  kwh: 2200 },
  { key: 'TERRACED',  label: 'Tussenwoning', gas: 1400, kwh: 3200 },
  { key: 'CORNER',    label: 'Hoekwoning',   gas: 1700, kwh: 3600 },
  { key: 'DETACHED',  label: 'Vrijstaand',   gas: 2500, kwh: 4500 },
]

// ── Style helpers ─────────────────────────────────────────────────────────────

const btn = (color = '#0a5c35', txt = '#fff'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '13px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: color, color: txt, fontWeight: 600, fontSize: 15,
  fontFamily: 'inherit', textDecoration: 'none', letterSpacing: '-0.01em',
})

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 14,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const Ic = {
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L3 5v5c0 4.1 2.9 7.9 7 9 4.1-1.1 7-4.9 7-9V5l-7-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Pin: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5z" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
    </svg>
  ),
  NoObligation: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Document: () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M6 2h7l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13 2v4h4M8 10h6M8 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Chat: () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4 4h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7l-4 3V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 9h6M8 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Wrench: () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M14.7 3.3a4.5 4.5 0 0 0-5.2 5.9L4 14.7a1.5 1.5 0 1 0 3.3 3.3l5.5-5.5a4.5 4.5 0 0 0 5.9-5.2l-2.8 2.8-2-2 2.8-2.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  Leaf: () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 19c3-3 5-10 14-14-4 9-11 11-14 14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M3 19c0 0 4-4 7-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  TrendDown: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 4l5 7 4-4 5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 14h4v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Bolt: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M10.5 2L5 10h5.5L8 16l8.5-8.5H11L13 2h-2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  Scale: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2v14M5 16h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M4 7L2 11h4L4 7zM14 7l-2 4h4l-2-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M3.5 7h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  Grid: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Sun: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Battery: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M20 10v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M6 12h4M12 10v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Flame: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-2-1-4-2-5 0 2-1 3-2 3-1 0-2-1-2-3 0-2 1-5 1-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  Home: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V21H15v-6H9v6H3V10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  Subsidy: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 7v1.5M12 15.5V17M9.5 14c.5 1 1.2 1.5 2.5 1.5s2.5-.8 2.5-2c0-2.5-5-1.5-5-4 0-1.2 1.1-2 2.5-2 1.2 0 2 .5 2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Person: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header() {
  const w = useWindowWidth()
  const isMobile = w < 768
  const isTablet = w >= 768 && w < 1024

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #f0f0f0',
    }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <Image src="/logo-bespaarhulp.jpg" alt="Bespaarhulp Friesland" width={isMobile ? 160 : 200} height={isMobile ? 40 : 50} priority style={{ display: 'block' }} />
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isMobile && !isTablet && [['Producten', '/producten'], ['Welk product?', '/welk-product'], ['Werkwijze', '#werkwijze']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13.5, color: '#4b5563', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 500 }}>{l}</a>
          ))}
          {isTablet && [['Producten', '/producten'], ['Welk product?', '/welk-product']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13.5, color: '#4b5563', textDecoration: 'none', padding: '6px 10px', borderRadius: 6, fontWeight: 500 }}>{l}</a>
          ))}
          <a href="#contact" style={{ ...btn('#0a5c35', '#fff'), padding: '9px 18px', fontSize: 13.5, marginLeft: 4, boxShadow: 'none', whiteSpace: 'nowrap' }}>
            Gratis advies
          </a>
          {!isMobile && (
            <Link href="/login" style={{ fontSize: 12.5, color: '#9ca3af', textDecoration: 'none', padding: '8px 10px' }}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

// ── Hero + Calculator ─────────────────────────────────────────────────────────

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
    width: '100%', padding: '11px 13px', borderRadius: 8,
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
    }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', gap: 'clamp(32px, 6vw, 72px)', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Left: hero text */}
        <div style={{ flex: '1 1 340px', minWidth: 280 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(245,196,66,0.12)', border: '1px solid rgba(245,196,66,0.25)', borderRadius: 4, padding: '5px 14px', marginBottom: 24 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#f5c442', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Salderingsregeling eindigt in 2027</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 18, letterSpacing: '-0.03em' }}>
            Stop met te veel<br />
            betalen voor<br />
            <span style={{ color: '#f5c442' }}>energie</span>
          </h1>

          <p style={{ fontSize: 'clamp(14px, 1.8vw, 16.5px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
            Gratis en onafhankelijk advies voor heel Friesland. Bereken direct hoeveel u kunt besparen met zonnepanelen, een thuisbatterij of warmtepomp.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
            {['Gratis advies, altijd vrijblijvend', 'Gecertificeerde installateurs in uw regio'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(245,196,66,0.15)', border: '1px solid rgba(245,196,66,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f5c442' }}>
                  <Ic.Check />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'clamp(20px, 4vw, 48px)', flexWrap: 'wrap' }}>
            {[['2.400+', 'huishoudens geholpen'], ['18', 'Friese gemeenten'], ['€3.2M', 'subsidies verwerkt']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: '#f5c442', letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: calculator */}
        <div style={{ flex: '1 1 340px', minWidth: 300, maxWidth: 460 }}>
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #0a5c35, #0e7a48)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Besparingscalculator</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                  {step === 1 ? 'Uw woonsituatie' : step === 2 ? 'Uw energieverbruik' : 'Uw besparing'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[1, 2, 3].map(n => (
                  <div key={n} style={{ width: 7, height: 7, borderRadius: '50%', background: step >= n ? '#f5c442' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>

            <div style={{ padding: '22px 24px' }}>
              {step === 1 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>Type woning</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {HOUSE_TYPES.map(h => (
                      <button key={h.key} onClick={() => setHouseType(h.key)} style={{
                        padding: '11px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        border: `1.5px solid ${houseType === h.key ? '#0a5c35' : '#e5e7eb'}`,
                        background: houseType === h.key ? '#f0fdf4' : '#fafafa',
                        fontFamily: 'inherit',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: houseType === h.key ? 700 : 500, color: houseType === h.key ? '#0a5c35' : '#4b5563' }}>{h.label}</div>
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
                              flex: 1, padding: '7px 4px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                              border: `1.5px solid ${(opt === 'Ja') === val ? '#0a5c35' : '#e5e7eb'}`,
                              background: (opt === 'Ja') === val ? '#f0fdf4' : '#fafafa',
                              color: (opt === 'Ja') === val ? '#0a5c35' : '#6b7280',
                              fontFamily: 'inherit',
                            }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={toStep2} style={{ ...btn(), width: '100%' }}>
                    Volgende
                  </button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div style={{ background: '#f0fdf4', borderRadius: 7, padding: '9px 12px', marginBottom: 16, fontSize: 12.5, color: '#166534', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Ic.Check />
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
                    Bereken mijn besparing
                  </button>
                  <button onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#9ca3af', fontFamily: 'inherit' }}>
                    Terug
                  </button>
                </div>
              )}

              {step === 3 && result && (
                <div>
                  <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Uw besparingspotentieel</p>
                    <div style={{ fontSize: 56, fontWeight: 900, color: '#0a5c35', lineHeight: 1, letterSpacing: '-0.04em' }}>
                      €{result.total.toLocaleString('nl-NL')}
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>per jaar</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                    {[
                      result.solarSavings > 0 && { label: 'Zonnepanelen', val: result.solarSavings },
                      result.heatPumpSavings > 0 && { label: 'Warmtepomp', val: result.heatPumpSavings },
                      result.batterySavings > 0 && { label: 'Thuisbatterij', val: result.batterySavings },
                    ].filter(Boolean).map((item: any) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 13px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: 13.5, color: '#374151', fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0a5c35' }}>€{item.val.toLocaleString('nl-NL')}/jaar</span>
                      </div>
                    ))}
                  </div>

                  <a href="#contact" style={{ ...btn('#0a5c35', '#fff'), width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}>
                    Gratis adviesgesprek aanvragen
                  </a>
                  <button onClick={() => { setStep(1); setResult(null) }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', fontFamily: 'inherit', marginTop: 8 }}>
                    Opnieuw berekenen
                  </button>
                </div>
              )}
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>
            Indicatieve berekening · Gratis en vrijblijvend
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Trust bar ─────────────────────────────────────────────────────────────────

function TrustBar() {
  const items: { icon: React.ReactNode; label: string }[] = [
    { icon: <Ic.Shield />, label: 'Gecertificeerde installateurs' },
    { icon: <Ic.NoObligation />, label: 'Onafhankelijk advies' },
    { icon: <Ic.Pin />, label: 'Heel Friesland' },
    { icon: <Ic.Check />, label: 'Geen verplichtingen' },
  ]
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '16px clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(20px, 4vw, 56px)', flexWrap: 'wrap' }}>
        {items.map(item => (
          <div key={String(item.label)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
            <span style={{ color: '#0a5c35', flexShrink: 0, display: 'flex' }}>{item.icon}</span>
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
    { n: '01', icon: <Ic.Document />, title: 'Aanvraag',      desc: 'Vul het formulier in. Binnen één werkdag nemen wij contact op.' },
    { n: '02', icon: <Ic.Chat />,     title: 'Adviesgesprek', desc: 'Onze adviseur analyseert uw situatie vrijblijvend en eerlijk.' },
    { n: '03', icon: <Ic.Wrench />,   title: 'Installatie',   desc: 'Gecertificeerde installateurs in uw regio regelen alles.' },
    { n: '04', icon: <Ic.Leaf />,     title: 'Besparen',      desc: 'Geniet van een lagere energierekening en meer comfort.' },
  ]
  return (
    <section id="werkwijze" style={{ background: '#f9fafb', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Zo werkt het</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#111827', marginTop: 8, letterSpacing: '-0.025em' }}>
            Van aanvraag tot besparing
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ position: 'relative', padding: '0 24px', textAlign: 'center' }}>
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', top: 36, right: -8, left: '50%', height: 1, background: '#d1fae5', zIndex: 0 }} />
              )}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', border: '1.5px solid #d1fae5', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, boxShadow: '0 2px 12px rgba(10,92,53,0.08)', color: '#0a5c35' }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', marginBottom: 6 }}>STAP {s.n}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Thuisbatterij info ────────────────────────────────────────────────────────

function ThuisbatterijInfo() {
  const reasons: { icon: React.ReactNode; label: string }[] = [
    { icon: <Ic.TrendDown />, label: 'Terugleververgoedingen dalen fors' },
    { icon: <Ic.Bolt />,      label: 'Stroomprijzen schommelen steeds meer' },
    { icon: <Ic.Scale />,     label: 'Salderingsregeling wordt afgebouwd' },
    { icon: <Ic.Grid />,      label: 'Het elektriciteitsnet raakt vaker vol' },
  ]
  const benefits = [
    'Meer eigen stroom gebruiken',
    'Minder terugleververlies',
    'Bescherming tegen stijgende prijzen',
    'Volledig automatisch systeem',
    'Gespreid betalen mogelijk vanaf €75/mnd',
  ]

  return (
    <section style={{ background: '#f9fafb', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Thuisbatterij</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#111827', marginTop: 8, letterSpacing: '-0.025em' }}>
            Slim besparen met een thuisbatterij
          </h2>
          <p style={{ fontSize: 15.5, color: '#6b7280', marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
            Ontdek hoe u meer van uw eigen stroom gebruikt en uw energiekosten verlaagt.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
              Waarom verandert uw energierekening?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {reasons.map((r) => (
                <div key={String(r.label)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0a5c35', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    {r.icon}
                  </div>
                  <span style={{ fontSize: 14.5, color: '#374151', fontWeight: 500 }}>{r.label}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: '16px 20px' }}>
              <p style={{ fontSize: 14.5, color: '#111827', lineHeight: 1.6 }}>
                <strong>Gemiddelde besparing met een thuisbatterij: €1.100 – €1.400 per jaar</strong>
              </p>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              Wat doet een thuisbatterij?
            </h3>
            <p style={{ fontSize: 14.5, color: '#4b5563', lineHeight: 1.75, marginBottom: 20 }}>
              Een thuisbatterij slaat energie op en gebruikt deze automatisch op het meest voordelige moment. Zo profiteert u optimaal van uw zonnepanelen én van lage stroomprijzen.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {benefits.map((b) => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0a5c35' }}>
                  <div style={{ flexShrink: 0 }}><Ic.Check /></div>
                  <span style={{ fontSize: 14, color: '#374151' }}>{b}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Nationaal Warmtefonds</p>
              <p style={{ fontSize: 13.5, color: '#78350f', lineHeight: 1.6 }}>
                Inkomen onder €60.000? Dan kunt u rentevrij lenen. Boetevrij aflossen is altijd mogelijk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Diensten ──────────────────────────────────────────────────────────────────

function Diensten() {
  const list: { icon: React.ReactNode; title: string; featured?: boolean; desc: string; href: string }[] = [
    { icon: <Ic.Home />,    title: 'Woningadvies',      desc: 'Ontdek welke maatregelen uw woning energiezuiniger maken. Van isolatie tot ventilatie.', href: '#contact' },
    { icon: <Ic.Sun />,     title: 'Zonnepanelen',      desc: 'Bereken of zonnepanelen rendabel zijn voor uw dak. Inclusief terugverdientijd en subsidies.', href: '#contact', featured: true },
    { icon: <Ic.Battery />, title: 'Thuisbatterij',     desc: 'Sla zonnestroom op en gebruik het wanneer het nodig is. Bespaar tot €1.400 per jaar.', href: '#contact' },
    { icon: <Ic.Flame />,   title: 'Warmtepomp',        desc: 'Alles over de overstap naar een warmtepomp. Kosten, subsidies en de juiste keuze.', href: '#contact' },
    { icon: <Ic.Subsidy />, title: 'Subsidiecheck',     desc: 'Check welke landelijke en gemeentelijke subsidies beschikbaar zijn voor uw situatie.', href: '#contact' },
    { icon: <Ic.Person />,  title: 'Persoonlijk advies', desc: 'Gratis en onafhankelijk advies van een energiecoach uit uw regio.', href: '#contact' },
  ]

  return (
    <section id="diensten" style={{ background: '#fff', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Onze diensten</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#111827', marginTop: 8, letterSpacing: '-0.025em' }}>
            Uw weg naar een duurzamer huis
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', marginTop: 12 }}>
            Ontdek welke stappen u kunt zetten om energie te besparen en subsidies te benutten.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {list.map(d => (
            <div key={d.title} style={{
              borderRadius: 14, padding: '28px 26px',
              border: d.featured ? '1.5px solid #0a5c35' : '1px solid #e5e7eb',
              background: d.featured ? '#f9fffe' : '#fff',
              boxShadow: d.featured ? '0 4px 20px rgba(10,92,53,0.08)' : 'none',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: d.featured ? '#dcfce7' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color: '#0a5c35' }}>
                {d.icon}
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, color: '#111827', marginBottom: 10 }}>{d.title}</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.7, marginBottom: 18 }}>{d.desc}</p>
              <a href={d.href} style={{ fontSize: 13.5, fontWeight: 600, color: '#0a5c35', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Meer informatie →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

function FAQ() {
  const items = [
    { q: 'Wat kost een thuisbatterij in Friesland?', a: 'Een thuisbatterij kost gemiddeld €4.000 tot €12.000, afhankelijk van merk en capaciteit. Met het Nationaal Warmtefonds kunt u rentevrij lenen als uw inkomen onder €60.000 ligt. Wij adviseren u gratis over de beste optie voor uw situatie.' },
    { q: 'Wanneer is een thuisbatterij rendabel?', a: 'Een thuisbatterij is het meest rendabel als u zonnepanelen heeft en de salderingsregeling afloopt. U bespaart gemiddeld €1.100 tot €1.400 per jaar. De terugverdientijd ligt doorgaans tussen de 7 en 12 jaar.' },
    { q: 'Welke subsidies zijn er voor een thuisbatterij?', a: 'Er is geen directe subsidie voor thuisbatterijen, maar u kunt rentevrij lenen via het Nationaal Warmtefonds. Sommige Friese gemeenten bieden aanvullende energieregelingen. Wij helpen u gratis bij alle beschikbare subsidies.' },
    { q: 'Wat is het verschil tussen AlphaESS en Sigenergy?', a: 'AlphaESS is een bewezen merk met een hechtere integratie tussen omvormer en batterij, ideaal voor uitbreiding. Sigenergy (SigenStor) biedt een modulair alles-in-één systeem met V2X mogelijkheden. Welk merk het beste bij u past hangt af van uw installatie en wensen.' },
    { q: 'Hoe snel wordt mijn aanvraag behandeld?', a: 'U ontvangt binnen 1 werkdag een reactie van een van onze adviseurs. Na het eerste gesprek plannen we een schouw in en ontvangt u een vrijblijvende offerte. Van aanvraag tot installatie duurt gemiddeld 2 tot 4 weken.' },
    { q: 'In welke plaatsen in Friesland zijn jullie actief?', a: 'Wij zijn actief in alle 18 Friese gemeenten: Leeuwarden, Drachten, Sneek, Heerenveen, Franeker, Harlingen, Dokkum, Joure, Bolsward en alle omliggende dorpen. Onze gecertificeerde installateurs rijden door heel Friesland.' },
  ]

  return (
    <section id="veelgestelde-vragen" style={{ background: '#fff', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Veelgestelde vragen</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#111827', marginTop: 8, letterSpacing: '-0.025em' }}>
            Alles over thuisbatterijen in Friesland
          </h2>
        </div>
        <div>
          {items.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} last={i === items.length - 1} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="#contact" style={{ ...btn(), display: 'inline-flex' }}>
            Stel uw vraag aan een adviseur
          </a>
        </div>
      </div>
    </section>
  )
}

function FAQItem({ question, answer, last }: { question: string; answer: string; last: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid #e5e7eb', ...(last ? { borderBottom: '1px solid #e5e7eb' } : {}) }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 16 }}
      >
        <span style={{ fontSize: 15.5, fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>{question}</span>
        <span style={{ fontSize: 20, color: '#0a5c35', flexShrink: 0, lineHeight: 1, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', fontWeight: 300 }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 0 20px', fontSize: 14.5, color: '#4b5563', lineHeight: 1.75 }}>
          {answer}
        </div>
      )}
    </div>
  )
}

// ── Contact ───────────────────────────────────────────────────────────────────

function ContactForm() {
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [telefoon, setTelefoon] = useState('')
  const [postcode, setPostcode] = useState('')
  const [bericht, setBericht] = useState('')
  const [herkomst, setHerkomst] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const herkomstOpties = ['Instagram', 'TikTok', 'Facebook', 'Vrienden / via via', 'Energieloket', 'Google']
  const w = useWindowWidth()
  const isMobile = w < 600

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try { await createLeadFromLanding({ naam, email, telefoon, postcode, bericht, herkomst: herkomst || undefined }); setSent(true) }
      catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 8, border: '1px solid #d1d5db',
    fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#111827',
  }

  return (
    <section id="contact" style={{ background: 'linear-gradient(160deg, #052e1a 0%, #0a5c35 100%)', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>

        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,196,66,0.75)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Gratis adviesgesprek</span>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: '#fff', marginTop: 10, marginBottom: 16, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Wij bellen<br />u terug
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 28 }}>
            Laat uw gegevens achter. Eén van onze adviseurs neemt binnen één werkdag contact op voor een gratis en volledig vrijblijvend gesprek.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Gratis en vrijblijvend advies', 'Binnen 1 werkdag reactie', 'Wij kennen de Friese markt'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(245,196,66,0.8)' }}>
                <Ic.Check />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, padding: 'clamp(22px, 4vw, 36px)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#16a34a' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Aanvraag ontvangen</h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>We nemen binnen 1 werkdag contact met u op.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
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
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Hoe bent u bij ons terechtgekomen?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {herkomstOpties.map(opt => (
                    <button key={opt} type="button" onClick={() => setHerkomst(herkomst === opt ? '' : opt)} style={{
                      padding: '7px 13px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      border: `1.5px solid ${herkomst === opt ? '#0a5c35' : '#d1d5db'}`,
                      background: herkomst === opt ? '#f0fdf4' : '#fff',
                      color: herkomst === opt ? '#0a5c35' : '#6b7280',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Bericht (optioneel)</label>
                <textarea value={bericht} onChange={e => setBericht(e.target.value)} rows={3} placeholder="Bijv. interesse in zonnepanelen en een thuisbatterij…" style={{ ...inp, resize: 'vertical' }} />
              </div>
              {error && <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>}
              <button type="submit" disabled={isPending} style={{ ...btn(), width: '100%', opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: 15 }}>
                {isPending ? 'Verzenden…' : 'Stuur aanvraag'}
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>
              <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.12em', marginLeft: 7, textTransform: 'uppercase' }}>Friesland</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              Onafhankelijk energieadvies voor heel Friesland. Gratis en vrijblijvend.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Diensten</p>
              {['Zonnepanelen', 'Thuisbatterij', 'Warmtepomp', 'Woningadvies'].map(item => (
                <a key={item} href="#diensten" style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 7 }}>{item}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Informatie</p>
              {[['Werkwijze', '#werkwijze'], ['Contact', '#contact']].map(([l, h]) => (
                <a key={l} href={h} style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 7 }}>{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland</p>
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Medewerker login</Link>
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
      <BatterijCheck />
      <ThuisbatterijInfo />
      <Diensten />
      <Werkwijze />
      <InstallationGallery />
      <FAQ />
      <ContactForm />
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
