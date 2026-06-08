export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import InstellingenClient from '@/components/account/InstellingenClient'

export default async function InstellingenPage() {
  await verifyAdmin()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return (
    <PageContainer>
      <PageHeader title="Instellingen" description="Platformbeheer en gebruikersbeheer" />
      <InstellingenClient users={users} />
    </PageContainer>
  )
}
