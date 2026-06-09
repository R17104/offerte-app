import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRODUCTS = [
  // ── Thuisbatterij ──────────────────────────────────────────────────────────
  {
    name: 'ZinVolt Mate los 1 kWh',
    description: 'Modulaire thuisbatterij van 1 kWh. Stapelbaar met meerdere modules voor grotere opslagcapaciteit. Eenvoudig uit te breiden naarmate uw behoefte groeit.',
    unitPrice: 309.87,
    vatRate: 21,
    category: 'BATTERY' as const,
    capacityKwh: 1,
    warrantyYears: 10,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/241880_1.jpg',
    notes: 'Art. nr. 242117 — vekto.nl',
  },
  {
    name: 'ZinVolt Power met P1 dongle + 5x ZinVolt Mate 6 kWh',
    description: 'Compleet thuisbatterijsysteem van 6 kWh inclusief de ZinVolt Power centrale eenheid met P1-dongle voor slimme energiemeting en 5 ZinVolt Mate modules.',
    unitPrice: 2147.93,
    vatRate: 21,
    category: 'BATTERY' as const,
    capacityKwh: 6,
    warrantyYears: 10,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/241879.jpg',
    notes: 'Art. nr. 241879 — vekto.nl',
  },
  {
    name: 'AlphaESS omvormer 10kW 3-fasen SMILE-G3-T10-INV',
    description: 'Driefasige hybride omvormer van AlphaESS met 10 kW vermogen. Geschikt voor koppeling met thuisbatterijen en zonnepanelen. SMILE-G3 serie voor optimale energieopslag.',
    unitPrice: 2000.00,
    vatRate: 21,
    category: 'BATTERY' as const,
    powerKw: 10,
    warrantyYears: 10,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/242246_label.png',
    notes: 'Art. nr. 242246 — vekto.nl',
  },

  // ── Noodstroom / Backup ────────────────────────────────────────────────────
  {
    name: 'Alpha ESS Backup box KIT 3 fase',
    description: 'Complete backup box kit voor driefasige installaties. Zorgt voor automatische overschakeling naar batterijvoeding bij stroomuitval. Inclusief benodigde bekabeling.',
    unitPrice: 153.00,
    vatRate: 21,
    category: 'EMERGENCY_POWER' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/8/8/8847238ba12a395839ed90f6a06c793d.jpg',
    notes: 'Art. nr. 105128 — vekto.nl',
  },
  {
    name: 'AlphaESS BackupBox 63A BB Plus',
    description: 'Geavanceerde backup box met 63A beveiliging voor grotere installaties. Biedt noodstroomfunctionaliteit en beschermt uw installatie bij netuitval.',
    unitPrice: 1320.00,
    vatRate: 21,
    category: 'EMERGENCY_POWER' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/242263.png',
    notes: 'Art. nr. 242263 — vekto.nl',
  },
  {
    name: '3 fase Backup box beveiliging C25 100mA High Immunity',
    description: 'Driefasige backup box beveiliging met C25-zekering en 100mA High Immunity aardlekbeveiliging. Vereiste component voor driefasige noodstroominstallaties.',
    unitPrice: 168.00,
    vatRate: 21,
    category: 'EMERGENCY_POWER' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/a/6/a643e6604691411778b6e53f0c18b712.jpg',
    notes: 'Art. nr. 105126 — vekto.nl',
  },

  // ── Zonnepanelen / Solar accessories ──────────────────────────────────────
  {
    name: 'Stringbox 2MPPT 4 strings 1000Vdc Type 1+2 MC4',
    description: 'Compacte stringbox met 2 MPPT-ingangen en 4 string-aansluitingen. Voorzien van Type 1+2 overspanningsbeveiliging en MC4-aansluitingen voor zonnepaneel installaties tot 1000V DC.',
    unitPrice: 266.32,
    vatRate: 21,
    category: 'SOLAR' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/3/9/3958bd6b4771a55b7ba088f4ca8f3ef8.jpg',
    notes: 'Art. nr. 242164 — vekto.nl',
  },
  {
    name: 'Stringbox 6MPPT 1000Vdc Type 2 schroefverbinding',
    description: 'Uitgebreide stringbox met 6 MPPT-ingangen en schroefverbindingen voor professionele PV-installaties. Type 2 overspanningsbeveiliging, maximaal 1000V DC.',
    unitPrice: 845.39,
    vatRate: 21,
    category: 'SOLAR' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/242157_1.jpg',
    notes: 'Art. nr. 242157 — vekto.nl',
  },
  {
    name: 'Trayco Mini PV Shelter staand model 800x1000x1100mm incl. afdak Ultra Galva',
    description: 'Vrijstaande behuizing voor buiten-omvormers en aanverwante apparatuur. Afmetingen 800x1000x1100mm, inclusief afdak. Ultra Galva coating voor maximale corrosiebestendigheid.',
    unitPrice: 532.00,
    vatRate: 21,
    category: 'SOLAR' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/5/_/5.png',
    notes: 'Art. nr. 241896 — vekto.nl',
  },
  {
    name: 'Trayco Los dak 80x52cm tbv Mini PV Shelter Ultra Galva',
    description: 'Losse dakplaat van 80x52 cm voor de Mini PV Shelter. Ultra Galva coating voor langdurige buitenopstelling. Eenvoudig te monteren op bestaande shelters.',
    unitPrice: 106.40,
    vatRate: 21,
    category: 'SOLAR' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/241897.jpg',
    notes: 'Art. nr. 241897 — vekto.nl',
  },
  {
    name: 'Q-Verdeler Enphase 1 fase 20A 100mA',
    description: 'Eenfasige Q-verdeler speciaal voor Enphase micro-omvormer installaties. 20A hoofdzekering met 100mA aardlekbeveiliging voor veilige aansluiting van zonnepaneel systemen.',
    unitPrice: 162.00,
    vatRate: 21,
    category: 'SOLAR' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/9/1/9175a388df743ec49d0a110ce25e3b0a.jpg',
    notes: 'Art. nr. 105082 — vekto.nl',
  },

  // ── Laadpaal ───────────────────────────────────────────────────────────────
  {
    name: 'Schneider Charge Pro T2 1P-3P 7.4-11-22kW 16-32A',
    description: 'Professionele laadpaal van Schneider Electric. Laadt enkelfasig (7,4 kW) of driefasig (11-22 kW). Type 2 aansluiting, instelbaar van 16 tot 32A. Geschikt voor thuisinstallatie en semi-publiek gebruik.',
    unitPrice: 514.46,
    vatRate: 21,
    category: 'CHARGER' as const,
    powerKw: 22,
    warrantyYears: 3,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/241926.png',
    notes: 'Art. nr. 241926 — vekto.nl',
  },
]

async function main() {
  // Zoek eerste admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) {
    console.error('Geen admin gebruiker gevonden — voer eerst de seed.sql uit')
    process.exit(1)
  }

  console.log(`Producten aanmaken voor gebruiker: ${admin.email}`)

  let created = 0
  let skipped = 0

  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { name: p.name, userId: admin.id },
    })

    if (existing) {
      console.log(`  ⏭  Bestaat al: ${p.name}`)
      skipped++
      continue
    }

    await prisma.product.create({
      data: {
        ...p,
        userId: admin.id,
        active: true,
      },
    })
    console.log(`  ✓  Aangemaakt: ${p.name}`)
    created++
  }

  console.log(`\nKlaar — ${created} aangemaakt, ${skipped} overgeslagen`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
