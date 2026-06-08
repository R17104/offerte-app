export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/ui'
import AccountClient from '@/components/account/AccountClient'

export default async function AccountPage() {
  const { userId, role } = await verifySession()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null

  return (
    <PageContainer>
      <PageHeader title="Mijn account" description="Beheer je profiel en wachtwoord" />
      <AccountClient
        userId={user.id}
        name={user.name}
        email={user.email}
        role={role}
      />
    </PageContainer>
  )
}
