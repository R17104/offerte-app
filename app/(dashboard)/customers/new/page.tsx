import { createCustomer } from '@/lib/actions/customer.actions'
import { PageContainer, PageHeader, Card, FormGroup, Input, PrimaryButton, SecondaryButton } from '@/components/ui'

export default function NewCustomerPage() {
  return (
    <PageContainer style={{ maxWidth: 720 }}>
      <PageHeader
        title="Nieuwe klant"
        back={{ href: '/customers', label: 'Terug naar klanten' }}
      />

      <form action={createCustomer}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Persoonsgegevens</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormGroup label="Voornaam" required>
                <Input name="firstName" placeholder="Jan" required />
              </FormGroup>
              <FormGroup label="Achternaam" required>
                <Input name="lastName" placeholder="de Vries" required />
              </FormGroup>
              <FormGroup label="Geboortedatum" required>
                <Input name="dateOfBirth" type="date" required />
              </FormGroup>
              <FormGroup label="IBAN">
                <Input name="iban" placeholder="NL00 BANK 0000 0000 00" />
              </FormGroup>
              <FormGroup label="Email">
                <Input name="email" type="email" placeholder="jan@bedrijf.nl" />
              </FormGroup>
              <FormGroup label="Telefoonnummer">
                <Input name="phone" placeholder="06 1234 5678" />
              </FormGroup>
            </div>
          </Card>

          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Correspondentieadres</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormGroup label="Straatnaam" style={{ gridColumn: '1 / -1' } as React.CSSProperties}>
                <Input name="street" placeholder="Hoofdstraat" />
              </FormGroup>
              <FormGroup label="Huisnummer">
                <Input name="houseNumber" placeholder="12A" />
              </FormGroup>
              <FormGroup label="Postcode">
                <Input name="postalCode" placeholder="1234 AB" />
              </FormGroup>
              <FormGroup label="Woonplaats">
                <Input name="city" placeholder="Amsterdam" />
              </FormGroup>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <PrimaryButton type="submit">Klant opslaan</PrimaryButton>
            <SecondaryButton href="/customers">Annuleren</SecondaryButton>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}
