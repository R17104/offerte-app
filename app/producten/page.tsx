export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import ShopPage from '@/components/marketing/ShopPage'

export default async function ProductenPage() {
  const products = await prisma.product.findMany({
    where: { active: true, shopVisible: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, description: true, unitPrice: true, vatRate: true,
      imageUrl: true, category: true, capacityKwh: true, powerKw: true,
      warrantyYears: true, active: true,
    },
  })

  return <ShopPage products={products} />
}
