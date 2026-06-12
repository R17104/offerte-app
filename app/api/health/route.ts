import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {}

  // DB column checks
  for (const [key, sql] of [
    ['lead_assignedToId', `SELECT "assignedToId" FROM "Lead" LIMIT 0`],
    ['lead_followUpAt',   `SELECT "followUpAt" FROM "Lead" LIMIT 0`],
    ['quote_assignedToId',`SELECT "assignedToId" FROM "Quote" LIMIT 0`],
    ['setting_table',     `SELECT * FROM "Setting" LIMIT 0`],
  ] as [string, string][]) {
    try {
      await prisma.$queryRawUnsafe(sql)
      checks[key] = 'OK'
    } catch (e) {
      checks[key] = 'FAIL: ' + (e instanceof Error ? e.message : String(e))
    }
  }

  // Dashboard query checks (same as page.tsx)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd   = new Date(todayStart.getTime() + 86400000)
  const weekAgo    = new Date(now.getTime() - 7 * 86400000)

  const queries: [string, () => Promise<unknown>][] = [
    ['quote_groupBy',    () => prisma.quote.groupBy({ by: ['status'], _count: true, _sum: { total: true }, where: { archivedAt: null } })],
    ['quote_recent',     () => prisma.quote.findMany({ take: 5, orderBy: { createdAt: 'desc' }, where: { archivedAt: null }, include: { customer: true, assignedTo: { select: { name: true } } } })],
    ['lead_groupBy',     () => prisma.lead.groupBy({ by: ['status'], _count: true, where: { archivedAt: null } })],
    ['lead_followup',    () => prisma.lead.findMany({ where: { archivedAt: null, followUpAt: { gte: todayStart, lt: todayEnd } }, select: { id: true, firstName: true, lastName: true, followUpAt: true, status: true, assignedTo: { select: { name: true } } } })],
    ['lead_thisweek',    () => prisma.lead.count({ where: { archivedAt: null, createdAt: { gte: weekAgo } } })],
    ['quote_aggregate',  () => prisma.quote.aggregate({ _sum: { total: true }, where: { archivedAt: null, status: { in: ['DRAFT', 'SENT'] } } })],
    ['user_perVerkoper', () => prisma.user.findMany({ select: { id: true, name: true, email: true, quotes: { where: { archivedAt: null }, select: { status: true, total: true } }, assignedLeads: { where: { archivedAt: null }, select: { status: true } } } })],
  ]

  for (const [key, fn] of queries) {
    try {
      await fn()
      checks[key] = 'OK'
    } catch (e) {
      checks[key] = 'FAIL: ' + (e instanceof Error ? e.message : String(e))
    }
  }

  const allOk = Object.values(checks).every((v) => v === 'OK')
  return NextResponse.json({ ok: allOk, checks }, { status: allOk ? 200 : 500 })
}
