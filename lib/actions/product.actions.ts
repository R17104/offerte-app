'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
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
    },
  })

  revalidatePath('/products')
  redirect('/products')
}

export async function updateProduct(id: string, formData: FormData) {
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
    where: { id },
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
