'use client'

import { useState, useEffect, useEffectEvent } from 'react'
import { estimateEnergyUsage } from '@/lib/savings'
import { calcBatteryAdvice } from '@/lib/battery-advice'
export type EnergyState = {
  quoteType: 'EIGEN_INVESTERING' | 'GEFINANCIERD'
  financingType: string
  loanInterestRate: number
  loanTermYears: number
  subsidyAmount: number
  hasBtwReturn: boolean
  hasSolarPanels: boolean
  energyLabel: string
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
  includeBatteryAdvice: boolean
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
  energyLabel: '',
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
  includeBatteryAdvice: false,
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

function calcAdviceFromState(state: EnergyState) {
  const feedbackKwh = parseFloat(state.electricityFeedbackKwh) || 0
  const solarKwh    = parseFloat(state.solarProductionKwh) || 0

  if (!state.hasSolarPanels || feedbackKwh <= 0 || solarKwh <= 0) return null

  return calcBatteryAdvice({
    feedbackKwh,
    solarKwp: parseFloat(state.solarPanelKwp) || 0,
    hasHeatPump: state.hasHeatPump,
    electricityTariff: parseFloat(state.electricityTariff) || undefined,
    feedbackTariff: parseFloat(state.feedbackTariff) || undefined,
  })
}

function BatteryAdvice({ state, onChange }: { state: EnergyState; onChange: (patch: Partial<EnergyState>) => void }) {
  const adv = calcAdviceFromState(state)
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
            {row('Startpunt berekening', `${adv.summerDailySurplus} kWh`, 'zomers dagoverschot als basis, zodat ook zonnige dagen volledig worden opgevangen')}
            {adv.heatPumpExtra > 0 && row('Warmtepomp toeslag', `+${adv.heatPumpExtra} kWh`, 'verschuiving warmtevraag naar zonne-uren')}
            {adv.kwp > 0 && adv.kwpExtra > 0 && row(`Hoog vermogen (${adv.kwp} kWp)`, `+${adv.kwpExtra} kWh`, 'snelle laadpiek vraagt grotere buffer')}
            {row('Minimaal benodigde capaciteit', `${adv.baseKwh} kWh`, '')}
            {row('Aanbevolen Alpha ESS maat', `${adv.recommended} kWh`, `naaste beschikbare grootte ≥ ${adv.baseKwh} kWh`)}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, background: 'rgba(10,92,53,0.04)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
          <strong>Toelichting:</strong> Met {adv.recommended} kWh batterij kan de klant circa {adv.absorbableKwh} kWh/jaar meer zelf gebruiken
          in plaats van terug te leveren tegen {parseFloat(state.feedbackTariff) || 0.07}€/kWh.
          Dit levert een tariffsverschil op van €{Math.round(((parseFloat(state.electricityTariff) || 0.28) - (parseFloat(state.feedbackTariff) || 0.07)) * 100) / 100}/kWh,
          dus circa €{adv.annualSavings}/jaar vanaf het einde van de saldering (2027){state.hasHeatPump ? ' (inclusief warmtepomp-toeslag)' : ''}.
          {adv.kwp >= 8 ? ` Door het hoge paneelvermogen (${adv.kwp} kWp) is een grotere batterij nodig om de piekopwek volledig te bufferen.` : ''}
        </p>
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '10px 0 0', fontStyle: 'italic' }}>
        Niet meegenomen: dakoriëntatie, schaduw, EV-laden thuis, of dynamisch verbruikspatroon.
        Beschouw dit als een eerste indicatie.
      </p>

      <div style={{ marginTop: 14, borderTop: '1px solid rgba(10,92,53,0.15)', paddingTop: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={state.includeBatteryAdvice}
            onChange={(e) => onChange({ includeBatteryAdvice: e.target.checked })}
            style={{ width: 17, height: 17, accentColor: 'var(--accent)' }}
          />
          <div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent)' }}>
              Batterijadvies meesturen in offerte
            </span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Voegt een pagina toe met het persoonlijk batterijadvies vóór de situatie-analyse.
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}

export default function EnergyProfileSection({ state, onChange }: Props) {
  const [inputMode, setInputMode] = useState<'estimate' | 'manual'>('manual')
  const [billManuallyEdited, setBillManuallyEdited] = useState(false)

  // Effect event: altijd de nieuwste onChange, zonder dat die in de deps hoeft.
  const emitChange = useEffectEvent(onChange)

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
    emitChange({ currentMonthlyBill: String(monthly) })
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


      {/* Energielabel */}
      <div style={s.card}>
        <p style={s.cardTitle}>Energielabel woning</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <select
            value={state.energyLabel}
            onChange={(e) => onChange({ energyLabel: e.target.value })}
            style={{ ...s.input, width: 140, appearance: 'none' }}
          >
            <option value="">- Onbekend -</option>
            {['A++++','A+++','A++','A+','A','B','C','D','E','F','G'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {state.energyLabel && (
            <div style={{
              width: 44, height: 44, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff',
              background: ({ 'A++++':'#005a00','A+++':'#007a00','A++':'#009900','A+':'#33b200',
                A:'#4cc300',B:'#8bc400',C:'#c8d400',D:'#f5d800',E:'#f5a800',F:'#f57000',G:'#e83000' } as Record<string,string>)[state.energyLabel] ?? '#6b7280',
            }}>
              {state.energyLabel}
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            Opzoeken via{' '}
            <a href="https://www.ep-online.nl/EpOnline/zoek-energielabel" target="_blank" rel="noreferrer"
              style={{ color: 'var(--text-link)' }}>ep-online.nl</a>
          </p>
        </div>
      </div>

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
                  <option value="">- Kies -</option>
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
            {/* Huidig termijnbedrag, altijd zichtbaar, auto-berekend */}
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
                  ? 'Handmatig ingevuld, klik "↺ auto" om terug te gaan naar automatische berekening.'
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
      <BatteryAdvice state={state} onChange={onChange} />

      {/* Tarieven */}
      <div style={s.card}>
        <p style={s.cardTitle}>Energietarieven</p>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14, marginTop: -8 }}>
          Standaardwaarden, pas aan per klant indien nodig
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
              <p style={s.hint}>Alpha ESS EMS handelt automatisch, schat in op basis van batterijgrootte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
