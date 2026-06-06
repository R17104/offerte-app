export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import LeadEditForm from '@/components/leads/LeadEditForm'

type Props = { params: Promise<{ id: string }> }

export default async function LeadEditPage({ params }: Props) {
  const { userId } = await verifySession()
  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id, createdById: userId },
  })

  if (!lead) notFound()

  return (
    <PageContainer style={{ maxWidth: 560 }}>
      <PageHeader
        title="Lead bewerken"
        back={{ href: `/leads/${id}`, label: `${lead.firstName} ${lead.lastName}` }}
      />
      <LeadEditForm lead={lead} />
    </PageContainer>
  )
}
