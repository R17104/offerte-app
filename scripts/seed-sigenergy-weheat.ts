import { PrismaClient, ProductCategory } from '@prisma/client'

const prisma = new PrismaClient()

// Image URLs
const IMG = {
  // Sigenergy EC (hybride omvormer)
  ec_sp: 'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-hybride-thuisbatterij.jpg',
  ec_tp: 'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-1.jpg',
  // Sigenergy BAT
  bat6: 'https://cdn.webshopapp.com/shops/252094/files/483240283/262x276x2/sigenergy-60-sigenstor-batterij-module.jpg',
  bat9: 'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-thuisbatterij-10-kwh.jpg',
  // Sigenergy Gateway
  gw_sp: 'https://cdn.webshopapp.com/shops/252094/files/477042152/262x276x2/sigenergy-energy-gateway-1-fase.jpg',
  gw_tp: 'https://cdn.webshopapp.com/shops/252094/files/475447440/262x276x2/sigenergy-energy-gateway-3-fase.jpg',
  // Sigenergy laadpaal
  lader7: 'https://cdn.webshopapp.com/shops/252094/files/486711965/262x276x2/sigenergy-ac-lader-7-kw-met-vaste-ev-kabel-5-meter.jpg',
  lader22: 'https://cdn.webshopapp.com/shops/252094/files/491189484/262x276x2/sigenergy-ac-lader-22kw.jpg',
  // WeHeat warmtepompen
  blackbird: 'https://cdn.prod.website-files.com/67ed5695314f69c537693240/681dea96fec3f1fba51b14e0_Blackbird%20-%20Product%20website.avif',
  blackbird_p80: 'https://www.aircozonderstek.nl/wp-content/uploads/weheat-blackbird-p80-all-electric-compact-set-8kw-1.webp',
  sparrow: 'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68122a8431ec990a5a3ffe18_Sparrow-outside.avif',
  flint: 'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68089931202a2dafe616a512_Flint-hero.webp',
  // WeHeat boilers
  boiler200: 'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-200l.webp',
  boiler300: 'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-300l.webp',
  // WeHeat buffervaten
  buffer50: 'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-50l.webp',
  buffer100: 'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-100l.webp',
}

type ProductInput = {
  name: string
  description: string
  unitPrice: number
  vatRate: number
  category: ProductCategory
  imageUrl: string
  capacityKwh?: number
  powerKw?: number
  warrantyYears?: number
  notes?: string
}

