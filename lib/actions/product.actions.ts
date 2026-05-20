'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/dal'

export async function createProduct(formData: FormData) {
  const { userId } = await verifySession()

  const name        = formData.get('name') as string
  const description = formData.get('description') as string | null
  const unitPrice   = parseFloat(formData.get('unitPrice') as string)
  const vatRate     = parseFloat(formData.get('vatRate') as string)
  const defaultQty  = formData.get('defaultQty') ? parseFloat(formData.get('defaultQty') as string) : null
  const notes       = formData.get('notes') as string | null

  if (!name || isNaN(unitPrice) || isNaN(vatRate)) {
    throw new Error('Naam, prijs en BTW% zijn verplicht')
  }

  await prisma.product.create({
    data: {
      name,
      description: description || null,
      unitPrice,
      vatRate,
      defaultQty,
      notes: notes || null,
      active: true,
      userId,
    },
  })

  revalidatePath('/products')
  redirect('/products')
}

export async function updateProduct(id: string, formData: FormData) {
  const { userId } = await verifySession()

  const name        = formData.get('name') as string
  const description = formData.get('description') as string | null
  const unitPrice   = parseFloat(formData.get('unitPrice') as string)
  const vatRate     = parseFloat(formData.get('vatRate') as string)
  const defaultQty  = formData.get('defaultQty') ? parseFloat(formData.get('defaultQty') as string) : null
  const notes       = formData.get('notes') as string | null
  const active      = formData.get('active') === 'on'

  if (!name || isNaN(unitPrice) || isNaN(vatRate)) {
    throw new Error('Naam, prijs en BTW% zijn verplicht')
  }

  await prisma.product.update({
    where: { id, userId },
    data: {
      name,
      description: description || null,
      unitPrice,
      vatRate,
      defaultQty,
      notes: notes || null,
      active,
    },
  })

  revalidatePath('/products')
  redirect('/products')
}
