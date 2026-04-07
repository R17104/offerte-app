import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { updateProduct } from '@/lib/actions/product.actions'
import {
  PageContainer, PageHeader, Card, FormGroup, Input, Textarea, Select,
  PrimaryButton, SecondaryButton,
} from '@/components/ui'

type Props = { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  const action = updateProduct.bind(null, product.id)

  return (
    <PageContainer style={{ maxWidth: 680 }}>
      <PageHeader
        title="Product bewerken"
        back={{ href: '/products', label: 'Terug naar catalogus' }}
      />

      <form action={action}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Productgegevens</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormGroup label="Naam" required>
                <Input name="name" defaultValue={product.name} required />
              </FormGroup>
              <FormGroup label="Omschrijving">
                <Textarea name="description" defaultValue={product.description ?? ''} rows={3} />
              </FormGroup>
              <FormGroup label="Notities" hint="Interne notities, niet zichtbaar voor klant">
                <Textarea name="notes" defaultValue={product.notes ?? ''} rows={2} />
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
                  defaultValue={product.unitPrice}
                  required
                />
              </FormGroup>
              <FormGroup label="BTW percentage" required>
                <Select name="vatRate" defaultValue={String(product.vatRate)} required>
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
                  defaultValue={product.defaultQty ?? ''}
                />
              </FormGroup>
            </div>
          </Card>

          <Card>
            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 13.5 }}>Status</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="active"
                defaultChecked={product.active}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: 13.5 }}>Product is actief (zichtbaar bij offerte aanmaken)</span>
            </label>
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
