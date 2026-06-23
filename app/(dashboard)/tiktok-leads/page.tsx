export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifySession, leadAccessFilter } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import SeoLeadsView from '@/components/leads/SeoLeadsView'

export default async function TikTokLeadsPage() {
  const session = await verifySession()

  const [leads, users] = await Promise.all([
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        AND: [
          {
            OR: [
              // Webhook-leads (TikTok Instant Forms via Make)
              { source: { startsWith: 'TikTok' } },
              // Leads van de TikTok-advertentielandingspagina (formulier op /thuisbatterij-actie)
              { source: { contains: 'Thuisbatterij-actie' } },
            ],
          },
          // Admin ziet alles; sales alleen eigen/toegewezen
          leadAccessFilter(session),
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
