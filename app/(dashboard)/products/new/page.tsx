import { createProduct } from '@/lib/actions/product.actions'
import {
  PageContainer, PageHeader, Card, FormGroup, Input, Textarea, Select,
  PrimaryButton, SecondaryButton,
} from '@/components/ui'

export default function NewProductPage() {
  return (
    <PageContainer style={{ maxWidth: 680 }}>
      <PageHeader
        title="Nieuw product"
        back={{ href: '/products', label: 'Terug naar catalogus' }}
      />

      <form action={createProduct}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Productgegevens</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormGroup label="Naam" required>
                <Input name="name" placeholder="Bijv. Adviesgesprek" required />
              </FormGroup>
              <FormGroup label="Omschrijving">
                <Textarea name="description" placeholder="Korte omschrijving van het product of dienst" rows={3} />
              </FormGroup>
              <FormGroup label="Notities" hint="Interne notities, niet zichtbaar voor klant">
                <Textarea name="notes" placeholder="Interne notities" rows={2} />
              </FormGroup>
            </div>
          </Card>

          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Prijsinformatie</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <FormGroup label="Eenheidsprijs (excl. BTW)" required>
                <Input
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </FormGroup>
              <FormGroup label="BTW percentage" required>
                <Select name="vatRate" defaultValue="21" required>
                  <option value="0">0%</option>
                  <option value="9">9%</option>
                  <option value="21">21%</option>
                </Select>
              </FormGroup>
              <FormGroup label="Standaard aantal">
                <Input
                  name="defaultQty"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1"
                />
              </FormGroup>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <PrimaryButton type="submit">Product opslaan</PrimaryButton>
            <SecondaryButton href="/products">Annuleren</SecondaryButton>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}
