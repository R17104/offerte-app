'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWindowWidth } from '@/lib/hooks/useWindowWidth'

import { calcBatteryAdvice, DEFAULT_ELECTRICITY_TARIFF, DEFAULT_FEEDBACK_TARIFF } from '@/lib/battery-advice'

function calcAdvice(feedbackKwh: number, kwp: number, hasHeatPump: boolean) {
  return calcBatteryAdvice({ feedbackKwh, solarKwp: kwp, hasHeatPump })
}

type Product = {
  id: string; name: string; unitPrice: number; vatRate: number
  imageUrl: string | null; category: string | null; capacityKwh: number | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
    >
      <div style={{
        width: 42, height: 24, borderRadius: 12, background: value ? '#0a5c35' : '#d1d5db',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3, width: 18, height: 18,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#374151' }}>{label}</span>
    </button>
  )
}

function SliderField({ label, hint, value, min, max, step, unit, onChange }: {
  label: string; hint?: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#0a5c35' }}>{value.toLocaleString('nl-NL')} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: '#0a5c35', height: 5, cursor: 'pointer' }}
      />
      {hint && <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3 }}>{hint}</p>}
    </div>
  )
}

export default function BatterijCheck({ products, variant = 'section' }: {
  products?: Product[]
  variant?: 'section' | 'page'
}) {
  const w = useWindowWidth()
  const isMobile = w < 768
  const [hasSolar, setHasSolar] = useState(true)
  const [feedbackKwh, setFeedbackKwh] = useState(2000)
  const [kwp, setKwp] = useState(6)
  const [hasHeatPump, setHasHeatPump] = useState(false)

  const adv = hasSolar ? calcAdvice(feedbackKwh, kwp, hasHeatPump) : null

  // Match products to recommended size
  const matchingProducts = products?.filter(p =>
    p.category === 'BATTERY' && p.capacityKwh != null &&
    adv && p.capacityKwh >= adv.recommended * 0.9 && p.capacityKwh <= adv.recommended * 1.4
  ).slice(0, 2) ?? []

  const inputStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18 }
  const isPage = variant === 'page'

  const inner = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: (isPage || isMobile) ? '1fr' : '1fr 1fr',
      gap: 'clamp(20px, 3vw, 40px)',
      alignItems: 'start',
    }}>

      {/* ── Left: Inputs ── */}
      <div style={inputStyle}>
        <div>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
            Uw situatie
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>
            Vul uw gegevens in — de aanbeveling wordt direct berekend.
          </p>
        </div>

        <Toggle label="Ik heb zonnepanelen" value={hasSolar} onChange={setHasSolar} />

        {hasSolar && (
          <>
            <SliderField
              label="Jaarlijkse teruglevering aan het net"
              hint="Staat op uw energienota of in de app van uw energiebedrijf"
              value={feedbackKwh} min={200} max={20000} step={100} unit="kWh/jaar"
              onChange={setFeedbackKwh}
            />
            <SliderField
              label="Paneelvermogen"
              hint="Staat op uw installatiedocument (bijv. 10x 400Wp = 4,0 kWp)"
              value={kwp} min={1} max={20} step={0.5} unit="kWp"
              onChange={setKwp}
            />
            <Toggle label="Ik heb ook een warmtepomp" value={hasHeatPump} onChange={setHasHeatPump} />
          </>
        )}

        {!hasSolar && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#92400e', marginBottom: 5 }}>💡 Combineer solar + batterij</p>
            <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
              Een thuisbatterij is het meest rendabel in combinatie met zonnepanelen. Wij installeren graag een compleet pakket.
            </p>
            <Link href="/gratis-advies" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 700, color: '#0a5c35', textDecoration: 'none' }}>
              Vraag een combinatieofferte aan →
            </Link>
          </div>
        )}
      </div>

      {/* ── Right: Result ── */}
      <div>
        {adv ? (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 16, padding: 'clamp(18px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Main result */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Aanbevolen batterijcapaciteit</p>
                <div style={{ fontSize: 'clamp(36px,5vw,52px)', fontWeight: 900, color: '#052e1a', lineHeight: 1 }}>
                  {adv.recommended} <span style={{ fontSize: '40%', fontWeight: 700, color: '#0a5c35' }}>kWh</span>
                </div>
                <p style={{ fontSize: 13, color: '#4b7c5e', marginTop: 6 }}>
                  ≈ <strong style={{ color: '#052e1a' }}>€{adv.annualSavings}/jaar</strong> extra besparing
                </p>
              </div>
              <div style={{ background: '#0a5c35', borderRadius: 12, padding: '10px 14px', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f5c442', lineHeight: 1 }}>🔋</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alpha ESS</div>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Berekening</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { label: 'Gemiddeld dagelijks overschot', value: `${adv.dailySurplusAvg} kWh/dag` },
                  { label: 'Zomers dagoverschot (basis)', value: `${adv.summerDailySurplus} kWh/dag` },
                  ...(adv.heatPumpExtra > 0 ? [{ label: 'Warmtepomp toeslag', value: `+${adv.heatPumpExtra} kWh` }] : []),
                  ...(adv.kwpExtra > 0 ? [{ label: `Paneelvermogen toeslag (${kwp} kWp)`, value: `+${adv.kwpExtra} kWh` }] : []),
                  { label: 'Minimaal benodigde capaciteit', value: `${adv.baseKwh} kWh` },
                  { label: 'Aanbevolen Alpha ESS maat', value: `→ ${adv.recommended} kWh`, bold: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: row.bold ? 800 : 600, color: row.bold ? '#0a5c35' : '#374151', whiteSpace: 'nowrap' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings detail */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0a5c35' }}>€{adv.annualSavings}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>besparing per jaar</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0a5c35' }}>{adv.absorbableKwh} kWh</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>meer zelfverbruik/jaar</div>
              </div>
            </div>

            {/* Matching products */}
            {matchingProducts.length > 0 && (
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7280', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Passende producten</p>
                {matchingProducts.map(p => (
                  <Link key={p.id} href={`/producten/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 6, textDecoration: 'none' }}>
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, background: '#f9fafb' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                      <p style={{ fontSize: 11.5, color: '#6b7280' }}>{p.capacityKwh} kWh · {fmt(p.unitPrice * (1 + p.vatRate / 100))}</p>
                    </div>
                    <span style={{ fontSize: 12, color: '#0a5c35', fontWeight: 700, flexShrink: 0 }}>Meer info →</span>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA */}
            <Link
              href={`/gratis-advies?product=Batterij+${adv.recommended}+kWh`}
              style={{ display: 'block', textAlign: 'center', padding: '13px 20px', borderRadius: 10, background: '#0a5c35', color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}
            >
              Offerte aanvragen voor {adv.recommended} kWh batterij →
            </Link>

            <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
              Op basis van €{DEFAULT_ELECTRICITY_TARIFF}/kWh inkooptarief en €{DEFAULT_FEEDBACK_TARIFF}/kWh teruglevertarief (na salderingsafbouw 2027). Niet meegenomen: dakoriëntatie, schaduw, EV-laden.
            </p>
          </div>
        ) : (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 16, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🔋</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Vul uw gegevens in</p>
            <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6 }}>
              Verschuif de sliders om direct te zien welke batterij het beste bij uw situatie past.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  if (variant === 'page') return inner

  return (
    <section style={{ background: '#fff', padding: 'clamp(48px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid #f3f4f6' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Gratis advies</span>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, color: '#111827', marginTop: 8, letterSpacing: '-0.02em' }}>
            Welke batterijmaat past bij u?
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', marginTop: 6 }}>
            Gebaseerd op uw teruglevering — dezelfde berekening die wij in onze offertes gebruiken.
          </p>
        </div>
        {inner}
      </div>
    </section>
  )
}
