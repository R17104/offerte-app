export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import LandingPage from '@/components/marketing/LandingPage'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'

export const metadata: Metadata = {
  title: 'Thuisbatterij & Zonnepanelen Friesland — Gratis Energieadvies',
  description: 'Gratis onafhankelijk advies over thuisbatterijen, zonnepanelen en warmtepompen in Friesland. Bespaar tot €3.000/jaar. Meer dan 2.400 Friese huishoudens geholpen.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Thuisbatterij & Zonnepanelen Friesland — Gratis Energieadvies',
    description: 'Gratis onafhankelijk advies over thuisbatterijen, zonnepanelen en warmtepompen in Friesland. Bespaar tot €3.000 per jaar.',
    url: '/',
    type: 'website',
  },
}

const localBusiness = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Bespaarhulp Friesland',
  description: 'Gratis en onafhankelijk energieadvies voor thuisbatterijen, zonnepanelen en warmtepompen in heel Friesland.',
  url: BASE_URL,
  areaServed: [
    { '@type': 'State', name: 'Friesland', containedInPlace: { '@type': 'Country', name: 'Nederland' } },
  ],
  serviceArea: { '@type': 'State', name: 'Friesland' },
  knowsAbout: ['thuisbatterij', 'zonnepanelen', 'warmtepomp', 'energiebesparing', 'thuisopslag'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Energiebesparingsproducten',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Gratis energieadvies thuisbatterij' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Gratis energieadvies zonnepanelen' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Gratis energieadvies warmtepomp' } },
    ],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Wat kost een thuisbatterij in Friesland?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Een thuisbatterij kost in Friesland gemiddeld €4.000 tot €12.000 afhankelijk van capaciteit en merk. Met het Nationaal Warmtefonds kunt u rentevrij lenen als uw inkomen onder €60.000 ligt. Bespaarhulp Friesland adviseert u gratis over de beste keuze voor uw situatie.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wanneer is een thuisbatterij rendabel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Een thuisbatterij is rendabel als u zonnepanelen heeft en de salderingsregeling afloopt. Met een gemiddeld huishouden bespaart u €1.100 tot €1.400 per jaar. De terugverdientijd ligt doorgaans tussen de 7 en 12 jaar, afhankelijk van uw energieverbruik en stroomprijs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welke subsidies zijn er voor een thuisbatterij in Friesland?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Er is geen directe subsidie voor thuisbatterijen, maar u kunt wel rentevrij lenen via het Nationaal Warmtefonds. Sommige Friese gemeenten bieden aanvullende energieregelingen. Bespaarhulp Friesland helpt u gratis bij het vinden van alle beschikbare subsidies en regelingen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wat is de beste thuisbatterij voor in Friesland?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Populaire en betrouwbare thuisbatterijen zijn de AlphaESS SMILE-G3 serie (3,8 tot 9,3 kWh) en de SigenStor serie van Sigenergy. De keuze hangt af van uw zonnepanelen, stroomverbruik en beschikbare ruimte. Onze adviseurs geven u gratis een persoonlijk advies.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hoe vraag ik gratis energieadvies aan in Friesland?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Vul het contactformulier op deze pagina in of gebruik de besparingscalculator. Een van onze adviseurs neemt binnen 1 werkdag contact op voor een gratis en volledig vrijblijvend gesprek. Wij kennen de Friese markt en helpen u de juiste keuze te maken.',
      },
    },
    {
      '@type': 'Question',
      name: 'In welke Friese gemeenten zijn jullie actief?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Bespaarhulp Friesland is actief in alle 18 Friese gemeenten, waaronder Leeuwarden, Groningen, Drachten, Sneek, Heerenveen, Franeker, Harlingen, Dokkum en omgeving. Wij werken samen met gecertificeerde installateurs door heel Friesland.',
      },
    },
  ],
}

export default async function HomePage() {
  // Topproducten voor de assortiment-sectie; faalt stil zodat de homepage
  // ook zonder database gewoon rendert.
  const products = await prisma.product.findMany({
    where: { active: true, shopVisible: true },
    orderBy: [{ category: 'asc' }, { unitPrice: 'asc' }],
    select: {
      id: true, name: true, description: true, unitPrice: true, vatRate: true,
      imageUrl: true, category: true, capacityKwh: true, powerKw: true,
      warrantyYears: true, isMaatwerk: true,
    },
  }).catch(() => [])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPage products={products} />
    </>
  )
}