const PRODUCTS: ProductInput[] = [
  // ── Sigenergy Hybride Omvormers (Energy Controller) ─────────────────────────
  {
    name: 'SigenStor EC 3.6 SP Hybride Omvormer',
    description: 'Sigenergy SigenStor Energy Controller 3,6 kW single-fase hybride omvormer met geïntegreerde MPPT. Geschikt voor thuisbatterijsystemen tot 54 kWh. IP66, <25 dB, 10 jaar garantie.',
    unitPrice: 2198,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.ec_sp,
    powerKw: 3.6,
    warrantyYears: 10,
    notes: '2x MPPT, 1-fase, IP66',
  },
  {
    name: 'SigenStor EC 5.0 SP Hybride Omvormer',
    description: 'Sigenergy SigenStor Energy Controller 5,0 kW single-fase hybride omvormer met geïntegreerde MPPT. Geschikt voor thuisbatterijsystemen tot 54 kWh. IP66, <25 dB, 10 jaar garantie.',
    unitPrice: 2286,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.ec_sp,
    powerKw: 5.0,
    warrantyYears: 10,
    notes: '2x MPPT, 1-fase, IP66',
  },
  {
    name: 'SigenStor EC 6.0 SP Hybride Omvormer',
    description: 'Sigenergy SigenStor Energy Controller 6,0 kW single-fase hybride omvormer met geïntegreerde MPPT. Geschikt voor thuisbatterijsystemen tot 54 kWh. IP66, <25 dB, 10 jaar garantie.',
    unitPrice: 2938,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.ec_sp,
    powerKw: 6.0,
    warrantyYears: 10,
    notes: '2x MPPT, 1-fase, IP66',
  },
  {
    name: 'SigenStor EC 5.0 TP Hybride Omvormer',
    description: 'Sigenergy SigenStor Energy Controller 5,0 kW drie-fase hybride omvormer met geïntegreerde MPPT. Geschikt voor thuisbatterijsystemen tot 54 kWh. IP66, <25 dB, 10 jaar garantie.',
    unitPrice: 3358,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.ec_tp,
    powerKw: 5.0,
    warrantyYears: 10,
    notes: '2x MPPT, 3-fase, IP66',
  },
  {
    name: 'SigenStor EC 6.0 TP Hybride Omvormer',
    description: 'Sigenergy SigenStor Energy Controller 6,0 kW drie-fase hybride omvormer met geïntegreerde MPPT. Geschikt voor thuisbatterijsystemen tot 54 kWh. IP66, <25 dB, 10 jaar garantie.',
    unitPrice: 3578,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.ec_tp,
    powerKw: 6.0,
    warrantyYears: 10,
    notes: '2x MPPT, 3-fase, IP66',
  },
  {
    name: 'SigenStor EC 8.0 TP Hybride Omvormer',
    description: 'Sigenergy SigenStor Energy Controller 8,0 kW drie-fase hybride omvormer met geïntegreerde MPPT. Geschikt voor thuisbatterijsystemen tot 54 kWh. IP66, <25 dB, 10 jaar garantie.',
    unitPrice: 3918,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.ec_tp,
    powerKw: 8.0,
    warrantyYears: 10,
    notes: '3x MPPT, 3-fase, IP66',
  },
  {
    name: 'SigenStor EC 10.0 TP Hybride Omvormer',
    description: 'Sigenergy SigenStor Energy Controller 10,0 kW drie-fase hybride omvormer met geïntegreerde MPPT. Geschikt voor thuisbatterijsystemen tot 54 kWh. IP66, <25 dB, 10 jaar garantie.',
    unitPrice: 3958,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.ec_tp,
    powerKw: 10.0,
    warrantyYears: 10,
    notes: '3x MPPT, 3-fase, IP66',
  },
  {
    name: 'SigenStor EC 12.0 TP Hybride Omvormer',
    description: 'Sigenergy SigenStor Energy Controller 12,0 kW drie-fase hybride omvormer met geïntegreerde MPPT. Geschikt voor thuisbatterijsystemen tot 54 kWh. IP66, <25 dB, 10 jaar garantie.',
    unitPrice: 4698,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.ec_tp,
    powerKw: 12.0,
    warrantyYears: 10,
    notes: '4x MPPT, 3-fase, IP66',
  },

  // ── Sigenergy Batterijmodules ─────────────────────────────────────────────────
  {
    name: 'SigenStor BAT 6.0 Batterijmodule',
    description: 'Sigenergy SigenStor batterijmodule 6,02 kWh (netto 5,84 kWh). LiFePO₄ chemie, 100% DoD, 3,0 kW laad-/ontlaadvermogen. Tot 6 modules per omvormer stapelbaar (max 54 kWh). IP65, 10 jaar garantie.',
    unitPrice: 4638,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.bat6,
    capacityKwh: 6.02,
    warrantyYears: 10,
    notes: 'LFP, 100% DoD, IP65, stapelbaar',
  },
  {
    name: 'SigenStor BAT 9.0 Batterijmodule',
    description: 'Sigenergy SigenStor batterijmodule 9,04 kWh (netto 8,76 kWh). LiFePO₄ chemie, 100% DoD, 4,6 kW laad-/ontlaadvermogen. Tot 6 modules per omvormer stapelbaar (max 54 kWh). IP65, 10 jaar garantie.',
    unitPrice: 5938,
    vatRate: 21,
    category: 'BATTERY',
    imageUrl: IMG.bat9,
    capacityKwh: 9.04,
    warrantyYears: 10,
    notes: 'LFP, 100% DoD, IP65, stapelbaar',
  },

  // ── Sigenergy Noodstroom / Energy Gateway ─────────────────────────────────────
  {
    name: 'Sigenergy Energy Gateway HomeMax SP',
    description: 'Sigenergy Energy Gateway voor 1-fase installaties. Zorgt voor 0 ms noodstroomoverschakeling bij netuitval. Max. 12 kW back-upvermogen. Vereist SigenStor EC omvormer + batterijmodule(s). IP54, 5 jaar garantie.',
    unitPrice: 1298,
    vatRate: 21,
    category: 'EMERGENCY_POWER',
    imageUrl: IMG.gw_sp,
    powerKw: 12,
    warrantyYears: 5,
    notes: '1-fase, 0 ms overschakeling, IP54',
  },
  {
    name: 'Sigenergy Energy Gateway HomePro TP',
    description: 'Sigenergy Energy Gateway voor 3-fase installaties. Zorgt voor 0 ms noodstroomoverschakeling bij netuitval. Max. 30 kW back-upvermogen. Vereist SigenStor EC TP omvormer + batterijmodule(s). IP54, 5 jaar garantie.',
    unitPrice: 2078,
    vatRate: 21,
    category: 'EMERGENCY_POWER',
    imageUrl: IMG.gw_tp,
    powerKw: 30,
    warrantyYears: 5,
    notes: '3-fase, 0 ms overschakeling, IP54',
  },

  // ── Sigenergy Laadpalen ───────────────────────────────────────────────────────
  {
    name: 'Sigenergy AC Lader 7 kW',
    description: 'Sigenergy slimme AC laadpaal 7 kW (1-fase, 32A) met vaste EV-laadkabel van 5 meter. Volledig geïntegreerd met SigenStor systeem voor slim laden op basis van zonne-energie en energieprijzen.',
    unitPrice: 1198,
    vatRate: 21,
    category: 'CHARGER',
    imageUrl: IMG.lader7,
    powerKw: 7,
    warrantyYears: 5,
    notes: '1-fase, 32A, 5m vaste kabel',
  },
  {
    name: 'Sigenergy AC Lader 22 kW',
    description: 'Sigenergy slimme AC laadpaal 22 kW (3-fase, 32A). Volledig geïntegreerd met SigenStor systeem voor slim laden op basis van zonne-energie en energieprijzen. Geschikt voor alle EV\'s met Type 2 aansluiting.',
    unitPrice: 1458,
    vatRate: 21,
    category: 'CHARGER',
    imageUrl: IMG.lader22,
    powerKw: 22,
    warrantyYears: 5,
    notes: '3-fase, 32A, Type 2',
  },

  // ── WeHeat Warmtepompen ───────────────────────────────────────────────────────
  {
    name: 'WeHeat Blackbird P60 Warmtepomp 9 kW',
    description: 'WeHeat Blackbird P60 monoblock lucht-water warmtepomp voor plat dak. 9 kW vermogen bij A7/W35, SCOP 4,7. R290 koelmiddel (propaan, laag GWP). Max. aanvoertemperatuur 70°C. ISDE subsidie van toepassing. 1-fase, 230V, 16A.',
    unitPrice: 7000,
    vatRate: 21,
    category: 'HEAT_PUMP',
    imageUrl: IMG.blackbird,
    powerKw: 9,
    warrantyYears: 5,
    notes: 'R290, SCOP 4.7, 38 dB, plat dak, ISDE',
  },
  {
    name: 'WeHeat Blackbird P80 Warmtepomp 11 kW',
    description: 'WeHeat Blackbird P80 monoblock lucht-water warmtepomp voor plat dak. 11 kW vermogen bij A7/W35, SCOP 4,7. R290 koelmiddel (propaan, laag GWP). Max. aanvoertemperatuur 70°C. ISDE subsidie van toepassing. 1-fase, 230V, 16A.',
    unitPrice: 8200,
    vatRate: 21,
    category: 'HEAT_PUMP',
    imageUrl: IMG.blackbird_p80,
    powerKw: 11,
    warrantyYears: 5,
    notes: 'R290, SCOP 4.7, 49 dB, plat dak, ISDE',
  },
  {
    name: 'WeHeat Sparrow P60 Warmtepomp 9 kW',
    description: 'WeHeat Sparrow P60 monoblock lucht-water warmtepomp. 9 kW vermogen bij A7/W35, SCOP 4,78. R290 koelmiddel (propaan, laag GWP). Max. aanvoertemperatuur 70°C. ISDE subsidie van toepassing. Hybride of all-electric. 1-fase, 230V, 16A.',
    unitPrice: 7000,
    vatRate: 21,
    category: 'HEAT_PUMP',
    imageUrl: IMG.sparrow,
    powerKw: 9,
    warrantyYears: 5,
    notes: 'R290, SCOP 4.78, 40.5 dB, ISDE',
  },
  {
    name: 'WeHeat Flint P40 Warmtepomp 6 kW',
    description: 'WeHeat Flint P40 monoblock lucht-water warmtepomp. 6 kW vermogen bij A7/W35, SCOP 4,9. R290 koelmiddel (propaan, laag GWP). Max. aanvoertemperatuur 70°C. ISDE subsidie van toepassing. Hybride of all-electric. 1-fase, 230V, 16A.',
    unitPrice: 6034,
    vatRate: 21,
    category: 'HEAT_PUMP',
    imageUrl: IMG.flint,
    powerKw: 6,
    warrantyYears: 5,
    notes: 'R290, SCOP 4.9, 37.5 dB, ISDE',
  },

  // ── WeHeat Boilers (tapwater) ─────────────────────────────────────────────────
  {
    name: 'WeHeat RVS Boilervat WBL-200 (200L)',
    description: 'WeHeat RVS boilervat 200 liter van Duplex RVS 2205 staal. Voor tapwaterverwarming via warmtepomp. Spiraalwarmtewisselaar 2,6 m², max. 6 bar, max. 90°C. Optioneel 3 kW elektrisch verwarmingselement. Afm: 600×1242 mm, 44 kg.',
    unitPrice: 3016,
    vatRate: 21,
    category: 'HEAT_PUMP',
    imageUrl: IMG.boiler200,
    warrantyYears: 2,
    notes: 'Duplex RVS 2205, 200L, max 90°C, 6 bar',
  },
  {
    name: 'WeHeat RVS Boilervat WBL-300 (300L)',
    description: 'WeHeat RVS boilervat 300 liter van Duplex RVS 2205 staal. Voor tapwaterverwarming via warmtepomp. Spiraalwarmtewisselaar 2,6 m², max. 6 bar, max. 90°C. Optioneel 3 kW elektrisch verwarmingselement. Afm: 600×1602 mm, 52 kg.',
    unitPrice: 3446,
    vatRate: 21,
    category: 'HEAT_PUMP',
    imageUrl: IMG.boiler300,
    warrantyYears: 2,
    notes: 'Duplex RVS 2205, 300L, max 90°C, 6 bar',
  },

  // ── WeHeat Buffervaten (verwarming) ───────────────────────────────────────────
  {
    name: 'WeHeat RVS Buffervat WBF-50 (50L)',
    description: 'WeHeat RVS buffervat 50 liter van Duplex RVS 2205 staal. Voor hydraulische ontkoppeling in verwarmingssysteem. Max. 6 bar, max. 90°C. Afm: 470×615 mm, 18 kg. Geschikt voor alle WeHeat warmtepompen.',
    unitPrice: 1198,
    vatRate: 21,
    category: 'HEAT_PUMP',
    imageUrl: IMG.buffer50,
    warrantyYears: 2,
    notes: 'Duplex RVS 2205, 50L, max 90°C',
  },
  {
    name: 'WeHeat RVS Buffervat WBF-100 (100L)',
    description: 'WeHeat RVS buffervat 100 liter van Duplex RVS 2205 staal. Voor hydraulische ontkoppeling in verwarmingssysteem. Max. 6 bar, max. 90°C. Afm: 470×1045 mm, 24 kg. Geschikt voor alle WeHeat warmtepompen.',
    unitPrice: 1462,
    vatRate: 21,
    category: 'HEAT_PUMP',
    imageUrl: IMG.buffer100,
    warrantyYears: 2,
    notes: 'Duplex RVS 2205, 100L, max 90°C',
  },
]

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
    ?? await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!admin) throw new Error('Geen gebruiker gevonden')

  console.log(`Aanmaken als: ${admin.email}`)

  let created = 0
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } })
    if (existing) {
      console.log(`  ⚡ Bestaat al: ${p.name}`)
      continue
    }
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        unitPrice: p.unitPrice,
        vatRate: p.vatRate,
        category: p.category,
        imageUrl: p.imageUrl,
        capacityKwh: p.capacityKwh ?? null,
        powerKw: p.powerKw ?? null,
        warrantyYears: p.warrantyYears ?? null,
        notes: p.notes ?? null,
        active: true,
        shopVisible: true,
        userId: admin.id,
      },
    })
    console.log(`  ✓ ${p.name}`)
    created++
  }

  console.log(`\n${created} producten aangemaakt.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
