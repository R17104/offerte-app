import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const verifySession = cache(async (): Promise<{ userId: string; email: string; role: string }> => {
  const session = await getSession()
  if (!session?.userId) {
    redirect('/login')
  }
  return { userId: session.userId, email: session.email, role: session.role ?? 'SALES' }
})

export const verifyAdmin = cache(async (): Promise<{ userId: string; email: string; role: string }> => {
  const session = await verifySession()
  if (session.role !== 'ADMIN') {
    redirect('/customers')
  }
  return session
})
