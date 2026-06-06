import { PageContainer, PageHeader } from '@/components/ui'
import LeadNewForm from '@/components/leads/LeadNewForm'

export default function NewLeadPage() {
  return (
    <PageContainer style={{ maxWidth: 560 }}>
      <PageHeader title="Lead toevoegen" back={{ href: '/leads', label: 'Leads' }} />
      <LeadNewForm />
    </PageContainer>
  )
}
