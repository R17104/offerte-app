// ── Besparingsberekeningen voor het bespaarplan ───────────────────────────────

export type EnergyInput = {
  // Verbruik klant
  electricityUsageKwh: number
  electricityFeedbackKwh: number   // teruglevering aan het net
  solarProductionKwh: number
  gasUsageM3: number
  hasSolarPanels: boolean

  // Tarieven
  electricityTariff: number   // €/kWh inkoopprijs
  feedbackTariff: number      // €/kWh na saldering (na 2027)
  gasTariff: number           // €/m³
  feedInCostTariff: number    // €/kWh terugleverkosten leverancier (vermeden met batterij)

  // EMS / onbalansmarkt
  emsAnnualRevenueEur: number // Jaarlijkse extra opbrengst via EMS/onbalansmarkt (Alpha ESS)

  // Producten in de offerte
  savingsKwhYear: number      // totale stroombesparing van alle producten samen
  gasReductionM3Year: number  // totale gasbesparing van alle producten samen

  // Investering
  totalInvestment: number     // totaalprijs offerte incl. BTW
  subsidyAmount: number       // BTW-teruggave / subsidie
}

export type FinancingInput = {
  loanInterestRate: number  // bijv. 0.03 = 3%
  loanTermYears: number     // bijv. 10
  subsidyAmount: number
  totalInvestment: number
}

export type SavingsResult = {
  // Jaarlijkse besparingen
  electricitySavingsEur: number   // besparing door minder stroom inkopen
  gasSavingsEur: number           // besparing op gas
  saldingSavingsEur: number       // extra voordeel door saldering te omzeilen
  feedInSavingsEur: number        // vermeden terugleverkosten leverancier
  emsRevenueEur: number           // EMS/onbalansmarkt opbrengst
  totalAnnualSavingsEur: number

  // Terugverdientijd (eigen investering)
  netInvestment: number           // na subsidie
  paybackYears: number

  // Financiering
  monthlyLoanPayment: number
  monthlySavings: number
  monthlyNetBenefit: number       // positief = voordeel vanaf maand 1

  // 10-jaars totaal
  savingsOver10Years: number
  savingsOver20Years: number

  // CO₂
  co2ReductionKgYear: number

  // Saldering verlies (zonder batterij)
  annualSaldingLossEur: number    // wat kwijt gaan ze zijn aan niet-gesaldeerde stroom
}

/** CBS-gemiddelden voor schatting */
export type HouseEstimateInput = {
  numPersons: number
  houseType: 'TERRACED' | 'CORNER' | 'DETACHED' | 'APARTMENT'
  buildYear: number
  houseSizeSqm: number
}

export function estimateEnergyUsage(input: HouseEstimateInput): {
  electricityUsageKwh: number
  gasUsageM3: number
} {
  const { numPersons, houseType, buildYear } = input

  // Stroom: basisverbruik + per persoon
  const baseElec = 1_200
  const perPersonElec = 800
  const electricityUsageKwh = Math.round(baseElec + numPersons * perPersonElec)

  // Gas: afhankelijk van woningtype
  const gasBase: Record<string, number> = {
    APARTMENT: 700,
    TERRACED:  1_400,
    CORNER:    1_700,
    DETACHED:  2_200,
  }
  let gasUsageM3 = gasBase[houseType] ?? 1_400

  // Bouwjaar correctie
  if (buildYear < 1970)        gasUsageM3 *= 1.35
  else if (buildYear < 1990)   gasUsageM3 *= 1.12
  else if (buildYear < 2000)   gasUsageM3 *= 1.00
  else if (buildYear < 2015)   gasUsageM3 *= 0.82
  else                          gasUsageM3 *= 0.60

  return {
    electricityUsageKwh,
    gasUsageM3: Math.round(gasUsageM3),
  }
}

