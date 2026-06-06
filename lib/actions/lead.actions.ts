'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { LeadStatus } from '@prisma/client'

export type LeadImportRow = {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  street?: string
  houseNumber?: string
  postalCode?: string
  city?: string
}

export async function importLeads(rows: LeadImportRow[], source: string) {
  const { userId } = await verifySession()
  await prisma.lead.createMany({
    data: rows.map((r) => ({
      firstName:   r.firstName,
      lastName:    r.lastName,
      email:       r.email    || null,
      phone:       r.phone    || null,
      street:      r.street   || null,
      houseNumber: r.houseNumber || null,
      postalCode:  r.postalCode  || null,
      city:        r.city        || null,
      source,
      createdById: userId,
    })),
    skipDuplicates: false,
  })
  revalidatePath('/leads')
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { userId } = await verifySession()
  await prisma.lead.update({
    where: { id: leadId, createdById: userId },
    data: { status },
  })
  revalidatePath('/leads')
  revalidatePath(`/leads/${leadId}`)
}

export async function addLeadNote(leadId: string, content: string) {
  const { userId } = await verifySession()
  await prisma.leadNote.create({
    data: { content, leadId, authorId: userId },
  })
  revalidatePath(`/leads/${leadId}`)
}

export async function deleteLeadNote(noteId: string, leadId: string) {
  const { userId } = await verifySession()
  await prisma.leadNote.delete({
    where: { id: noteId, authorId: userId },
  })
  revalidatePath(`/leads/${leadId}`)
}

export async function archiveLead(leadId: string) {
  const { userId } = await verifySession()
  await prisma.lead.update({
    where: { id: leadId, createdById: userId },
    data: { archivedAt: new Date() },
  })
  revalidatePath('/leads')
  redirect('/leads')
}

export async function createLead(data: LeadImportRow) {
  const { userId } = await verifySession()
  const lead = await prisma.lead.create({
    data: {
      firstName:   data.firstName,
      lastName:    data.lastName,
      email:       data.email    || null,
      phone:       data.phone    || null,
      street:      data.street   || null,
      houseNumber: data.houseNumber || null,
      postalCode:  data.postalCode  || null,
      city:        data.city        || null,
      source:      'handmatig',
      createdById: userId,
    },
  })
  revalidatePath('/leads')
  redirect(`/leads/${lead.id}`)
}
