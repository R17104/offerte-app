import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const PRODUCTS = [
  {
    name: 'AlphaESS batterij 3.8kWh SMILE-G3-BAT-3.8S',
    description: 'Thuisbatterij van AlphaESS met een opslagcapaciteit van 3,8 kWh. Onderdeel van de SMILE-G3 serie. Koppelt direct aan de AlphaESS omvormer voor een volledig thuisopslagsysteem. Ideaal als instapmodel of als uitbreiding.',
    unitPrice: 1480.00,
    vatRate: 21,
    category: 'BATTERY' as const,
    capacityKwh: 3.8,
    warrantyYears: 10,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/242247_label_2_1.png',
    notes: 'Art. nr. 242247 — vekto.nl',
  },
  {
    name: 'AlphaESS omvormer 5kW 1-fase SMILE-G3-S5-INV',
    description: 'Eenfasige hybride omvormer van AlphaESS met 5 kW vermogen. Geschikt voor woningen met eenfasige netaansluiting. Koppelt met AlphaESS batterijen voor een compleet thuis-energiesysteem met dynamische stroomopslag.',
    unitPrice: 1600.00,
    vatRate: 21,
    category: 'BATTERY' as const,
    powerKw: 5,
    warrantyYears: 10,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/242242_label.png',
    notes: 'Art. nr. 242242 — vekto.nl',
  },
  {
    name: 'AlphaESS batterij 9.3kWh SMILE-G3-BAT-9.3S IP65',
    description: 'Grote thuisbatterij van AlphaESS met 9,3 kWh opslagcapaciteit en IP65 weerbestendigheid. Geschikt voor buiten- of garageplaatsing. Biedt voldoende opslag voor gemiddeld huishouden om meerdere dagen onafhankelijk te zijn.',
    unitPrice: 2760.00,
    vatRate: 21,
    category: 'BATTERY' as const,
    capacityKwh: 9.3,
    warrantyYears: 10,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/2/4/242248-1.png',
    notes: 'Art. nr. 242248 — vekto.nl',
  },
  {
    name: 'Noodstroom verdeelunit 1 fase IP54 2 meter',
    description: 'Eenfasige noodstroom verdeelunit met IP54 beschermingsklasse en 2 meter aansluitkabel. Zorgt voor gecontroleerde verdeling van noodstroom vanuit de thuisbatterij naar kritische circuits in huis bij netuitval.',
    unitPrice: 99.58,
    vatRate: 21,
    category: 'EMERGENCY_POWER' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/4/4/4480ca4a2f681533290e6c7218a883b7.jpg',
    notes: 'Art. nr. 105131 — vekto.nl',
  },
  {
    name: 'Noodstroom verdeelunit 3 fase IP54 2 meter',
    description: 'Driefasige noodstroom verdeelunit met IP54 beschermingsklasse en 2 meter aansluitkabel. Voor driefasige installaties met thuisbatterij. Verdeelt noodstroom veilig over meerdere circuits bij netuitval.',
    unitPrice: 169.15,
    vatRate: 21,
    category: 'EMERGENCY_POWER' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/8/3/8341a667ad447e892b42458d57beacb6.jpg',
    notes: 'Art. nr. 105130 — vekto.nl',
  },
  {
    name: 'ATS 3 polig + nul 63A',
    description: 'Automatische overschakelaar (ATS) driefasig met nulgeleider, 63A. Schakelt bij netuitval automatisch over op batterijvoeding en terug zodra het net hersteld is. Essentieel onderdeel voor een volledig noodstroomsysteem.',
    unitPrice: 84.00,
    vatRate: 21,
    category: 'EMERGENCY_POWER' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/5/7/577a962dc0f0a04fc247e2813631adf2.jpg',
    notes: 'Art. nr. 242949 — vekto.nl',
  },
  {
    name: 'ATS 1 polig + nul 63A',
    description: 'Automatische overschakelaar (ATS) eenfasig met nulgeleider, 63A. Zorgt voor automatische overschakeling tussen netvoeding en batterijvoeding. Compact formaat voor eenfasige installaties.',
    unitPrice: 70.00,
    vatRate: 21,
    category: 'EMERGENCY_POWER' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/4/1/41a74cd1fe8700a6ac813a34fe70fbda.jpg',
    notes: 'Art. nr. 242948 — vekto.nl',
  },
  {
    name: 'ZinVolt 3 fase verdeler 3 groepen',
    description: 'Driefasige verdeler met 3 groepen speciaal voor ZinVolt thuisbatterij systemen. Maakt het mogelijk om specifieke circuits in huis te voorzien van noodstroom vanuit de ZinVolt batterij. Eenvoudig te installeren.',
    unitPrice: 130.97,
    vatRate: 21,
    category: 'BATTERY' as const,
    imageUrl: 'https://www.vekto.nl/media/catalog/product/0/5/05fcfc67a6184aeab9bbfa7574b04008.jpg',
    notes: 'Art. nr. 105165 — vekto.nl',
  },
]

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) { console.error('Geen admin gevonden'); process.exit(1) }

  let created = 0, skipped = 0
  for (const p of PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { name: p.name, userId: admin.id } })
    if (exists) { console.log(`  ⏭  ${p.name}`); skipped++; continue }
    await prisma.product.create({ data: { ...p, userId: admin.id, active: true, shopVisible: true } })
    console.log(`  ✓  ${p.name}`)
    created++
  }
  console.log(`\nKlaar — ${created} aangemaakt, ${skipped} overgeslagen`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
