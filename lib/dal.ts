import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type SessionInfo = { userId: string; email: string; role: string }

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
    redirect('/dashboard')
  }
  return session
})

// ── Toegangsfilters ───────────────────────────────────────────────────────────
// Admin mag alles; sales alleen records die ze zelf aanmaakten of die aan hen
// zijn toegewezen. Te gebruiken als extra where-voorwaarde in Prisma-queries.

export function leadAccessFilter(s: SessionInfo): Prisma.LeadWhereInput {
  if (s.role === 'ADMIN') return {}
  return { OR: [{ createdById: s.userId }, { assignedToId: s.userId }] }
}

export function quoteAccessFilter(s: SessionInfo): Prisma.QuoteWhereInput {
  if (s.role === 'ADMIN') return {}
  return { OR: [{ createdById: s.userId }, { assignedToId: s.userId }] }
}

export function customerAccessFilter(s: SessionInfo): Prisma.CustomerWhereInput {
  if (s.role === 'ADMIN') return {}
  return { userId: s.userId }
}

// Afspraken: admin ziet alles; anderen zien afspraken die ze inplanden, die aan
// hen zijn toegewezen, of die nog niet zijn toegewezen (open = voor iedereen).
export function appointmentAccessFilter(s: SessionInfo): Prisma.AppointmentWhereInput {
  if (s.role === 'ADMIN') return {}
  return { OR: [{ plannedById: s.userId }, { assignedToId: s.userId }, { assignedToId: null }] }
}

// Mag deze gebruiker afspraken inplannen/verdelen? Admin altijd; sales alleen met canPlan.
export async function isPlanner(s: SessionInfo): Promise<boolean> {
  if (s.role === 'ADMIN') return true
  const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { canPlan: true } })
  return !!u?.canPlan
}
