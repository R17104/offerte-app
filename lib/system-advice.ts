// ── Systeemadvies op basis van het maandelijkse energiebedrag ─────────────────
//
// Indicatieve berekening met Nederlandse gemiddelden en tarieven. Bedoeld om
// een richting te geven; de exacte besparing volgt uit het gratis advies / de
// offerte. Tarieven gelijk aan de rest van het platform.

export const ELEC_TARIFF = 0.28   // €/kWh inkoop
export const GAS_TARIFF = 1.10    // €/m³
export const FEEDBACK_TARIFF = 0.07 // €/kWh teruglevering na saldering (2027)

// Verdeling van een gemiddelde energierekening van een gasgestookte woning:
// grofweg 40% stroom, 60% gas. Gebruikt om uit het maandbedrag een indicatie
// van het verbruik te halen.
const ELEC_SHARE = 0.40
const GAS_SHARE = 0.60

export type AdviceInput = {
  monthlyBill: number
  hasSolar: boolean
}

export type AdviceItem = {
  key: 'SOLAR' | 'BATTERY' | 'HEAT_PUMP'
  title: string
  reason: string
  yearlySaving: number   // indicatieve besparing €/jaar
}

export type AdviceResult = {
  annualCost: number
  estElecKwh: number
  estGasM3: number
  items: AdviceItem[]
  totalLow: number
  totalHigh: number
}

export function calcSystemAdvice({ monthlyBill, hasSolar }: AdviceInput): AdviceResult {
  const annualCost = Math.round(monthlyBill * 12)

  // Indicatie verbruik uit de rekening
  const estElecKwh = Math.round((annualCost * ELEC_SHARE) / ELEC_TARIFF)
  const estGasM3 = Math.round((annualCost * GAS_SHARE) / GAS_TARIFF)

  const items: AdviceItem[] = []

  // Zonnepanelen, alleen zinvol als de klant ze nog niet heeft
  if (!hasSolar) {
    // Panelen dekken doorgaans 70-80% van het stroomverbruik; ~65% wordt direct
    // zelf gebruikt tegen het volle inkooptarief.
    const solarSaving = Math.round(estElecKwh * 0.65 * ELEC_TARIFF)
    items.push({
      key: 'SOLAR',
      title: 'Zonnepanelen',
      reason: `U verbruikt naar schatting ${estElecKwh.toLocaleString('nl-NL')} kWh stroom per jaar. Met eigen opwek bespaart u direct op uw inkoop.`,
      yearlySaving: solarSaving,
    })
  }

  // Thuisbatterij, voordeel groeit na het einde van de saldering (2027): zelf
  // gebruiken i.p.v. goedkoop terugleveren.
  // Mét panelen is er nú al overschot om op te slaan (groter voordeel); zonder
  // panelen is het overschot nog hypothetisch en kleiner, dus conservatiever.
  const feedbackFraction = hasSolar ? 0.55 : 0.30
  const feedbackKwhEst = Math.round(estElecKwh * feedbackFraction)
  const batterySaving = Math.round(feedbackKwhEst * 0.85 * (ELEC_TARIFF - FEEDBACK_TARIFF))
  if (batterySaving > 0) {
    items.push({
      key: 'BATTERY',
      title: 'Thuisbatterij',
      reason: hasSolar
        ? 'U heeft al zonnepanelen, na het einde van de saldering (2027) houdt een batterij uw zonnestroom waardevol.'
        : 'In combinatie met zonnepanelen: sla overschot op en gebruik het ’s avonds, juist als de saldering verdwijnt.',
      yearlySaving: batterySaving,
    })
  }

  // Warmtepomp, zinvol bij een serieus gasverbruik. Hybride bespaart ~60% gas.
  if (estGasM3 > 800) {
    const gasSaving = Math.round(estGasM3 * 0.6 * GAS_TARIFF)
    items.push({
      key: 'HEAT_PUMP',
      title: '(Hybride) warmtepomp',
      reason: `Bij een verbruik van circa ${estGasM3.toLocaleString('nl-NL')} m³ gas bespaart een hybride warmtepomp al snel 60% op uw gas, met ISDE-subsidie op de aanschaf.`,
      yearlySaving: gasSaving,
    })
  }

  const total = items.reduce((s, i) => s + i.yearlySaving, 0)
  // Conservatieve bandbreedte (werkelijkheid hangt af van situatie)
  const totalLow = Math.round(total * 0.7)
  const totalHigh = total

  return { annualCost, estElecKwh, estGasM3, items, totalLow, totalHigh }
}
