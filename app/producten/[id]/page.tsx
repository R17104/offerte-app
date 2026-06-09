export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import ProductDetailPage from '@/components/marketing/ProductDetailPage'

type Props = { params: Promise<{ id: string }> }

export default async function ProductDetailRoute({ params }: Props) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true, name: true, description: true, unitPrice: true, vatRate: true,
      imageUrl: true, category: true, capacityKwh: true, powerKw: true,
      warrantyYears: true, savingsKwhYear: true, gasReductionM3Year: true,
      notes: true, active: true, shopVisible: true,
    },
  })

  if (!product || !product.active || !product.shopVisible) notFound()

  return <ProductDetailPage product={product} />
}
