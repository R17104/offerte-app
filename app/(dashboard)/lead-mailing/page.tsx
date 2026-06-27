export const dynamic = 'force-dynamic'
export const maxDuration = 60 // bulk-mailen kan even duren

import { prisma } from '@/lib/db'
import { verifySession, leadAccessFilter } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import { MAILING_BATCH_LIMIT } from '@/lib/constants'
import LeadMailingView from '@/components/leads/LeadMailingView'

export default async function LeadMailingPage() {
  const session = await verifySession()
  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } })
  const senderName = me?.name?.trim() || me?.email?.split('@')[0] || 'Bespaarhulp Friesland'

  // Mailbare leads: hebben e-mail, niet gearchiveerd, niet verloren/foutief
  const leadsRaw = await prisma.lead.findMany({
    where: {
      ...leadAccessFilter(session),
      archivedAt: null,
      email: { not: null },
      status: { notIn: ['LOST', 'FOUTIEF_NUMMER'] },
    },
    select: { id: true, firstName: true, lastName: true, email: true, city: true, status: true, lastMailedAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const leads = leadsRaw.map((l) => ({
    ...l,
    lastMailedAt: l.lastMailedAt ? l.lastMailedAt.toISOString() : null,
  }))

  return (
    <PageContainer>
      <PageHeader title="Lead mailing" description="Verstuur de informatiemail naar je leads — in veilige batches" />
      <LeadMailingView leads={leads} senderName={senderName} batchLimit={MAILING_BATCH_LIMIT} />
    </PageContainer>
  )
}
