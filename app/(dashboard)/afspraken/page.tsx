export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifySession, isPlanner, appointmentAccessFilter, leadAccessFilter } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import AfsprakenView from '@/components/afspraken/AfsprakenView'

export default async function AfsprakenPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const session = await verifySession()
  const planner = await isPlanner(session)
  const { lead: preselectLeadId } = await searchParams

  const appointmentsRaw = await prisma.appointment.findMany({
    where: { ...appointmentAccessFilter(session) },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true, phone: true, street: true, houseNumber: true, postalCode: true, city: true } },
      plannedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }],
  })

  const appointments = appointmentsRaw.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt.toISOString(),
    notes: a.notes,
    status: a.status,
    lead: a.lead,
    plannedBy: a.plannedBy,
    assignedTo: a.assignedTo,
  }))

  const [leads, users] = planner
    ? await Promise.all([
        prisma.lead.findMany({
          where: { archivedAt: null, ...leadAccessFilter(session) },
          select: { id: true, firstName: true, lastName: true, city: true },
          orderBy: { lastName: 'asc' },
        }),
        prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
      ])
    : [[], []]

  return (
    <PageContainer>
      <PageHeader title="Afspraken" description="Ingeplande afspraken voor jou en je team" />
      <AfsprakenView
        appointments={appointments}
        isPlanner={planner}
        leads={leads}
        users={users}
        currentUserId={session.userId}
        preselectLeadId={preselectLeadId ?? null}
      />
    </PageContainer>
  )
}
