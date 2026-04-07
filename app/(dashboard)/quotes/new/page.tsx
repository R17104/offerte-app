import { prisma } from '@/lib/db'
import { PageContainer, PageHeader } from '@/components/ui'
import QuoteLineEditor from '@/components/quotes/QuoteLineEditor'

type Props = {
  searchParams: Promise<{ customerId?: string }>
}

export default async function NewQuotePage({ searchParams }: Props) {
  const { customerId } = await searchParams

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, description: true,
        unitPrice: true, vatRate: true, defaultQty: true,
      },
    }),
  ])

  return (
    <PageContainer>
      <PageHeader
        title="Nieuwe offerte"
        back={{ href: customerId ? `/customers/${customerId}` : '/quotes', label: 'Terug' }}
      />

      <QuoteLineEditor
        customerId=""
        customers={customers}
        products={products}
        preselectedCustomerId={customerId}
      />
    </PageContainer>
  )
}