/** Maandelijkse annuïteit berekening */
function annuityPayment(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0) return principal / (years * 12)
  const r = annualRate / 12
  const n = years * 12
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function calculateSavings(input: EnergyInput, financing: FinancingInput): SavingsResult {
  const {
    electricityUsageKwh,
    electricityFeedbackKwh,
    solarProductionKwh,
    gasUsageM3,
    hasSolarPanels,
    electricityTariff,
    feedbackTariff,
    gasTariff,
    feedInCostTariff,
    emsAnnualRevenueEur,
    savingsKwhYear,
    gasReductionM3Year,
    totalInvestment,
    subsidyAmount,
  } = input

  // 1. Stroombesparingen door producten (batterij slaat overtollige stroom op)
  const electricitySavingsEur = savingsKwhYear * electricityTariff

  // 2. Gasbesparingen (warmtepomp)
  const gasSavingsEur = gasReductionM3Year * gasTariff

  // 3. Salderingsvoordeel: na 2027 verliest klant (feedback × verschil tarief)
  //    Met batterij wordt die stroom nu zelf gebruikt → besparing op inkoop
  const saldingDelta = electricityTariff - feedbackTariff   // verschil per kWh
  const saldingSavingsEur = hasSolarPanels
    ? Math.min(electricityFeedbackKwh, savingsKwhYear) * saldingDelta
    : 0

  // 4. Wat de klant VERLIEST als hij géén batterij neemt na 2027
  const annualSaldingLossEur = hasSolarPanels
    ? electricityFeedbackKwh * saldingDelta
    : 0

  // 5. Terugleverkosten vermeden: leverancier rekent €X/kWh voor teruglevering.
  //    Met batterij sla je op i.p.v. terugleveren → kosten vermeden.
  const feedInSavingsEur = hasSolarPanels
    ? Math.min(electricityFeedbackKwh, savingsKwhYear) * feedInCostTariff
    : 0

  // 6. EMS / onbalansmarkt opbrengst (Alpha ESS handelt automatisch)
  const emsRevenueEur = emsAnnualRevenueEur

  const totalAnnualSavingsEur =
    electricitySavingsEur + gasSavingsEur + saldingSavingsEur + feedInSavingsEur + emsRevenueEur

  // 5. Terugverdientijd
  const netInvestment = Math.max(0, totalInvestment - subsidyAmount)
  const paybackYears = totalAnnualSavingsEur > 0
    ? netInvestment / totalAnnualSavingsEur
    : 99

  // 6. Financiering
  const { loanInterestRate, loanTermYears } = financing
  const monthlyLoanPayment = annuityPayment(netInvestment, loanInterestRate, loanTermYears)
  const monthlySavings = totalAnnualSavingsEur / 12
  const monthlyNetBenefit = monthlySavings - monthlyLoanPayment

  // 7. Langetermijn
  const savingsOver10Years = totalAnnualSavingsEur * 10 - netInvestment
  const savingsOver20Years = totalAnnualSavingsEur * 20 - netInvestment

  // 8. CO₂ (gem. 0.298 kg CO₂/kWh NL elektriciteitsnet, 1.89 kg CO₂/m³ gas)
  const co2ReductionKgYear = Math.round(
    savingsKwhYear * 0.298 + gasReductionM3Year * 1.89
  )

  return {
    electricitySavingsEur:   Math.round(electricitySavingsEur),
    gasSavingsEur:           Math.round(gasSavingsEur),
    saldingSavingsEur:       Math.round(saldingSavingsEur),
    feedInSavingsEur:        Math.round(feedInSavingsEur),
    emsRevenueEur:           Math.round(emsRevenueEur),
    totalAnnualSavingsEur:   Math.round(totalAnnualSavingsEur),
    netInvestment:           Math.round(netInvestment),
    paybackYears:            Math.round(paybackYears * 10) / 10,
    monthlyLoanPayment:      Math.round(monthlyLoanPayment),
    monthlySavings:          Math.round(monthlySavings),
    monthlyNetBenefit:       Math.round(monthlyNetBenefit),
    savingsOver10Years:      Math.round(savingsOver10Years),
    savingsOver20Years:      Math.round(savingsOver20Years),
    co2ReductionKgYear,
    annualSaldingLossEur:    Math.round(annualSaldingLossEur),
  }
}
