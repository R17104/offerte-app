import { prisma } from '@/lib/db'
import ProductQuiz from '@/components/marketing/ProductQuiz'

export default async function WelkProductPage() {
  const products = await prisma.product.findMany({
    where: { active: true, shopVisible: true },
    orderBy: [{ category: 'asc' }, { unitPrice: 'asc' }],
    select: {
      id: true, name: true, description: true, unitPrice: true, vatRate: true,
      imageUrl: true, category: true, capacityKwh: true, powerKw: true, warrantyYears: true,
    },
  })

  return <ProductQuiz products={products} />
}
