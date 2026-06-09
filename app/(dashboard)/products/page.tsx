export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { PageContainer, PageHeader, PrimaryButton } from '@/components/ui'
import { verifySession } from '@/lib/dal'
import ProductsGrid from '@/components/products/ProductsGrid'

export default async function ProductsPage() {
  const { role } = await verifySession()
  const isAdmin = role === 'ADMIN'

  const products = await prisma.product.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { quoteLines: true } } },
  })

  return (
    <PageContainer>
      <PageHeader
        title="Productcatalogus"
        description={`${products.length} product${products.length !== 1 ? 'en' : ''}`}
        action={isAdmin ? <PrimaryButton href="/products/new">+ Nieuw product</PrimaryButton> : undefined}
      />
      <ProductsGrid products={products} isAdmin={isAdmin} />
    </PageContainer>
  )
}
