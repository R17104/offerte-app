'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { createLeadFromLanding } from '@/lib/actions/lead.actions'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'
import { trackWhatsAppClick } from '@/lib/track-contact'
import { useWindowWidth } from '@/lib/hooks/useWindowWidth'

const InstallationGallery = dynamic(() => import('@/components/marketing/InstallationGallery'))

export type ShopProduct = {
  id: string
  name: string
  description: string | null
  unitPrice: number
  vatRate: number
  imageUrl: string | null
  category: string | null
  capacityKwh: number | null
  powerKw: number | null
  warrantyYears: number | null
  isMaatwerk: boolean
}

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
      background: 'rgba(8,18,13,0.85)', backdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 clamp(10px, 4vw, 48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Image src="/logo-bespaarhulp-wit.png" alt="Bespaarhulp Friesland" width={isMobile ? 100 : 127} height={isMobile ? 30 : 38} priority style={{ display: 'block' }} />
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isMobile && !isTablet && [['Rekentools', '/rekentools'], ['Welk product?', '/welk-product'], ['Werkwijze', '#werkwijze']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 500 }}>{l}</a>
          ))}
          {!isMobile && (
            <a href="https://wa.me/31638922513" onClick={trackWhatsAppClick} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', padding: '6px 12px', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16"><path d="M14 11.3c0 .4-.1.8-.3 1.2-.2.4-.5.7-.8 1-.6.4-1.2.6-1.9.5-1-.1-2-.4-2.9-.9a12 12 0 01-2.6-1.9A12 12 0 013.6 8.6c-.5-.9-.8-1.9-.9-2.9-.1-.7.1-1.3.5-1.9.3-.3.6-.6 1-.8.4-.2.8-.3 1.2-.3.2 0 .3.1.4.3l1 2.1c.1.2.1.3 0 .5l-.6.9c-.1.2-.1.3 0 .5.3.6.7 1.1 1.2 1.6s1 .9 1.6 1.2c.2.1.3.1.5 0l.9-.6c.2-.1.3-.1.5 0l2.1 1c.2.1.3.2.3.4z" fill="#f5c442"/></svg>
              06 38 92 25 13
            </a>
          )}
          {isTablet && (
            <a href="/rekentools" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', padding: '6px 10px', borderRadius: 6, fontWeight: 500 }}>Rekentools</a>
          )}
          {/* Producten als echte knop, zichtbaar op elk formaat */}
          <Link href="/producten" style={{
            fontSize: isMobile ? 12.5 : 13.5, fontWeight: 700, color: '#f5c442', textDecoration: 'none',
            padding: isMobile ? '7px 9px' : '8px 16px', borderRadius: 8,
            border: '1.5px solid rgba(245,196,66,0.5)', whiteSpace: 'nowrap', marginRight: 4, flexShrink: 0,
          }}>
            Producten
          </Link>
          <a href="#contact" style={{ ...btn('#f5c442', '#052e1a'), padding: isMobile ? '8px 11px' : '9px 18px', fontSize: isMobile ? 12.5 : 13.5, boxShadow: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Gratis advies
          </a>
          {!isMobile && (
            <Link href="/login" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', padding: '8px 10px', flexShrink: 0 }}>
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
      background: 'radial-gradient(130% 110% at 78% 0%, rgba(14,122,72,0.45) 0%, rgba(5,20,14,0) 55%), linear-gradient(165deg, #061611 0%, #07261a 45%, #0a3a24 100%)',
      paddingTop: 'clamp(88px, 12vw, 120px)',
      paddingBottom: 'clamp(48px, 8vw, 80px)',
      paddingLeft: 'clamp(16px, 4vw, 48px)',
      paddingRight: 'clamp(16px, 4vw, 48px)',
    }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', gap: 'clamp(32px, 6vw, 72px)', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Left: hero text */}
        <div style={{ flex: '1 1 340px', minWidth: 280 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 4, padding: '5px 14px', marginBottom: 24 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fca5a5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Salderingsregeling eindigt in 2027</span>
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
                    ].filter((i): i is { label: string; val: number } => Boolean(i)).map((item) => (
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
    <div style={{ background: '#08120d', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(20px, 4vw, 56px)', flexWrap: 'wrap' }}>
        {items.map(item => (
          <div key={String(item.label)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f5c442', flexShrink: 0, display: 'flex' }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Uitgelichte batterijen (2 producten, premium dark) ────────────────────────

type Featured = { capacity: number; name: string; vanaf: number; badge?: string; tagline: string; image?: string }

const FEATURED: Featured[] = [
  { capacity: 9.3,  name: 'Alpha ESS 9,3 kWh thuisbatterij',  vanaf: 5000, badge: 'Meest gekozen', tagline: 'De populairste keuze voor het gemiddelde huishouden.' },
  { capacity: 18.6, name: 'Alpha ESS 18,6 kWh thuisbatterij', vanaf: 6950, tagline: 'Maximale opslag voor woningen met hoog verbruik of een warmtepomp.', image: 'https://thuisbatterijnederland.nl/wp-content/uploads/2024/07/ChatGPT-Image-8-mei-2026-13_55_35-3.png' },
]

function FeaturedImage({ src, alt }: { src: string | null; alt: string }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ position: 'relative', height: 280, background: 'radial-gradient(120% 90% at 50% 25%, #ffffff 0%, #eef2f5 70%, #dde4ea 100%)' }}>
      {src && !err ? (
        <Image src={src} alt={alt} fill unoptimized onError={() => setErr(true)} style={{ objectFit: 'contain', padding: 28, boxSizing: 'border-box' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🔋</div>
      )}
    </div>
  )
}

function FeaturedBatteries({ products }: { products: ShopProduct[] }) {
  const gold = '#f5c442'

  return (
    <section id="assortiment" style={{ background: 'radial-gradient(130% 110% at 50% 0%, rgba(14,122,72,0.4) 0%, #0a1410 58%)', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Onze bestsellers</span>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: '#fff', marginTop: 10, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            De thuisbatterijen die Friesland kiest
          </h2>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.6)', marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
            Geleverd én geïnstalleerd door eigen monteurs. A-merk Alpha ESS, 10 jaar garantie.
          </p>
        </div>

        {/* Merkenbalk */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 2vw, 20px)', flexWrap: 'wrap', margin: '24px 0 40px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Wij leveren o.a.</span>
          {['AlphaESS', 'Sigenergy', 'WeHeat'].map(brand => (
            <span key={brand} style={{ fontSize: 14.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)', padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}>
              {brand}
            </span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {FEATURED.map((f, i) => {
            const product = products.find(p => p.category === 'BATTERY' && p.capacityKwh === f.capacity)
            const name = product?.name ?? f.name
            const offerHref = product ? `/offerte-aanvragen?product=${product.id}` : '/gratis-advies?product=' + encodeURIComponent(f.name)
            const infoHref = product ? `/producten/${product.id}` : '/producten?cat=BATTERY'
            return (
              <div key={f.capacity} style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(245,196,66,0.4)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
              }}>
                {(i === 0 || f.badge) && (
                  <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, padding: '5px 12px', borderRadius: 20, background: i === 0 ? gold : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', fontSize: 11.5, fontWeight: 800, color: i === 0 ? '#052e1a' : '#fff' }}>
                    {i === 0 ? `★ ${f.badge}` : f.badge}
                  </div>
                )}
                <FeaturedImage src={f.image ?? product?.imageUrl ?? null} alt={name} />
                <div style={{ padding: 'clamp(22px, 3vw, 32px)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 'clamp(19px, 2.4vw, 23px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginBottom: 8 }}>{name}</h3>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16 }}>{f.tagline}</p>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                    {[`${f.capacity.toString().replace('.', ',')} kWh`, product?.powerKw != null ? `${product.powerKw} kW` : null, `${product?.warrantyYears ?? 10} jr garantie`].filter(Boolean).map(s => (
                      <span key={s} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>{s}</span>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>vanaf</span>
                        <span style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 900, color: gold, letterSpacing: '-0.02em' }}>
                          {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(f.vanaf)}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>compleet geïnstalleerd · exacte prijs na gratis advies</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={offerHref} style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: 10, background: gold, color: '#052e1a', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                        Vraag offerte aan
                      </Link>
                      <Link href={infoHref} style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Meer info
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link href="/producten" style={{ fontSize: 14.5, fontWeight: 700, color: gold, textDecoration: 'none' }}>
            Bekijk het volledige assortiment →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Rekentools-band (premium dark) ────────────────────────────────────────────

function RekentoolsBand() {
  const tools = [
    { icon: '🧮', title: 'Besparingscalculator', desc: 'Vul uw maandbedrag in en zie wat verduurzamen u per jaar oplevert.', href: '/rekentools' },
    { icon: '🔋', title: 'Backup-tijd calculator', desc: 'Bereken hoelang u doordraait bij stroomuitval met een thuisbatterij.', href: '/rekentools' },
  ]
  return (
    <section style={{ background: 'radial-gradient(120% 120% at 50% 0%, rgba(14,122,72,0.4) 0%, #0a1410 60%)', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f5c442', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Gratis rekentools</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#fff', marginTop: 8, letterSpacing: '-0.025em' }}>
            Reken zelf uit wat u bespaart
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 12, maxWidth: 540, margin: '12px auto 0' }}>
            Eerlijke berekeningen op basis van Nederlandse tarieven en regels. Geen verkooppraatjes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 44 }}>
          {tools.map(t => (
            <Link key={t.title} href={t.href} style={{
              display: 'block', padding: '26px 24px', borderRadius: 16, textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ fontSize: 30 }}>{t.icon}</span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 12, marginBottom: 6 }}>{t.title}</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>{t.desc}</p>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f5c442' }}>Open de tool →</span>
            </Link>
          ))}
        </div>

        {/* Stats — Anker-stijl */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(16px, 3vw, 40px)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 36 }}>
          {[
            ['250+', 'installaties in Friesland'],
            ['10 jaar', 'garantie op A-merk batterijen'],
            ['±2 weken', 'van offerte tot installatie'],
            ['KVK 71128174', 'geregistreerd & verzekerd'],
          ].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 900, color: '#f5c442', letterSpacing: '-0.02em' }}>{v}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
    <section id="werkwijze" style={{ background: '#08120d', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f5c442', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Zo werkt het</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#fff', marginTop: 8, letterSpacing: '-0.025em' }}>
            Van aanvraag tot besparing
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ position: 'relative', padding: '0 24px', textAlign: 'center' }}>
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', top: 36, right: -8, left: '50%', height: 1, background: 'rgba(255,255,255,0.14)', zIndex: 0 }} />
              )}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,196,66,0.12)', border: '1.5px solid rgba(245,196,66,0.4)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, color: '#f5c442' }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', marginBottom: 6 }}>STAP {s.n}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 }}>{s.desc}</p>
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
    'Gespreid betalen mogelijk vanaf €35/mnd',
  ]

  return (
    <section style={{ background: '#0a1410', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f5c442', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Thuisbatterij</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#fff', marginTop: 8, letterSpacing: '-0.025em' }}>
            Slim besparen met een thuisbatterij
          </h2>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.6)', marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
            Ontdek hoe u meer van uw eigen stroom gebruikt en uw energiekosten verlaagt.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
              Waarom verandert uw energierekening?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {reasons.map((r) => (
                <div key={String(r.label)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f5c442' }}>
                    {r.icon}
                  </div>
                  <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{r.label}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(245,196,66,0.1)', border: '1px solid rgba(245,196,66,0.3)', borderRadius: 10, padding: '16px 20px' }}>
              <p style={{ fontSize: 14.5, color: '#fff', lineHeight: 1.6 }}>
                <strong>Gemiddelde besparing met een thuisbatterij: €1.100 – €1.400 per jaar</strong>
              </p>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              Wat doet een thuisbatterij?
            </h3>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 20 }}>
              Een thuisbatterij slaat energie op en gebruikt deze automatisch op het meest voordelige moment. Zo profiteert u optimaal van uw zonnepanelen én van lage stroomprijzen.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {benefits.map((b) => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f5c442' }}>
                  <div style={{ flexShrink: 0 }}><Ic.Check /></div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{b}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(245,196,66,0.1)', border: '1px solid rgba(245,196,66,0.3)', borderRadius: 10, padding: '14px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f5c442', marginBottom: 4 }}>Nationaal Warmtefonds</p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
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
  const [openTitle, setOpenTitle] = useState<string | null>(null)

  const list: { icon: React.ReactNode; title: string; featured?: boolean; desc: string; info: string; productHref?: string }[] = [
    {
      icon: <Ic.Home />, title: 'Woningadvies',
      desc: 'Ontdek welke maatregelen uw woning energiezuiniger maken. Van isolatie tot ventilatie.',
      info: 'Een goed geïsoleerde woning bespaart al snel honderden euro’s per jaar. Wij kijken naar isolatie, kierdichting, ventilatie en uw energielabel, en maken een stappenplan in de juiste volgorde: eerst besparen, dan opwekken. Zo voorkomt u dat u investeert in een warmtepomp terwijl de warmte nog door het dak verdwijnt.',
    },
    {
      icon: <Ic.Sun />, title: 'Zonnepanelen', featured: true,
      desc: 'Bereken of zonnepanelen rendabel zijn voor uw dak. Inclusief terugverdientijd en subsidies.',
      info: 'Een set van 10–12 panelen levert zo’n 3.500–4.500 kWh per jaar. Ook na het einde van de saldering (2027) blijven panelen rendabel: stroom die u zelf direct verbruikt bespaart het volle tarief van ±€0,28/kWh. In combinatie met een thuisbatterij benut u nog meer van uw eigen opwek. De terugverdientijd ligt doorgaans tussen de 5 en 8 jaar.',
      productHref: '/producten?cat=SOLAR',
    },
    {
      icon: <Ic.Battery />, title: 'Thuisbatterij',
      desc: 'Sla zonnestroom op en gebruik het wanneer het nodig is. Bespaar tot €1.400 per jaar.',
      info: 'Een thuisbatterij slaat uw zonnestroom van overdag op voor ’s avonds. Dat wordt belangrijk: de salderingsregeling stopt per 2027, waarna terugleveren nog maar ±€0,07/kWh oplevert terwijl inkopen ±€0,28 kost. Met een slim energiemanagementsysteem (EMS) kan de batterij bovendien extra verdienen op de onbalansmarkt. Welke maat bij u past, ziet u in 2 minuten met onze gratis batterijcheck.',
      productHref: '/producten?cat=BATTERY',
    },
    {
      icon: <Ic.Flame />, title: 'Warmtepomp',
      desc: 'Alles over de overstap naar een warmtepomp. Kosten, subsidies en de juiste keuze.',
      info: 'Een (hybride) warmtepomp bespaart 60 tot 100% op uw gasverbruik. Via de ISDE-subsidie krijgt u al snel €2.000–€3.500 terug op de aanschaf. Wij adviseren welk type bij uw woning past — hybride naast de cv-ketel of volledig elektrisch — en nemen de subsidieaanvraag uit handen.',
      productHref: '/producten?cat=HEAT_PUMP',
    },
    {
      icon: <Ic.Subsidy />, title: 'Subsidiecheck',
      desc: 'Check welke landelijke en gemeentelijke subsidies beschikbaar zijn voor uw situatie.',
      info: 'Er bestaan landelijke regelingen zoals de ISDE-subsidie (warmtepompen en isolatie) en het Nationaal Warmtefonds, waarmee u tegen lage of zelfs 0% rente kunt lenen bij een inkomen tot €60.000. Daarnaast hebben sommige Friese gemeenten eigen regelingen. Wij zoeken gratis voor u uit waar u recht op heeft.',
    },
    {
      icon: <Ic.Person />, title: 'Persoonlijk advies',
      desc: 'Gratis en onafhankelijk advies van een energiecoach uit uw regio.',
      info: 'Eén van onze adviseurs belt u of komt langs — gratis en vrijblijvend. We nemen uw energienota door, bekijken uw woning en rekenen door wat zinvol is en wat niet. U krijgt een eerlijk advies, ook als dat advies is om iets juist níet te doen.',
    },
  ]

  return (
    <section id="diensten" style={{ background: '#08120d', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f5c442', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Onze diensten</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#fff', marginTop: 8, letterSpacing: '-0.025em' }}>
            Uw weg naar een duurzamer huis
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>
            Ontdek welke stappen u kunt zetten om energie te besparen en subsidies te benutten.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>
          {list.map(d => {
            const open = openTitle === d.title
            return (
              <div key={d.title} style={{
                borderRadius: 14, padding: '28px 26px',
                border: d.featured || open ? '1.5px solid rgba(245,196,66,0.45)' : '1px solid rgba(255,255,255,0.1)',
                background: d.featured ? 'rgba(245,196,66,0.06)' : 'rgba(255,255,255,0.03)',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,196,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color: '#f5c442' }}>
                  {d.icon}
                </div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{d.title}</h3>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 18 }}>{d.desc}</p>

                <button
                  onClick={() => setOpenTitle(open ? null : d.title)}
                  style={{ fontSize: 13.5, fontWeight: 600, color: '#f5c442', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  Meer informatie {open ? '▴' : '▾'}
                </button>

                {open && (
                  <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 16 }}>{d.info}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {d.productHref && (
                        <Link href={d.productHref} style={{ padding: '8px 14px', borderRadius: 8, background: '#f5c442', color: '#052e1a', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                          Bekijk producten →
                        </Link>
                      )}
                      <a href="#contact" style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid rgba(245,196,66,0.5)', color: '#f5c442', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                        Gratis advies →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Reviews ───────────────────────────────────────────────────────────────────
// LET OP: de sectie staat UIT (SHOW_REVIEWS) tot er échte Google-reviews zijn.
// Vervang de voorbeelden hieronder door echte reviews en zet dan de vlag aan.
// Verzonnen reviews publiceren is misleidend en wettelijk niet toegestaan.

const SHOW_REVIEWS = false

const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?q=Bespaarhulp+Friesland+reviews'

const REVIEWS: { name: string; place: string; text: string; product: string }[] = [
  { name: 'J. de Boer', place: 'Leeuwarden', product: 'Thuisbatterij 9,3 kWh', text: 'Heldere uitleg over de saldering en wat dat voor ons betekent. Binnen twee weken geïnstalleerd, netjes afgewerkt.' },
  { name: 'A. Visser', place: 'Drachten', product: 'Thuisbatterij + EMS', text: 'Geen verkooppraatjes maar een eerlijke berekening. De batterij doet precies wat beloofd werd.' },
  { name: 'S. Hoekstra', place: 'Sneek', product: 'Warmtepomp', text: 'Goed geholpen bij de subsidieaanvraag. De adviseur dacht echt mee over wat bij ons huis past.' },
  { name: 'P. van der Meer', place: 'Heerenveen', product: 'Zonnepanelen + batterij', text: 'Snelle reactie op de aanvraag, duidelijke offerte met alle besparingen onderbouwd. Aanrader.' },
]

function ReviewsSection() {
  return (
    <section style={{ background: '#f8faf9', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)', borderTop: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Klantervaringen</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#111827', marginTop: 8, letterSpacing: '-0.025em' }}>
            Wat klanten over ons zeggen
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <span style={{ color: '#f5c442', fontSize: 18, letterSpacing: 2 }}>★★★★★</span>
            <span style={{ fontSize: 14, color: '#6b7280' }}>250+ installaties in Friesland</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {REVIEWS.map(r => (
            <div key={r.name} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 22px 18px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#f5c442', fontSize: 14, letterSpacing: 1.5, marginBottom: 10 }}>★★★★★</span>
              <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, flex: 1, marginBottom: 16 }}>
                &ldquo;{r.text}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0a5c35', flexShrink: 0 }}>
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.name} · {r.place}</p>
                  <p style={{ fontSize: 11.5, color: '#9ca3af' }}>{r.product}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 700, color: '#0a5c35', textDecoration: 'none' }}>
            Bekijk al onze reviews op Google →
          </a>
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
    <section id="veelgestelde-vragen" style={{ background: '#0a1410', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f5c442', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Veelgestelde vragen</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#fff', marginTop: 8, letterSpacing: '-0.025em' }}>
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
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', ...(last ? { borderBottom: '1px solid rgba(255,255,255,0.1)' } : {}) }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 16 }}
      >
        <span style={{ fontSize: 15.5, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{question}</span>
        <span style={{ fontSize: 20, color: '#f5c442', flexShrink: 0, lineHeight: 1, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', fontWeight: 300 }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 0 20px', fontSize: 14.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
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
  const [website, setWebsite] = useState('') // honeypot
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
      try { await createLeadFromLanding({ naam, email, telefoon, postcode, bericht, herkomst: herkomst || undefined, website }); setSent(true) }
      catch (err) { setError(err instanceof Error && err.message ? err.message : 'Er ging iets mis. Probeer het opnieuw.') }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 8, border: '1px solid #d1d5db',
    fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#111827',
  }

  return (
    <section id="contact" style={{ background: 'radial-gradient(120% 100% at 50% 0%, rgba(14,122,72,0.35) 0%, #07120d 60%), #07120d', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 48px)' }}>
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

          {/* Persoonlijk contact — geen callcenter */}
          <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center', maxWidth: 420 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(245,196,66,0.15)', border: '1.5px solid rgba(245,196,66,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f5c442' }}>
              <Ic.Person />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>U spreekt direct een adviseur</p>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
                Geen callcenter — één van onze eigen adviseurs uit Friesland belt u terug. Liever direct contact?{' '}
                <a href="https://wa.me/31638922513" onClick={trackWhatsAppClick} style={{ color: '#f5c442', fontWeight: 600, textDecoration: 'none' }}>App 06 38 92 25 13</a>
              </p>
            </div>
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
              {/* Honeypot: onzichtbaar voor bezoekers, bots vullen het in */}
              <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
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
              <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center' }}>
                Uw gegevens worden vertrouwelijk behandeld — zie onze <Link href="/privacy" style={{ color: '#0a5c35', fontWeight: 600 }}>privacyverklaring</Link>
              </p>
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
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Producten</p>
              {[['Thuisbatterijen', '/producten?cat=BATTERY'], ['Zonnepanelen', '/producten?cat=SOLAR'], ['Warmtepompen', '/producten?cat=HEAT_PUMP'], ['Volledig assortiment', '/producten']].map(([l, h]) => (
                <a key={l} href={h} style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 7 }}>{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Informatie</p>
              {[['Rekentools', '/rekentools'], ['Werkwijze', '#werkwijze'], ['Welk product past bij mij?', '/welk-product'], ['Contact', '#contact'], ['Privacyverklaring', '/privacy'], ['Algemene voorwaarden', '/voorwaarden']].map(([l, h]) => (
                <a key={l} href={h} style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 7 }}>{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Contact</p>
              <a href="https://wa.me/31638922513" onClick={trackWhatsAppClick} style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 7 }}>WhatsApp: 06 38 92 25 13</a>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 7 }}>Actief in heel Friesland</p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)' }}>KVK 71128174</p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland · KVK 71128174</p>
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Medewerker login</Link>
        </div>
      </div>
    </footer>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LandingPage({ products = [] }: { products?: ShopProduct[] }) {
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh', background: '#0a1410' }}>
      <Header />
      <HeroSection />
      <TrustBar />
      <FeaturedBatteries products={products} />
      <RekentoolsBand />
      <ThuisbatterijInfo />
      <Diensten />
      <Werkwijze />
      <InstallationGallery />
      {SHOW_REVIEWS && <ReviewsSection />}
      <FAQ />
      <ContactForm />
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
