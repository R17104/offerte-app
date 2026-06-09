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
  source?: string
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
      source:      r.source || source,
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

export async function updateLead(leadId: string, data: LeadImportRow) {
  const { userId } = await verifySession()
  await prisma.lead.update({
    where: { id: leadId, createdById: userId },
    data: {
      firstName:   data.firstName,
      lastName:    data.lastName,
      email:       data.email    || null,
      phone:       data.phone    || null,
      street:      data.street   || null,
      houseNumber: data.houseNumber || null,
      postalCode:  data.postalCode  || null,
      city:        data.city        || null,
    },
  })
  revalidatePath('/leads')
  revalidatePath(`/leads/${leadId}`)
  redirect(`/leads/${leadId}`)
}

export async function deleteLead(leadId: string) {
  const { userId } = await verifySession()
  await prisma.lead.delete({
    where: { id: leadId, createdById: userId },
  })
  revalidatePath('/leads')
  redirect('/leads')
}

export async function updateFollowUp(leadId: string, date: string | null) {
  await verifySession()
  await prisma.lead.update({
    where: { id: leadId },
    data: { followUpAt: date ? new Date(date) : null },
  })
  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/')
}

export async function assignLead(leadId: string, assignedToId: string | null) {
  await verifySession()
  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId },
  })
  revalidatePath(`/leads/${leadId}`)
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

export async function createLeadFromLanding({
  naam, email, telefoon, postcode, bericht,
}: {
  naam: string
  email: string
  telefoon?: string
  postcode?: string
  bericht?: string
}) {
  const parts = naam.trim().split(' ')
  const firstName = parts[0] ?? naam
  const lastName  = parts.slice(1).join(' ') || '-'

  // Find first admin/system user to assign as creator
  const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
    ?? await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!systemUser) return

  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName,
      email:    email || null,
      phone:    telefoon || null,
      postalCode: postcode || null,
      source:   'Website',
      status:   'NEW',
      createdById: systemUser.id,
    },
  })

  if (bericht?.trim()) {
    await prisma.leadNote.create({
      data: { leadId: lead.id, content: bericht.trim(), authorId: systemUser.id },
    })
  }

  revalidatePath('/leads')
  revalidatePath('/dashboard')
}
