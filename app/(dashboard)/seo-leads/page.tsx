export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import SeoLeadsView from '@/components/leads/SeoLeadsView'

const SEO_SOURCES = ['Website', 'Website – offerte aanvraag', 'thuisbatterij']

export default async function SeoLeadsPage() {
  await verifySession()

  const [leads, users] = await Promise.all([
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        source: { in: SEO_SOURCES },
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { notes: true } },
        quote: { select: { id: true, quoteNumber: true, total: true, status: true, lines: { select: { name: true }, take: 1, orderBy: { sortOrder: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <PageContainer>
      <PageHeader
        title="SEO Leads"
        description="Bezoekers die via de website een aanvraag hebben gedaan of een product willen bestellen"
      />
      <SeoLeadsView leads={leads} users={users} />
    </PageContainer>
  )
}
