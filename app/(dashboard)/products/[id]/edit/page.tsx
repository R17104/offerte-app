export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { updateProduct } from '@/lib/actions/product.actions'
import {
  PageContainer, PageHeader, Card, FormGroup, Input, Textarea, Select,
  PrimaryButton, SecondaryButton,
} from '@/components/ui'
import ImageUpload from '@/components/ui/ImageUpload'
import { verifyAdmin } from '@/lib/dal'

type Props = { params: Promise<{ id: string }> }

const CATEGORIES = [
  { value: '',              label: '— Geen categorie —' },
  { value: 'BATTERY',      label: '🔋 Thuisbatterij' },
  { value: 'SOLAR',        label: '☀️ Zonnepanelen' },
  { value: 'HEAT_PUMP',    label: '♨️ Warmtepomp' },
  { value: 'CHARGER',      label: '⚡ Laadpaal' },
  { value: 'EMERGENCY_POWER', label: '🔌 Noodstroom box' },
]

export default async function EditProductPage({ params }: Props) {
  const { userId } = await verifyAdmin()
  const { id } = await params

  const product = await prisma.product.findUnique({ where: { id, userId } })
  if (!product) notFound()

  const action = updateProduct.bind(null, product.id)

  return (
    <PageContainer style={{ maxWidth: 780 }}>
      <PageHeader
        title="Product bewerken"
        back={{ href: '/products', label: 'Terug naar catalogus' }}
      />

      <form action={action}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Basis */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Productgegevens</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="r-grid-2" style={{ display: 'grid', gap: 14 }}>
                <FormGroup label="Naam" required>
                  <Input name="name" defaultValue={product.name} required />
                </FormGroup>
                <FormGroup label="Categorie">
                  <Select name="category" defaultValue={product.category ?? ''}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Select>
                </FormGroup>
              </div>
              <FormGroup label="Omschrijving">
                <Textarea name="description" defaultValue={product.description ?? ''} rows={3} />
              </FormGroup>
              <FormGroup label="Notities" hint="Intern — niet zichtbaar voor klant">
                <Textarea name="notes" defaultValue={product.notes ?? ''} rows={2} />
              </FormGroup>
            </div>
          </Card>

          {/* Foto */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13.5 }}>Productfoto</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 14 }}>
              Zichtbaar in het bespaarplan van de klant
            </p>
            <ImageUpload name="imageUrl" defaultValue={product.imageUrl} category={product.category ?? undefined} />
          </Card>

          {/* Technische specs */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Technische specs</p>
            <div className="r-grid-3" style={{ display: 'grid', gap: 14 }}>
              <FormGroup label="Capaciteit / opwek (kWh)" hint="Batterij: opslagcap. | Zonnepanelen: jaaropwek">
                <Input name="capacityKwh" type="number" min="0" step="0.1" defaultValue={product.capacityKwh ?? ''} placeholder="15" />
              </FormGroup>
              <FormGroup label="Vermogen (kW)">
                <Input name="powerKw" type="number" min="0" step="0.1" defaultValue={product.powerKw ?? ''} placeholder="8" />
              </FormGroup>
              <FormGroup label="Garantie (jaar)">
                <Input name="warrantyYears" type="number" min="0" step="1" defaultValue={product.warrantyYears ?? ''} placeholder="10" />
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
              <FormGroup label="Stroombesparing per jaar (kWh)">
                <Input name="savingsKwhYear" type="number" min="0" step="1" defaultValue={product.savingsKwhYear ?? ''} placeholder="3500" />
              </FormGroup>
              <FormGroup label="Gasbesparing per jaar (m³)" hint="Alleen voor warmtepompen">
                <Input name="gasReductionM3Year" type="number" min="0" step="1" defaultValue={product.gasReductionM3Year ?? ''} placeholder="800" />
              </FormGroup>
            </div>
          </Card>

          {/* Prijs */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Prijsinformatie</p>
            <div className="r-grid-3" style={{ display: 'grid', gap: 14 }}>
              <FormGroup label="Eenheidsprijs (excl. BTW)" required>
                <Input name="unitPrice" type="number" min="0" step="0.01" defaultValue={product.unitPrice} required />
              </FormGroup>
              <FormGroup label="BTW percentage" required>
                <Select name="vatRate" defaultValue={String(product.vatRate)} required>
                  <option value="0">0%</option>
                  <option value="9">9%</option>
                  <option value="21">21%</option>
                </Select>
              </FormGroup>
              <FormGroup label="Standaard aantal">
                <Input name="defaultQty" type="number" min="0" step="1" defaultValue={product.defaultQty ?? ''} />
              </FormGroup>
            </div>
          </Card>

          {/* Status */}
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Status</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={product.active}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: 13.5 }}>Product is actief (zichtbaar bij offerte aanmaken)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="shopVisible"
                  defaultChecked={product.shopVisible}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: 13.5 }}>Zichtbaar op de publieke productpagina (/producten)</span>
              </label>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <PrimaryButton type="submit">Wijzigingen opslaan</PrimaryButton>
            <SecondaryButton href="/products">Annuleren</SecondaryButton>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}
