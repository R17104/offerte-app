'use server'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'

export async function addTodo(content: string, assignedToId?: string) {
  const { userId } = await verifySession()
  if (!content.trim()) return

  await prisma.salesTodo.create({
    data: {
      content: content.trim(),
      authorId: userId,
      assignedToId: assignedToId || null,
    },
  })
  revalidatePath('/dashboard')
}

export async function toggleTodo(id: string) {
  await verifySession()
  const todo = await prisma.salesTodo.findUniqueOrThrow({ where: { id } })
  await prisma.salesTodo.update({ where: { id }, data: { done: !todo.done } })
  revalidatePath('/dashboard')
}

export async function deleteTodo(id: string) {
  await verifySession()
  await prisma.salesTodo.delete({ where: { id } })
  revalidatePath('/dashboard')
}
