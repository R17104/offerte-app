'use client'

import { useState } from 'react'
import { estimateEnergyUsage } from '@/lib/savings'

export type EnergyState = {
  quoteType: 'EIGEN_INVESTERING' | 'GEFINANCIERD'
  financingType: string
  loanInterestRate: number
  loanTermYears: number
  subsidyAmount: number
  hasBtwReturn: boolean
  hasSolarPanels: boolean
  solarProductionKwh: string
  electricityUsageKwh: string
  electricityFeedbackKwh: string
  gasUsageM3: string
  electricityTariff: string
  feedbackTariff: string
  gasTariff: string
  feedInCostTariff: string
  emsAnnualRevenueEur: string
  numPersons: string
  houseType: string
  buildYear: string
  houseSizeSqm: string
}

export const DEFAULT_ENERGY_STATE: EnergyState = {
  quoteType: 'EIGEN_INVESTERING',
  financingType: '',
  loanInterestRate: 3,
  loanTermYears: 10,
  subsidyAmount: 0,
  hasBtwReturn: false,
  hasSolarPanels: false,
  solarProductionKwh: '',
  electricityUsageKwh: '',
  electricityFeedbackKwh: '',
  gasUsageM3: '',
  electricityTariff: '0.28',
  feedbackTariff: '0.07',
  gasTariff: '1.10',
  feedInCostTariff: '0.02',
  emsAnnualRevenueEur: '0',
  numPersons: '',
  houseType: '',
  buildYear: '',
  houseSizeSqm: '',
}

interface Props {
  state: EnergyState
  onChange: (patch: Partial<EnergyState>) => void
}

const s = {
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 20px',
  },
  cardTitle: { fontWeight: 600, fontSize: 13.5, marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 },
  hint: { fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 },
  input: {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 10px',
    color: 'var(--text-primary)',
    fontSize: 13.5,
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box' as const,
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as React.CSSProperties,
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 } as React.CSSProperties,
  row4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 } as React.CSSProperties,
  typeBtn: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: active ? '2px solid var(--accent)' : '1px solid var(--border-strong)',
    background: active ? 'var(--accent-muted)' : 'var(--bg-elevated)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    textAlign: 'left' as const,
  }),
}

