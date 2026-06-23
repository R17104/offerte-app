export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifySession, leadAccessFilter } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import LeadImportButton from '@/components/leads/LeadImportButton'
import LeadsView from '@/components/leads/LeadsView'
import Link from 'next/link'

export default async function LeadsPage() {
  const session = await verifySession()

  // Admin ziet alle leads; sales alleen eigen aangemaakte of aan hen toegewezen.
  const leads = await prisma.lead.findMany({
    where: { ...leadAccessFilter(session), archivedAt: null },
    include: { _count: { select: { notes: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <PageContainer>
      <PageHeader
        title="Leads"
        description={`${leads.length} actieve leads`}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <LeadImportButton />
            <Link
              href="/leads/nieuw"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 8,
                background: 'var(--accent)', color: '#fff',
                fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
              }}
            >
              + Lead toevoegen
            </Link>
          </div>
        }
      />
      <LeadsView leads={leads} />
    </PageContainer>
  )
}
