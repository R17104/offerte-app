// ── Batterijadvies & -besparing: één bron voor alle berekeningen ──────────────
// Gebruikt door: EnergyProfileSection, offerte/[token], BatterijCheck,
// ProductDetailPage. Wijzig formules alleen hier.

export const ALPHA_SIZES = [9.3, 18.6, 27.9, 37.2, 46.5, 55.8]

export const DEFAULT_ELECTRICITY_TARIFF = 0.28 // €/kWh inkoop
export const DEFAULT_FEEDBACK_TARIFF = 0.07    // €/kWh terugleververgoeding na saldering

// Gemiddelde EMS/onbalansmarkt-opbrengst Alpha ESS 9,3 kWh (3-jaarsgemiddelde vloot)
export const EMS_EXAMPLE_REVENUE_EUR = 1314

// Een thuisbatterij laadt niet elke dag vol met zonne-overschot (winter!).
// ~250 effectieve volle cycli per jaar is een realistische bovengrens.
export const EFFECTIVE_CYCLES_PER_YEAR = 250

// Aandeel van de jaarlijkse teruglevering dat een (ruim bemeten) batterij
// in de praktijk kan opvangen.
export const ABSORBABLE_FEEDBACK_SHARE = 0.85

/**
 * Besparing van een batterij met gegeven capaciteit: hoeveel teruglevering
 * kan zelf worden gebruikt, en wat is dat waard (verschil inkoop- en
 * teruglevertarief). Geldt volledig vanaf het einde van de saldering (2027);
 * tot die tijd is het voordeel beperkt tot vermeden terugleverkosten.
 */
export function calcBatterySavings(
  capacityKwh: number,
  feedbackKwh: number,
  electricityTariff = DEFAULT_ELECTRICITY_TARIFF,
  feedbackTariff = DEFAULT_FEEDBACK_TARIFF,
): { absorbableKwh: number; annualSavings: number } {
  const absorbable = Math.max(0, Math.min(
    capacityKwh * EFFECTIVE_CYCLES_PER_YEAR,
    feedbackKwh * ABSORBABLE_FEEDBACK_SHARE,
  ))
  return {
    absorbableKwh: Math.round(absorbable),
    annualSavings: Math.round(absorbable * (electricityTariff - feedbackTariff)),
  }
}

export type BatteryAdviceInput = {
  feedbackKwh: number
  solarKwp?: number
  hasHeatPump?: boolean
  electricityTariff?: number
  feedbackTariff?: number
}

export type BatteryAdvice = {
  feedbackKwh: number
  kwp: number
  dailySurplusAvg: number      // kWh/dag, jaargemiddelde
  summerDailySurplus: number   // kWh/dag in de zomer (65% van jaaropbrengst in 182 dagen)
  heatPumpExtra: number
  kwpExtra: number
  baseKwh: number              // minimaal benodigde capaciteit
  recommended: number          // aanbevolen Alpha ESS maat
  absorbableKwh: number        // extra zelfgebruik per jaar
  annualSavings: number        // € per jaar (vanaf einde saldering)
}

/**
 * Adviesmaat voor een thuisbatterij. Gedimensioneerd op het ZOMERSE
 * dagoverschot (niet het jaargemiddelde): dan vangt de batterij ook op
 * zonnige dagen het volledige overschot op — wat de offerte ook belooft.
 */
export function calcBatteryAdvice(input: BatteryAdviceInput): BatteryAdvice | null {
  const feedbackKwh = input.feedbackKwh
  if (!feedbackKwh || feedbackKwh <= 0) return null

  const kwp = input.solarKwp ?? 0
  const dailySurplusAvg = feedbackKwh / 365
  const summerDailySurplus = (feedbackKwh * 0.65) / 182

  // Basis: zomers dagoverschot moet in de batterij passen
  let baseKwh = summerDailySurplus

  // Warmtepomp: avond-/ochtendvraag die de batterij kan dekken
  const heatPumpExtra = input.hasHeatPump ? 2.5 : 0
  baseKwh += heatPumpExtra

  // Hoog paneelvermogen: snelle laadpiek vraagt extra buffer
  let kwpExtra = 0
  if (kwp >= 8) kwpExtra = kwp * 0.15
  else if (kwp >= 5) kwpExtra = kwp * 0.1
  baseKwh += kwpExtra

  // Minimaal zinvolle batterij
  baseKwh = Math.max(4, baseKwh)

  const recommended = ALPHA_SIZES.find((s) => s >= baseKwh) ?? ALPHA_SIZES[ALPHA_SIZES.length - 1]

  const { absorbableKwh, annualSavings } = calcBatterySavings(
    recommended, feedbackKwh, input.electricityTariff, input.feedbackTariff,
  )

  return {
    feedbackKwh,
    kwp,
    dailySurplusAvg: Math.round(dailySurplusAvg * 10) / 10,
    summerDailySurplus: Math.round(summerDailySurplus * 10) / 10,
    heatPumpExtra,
    kwpExtra: Math.round(kwpExtra * 10) / 10,
    baseKwh: Math.round(baseKwh * 10) / 10,
    recommended,
    absorbableKwh,
    annualSavings,
  }
}
