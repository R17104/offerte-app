'use client'

import { useState, useEffect } from 'react'
import { estimateEnergyUsage } from '@/lib/savings'

export type EnergyState = {
  quoteType: 'EIGEN_INVESTERING' | 'GEFINANCIERD'
  financingType: string
  loanInterestRate: number
  loanTermYears: number
  subsidyAmount: number
  hasBtwReturn: boolean
  hasSolarPanels: boolean
  solarPanelKwp: string
  solarProductionKwh: string
  electricityUsageKwh: string
  electricityFeedbackKwh: string
  gasUsageM3: string
  electricityTariff: string
  feedbackTariff: string
  gasTariff: string
  feedInCostTariff: string
  hasHeatPump: boolean
  emsAnnualRevenueEur: string
  currentMonthlyBill: string
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
  solarPanelKwp: '',
  solarProductionKwh: '',
  electricityUsageKwh: '',
  electricityFeedbackKwh: '',
  gasUsageM3: '',
  electricityTariff: '0.28',
  feedbackTariff: '0.07',
  gasTariff: '1.10',
  feedInCostTariff: '0.02',
  hasHeatPump: false,
  emsAnnualRevenueEur: '0',
  currentMonthlyBill: '0',
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

const ALPHA_SIZES = [5.9, 9.3, 11.8, 18.6]

function calcBatteryAdvice(state: EnergyState) {
  const feedbackKwh = parseFloat(state.electricityFeedbackKwh) || 0
  const solarKwh    = parseFloat(state.solarProductionKwh) || 0
  const usageKwh    = parseFloat(state.electricityUsageKwh) || 0
  const kwp         = parseFloat(state.solarPanelKwp) || 0

  if (!state.hasSolarPanels || feedbackKwh <= 0 || solarKwh <= 0) return null

  // Average daily surplus (full year)
  const dailySurplusAvg = feedbackKwh / 365

  // Summer accounts for ~65% of annual feedback, spread over 182 days
  const summerDailySurplus = (feedbackKwh * 0.65) / 182

  // Base recommendation: store a typical summer day's surplus
  let baseKwh = summerDailySurplus

  // Heat pump: adds evening/morning load that battery can serve → needs more capacity
  const heatPumpExtra = state.hasHeatPump ? 2.5 : 0
  baseKwh += heatPumpExtra

  // High kWp → fast charge, more instantaneous power → need larger buffer
  let kwpExtra = 0
  if (kwp >= 8) { kwpExtra = kwp * 0.15; baseKwh = Math.max(baseKwh, kwp * 1.2) }
  else if (kwp >= 5) { kwpExtra = kwp * 0.1; baseKwh = Math.max(baseKwh, kwp * 1.0) }

  // Minimum viable battery
  baseKwh = Math.max(4, baseKwh)

  const recommended = ALPHA_SIZES.find((s) => s >= baseKwh) ?? 18.6

  // Self-use gain: the amount of feedback we can now use ourselves instead of selling cheap
  // Assume battery absorbs ~85% of daily feedback (limited by battery size vs surplus)
  const absorbable = Math.min(recommended * 365 * 0.9, feedbackKwh * 0.85)
  const tariffDiff = (parseFloat(state.electricityTariff) || 0.28) - (parseFloat(state.feedbackTariff) || 0.07)
  const annualSavings = Math.round(absorbable * tariffDiff)

  return {
    feedbackKwh,
    solarKwh,
    usageKwh,
    kwp,
    dailySurplusAvg: Math.round(dailySurplusAvg * 10) / 10,
    summerDailySurplus: Math.round(summerDailySurplus * 10) / 10,
    heatPumpExtra,
    kwpExtra: Math.round(kwpExtra * 10) / 10,
    baseKwh: Math.round(baseKwh * 10) / 10,
    recommended,
    annualSavings,
    selfUseKwh: Math.round(absorbable),
  }
}

function BatteryAdvice({ state }: { state: EnergyState }) {
  const adv = calcBatteryAdvice(state)
  if (!adv) return null

  const row = (label: string, value: string, sub?: string) => (
    <tr key={label}>
      <td style={{ paddingBottom: 6, paddingRight: 16, fontSize: 13, color: 'var(--text-secondary)', verticalAlign: 'top' }}>{label}</td>
      <td style={{ paddingBottom: 6, fontSize: 13, fontWeight: 600, verticalAlign: 'top' }}>
        {value}
        {sub && <span style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 6 }}>{sub}</span>}
      </td>
    </tr>
  )

  return (
    <div style={{
      background: 'rgba(10,92,53,0.06)',
      border: '1.5px solid rgba(10,92,53,0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)', margin: '0 0 2px' }}>Batterijadvies</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>Op basis van het ingevulde energieprofiel</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{adv.recommended} kWh</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>aanbevolen batterijcapaciteit</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2563eb', marginTop: 4 }}>≈ €{adv.annualSavings}/jaar extra besparing</div>
        </div>
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid rgba(10,92,53,0.15)', paddingTop: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Berekening</p>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {row('Gemiddeld dagelijks overschot', `${adv.dailySurplusAvg} kWh/dag`, `(${adv.feedbackKwh} kWh/jaar ÷ 365)`)}
            {row('Zomers dagelijks overschot', `${adv.summerDailySurplus} kWh/dag`, '(65% van jaaropbrengst in ~182 zomerdagen)')}
            {row('Startpunt berekening', `${adv.summerDailySurplus} kWh`, 'zomerse piekopwek bepaalt minimale capaciteit')}
            {adv.heatPumpExtra > 0 && row('Warmtepomp toeslag', `+${adv.heatPumpExtra} kWh`, 'verschuiving warmtevraag naar zonne-uren')}
            {adv.kwp > 0 && adv.kwpExtra > 0 && row(`Hoog vermogen (${adv.kwp} kWp)`, `+${adv.kwpExtra} kWh`, 'snelle laadpiek vraagt grotere buffer')}
            {row('Minimaal benodigde capaciteit', `${adv.baseKwh} kWh`, '')}
            {row('Aanbevolen Alpha ESS maat', `${adv.recommended} kWh`, `naaste beschikbare grootte ≥ ${adv.baseKwh} kWh`)}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, background: 'rgba(10,92,53,0.04)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
          <strong>Toelichting:</strong> Met {adv.recommended} kWh batterij kan de klant circa {adv.selfUseKwh} kWh/jaar meer zelf gebruiken
          in plaats van terug te leveren tegen {parseFloat(state.feedbackTariff) || 0.07}€/kWh.
          Dit levert een tariffsverschil op van €{Math.round(((parseFloat(state.electricityTariff) || 0.28) - (parseFloat(state.feedbackTariff) || 0.07)) * 100) / 100}/kWh,
          dus circa €{adv.annualSavings}/jaar{state.hasHeatPump ? ' (inclusief warmtepomp-toeslag)' : ''}.
          {adv.kwp >= 8 ? ` Door het hoge paneelvermogen (${adv.kwp} kWp) is een grotere batterij nodig om de piekopwek volledig te bufferen.` : ''}
        </p>
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '10px 0 0', fontStyle: 'italic' }}>
        Niet meegenomen: dakoriëntatie, schaduw, EV-laden thuis, of dynamisch verbruikspatroon.
        Beschouw dit als een eerste indicatie.
      </p>
    </div>
  )
}

