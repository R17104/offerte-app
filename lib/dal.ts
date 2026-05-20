import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const verifySession = cache(async (): Promise<{ userId: string; email: string }> => {
  const session = await getSession()
  if (!session?.userId) {
    redirect('/login')
  }
  return { userId: session.userId, email: session.email }
})
