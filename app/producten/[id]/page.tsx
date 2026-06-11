export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import ProductDetailPage from '@/components/marketing/ProductDetailPage'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id, active: true, shopVisible: true },
    select: { name: true, description: true, unitPrice: true, vatRate: true, imageUrl: true, category: true, capacityKwh: true, powerKw: true, isMaatwerk: true },
  })

  if (!product) return { title: 'Product niet gevonden' }

  const priceIncl = product.unitPrice * (1 + product.vatRate / 100)
  const categoryLabel = product.category === 'BATTERY' ? 'Thuisbatterij'
    : product.category === 'SOLAR' ? 'Zonnepanelen'
    : product.category === 'HEAT_PUMP' ? 'Warmtepomp'
    : product.category === 'EMERGENCY_POWER' ? 'Noodstroom'
    : 'Energieproduct'

  const title = `${product.name} — ${categoryLabel} kopen in Friesland`
  const description = product.description
    ? `${product.description.slice(0, 140)}… Gratis advies en installatie in heel Friesland.`
    : `${product.name} kopen? Gratis installatieadvies in heel Friesland. Bekijk prijs en specificaties.`

  return {
    title,
    description,
    alternates: { canonical: `/producten/${id}` },
    openGraph: {
      title,
      description,
      url: `/producten/${id}`,
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : [],
    },
    other: {
      'product:price:amount': priceIncl.toFixed(2),
      'product:price:currency': 'EUR',
    },
  }
}

export default async function ProductDetailRoute({ params }: Props) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true, name: true, description: true, unitPrice: true, vatRate: true,
      imageUrl: true, category: true, capacityKwh: true, powerKw: true,
      warrantyYears: true, savingsKwhYear: true, gasReductionM3Year: true,
      notes: true, active: true, shopVisible: true, isMaatwerk: true,
    },
  })

  if (!product || !product.active || !product.shopVisible) notFound()

  const priceIncl = product.unitPrice * (1 + product.vatRate / 100)
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.imageUrl ?? undefined,
    brand: { '@type': 'Brand', name: 'Bespaarhulp Friesland' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: priceIncl.toFixed(2),
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Bespaarhulp Friesland' },
    },
    ...(product.warrantyYears ? { warranty: `${product.warrantyYears} jaar garantie` } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailPage product={product} />
    </>
  )
}
