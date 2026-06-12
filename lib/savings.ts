// ── Verbruiksschatting op basis van woningkenmerken (CBS-gemiddelden) ─────────

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
