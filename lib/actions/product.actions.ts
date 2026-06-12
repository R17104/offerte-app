'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { verifyAdmin } from '@/lib/dal'
import { ProductCategory } from '@prisma/client'

function parseProductFields(formData: FormData) {
  const category     = (formData.get('category') as string) || null
  const imageUrl     = (formData.get('imageUrl') as string) || null
  const capacityKwh  = formData.get('capacityKwh') ? parseFloat(formData.get('capacityKwh') as string) : null
  const powerKw      = formData.get('powerKw')     ? parseFloat(formData.get('powerKw') as string)     : null
  const warrantyYears = formData.get('warrantyYears') ? parseInt(formData.get('warrantyYears') as string) : null
  const savingsKwhYear     = formData.get('savingsKwhYear')     ? parseFloat(formData.get('savingsKwhYear') as string)     : null
  const gasReductionM3Year = formData.get('gasReductionM3Year') ? parseFloat(formData.get('gasReductionM3Year') as string) : null

  return {
    category: (category as ProductCategory) || null,
    imageUrl,
    capacityKwh,
    powerKw,
    warrantyYears,
    savingsKwhYear,
    gasReductionM3Year,
  }
}

export async function createProduct(formData: FormData) {
  const { userId } = await verifyAdmin()

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
      ...parseProductFields(formData),
    },
  })

  revalidatePath('/products')
  redirect('/products')
}

export async function bulkToggleProductActive(ids: string[], active: boolean): Promise<void> {
  await verifyAdmin()
  if (!ids.length) return
  await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active } })
  revalidatePath('/products')
}

export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  await verifyAdmin()
  if (!ids.length) return
  const used = await prisma.quoteLine.findMany({
    where: { productId: { in: ids } },
    select: { productId: true },
    distinct: ['productId'],
  })
  const usedIds = used.map((l) => l.productId!).filter(Boolean)
  const deletableIds = ids.filter((id) => !usedIds.includes(id))
  if (deletableIds.length > 0) {
    await prisma.product.deleteMany({ where: { id: { in: deletableIds } } })
  }
  if (usedIds.length > 0) {
    await prisma.product.updateMany({ where: { id: { in: usedIds } }, data: { active: false } })
  }
  revalidatePath('/products')
}

export async function updateProduct(id: string, formData: FormData) {
  await verifyAdmin()

  const name        = formData.get('name') as string
  const description = formData.get('description') as string | null
  const unitPrice   = parseFloat(formData.get('unitPrice') as string)
  const vatRate     = parseFloat(formData.get('vatRate') as string)
  const defaultQty  = formData.get('defaultQty') ? parseFloat(formData.get('defaultQty') as string) : null
  const notes       = formData.get('notes') as string | null
  const active      = formData.get('active') === 'on'
  const shopVisible = formData.get('shopVisible') === 'on'

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
      shopVisible,
      ...parseProductFields(formData),
    },
  })

  revalidatePath('/products')
  redirect('/products')
}
