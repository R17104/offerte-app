import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import OfferteAanvragen from '@/components/marketing/OfferteAanvragen'

type Props = { searchParams: Promise<{ product?: string }> }

export default async function OfferteAanvragenPage({ searchParams }: Props) {
  const { product: productId } = await searchParams

  if (!productId) notFound()

  const product = await prisma.product.findUnique({
    where: { id: productId, active: true, shopVisible: true },
    select: {
      id: true, name: true, description: true, unitPrice: true,
      vatRate: true, category: true, capacityKwh: true, powerKw: true, imageUrl: true,
    },
  })

  if (!product) notFound()

  return <OfferteAanvragen product={product} />
}
