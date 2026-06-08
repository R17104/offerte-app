import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {}

  try {
    await prisma.$queryRaw`SELECT "assignedToId" FROM "Lead" LIMIT 0`
    checks.lead_assignedToId = 'OK'
  } catch (e: any) {
    checks.lead_assignedToId = 'MISSING: ' + e.message
  }

  try {
    await prisma.$queryRaw`SELECT "followUpAt" FROM "Lead" LIMIT 0`
    checks.lead_followUpAt = 'OK'
  } catch (e: any) {
    checks.lead_followUpAt = 'MISSING: ' + e.message
  }

  try {
    await prisma.$queryRaw`SELECT "assignedToId" FROM "Quote" LIMIT 0`
    checks.quote_assignedToId = 'OK'
  } catch (e: any) {
    checks.quote_assignedToId = 'MISSING: ' + e.message
  }

  try {
    await prisma.$queryRaw`SELECT * FROM "Setting" LIMIT 0`
    checks.setting_table = 'OK'
  } catch (e: any) {
    checks.setting_table = 'MISSING: ' + e.message
  }

  const allOk = Object.values(checks).every((v) => v === 'OK')
  return NextResponse.json({ ok: allOk, checks }, { status: allOk ? 200 : 500 })
}
