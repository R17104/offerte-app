'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'

type Product = {
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
}

type Answers = {
  doel?: 'besparen' | 'noodstroom' | 'beiden'
  solar?: 'ja' | 'nee'
  kwh?: number
  budget?: 'klein' | 'midden' | 'groot' | 'geen'
}

const CAT: Record<string, { label: string; icon: string }> = {
  BATTERY:         { label: 'Thuisbatterij', icon: '🔋' },
  SOLAR:           { label: 'Zonnepanelen',  icon: '☀️' },
  HEAT_PUMP:       { label: 'Warmtepomp',    icon: '🌡️' },
  CHARGER:         { label: 'Laadpaal',      icon: '⚡' },
  EMERGENCY_POWER: { label: 'Noodstroom',    icon: '🔌' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

function scoreProduct(p: Product, a: Answers): number {
  let score = 0
  const inclPrice = p.unitPrice * (1 + (p.vatRate || 21) / 100)

  if (a.doel === 'noodstroom') {
    if (p.category === 'EMERGENCY_POWER') score += 50
    if (p.category === 'BATTERY') score += 20
  } else if (a.doel === 'besparen') {
    if (p.category === 'BATTERY') score += 50
    if (p.category === 'SOLAR') score += a.solar === 'nee' ? 40 : 10
  } else if (a.doel === 'beiden') {
    if (p.category === 'BATTERY') score += 40
    if (p.category === 'EMERGENCY_POWER') score += 30
  }

  if (a.budget === 'klein'  && inclPrice < 2000) score += 20
  if (a.budget === 'midden' && inclPrice >= 2000 && inclPrice < 6000) score += 20
  if (a.budget === 'groot'  && inclPrice >= 4000) score += 20
  if (a.budget === 'geen')  score += 10

  if (a.kwh && a.kwh >= 4000 && p.capacityKwh && p.capacityKwh >= 6) score += 15
  if (a.kwh && a.kwh < 3000  && p.capacityKwh && p.capacityKwh <= 4) score += 15

  return score
}

function OptionBtn({ label, desc, icon, selected, onClick }: { label: string; desc?: string; icon?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 16px', borderRadius: 12, border: `2px solid ${selected ? '#0a5c35' : '#e5e7eb'}`,
        background: selected ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s', fontFamily: 'inherit', width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#0a5c35' : '#111827' }}>{label}</div>
          {desc && <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>{desc}</div>}
        </div>
        {selected && <span style={{ marginLeft: 'auto', color: '#0a5c35', fontSize: 18 }}>✓</span>}
      </div>
    </button>
  )
}

const STEPS = ['Uw doel', 'Zonnepanelen', 'Stroomverbruik', 'Budget']