export default function EnergyProfileSection({ state, onChange }: Props) {
  const [inputMode, setInputMode] = useState<'estimate' | 'manual'>('manual')
  const [billManuallyEdited, setBillManuallyEdited] = useState(false)

  useEffect(() => {
    if (billManuallyEdited) return
    const usage    = parseFloat(state.electricityUsageKwh) || 0
    const solar    = parseFloat(state.solarProductionKwh) || 0
    const tariff   = parseFloat(state.electricityTariff) || 0.28
    const gas      = parseFloat(state.gasUsageM3) || 0
    const gasTariff = parseFloat(state.gasTariff) || 1.10
    if (usage === 0 && gas === 0) return
    const feedback    = parseFloat(state.electricityFeedbackKwh) || 0
    const feedInCost  = parseFloat(state.feedInCostTariff) || 0
    const netElec = Math.max(0, usage - (state.hasSolarPanels ? solar : 0))
    const monthly = Math.round(netElec * tariff / 12 + gas * gasTariff / 12 + feedback * feedInCost / 12)
    onChange({ currentMonthlyBill: String(monthly) })
  }, [state.electricityUsageKwh, state.solarProductionKwh, state.electricityTariff, state.gasUsageM3, state.gasTariff, state.hasSolarPanels, state.electricityFeedbackKwh, state.feedInCostTariff, billManuallyEdited])

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
            {/* Huidig termijnbedrag — altijd zichtbaar, auto-berekend */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...s.label, fontSize: 13.5, fontWeight: 700, margin: 0 }}>
                  Huidig maandelijks termijnbedrag klant (€)
                </label>
                {billManuallyEdited && (
                  <button type="button" onClick={() => setBillManuallyEdited(false)}
                    style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}>
                    ↺ auto
                  </button>
                )}
              </div>
              <input type="number" min="0" step="any"
                value={state.currentMonthlyBill}
                onChange={(e) => { setBillManuallyEdited(true); onChange({ currentMonthlyBill: e.target.value }) }}
                placeholder="150"
                style={{ ...s.input }} />
              <p style={s.hint}>
                {billManuallyEdited
                  ? 'Handmatig ingevuld — klik "↺ auto" om terug te gaan naar automatische berekening.'
                  : 'Automatisch berekend op basis van verbruik en tarieven. Klik het veld om handmatig aan te passen.'}
              </p>
            </div>

            {/* Situatie klant */}
            <div style={{ display: 'flex', gap: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 500 }}>
                <input type="checkbox"
                  checked={state.hasSolarPanels}
                  onChange={(e) => onChange({ hasSolarPanels: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                Klant heeft al zonnepanelen
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 500 }}>
                <input type="checkbox"
                  checked={state.hasHeatPump}
                  onChange={(e) => onChange({ hasHeatPump: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                Klant heeft al een warmtepomp
              </label>
            </div>

            <div style={state.hasSolarPanels ? s.row4 : s.row2}>
              <div>
                <label style={s.label}>Stroomverbruik (kWh/jaar)</label>
                <input type="number" min="0" step="any"
                  value={state.electricityUsageKwh}
                  onChange={(e) => onChange({ electricityUsageKwh: e.target.value })}
                  placeholder="3200" style={s.input} />
              </div>
              {state.hasSolarPanels && (
                <div>
                  <label style={s.label}>Vermogen panelen (kWp)</label>
                  <input type="number" min="0" step="any"
                    value={state.solarPanelKwp}
                    onChange={(e) => onChange({ solarPanelKwp: e.target.value })}
                    placeholder="5.0" style={s.input} />
                  <p style={s.hint}>Piekvermogen totale installatie</p>
                </div>
              )}
              {state.hasSolarPanels && (
                <div>
                  <label style={s.label}>Zonne-opwek (kWh/jaar)</label>
                  <input type="number" min="0" step="any"
                    value={state.solarProductionKwh}
                    onChange={(e) => onChange({ solarProductionKwh: e.target.value })}
                    placeholder="4200" style={s.input} />
                </div>
              )}
              {state.hasSolarPanels && (
                <div>
                  <label style={s.label}>Teruglevering (kWh/jaar)</label>
                  <input type="number" min="0" step="any"
                    value={state.electricityFeedbackKwh}
                    onChange={(e) => onChange({ electricityFeedbackKwh: e.target.value })}
                    placeholder="2100" style={s.input} />
                  <p style={s.hint}>Stroom die nu naar het net gaat</p>
                </div>
              )}
            </div>
            <div>
              <label style={s.label}>Gasverbruik (m³/jaar)</label>
              <input type="number" min="0" step="any"
                value={state.gasUsageM3}
                onChange={(e) => onChange({ gasUsageM3: e.target.value })}
                placeholder="1400" style={{ ...s.input, maxWidth: 200 }} />
            </div>
          </div>
        )}
      </div>

      {/* Batterijadvies */}
      <BatteryAdvice state={state} />

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
              <input type="number" min="0" step="any"
                value={state.electricityTariff}
                onChange={(e) => onChange({ electricityTariff: e.target.value })}
                style={s.input} />
            </div>
            <div>
              <label style={s.label}>Teruglevertarief na 2027 (€/kWh)</label>
              <input type="number" min="0" step="any"
                value={state.feedbackTariff}
                onChange={(e) => onChange({ feedbackTariff: e.target.value })}
                style={s.input} />
              <p style={s.hint}>Saldering vervalt volledig in 2027</p>
            </div>
            <div>
              <label style={s.label}>Gasprijs (€/m³)</label>
              <input type="number" min="0" step="any"
                value={state.gasTariff}
                onChange={(e) => onChange({ gasTariff: e.target.value })}
                style={s.input} />
            </div>
          </div>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Terugleverkosten leverancier (€/kWh)</label>
              <input type="number" min="0" step="any"
                value={state.feedInCostTariff}
                onChange={(e) => onChange({ feedInCostTariff: e.target.value })}
                style={s.input} />
              <p style={s.hint}>Kosten die leverancier rekent voor teruglevering aan het net</p>
            </div>
            <div>
              <label style={s.label}>EMS / onbalansmarkt opbrengst (€/jaar)</label>
              <input type="number" min="0" step="any"
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
