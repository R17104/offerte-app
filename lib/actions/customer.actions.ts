'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/dal'

// ── Create ────────────────────────────────────────────────────────────────────

export async function createCustomer(formData: FormData) {
  const { userId } = await verifySession()

  const firstName   = formData.get('firstName') as string
  const lastName    = formData.get('lastName') as string
  const dateOfBirth = formData.get('dateOfBirth') as string
  const email       = formData.get('email') as string | null
  const phone       = formData.get('phone') as string | null
  const iban        = formData.get('iban') as string | null
  const street      = formData.get('street') as string | null
  const houseNumber = formData.get('houseNumber') as string | null
  const postalCode  = formData.get('postalCode') as string | null
  const city        = formData.get('city') as string | null

  if (!firstName || !lastName || !email || !phone) {
    throw new Error('Verplichte velden ontbreken')
  }

  const customer = await prisma.customer.create({
    data: {
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      email: email || null,
      phone: phone || null,
      iban: iban || null,
      userId,
      addresses:
        street && city
          ? {
              create: [
                {
                  type: 'CORRESPONDENCE',
                  street,
                  houseNumber: houseNumber || '',
                  postalCode: postalCode || '',
                  city,
                },
              ],
            }
          : undefined,
    },
  })

  redirect(`/customers/${customer.id}`)
}

// ── Create inline (geen redirect, voor gebruik binnen andere formulieren) ─────

export async function createCustomerInline(data: {
  firstName: string
  lastName: string
  dateOfBirth?: string
  email?: string
  phone?: string
  street?: string
  houseNumber?: string
  postalCode?: string
  city?: string
}): Promise<{ id: string; firstName: string; lastName: string }> {
  const { userId } = await verifySession()

  if (!data.firstName || !data.lastName) {
    throw new Error('Verplichte velden ontbreken')
  }

  const customer = await prisma.customer.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      email: data.email || null,
      phone: data.phone || null,
      userId,
      addresses:
        data.street && data.city
          ? {
              create: [
                {
                  type: 'CORRESPONDENCE',
                  street: data.street,
                  houseNumber: data.houseNumber || '',
                  postalCode: data.postalCode || '',
                  city: data.city,
                },
              ],
            }
          : undefined,
    },
    select: { id: true, firstName: true, lastName: true },
  })

  revalidatePath('/customers')
  return customer
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateCustomer(id: string, formData: FormData) {
  const { userId } = await verifySession()

  const firstName   = formData.get('firstName') as string
  const lastName    = formData.get('lastName') as string
  const email       = formData.get('email') as string | null
  const phone       = formData.get('phone') as string | null
  const dateOfBirth = formData.get('dateOfBirth') as string
  const iban        = formData.get('iban') as string | null
  const street      = formData.get('street') as string | null
  const houseNumber = formData.get('houseNumber') as string | null
  const postalCode  = formData.get('postalCode') as string | null
  const city        = formData.get('city') as string | null

  if (!firstName || !lastName || !email || !phone) {
    throw new Error('Verplichte velden ontbreken')
  }

  await prisma.customer.update({
    where: { id, userId },
    data: {
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      iban: iban || null,
    },
  })

  if (street && city) {
    const existing = await prisma.address.findFirst({
      where: { customerId: id, type: 'CORRESPONDENCE' },
    })
    if (existing) {
      await prisma.address.update({
        where: { id: existing.id },
        data: {
          street,
          houseNumber: houseNumber || '',
          postalCode: postalCode || '',
          city,
        },
      })
    } else {
      await prisma.address.create({
        data: {
          customerId: id,
          type: 'CORRESPONDENCE',
          street,
          houseNumber: houseNumber || '',
          postalCode: postalCode || '',
          city,
        },
      })
    }
  }

  revalidatePath(`/customers/${id}`)
  redirect(`/customers/${id}`)
}

// ── Archive / unarchive ───────────────────────────────────────────────────────

export async function archiveCustomer(id: string) {
  const { userId } = await verifySession()
  await prisma.customer.update({
    where: { id, userId },
    data: { archivedAt: new Date() },
  })
  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
}

export async function unarchiveCustomer(id: string) {
  const { userId } = await verifySession()
  await prisma.customer.update({
    where: { id, userId },
    data: { archivedAt: null },
  })
  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCustomer(id: string) {
  const { userId } = await verifySession()

  const customer = await prisma.customer.findUnique({
    where: { id, userId },
    select: { id: true },
  })
  if (!customer) throw new Error('Klant niet gevonden')

  const quotes = await prisma.quote.findMany({
    where: { customerId: id },
    select: { id: true },
  })
  const quoteIds = quotes.map((q) => q.id)

  if (quoteIds.length > 0) {
    await prisma.quoteAcceptance.deleteMany({ where: { quoteId: { in: quoteIds } } })
    await prisma.quoteLine.deleteMany({ where: { quoteId: { in: quoteIds } } })
    await prisma.quote.deleteMany({ where: { id: { in: quoteIds } } })
  }

  await prisma.customer.delete({ where: { id } })

  revalidatePath('/customers')
  redirect('/customers')
}

// ── Bulk actions ─────────────────────────────────────────────────────────────

export async function bulkArchiveCustomers(ids: string[]): Promise<void> {
  const { userId } = await verifySession()
  if (!ids.length) return
  await prisma.customer.updateMany({ where: { id: { in: ids }, userId }, data: { archivedAt: new Date() } })
  revalidatePath('/customers')
}

export async function bulkUnarchiveCustomers(ids: string[]): Promise<void> {
  const { userId } = await verifySession()
  if (!ids.length) return
  await prisma.customer.updateMany({ where: { id: { in: ids }, userId }, data: { archivedAt: null } })
  revalidatePath('/customers')
}

export async function bulkDeleteCustomers(ids: string[]): Promise<void> {
  const { userId } = await verifySession()
  if (!ids.length) return
  const owned = await prisma.customer.findMany({ where: { id: { in: ids }, userId }, select: { id: true } })
  const ownedIds = owned.map((c) => c.id)
  if (!ownedIds.length) return
  const quotes = await prisma.quote.findMany({ where: { customerId: { in: ownedIds } }, select: { id: true } })
  const quoteIds = quotes.map((q) => q.id)
  if (quoteIds.length > 0) {
    await prisma.quoteAcceptance.deleteMany({ where: { quoteId: { in: quoteIds } } })
    await prisma.quoteLine.deleteMany({ where: { quoteId: { in: quoteIds } } })
    await prisma.quote.deleteMany({ where: { id: { in: quoteIds } } })
  }
  await prisma.customer.deleteMany({ where: { id: { in: ownedIds } } })
  revalidatePath('/customers')
}

export async function assignCustomer(customerId: string, userId: string | null) {
  await verifySession()
  await prisma.customer.update({
    where: { id: customerId },
    data: { userId },
  })
  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/customers')
}