export default function ProductQuiz({ products }: { products: Product[] }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [done, setDone] = useState(false)

  function set<K extends keyof Answers>(k: K, v: Answers[K]) {
    setAnswers(a => ({ ...a, [k]: v }))
  }

  const results = done
    ? products
        .map(p => ({ p, score: scoreProduct(p, answers) }))
        .filter(x => x.score > 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(x => x.p)
    : []

  function finish() { setDone(true) }

  function restart() { setStep(0); setAnswers({}); setDone(false) }

  const canNext = [
    !!answers.doel,
    !!answers.solar,
    !!answers.kwh,
    !!answers.budget,
  ]

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo-bespaarhulp.png" alt="Bespaarhulp Friesland" width={82} height={46} priority style={{ display: 'block' }} />
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/producten" style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '7px 14px' }}>Alle producten</Link>
            <Link href="/gratis-advies" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#0a5c35', padding: '7px 16px', borderRadius: 8, textDecoration: 'none' }}>Gratis advies</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,32px)' }}>

        {!done ? (
          <>
            {/* Progress */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                {STEPS.map((s, i) => (
                  <span key={s} style={{ fontSize: 12, fontWeight: i === step ? 700 : 400, color: i === step ? '#0a5c35' : i < step ? '#9ca3af' : '#d1d5db' }}>
                    {i < step ? '✓ ' : ''}{s}
                  </span>
                ))}
              </div>
              <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: '#0a5c35', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Step content */}
            {step === 0 && (
              <div>
                <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Wat is uw voornaamste doel?</h1>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Wij selecteren de beste producten voor uw situatie.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <OptionBtn icon="💰" label="Energierekening verlagen" desc="Meer zelfverbruik, minder teruglevering" selected={answers.doel === 'besparen'} onClick={() => set('doel', 'besparen')} />
                  <OptionBtn icon="🔌" label="Noodstroom bij stroomuitval" desc="Kritische apparaten altijd van stroom voorzien" selected={answers.doel === 'noodstroom'} onClick={() => set('doel', 'noodstroom')} />
                  <OptionBtn icon="⚡" label="Beide — besparen én noodstroom" desc="Complete energieonafhankelijkheid" selected={answers.doel === 'beiden'} onClick={() => set('doel', 'beiden')} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Heeft u al zonnepanelen?</h1>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Dit bepaalt welk type batterij het meest geschikt is.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <OptionBtn icon="☀️" label="Ja, ik heb zonnepanelen" desc="Een batterij verhoogt uw zelfverbruik sterk" selected={answers.solar === 'ja'} onClick={() => set('solar', 'ja')} />
                  <OptionBtn icon="🏠" label="Nee, nog geen zonnepanelen" desc="We kunnen solar + batterij combineren" selected={answers.solar === 'nee'} onClick={() => set('solar', 'nee')} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Wat is uw jaarlijks stroomverbruik?</h1>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Kijk op uw energienota of schat het in (gemiddeld NL gezin: 3.500 kWh).</p>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>Jaarverbruik</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#0a5c35' }}>{(answers.kwh ?? 3500).toLocaleString('nl-NL')} kWh</span>
                  </div>
                  <input
                    type="range" min={1000} max={8000} step={100}
                    value={answers.kwh ?? 3500}
                    onChange={e => set('kwh', +e.target.value)}
                    style={{ width: '100%', accentColor: '#0a5c35', height: 6 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                    <span>1-persoons (1.000 kWh)</span><span>Groot gezin (8.000 kWh)</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
                  {[{ label: 'Klein gezin', kwh: 2000 }, { label: 'Gemiddeld', kwh: 3500 }, { label: 'Groot gezin', kwh: 5500 }].map(o => (
                    <button key={o.kwh} onClick={() => set('kwh', o.kwh)} style={{ padding: '8px 4px', borderRadius: 8, border: `1.5px solid ${answers.kwh === o.kwh ? '#0a5c35' : '#e5e7eb'}`, background: answers.kwh === o.kwh ? '#f0fdf4' : '#fff', fontSize: 12.5, fontWeight: 600, color: answers.kwh === o.kwh ? '#0a5c35' : '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {o.label}<br /><span style={{ fontWeight: 400, fontSize: 11.5 }}>{o.kwh.toLocaleString('nl-NL')} kWh</span>
                    </button>
                  ))}
                </div>
                {!answers.kwh && (
                  <p style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 10 }}>Versleep de slider of kies een profiel hierboven.</p>
                )}
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Wat is uw indicatieve budget?</h1>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Inclusief installatie. Subsidies worden verrekend.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <OptionBtn label="Tot € 2.000" desc="Starterspakket of losse module" selected={answers.budget === 'klein'} onClick={() => set('budget', 'klein')} />
                  <OptionBtn label="€ 2.000 – € 6.000" desc="Compleet thuisbatterij systeem" selected={answers.budget === 'midden'} onClick={() => set('budget', 'midden')} />
                  <OptionBtn label="€ 6.000 of meer" desc="Groot systeem of combinatie met solar" selected={answers.budget === 'groot'} onClick={() => set('budget', 'groot')} />
                  <OptionBtn label="Geen voorkeur" desc="Toon mij de beste optie ongeacht prijs" selected={answers.budget === 'geen'} onClick={() => set('budget', 'geen')} />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : undefined}
                style={{ fontSize: 13.5, color: step > 0 ? '#6b7280' : '#d1d5db', background: 'none', border: 'none', cursor: step > 0 ? 'pointer' : 'default', fontFamily: 'inherit', padding: '8px 0' }}
              >
                ← Vorige
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => canNext[step] && setStep(s => s + 1)}
                  disabled={!canNext[step]}
                  style={{ padding: '12px 28px', borderRadius: 10, background: canNext[step] ? '#0a5c35' : '#e5e7eb', color: canNext[step] ? '#fff' : '#9ca3af', fontSize: 14, fontWeight: 700, border: 'none', cursor: canNext[step] ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                >
                  Volgende →
                </button>
              ) : (
                <button
                  onClick={() => canNext[step] && finish()}
                  disabled={!canNext[step]}
                  style={{ padding: '12px 28px', borderRadius: 10, background: canNext[step] ? '#0a5c35' : '#e5e7eb', color: canNext[step] ? '#fff' : '#9ca3af', fontSize: 14, fontWeight: 700, border: 'none', cursor: canNext[step] ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                >
                  Bekijk aanbeveling →
                </button>
              )}
            </div>
          </>
        ) : (
          /* Results */
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #0a5c35', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>✓</div>
              <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 900, color: '#111827', marginBottom: 8, letterSpacing: '-0.02em' }}>Uw persoonlijk advies</h1>
              <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.65 }}>
                Op basis van uw antwoorden raden wij de volgende producten aan.
                {answers.doel === 'besparen' && answers.solar === 'ja' && ' Een thuisbatterij maximaliseert uw zelfverbruik van zonnestroom.'}
                {answers.doel === 'besparen' && answers.solar === 'nee' && ' Combineer zonnepanelen met een batterij voor maximale besparing.'}
                {answers.doel === 'noodstroom' && ' Een backup-systeem houdt uw huis draaiende bij stroomuitval.'}
                {answers.doel === 'beiden' && ' Een compleet systeem biedt zowel besparing als noodstroom.'}
              </p>
            </div>

            {results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {results.map((p, i) => {
                  const cat = CAT[p.category ?? '']
                  const inclPrice = p.unitPrice * (1 + p.vatRate / 100)
                  return (
                    <div key={p.id} style={{ display: 'flex', gap: 14, padding: 16, borderRadius: 14, border: `2px solid ${i === 0 ? '#0a5c35' : '#e5e7eb'}`, background: i === 0 ? '#f0fdf4' : '#fff', alignItems: 'center' }}>
                      {i === 0 && <span style={{ position: 'absolute', marginTop: -36, marginLeft: -2 }} />}
                      <div style={{ width: 70, height: 70, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{cat?.icon ?? '📦'}</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {i === 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', background: '#dcfce7', padding: '2px 8px', borderRadius: 20, marginBottom: 5, display: 'inline-block' }}>Beste match</span>}
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{p.name}</p>
                        {cat && <p style={{ fontSize: 12, color: '#6b7280' }}>{cat.icon} {cat.label}</p>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{fmt(inclPrice)}</div>
                        <Link href={`/producten/${p.id}`} style={{ fontSize: 12.5, color: '#0a5c35', fontWeight: 700, textDecoration: 'none' }}>Meer info →</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>
                <p style={{ marginBottom: 16 }}>We adviseren u graag persoonlijk.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/gratis-advies" style={{ display: 'block', textAlign: 'center', padding: '13px 20px', borderRadius: 10, background: '#0a5c35', color: '#fff', fontSize: 14.5, fontWeight: 800, textDecoration: 'none' }}>
                Gratis persoonlijk adviesgesprek aanvragen →
              </Link>
              <Link href="/producten" style={{ display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 10, border: '1px solid #d1d5db', color: '#374151', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
                Bekijk alle producten
              </Link>
              <button onClick={restart} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 0' }}>
                Quiz opnieuw doen
              </button>
            </div>
          </div>
        )}
      </div>

      <WhatsAppButton />
    </div>
  )
}
