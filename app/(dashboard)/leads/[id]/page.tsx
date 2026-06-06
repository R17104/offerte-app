export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import LeadDetailClient from '@/components/leads/LeadDetailClient'

type Props = { params: Promise<{ id: string }> }

export default async function LeadDetailPage({ params }: Props) {
  const { userId } = await verifySession()
  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id, createdById: userId },
    include: {
      notes: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!lead) notFound()

  return (
    <PageContainer>
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        back={{ href: '/leads', label: 'Leads' }}
      />
      <LeadDetailClient lead={lead} />
    </PageContainer>
  )
}
