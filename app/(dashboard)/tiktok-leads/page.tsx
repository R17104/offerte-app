export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import SeoLeadsView from '@/components/leads/SeoLeadsView'

export default async function TikTokLeadsPage() {
  await verifySession()

  const [leads, users] = await Promise.all([
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        OR: [
          // Webhook-leads (TikTok Instant Forms via Make)
          { source: { startsWith: 'TikTok' } },
          // Leads van de TikTok-advertentielandingspagina (formulier op /thuisbatterij-actie)
          { source: { contains: 'Thuisbatterij-actie' } },
        ],
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
        title="TikTok Leads"
        description="Leads die via je TikTok-advertentie binnenkomen"
      />
      <SeoLeadsView leads={leads} users={users} entityLabel="TikTok leads" />
    </PageContainer>
  )
}
