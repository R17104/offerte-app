import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { updateCustomer } from '@/lib/actions/customer.actions'
import {
  PageContainer, PageHeader, Card, FormGroup, Input,
  PrimaryButton, SecondaryButton,
} from '@/components/ui'
import { formatDateInput } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export default async function EditCustomerPage({ params }: Props) {
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { addresses: true },
  })

  if (!customer) notFound()

  const corrAddr = customer.addresses.find((a) => a.type === 'CORRESPONDENCE')
  const action = updateCustomer.bind(null, customer.id)

  return (
    <PageContainer style={{ maxWidth: 720 }}>
      <PageHeader
        title="Klant bewerken"
        back={{ href: `/customers/${id}`, label: `${customer.firstName} ${customer.lastName}` }}
      />

      <form action={action}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Persoonsgegevens</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormGroup label="Voornaam" required>
                <Input name="firstName" defaultValue={customer.firstName} required />
              </FormGroup>
              <FormGroup label="Achternaam" required>
                <Input name="lastName" defaultValue={customer.lastName} required />
              </FormGroup>
              <FormGroup label="Geboortedatum" required>
                <Input name="dateOfBirth" type="date" defaultValue={formatDateInput(customer.dateOfBirth)} required />
              </FormGroup>
              <FormGroup label="IBAN">
                <Input name="iban" defaultValue={customer.iban ?? ''} placeholder="NL00 BANK 0000 0000 00" />
              </FormGroup>
              <FormGroup label="Email">
                <Input name="email" type="email" defaultValue={customer.email ?? ''} />
              </FormGroup>
              <FormGroup label="Telefoonnummer">
                <Input name="phone" defaultValue={customer.phone ?? ''} />
              </FormGroup>
            </div>
          </Card>

          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Correspondentieadres</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormGroup label="Straatnaam" style={{ gridColumn: '1 / -1' }}>
                <Input name="street" defaultValue={corrAddr?.street ?? ''} placeholder="Hoofdstraat" />
              </FormGroup>
              <FormGroup label="Huisnummer">
                <Input name="houseNumber" defaultValue={corrAddr?.houseNumber ?? ''} placeholder="12A" />
              </FormGroup>
              <FormGroup label="Postcode">
                <Input name="postalCode" defaultValue={corrAddr?.postalCode ?? ''} placeholder="1234 AB" />
              </FormGroup>
              <FormGroup label="Woonplaats">
                <Input name="city" defaultValue={corrAddr?.city ?? ''} placeholder="Amsterdam" />
              </FormGroup>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <PrimaryButton type="submit">Wijzigingen opslaan</PrimaryButton>
            <SecondaryButton href={`/customers/${id}`}>Annuleren</SecondaryButton>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}
