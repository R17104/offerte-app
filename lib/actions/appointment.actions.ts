'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { verifySession, isPlanner } from '@/lib/dal'
import { AppointmentStatus } from '@prisma/client'

export async function createAppointment(data: {
  leadId?: string | null
  scheduledAt: string
  assignedToId?: string | null
  notes?: string
}) {
  const session = await verifySession()
  if (!(await isPlanner(session))) throw new Error('Je hebt geen rechten om afspraken in te plannen')
  if (!data.scheduledAt) throw new Error('Kies een datum en tijd')
  const when = new Date(data.scheduledAt)
  if (isNaN(when.getTime())) throw new Error('Ongeldige datum/tijd')

  await prisma.appointment.create({
    data: {
      scheduledAt: when,
      notes: data.notes?.trim() || null,
      plannedById: session.userId,
      assignedToId: data.assignedToId || null,
      leadId: data.leadId || null,
    },
  })

  // Lead automatisch op "afspraak ingepland" zetten
  if (data.leadId) {
    await prisma.lead.update({ where: { id: data.leadId }, data: { status: 'AFSPRAAK_INGEPLAND' } }).catch(() => {})
  }

  revalidatePath('/afspraken')
  revalidatePath('/leads')
  revalidatePath('/dashboard')
}

export async function assignAppointment(id: string, assignedToId: string | null) {
  const session = await verifySession()
  if (!(await isPlanner(session))) throw new Error('Geen rechten')
  await prisma.appointment.update({ where: { id }, data: { assignedToId: assignedToId || null } })
  revalidatePath('/afspraken')
}

// Een open afspraak (zonder toegewezen saler) zelf oppakken
export async function claimAppointment(id: string) {
  const session = await verifySession()
  const appt = await prisma.appointment.findUnique({ where: { id }, select: { assignedToId: true } })
  if (!appt) throw new Error('Afspraak niet gevonden')
  if (appt.assignedToId) throw new Error('Deze afspraak is al toegewezen')
  await prisma.appointment.update({ where: { id }, data: { assignedToId: session.userId } })
  revalidatePath('/afspraken')
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const session = await verifySession()
  const appt = await prisma.appointment.findUnique({ where: { id }, select: { plannedById: true, assignedToId: true } })
  if (!appt) throw new Error('Afspraak niet gevonden')
  const allowed = (await isPlanner(session)) || appt.plannedById === session.userId || appt.assignedToId === session.userId
  if (!allowed) throw new Error('Geen rechten')
  await prisma.appointment.update({ where: { id }, data: { status } })
  revalidatePath('/afspraken')
}

// Rondt een afspraak af vanaf de Taken-pagina: status -> COMPLETED, en zet
// eventueel meteen een nieuwe opvolgdatum op de gekoppelde lead.
export async function completeAppointment(id: string, newFollowUpAt: string | null) {
  const session = await verifySession()
  const appt = await prisma.appointment.findUnique({ where: { id }, select: { plannedById: true, assignedToId: true, leadId: true } })
  if (!appt) throw new Error('Afspraak niet gevonden')
  const allowed = (await isPlanner(session)) || appt.plannedById === session.userId || appt.assignedToId === session.userId
  if (!allowed) throw new Error('Geen rechten')
  await prisma.appointment.update({ where: { id }, data: { status: 'COMPLETED' } })
  if (appt.leadId && newFollowUpAt) {
    await prisma.lead.update({ where: { id: appt.leadId }, data: { followUpAt: new Date(newFollowUpAt) } }).catch(() => {})
  }
  revalidatePath('/taken')
  revalidatePath('/afspraken')
  revalidatePath('/leads')
  revalidatePath('/dashboard')
}

export async function deleteAppointment(id: string) {
  const session = await verifySession()
  if (!(await isPlanner(session))) throw new Error('Geen rechten')
  await prisma.appointment.delete({ where: { id } })
  revalidatePath('/afspraken')
}
