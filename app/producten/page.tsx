export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import ShopPage from '@/components/marketing/ShopPage'

export const metadata: Metadata = {
  title: 'Thuisbatterijen & Energieproducten kopen in Friesland',
  description: 'Bekijk ons aanbod van thuisbatterijen, warmtepompen en zonnepaneel-accessoires. AlphaESS, SigenStor, WeHeat en meer. Gratis installatieadvies in heel Friesland.',
  alternates: { canonical: '/producten' },
  openGraph: {
    title: 'Thuisbatterijen & Energieproducten kopen in Friesland',
    description: 'AlphaESS, SigenStor, WeHeat en meer. Gratis installatieadvies in heel Friesland.',
    url: '/producten',
  },
}

export default async function ProductenPage() {
  const products = await prisma.product.findMany({
    where: { active: true, shopVisible: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, description: true, unitPrice: true, vatRate: true,
      imageUrl: true, category: true, capacityKwh: true, powerKw: true,
      warrantyYears: true, active: true, isMaatwerk: true,
    },
  })

  return <ShopPage products={products} />
}