export default function EnergyProfileSection({ state, onChange }: Props) {
  const [inputMode, setInputMode] = useState<'estimate' | 'manual'>('manual')

  function runEstimate() {
    if (!state.numPersons || !state.houseType || !state.buildYear) return
    const result = estimateEnergyUsage({
      numPersons: parseInt(state.numPersons),
      houseType: state.houseType as 'TERRACED' | 'CORNER' | 'DETACHED' | 'APARTMENT',
      buildYear: parseInt(state.buildYear),
      houseSizeSqm: state.houseSizeSqm ? parseInt(state.houseSizeSqm) : 100,
    })
    onChange({
      electricityUsageKwh: String(result.electricityUsageKwh),
      gasUsageM3: String(result.gasUsageM3),
    })
    setInputMode('manual')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Type offerte */}
      <div style={s.card}>
        <p style={s.cardTitle}>Type offerte</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" style={s.typeBtn(state.quoteType === 'EIGEN_INVESTERING')}
            onClick={() => onChange({ quoteType: 'EIGEN_INVESTERING' })}>
            <div style={{ fontSize: 15, marginBottom: 2 }}>💰</div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Eigen investering</div>
            <div style={{ fontSize: 11.5, opacity: 0.8 }}>Klant betaalt zelf — terugverdientijd centraal</div>
          </button>
          <button type="button" style={s.typeBtn(state.quoteType === 'GEFINANCIERD')}
            onClick={() => onChange({ quoteType: 'GEFINANCIERD' })}>
            <div style={{ fontSize: 15, marginBottom: 2 }}>🏦</div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Gefinancierd</div>
            <div style={{ fontSize: 11.5, opacity: 0.8 }}>Warmtefonds / SVn — voordeel vanaf dag 1</div>
          </button>
        </div>
      </div>

      {/* Financieringsdetails */}
      {state.quoteType === 'GEFINANCIERD' && (
        <div style={s.card}>
          <p style={s.cardTitle}>Financieringsdetails</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={s.row2}>
              <div>
                <label style={s.label}>Financieringsvorm</label>
                <select
                  value={state.financingType}
                  onChange={(e) => onChange({ financingType: e.target.value })}
                  style={{ ...s.input, appearance: 'none' }}
                >
                  <option value="">— Kies —</option>
                  <option value="WARMTEFONDS">Nationaal Warmtefonds</option>
                  <option value="SVN">SVn Duurzaamheidslening</option>
                  <option value="BANK">Bancaire lening</option>
                  <option value="OVERIG">Overig</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Rente (% per jaar)</label>
                <input type="number" min="0" max="20" step="0.1"
                  value={state.loanInterestRate}
                  onChange={(e) => onChange({ loanInterestRate: parseFloat(e.target.value) || 0 })}
                  style={s.input} />
              </div>
            </div>
            <div style={s.row3}>
              <div>
                <label style={s.label}>Looptijd (jaar)</label>
                <input type="number" min="1" max="30" step="1"
                  value={state.loanTermYears}
                  onChange={(e) => onChange({ loanTermYears: parseInt(e.target.value) || 10 })}
                  style={s.input} />
              </div>
              <div>
                <label style={s.label}>Subsidie / teruggave (€)</label>
                <input type="number" min="0" step="1" placeholder="0"
                  value={state.subsidyAmount || ''}
                  onChange={(e) => onChange({ subsidyAmount: parseFloat(e.target.value) || 0 })}
                  style={s.input} />
                <p style={s.hint}>BTW-teruggave of andere subsidie</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox"
                    checked={state.hasBtwReturn}
                    onChange={(e) => onChange({ hasBtwReturn: e.target.checked })}
                    style={{ width: 15, height: 15, accentColor: 'var(--accent)' }} />
                  BTW-teruggave van toepassing
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Energieprofiel */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ ...s.cardTitle, margin: 0 }}>Energieprofiel klant</p>
          <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
            {(['manual', 'estimate'] as const).map((m) => (
              <button key={m} type="button"
                onClick={() => setInputMode(m)}
                style={{
                  padding: '5px 12px',
                  fontSize: 12,
                  background: inputMode === m ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: inputMode === m ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}>
                {m === 'manual' ? 'Handmatig' : 'Schatting'}
              </button>
            ))}
          </div>
        </div>

        {inputMode === 'estimate' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={s.row2}>
              <div>
                <label style={s.label}>Aantal personen</label>
                <input type="number" min="1" max="10"
                  value={state.numPersons}
                  onChange={(e) => onChange({ numPersons: e.target.value })}
                  placeholder="3" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Type woning</label>
                <select value={state.houseType}
                  onChange={(e) => onChange({ houseType: e.target.value })}
                  style={{ ...s.input, appearance: 'none' }}>
                  <option value="">— Kies —</option>
                  <option value="APARTMENT">Appartement</option>
                  <option value="TERRACED">Tussenwoning</option>
                  <option value="CORNER">Hoekwoning</option>
                  <option value="DETACHED">Vrijstaand</option>
                </select>
              </div>
            </div>
            <div style={s.row2}>
              <div>
                <label style={s.label}>Bouwjaar</label>
                <input type="number" min="1900" max="2025"
                  value={state.buildYear}
                  onChange={(e) => onChange({ buildYear: e.target.value })}
                  placeholder="1995" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Woonoppervlak (m²)</label>
                <input type="number" min="20" max="1000"
                  value={state.houseSizeSqm}
                  onChange={(e) => onChange({ houseSizeSqm: e.target.value })}
                  placeholder="120" style={s.input} />
              </div>
            </div>
            <button type="button" onClick={runEstimate}
              style={{
                padding: '9px 16px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13.5,
                fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                alignSelf: 'flex-start',
              }}>
              Schatting berekenen →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Zonnepanelen toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 500 }}>
              <input type="checkbox"
                checked={state.hasSolarPanels}
                onChange={(e) => onChange({ hasSolarPanels: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
              Klant heeft al zonnepanelen
            </label>

            <div style={state.hasSolarPanels ? s.row3 : s.row2}>
              <div>
                <label style={s.label}>Stroomverbruik (kWh/jaar)</label>
                <input type="number" min="0" step="100"
                  value={state.electricityUsageKwh}
                  onChange={(e) => onChange({ electricityUsageKwh: e.target.value })}
                  placeholder="3200" style={s.input} />
              </div>
              {state.hasSolarPanels && (
                <div>
                  <label style={s.label}>Zonne-opwek (kWh/jaar)</label>
                  <input type="number" min="0" step="100"
                    value={state.solarProductionKwh}
                    onChange={(e) => onChange({ solarProductionKwh: e.target.value })}
                    placeholder="4200" style={s.input} />
                </div>
              )}
              {state.hasSolarPanels && (
                <div>
                  <label style={s.label}>Teruglevering (kWh/jaar)</label>
                  <input type="number" min="0" step="100"
                    value={state.electricityFeedbackKwh}
                    onChange={(e) => onChange({ electricityFeedbackKwh: e.target.value })}
                    placeholder="2100" style={s.input} />
                  <p style={s.hint}>Stroom die nu naar het net gaat</p>
                </div>
              )}
            </div>
            <div>
              <label style={s.label}>Gasverbruik (m³/jaar)</label>
              <input type="number" min="0" step="100"
                value={state.gasUsageM3}
                onChange={(e) => onChange({ gasUsageM3: e.target.value })}
                placeholder="1400" style={{ ...s.input, maxWidth: 200 }} />
            </div>
          </div>
        )}
      </div>

      {/* Tarieven */}
      <div style={s.card}>
        <p style={s.cardTitle}>Energietarieven</p>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14, marginTop: -8 }}>
          Standaardwaarden — pas aan per klant indien nodig
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={s.row3}>
            <div>
              <label style={s.label}>Stroomprijs (€/kWh)</label>
              <input type="number" min="0" step="0.01"
                value={state.electricityTariff}
                onChange={(e) => onChange({ electricityTariff: e.target.value })}
                style={s.input} />
            </div>
            <div>
              <label style={s.label}>Teruglevertarief na 2027 (€/kWh)</label>
              <input type="number" min="0" step="0.01"
                value={state.feedbackTariff}
                onChange={(e) => onChange({ feedbackTariff: e.target.value })}
                style={s.input} />
              <p style={s.hint}>Saldering vervalt volledig in 2027</p>
            </div>
            <div>
              <label style={s.label}>Gasprijs (€/m³)</label>
              <input type="number" min="0" step="0.01"
                value={state.gasTariff}
                onChange={(e) => onChange({ gasTariff: e.target.value })}
                style={s.input} />
            </div>
          </div>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Terugleverkosten leverancier (€/kWh)</label>
              <input type="number" min="0" step="0.005"
                value={state.feedInCostTariff}
                onChange={(e) => onChange({ feedInCostTariff: e.target.value })}
                style={s.input} />
              <p style={s.hint}>Kosten die leverancier rekent voor teruglevering aan het net</p>
            </div>
            <div>
              <label style={s.label}>EMS / onbalansmarkt opbrengst (€/jaar)</label>
              <input type="number" min="0" step="50"
                value={state.emsAnnualRevenueEur}
                onChange={(e) => onChange({ emsAnnualRevenueEur: e.target.value })}
                style={s.input} />
              <p style={s.hint}>Alpha ESS EMS handelt automatisch — schat in op basis van batterijgrootte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
