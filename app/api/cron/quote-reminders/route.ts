import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Dagelijkse cron (zie vercel.json): stuurt herinneringen voor verstuurde, nog
// niet getekende offertes waarvoor een herinneringstermijn is ingesteld.
export async function GET(req: NextRequest) {
  // Beveiliging: als CRON_SECRET is ingesteld, moet de Authorization-header kloppen.
  // (Vercel Cron stuurt automatisch "Authorization: Bearer <CRON_SECRET>" mee.)
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'E-mail niet geconfigureerd' })
  }

  const now = new Date()
  // Kandidaten: verstuurd, herinnering ingesteld, nog niet verstuurd
  const candidates = await prisma.quote.findMany({
    where: {
      status: 'SENT',
      archivedAt: null,
      reminderDays: { not: null },
      reminderSentAt: null,
      sentAt: { not: null },
    },
    include: { customer: true, createdBy: { select: { email: true } }, assignedTo: { select: { email: true } } },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'
  const { sendQuoteReminderEmail } = await import('@/lib/email')
  let sent = 0

  for (const q of candidates) {
    if (!q.sentAt || !q.reminderDays || !q.customer.email) continue
    const due = new Date(q.sentAt)
    due.setDate(due.getDate() + q.reminderDays)
    if (due > now) continue // nog niet aan de beurt

    try {
      const cc = q.assignedTo?.email ?? q.createdBy?.email ?? undefined
      await sendQuoteReminderEmail({
        to: q.customer.email,
        cc,
        salesEmail: cc,
        customerName: `${q.customer.firstName} ${q.customer.lastName}`,
        quoteTitle: q.title,
        quoteNumber: q.quoteNumber,
        quoteUrl: `${baseUrl}/offerte/${q.publicToken}`,
      })
      await prisma.quote.update({ where: { id: q.id }, data: { reminderSentAt: new Date() } })
      sent++
    } catch (e) {
      console.error('Herinnering mislukt voor offerte', q.quoteNumber, e)
    }
  }

  return NextResponse.json({ ok: true, checked: candidates.length, sent })
}
