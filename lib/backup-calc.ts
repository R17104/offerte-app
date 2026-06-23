// ── Backup-stroom calculator (Nederlandse situatie) ───────────────────────────
//
// BELANGRIJK (NL-regel): een net-gekoppelde thuisbatterij schakelt bij een
// stroomstoring standaard UIT (anti-eilandbedrijf, veiligheidseis uit de
// netcode, zodat monteurs niet op een 'dode' kabel onder spanning komen).
// Backup-stroom werkt daarom ALLEEN met een backup-box + automatische
// omschakeling (ATS). Zonder die voorziening levert de batterij bij netuitval
// niets. De calculator rekent de looptijd uit ervan uitgaande dat die
// backup-voorziening aanwezig is.

export type Appliance = {
  id: string
  label: string
  watts: number       // gemiddeld opgenomen vermogen tijdens gebruik (W)
  essential?: boolean // standaard aangevinkt (essentieel bij stroomuitval)
  heavy?: boolean      // grootverbruiker, kan omvormervermogen overschrijden
}

// Realistische Nederlandse waarden (gemiddeld draaivermogen).
export const APPLIANCES: Appliance[] = [
  { id: 'fridge',   label: 'Koelkast / koel-vriescombi', watts: 120, essential: true },
  { id: 'freezer',  label: 'Diepvriezer',                watts: 100, essential: true },
  { id: 'cv',       label: 'CV-ketel (pomp + besturing)', watts: 120, essential: true },
  { id: 'lights',   label: 'Verlichting (LED, hele woning)', watts: 80, essential: true },
  { id: 'wifi',     label: 'Wifi-router + modem',        watts: 20,  essential: true },
  { id: 'tv',       label: 'Televisie',                  watts: 100 },
  { id: 'devices',  label: 'Laptop / telefoons laden',   watts: 60 },
  { id: 'medical',  label: 'Medische apparatuur (bijv. CPAP)', watts: 60 },
  { id: 'microwave',label: 'Magnetron',                  watts: 1000, heavy: true },
  { id: 'kettle',   label: 'Waterkoker',                 watts: 2000, heavy: true },
  { id: 'washer',   label: 'Wasmachine',                 watts: 2200, heavy: true },
  { id: 'dishwasher',label: 'Vaatwasser',                watts: 1800, heavy: true },
  { id: 'induction',label: 'Inductie kookplaat',         watts: 2500, heavy: true },
  { id: 'heater',   label: 'Elektrische kachel',         watts: 1500, heavy: true },
  { id: 'heatpump', label: 'Warmtepomp',                 watts: 1500, heavy: true },
]

// Bruikbaar deel van een LiFePO4-batterij (~90% diepte-ontlading is veilig
// dagelijks bruikbaar zonder de cellen te belasten).
export const USABLE_FRACTION = 0.9

// Typisch continu vermogen van een 1-fase backup-omvormer (Alpha ESS e.d.).
// Boven dit niveau is doorgaans een 3-fase backup-set nodig.
export const SINGLE_PHASE_MAX_W = 5000

export type BackupResult = {
  totalWatts: number
  usableKwh: number
  runtimeHours: number
  runtimeLabel: string       // "8 uur" of "1 dag en 4 uur"
  exceedsSinglePhase: boolean
}

export function calcBackup(capacityKwh: number, selectedWatts: number): BackupResult {
  const usableKwh = capacityKwh * USABLE_FRACTION
  const totalKw = selectedWatts / 1000
  const runtimeHours = totalKw > 0 ? usableKwh / totalKw : 0

  let runtimeLabel: string
  if (runtimeHours <= 0) {
    runtimeLabel = '-'
  } else if (runtimeHours < 1) {
    runtimeLabel = `${Math.round(runtimeHours * 60)} minuten`
  } else if (runtimeHours < 24) {
    runtimeLabel = `${Math.round(runtimeHours)} uur`
  } else {
    const days = Math.floor(runtimeHours / 24)
    const hours = Math.round(runtimeHours % 24)
    runtimeLabel = hours > 0 ? `${days} dag${days > 1 ? 'en' : ''} en ${hours} uur` : `${days} dag${days > 1 ? 'en' : ''}`
  }

  return {
    totalWatts: selectedWatts,
    usableKwh: Math.round(usableKwh * 10) / 10,
    runtimeHours: Math.round(runtimeHours * 10) / 10,
    runtimeLabel,
    exceedsSinglePhase: selectedWatts > SINGLE_PHASE_MAX_W,
  }
}
