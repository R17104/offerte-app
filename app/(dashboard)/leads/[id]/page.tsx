export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { verifySession, leadAccessFilter, isPlanner } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import LeadDetailClient from '@/components/leads/LeadDetailClient'

type Props = { params: Promise<{ id: string }> }

export default async function LeadDetailPage({ params }: Props) {
  const session = await verifySession()
  const { role } = session
  const { id } = await params

  // Admin mag elke lead openen; sales alleen eigen aangemaakte of aan hen toegewezen.
  const lead = await prisma.lead.findFirst({
    where: { id, ...leadAccessFilter(session) },
    include: {
      notes: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      assignedTo: { select: { id: true, name: true, email: true } },
      appointmentPlannedBy: { select: { id: true, name: true, email: true } },
      quote: { select: { id: true, quoteNumber: true, title: true, total: true, status: true } },
    },
  })


  if (!lead) notFound()

  const planner = await isPlanner(session)
  const users = role === 'ADMIN'
    ? await prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } })
    : []

  return (
    <PageContainer>
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        back={{ href: '/leads', label: 'Leads' }}
        action={planner ? (
          <Link href={`/afspraken?lead=${lead.id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff',
            fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
          }}>
            📅 Afspraak inplannen
          </Link>
        ) : undefined}
      />
      <LeadDetailClient lead={lead} users={users} isAdmin={role === 'ADMIN'} />
    </PageContainer>
  )
}
