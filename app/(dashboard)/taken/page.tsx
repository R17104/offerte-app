export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifySession, appointmentAccessFilter, leadAccessFilter } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import TakenView, { type Task } from '@/components/taken/TakenView'

export default async function TakenPage() {
  const session = await verifySession()

  const [appointments, followUpLeads] = await Promise.all([
    // Geplande afspraken (hebben altijd een tijd)
    prisma.appointment.findMany({
      where: { status: 'PLANNED', ...appointmentAccessFilter(session) },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, phone: true, city: true } },
        assignedTo: { select: { name: true, email: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    // Lead-opvolgingen met een ingestelde opvolgdatum/tijd (niet de dode leads)
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        followUpAt: { not: null },
        status: { notIn: ['LOST', 'FOUTIEF_NUMMER'] },
        ...leadAccessFilter(session),
      },
      select: { id: true, firstName: true, lastName: true, phone: true, city: true, status: true, followUpAt: true, assignedTo: { select: { name: true, email: true } } },
      orderBy: { followUpAt: 'asc' },
    }),
  ])

  const tasks: Task[] = [
    ...appointments.map((a): Task => ({
      kind: 'appointment',
      id: a.id,
      when: a.scheduledAt.toISOString(),
      leadId: a.lead?.id ?? null,
      name: a.lead ? `${a.lead.firstName} ${a.lead.lastName}`.trim() : 'Afspraak (geen lead)',
      phone: a.lead?.phone ?? null,
      city: a.lead?.city ?? null,
      note: a.notes,
      owner: a.assignedTo?.name || a.assignedTo?.email?.split('@')[0] || null,
    })),
    ...followUpLeads.map((l): Task => ({
      kind: 'followup',
      id: l.id,
      when: l.followUpAt!.toISOString(),
      leadId: l.id,
      name: `${l.firstName} ${l.lastName}`.trim(),
      phone: l.phone,
      city: l.city,
      note: null,
      owner: l.assignedTo?.name || l.assignedTo?.email?.split('@')[0] || null,
    })),
  ].sort((a, b) => a.when.localeCompare(b.when))

  return (
    <PageContainer>
      <PageHeader title="Taken" description="Je afspraken en opvolgingen op volgorde van tijd" />
      <TakenView tasks={tasks} />
    </PageContainer>
  )
}
