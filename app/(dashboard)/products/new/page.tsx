import { createProduct } from '@/lib/actions/product.actions'
import {
  PageContainer, PageHeader, Card, FormGroup, Input, Textarea, Select,
  PrimaryButton, SecondaryButton,
} from '@/components/ui'
import ImageUpload from '@/components/ui/ImageUpload'
import { verifyAdmin } from '@/lib/dal'

const CATEGORIES = [
  { value: '',              label: 'Geen categorie' },
  { value: 'BATTERY',      label: '🔋 Thuisbatterij' },
  { value: 'SOLAR',        label: '☀️ Zonnepanelen' },
  { value: 'HEAT_PUMP',    label: '♨️ Warmtepomp' },
  { value: 'CHARGER',      label: '⚡ Laadpaal' },
  { value: 'EMERGENCY_POWER', label: '🔌 Noodstroom box' },
  { value: 'FULL_INSTALLATION', label: '🏠 Volledige installatie' },
]

export default async function NewProductPage() {
  await verifyAdmin()

  return (
    <PageContainer style={{ maxWidth: 780 }}>
      <PageHeader
        title="Nieuw product"
        back={{ href: '/products', label: 'Terug naar catalogus' }}
      />

      <form action={createProduct}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Basis */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Productgegevens</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="r-grid-2" style={{ display: 'grid', gap: 14 }}>
                <FormGroup label="Naam" required>
                  <Input name="name" placeholder="Bijv. Thuisbatterij 15 kWh" required />
                </FormGroup>
                <FormGroup label="Categorie">
                  <Select name="category">
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Select>
                </FormGroup>
              </div>
              <FormGroup label="Omschrijving">
                <Textarea name="description" placeholder="Korte omschrijving zichtbaar in de offerte" rows={3} />
              </FormGroup>
              <FormGroup label="Notities" hint="Intern, niet zichtbaar voor klant">
                <Textarea name="notes" placeholder="Interne notities" rows={2} />
              </FormGroup>
            </div>
          </Card>

          {/* Foto */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13.5 }}>Productfoto</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 14 }}>
              Zichtbaar in het bespaarplan van de klant
            </p>
            <ImageUpload name="imageUrl" />
          </Card>

          {/* Technische specs */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Technische specs</p>
            <div className="r-grid-3" style={{ display: 'grid', gap: 14 }}>
              <FormGroup label="Capaciteit / opwek (kWh)" hint="Batterij: opslagcap. | Zonnepanelen: jaaropwek">
                <Input name="capacityKwh" type="number" min="0" step="0.1" placeholder="15" />
              </FormGroup>
              <FormGroup label="Vermogen (kW)" hint="Bijv. warmtepomp of laadpaal">
                <Input name="powerKw" type="number" min="0" step="0.1" placeholder="8" />
              </FormGroup>
              <FormGroup label="Garantie (jaar)">
                <Input name="warrantyYears" type="number" min="0" step="1" placeholder="10" />
              </FormGroup>
            </div>
          </Card>

          {/* Besparing */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13.5 }}>Verwachte besparing</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Wordt gebruikt in het automatische bespaarplan
            </p>
            <div className="r-grid-2" style={{ display: 'grid', gap: 14 }}>
              <FormGroup label="Stroombesparing per jaar (kWh)" hint="Bijv. batterij: 3.500 kWh">
                <Input name="savingsKwhYear" type="number" min="0" step="1" placeholder="3500" />
              </FormGroup>
              <FormGroup label="Gasbesparing per jaar (m³)" hint="Alleen voor warmtepompen">
                <Input name="gasReductionM3Year" type="number" min="0" step="1" placeholder="800" />
              </FormGroup>
            </div>
          </Card>

          {/* Prijs */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Prijsinformatie</p>
            <div className="r-grid-3" style={{ display: 'grid', gap: 14 }}>
              <FormGroup label="Eenheidsprijs (excl. BTW)" required>
                <Input name="unitPrice" type="number" min="0" step="0.01" placeholder="0.00" required />
              </FormGroup>
              <FormGroup label="BTW percentage" required>
                <Select name="vatRate" defaultValue="21" required>
                  <option value="0">0%</option>
                  <option value="9">9%</option>
                  <option value="21">21%</option>
                </Select>
              </FormGroup>
              <FormGroup label="Standaard aantal">
                <Input name="defaultQty" type="number" min="0" step="1" placeholder="1" />
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
