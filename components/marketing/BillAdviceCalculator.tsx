'use client'

import { useState } from 'react'
import Link from 'next/link'
import { calcSystemAdvice } from '@/lib/system-advice'

const gold = '#f5c442'

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const PRODUCT_HREF: Record<string, string> = {
  SOLAR: '/producten?cat=SOLAR',
  BATTERY: '/producten?cat=BATTERY',
  HEAT_PUMP: '/producten?cat=HEAT_PUMP',
}

export default function BillAdviceCalculator() {
  const [bill, setBill] = useState(220)
  const [hasSolar, setHasSolar] = useState(false)

  const res = calcSystemAdvice({ monthlyBill: bill, hasSolar })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>

      {/* Inputs */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Uw huidige situatie
        </p>

        <label style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 8 }}>
          Wat betaalt u nu per maand aan energie?
        </label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 900, color: gold }}>{fmt(bill)}</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>/ maand</span>
        </div>
        <input
          type="range" min={80} max={600} step={10} value={bill}
          onChange={e => setBill(+e.target.value)}
          style={{ width: '100%', accentColor: gold, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          <span>€80</span><span>€600</span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, cursor: 'pointer' }}>
          <button
            type="button"
            onClick={() => setHasSolar(v => !v)}
            style={{
              width: 46, height: 26, borderRadius: 13, flexShrink: 0, position: 'relative', border: 'none', cursor: 'pointer',
              background: hasSolar ? gold : 'rgba(255,255,255,0.2)', transition: 'background 0.2s',
            }}
          >
            <span style={{ position: 'absolute', top: 3, left: hasSolar ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>Ik heb al zonnepanelen</span>
        </label>

        <div style={{ marginTop: 24, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          <p>Geschat jaarverbruik op basis van uw bedrag:</p>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            ± {res.estElecKwh.toLocaleString('nl-NL')} kWh stroom · ± {res.estGasM3.toLocaleString('nl-NL')} m³ gas
          </p>
        </div>
      </div>

      {/* Result */}
      <div>
        <div style={{ background: 'linear-gradient(160deg, rgba(245,196,66,0.12), rgba(245,196,66,0.04))', border: '1px solid rgba(245,196,66,0.3)', borderRadius: 16, padding: '26px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Geschatte besparing per jaar
          </p>
          <div style={{ fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 900, color: gold, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {fmt(res.totalLow)} – {fmt(res.totalHigh)}
          </div>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
            indicatie · u betaalt nu ± {fmt(res.annualCost)} per jaar
          </p>
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', margin: '20px 0 12px' }}>
          Aanbevolen voor uw situatie
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {res.items.map(item => (
            <Link key={item.key} href={PRODUCT_HREF[item.key]} style={{
              display: 'block', padding: '14px 16px', borderRadius: 12, textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{item.title}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: gold, whiteSpace: 'nowrap' }}>≈ {fmt(item.yearlySaving)}/jr</span>
              </div>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{item.reason}</p>
            </Link>
          ))}
          {res.items.length === 0 && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Vul uw maandbedrag in voor een persoonlijk advies.</p>
          )}
        </div>

        <Link href="/gratis-advies" style={{
          display: 'block', textAlign: 'center', marginTop: 18, padding: '13px', borderRadius: 10,
          background: gold, color: '#052e1a', fontSize: 14.5, fontWeight: 800, textDecoration: 'none',
        }}>
          Vraag een exacte berekening aan →
        </Link>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          Indicatie op basis van Nederlandse gemiddelden (stroom €0,28/kWh, gas €1,10/m³). Uw exacte besparing berekenen wij gratis op maat.
        </p>
      </div>
    </div>
  )
}
