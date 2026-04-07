import { prisma } from '@/lib/db'
import {
  PageContainer, PageHeader, PrimaryButton, SecondaryButton,
  Card, Table, Thead, Tbody, Tr, Th, Td, EmptyState, Badge,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { quoteLines: true } } },
  })

  return (
    <PageContainer>
      <PageHeader
        title="Productcatalogus"
        description={`${products.length} product${products.length !== 1 ? 'en' : ''}`}
        action={<PrimaryButton href="/products/new">+ Nieuw product</PrimaryButton>}
      />

      <Card padding={0}>
        {products.length === 0 ? (
          <EmptyState
            title="Nog geen producten"
            description="Voeg producten toe aan de catalogus om ze te gebruiken in offertes."
            action={<PrimaryButton href="/products/new">Product toevoegen</PrimaryButton>}
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Naam</Th>
                <Th>Omschrijving</Th>
                <Th right>Eenheidsprijs</Th>
                <Th right>BTW%</Th>
                <Th right>Std. aantal</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {products.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                  </Td>
                  <Td muted style={{ maxWidth: 260 }}>
                    <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const }}>
                      {p.description || '—'}
                    </span>
                  </Td>
                  <Td right>{formatCurrency(p.unitPrice)}</Td>
                  <Td right muted>{p.vatRate}%</Td>
                  <Td right muted>{p.defaultQty ?? '—'}</Td>
                  <Td>
                    {p.active
                      ? <Badge label="Actief" color="var(--success)" bg="var(--success-muted)" />
                      : <Badge label="Inactief" color="var(--text-tertiary)" bg="var(--bg-elevated)" />
                    }
                  </Td>
                  <Td>
                    <SecondaryButton href={`/products/${p.id}/edit`} style={{ padding: '4px 10px', fontSize: 12 }}>
                      Bewerken
                    </SecondaryButton>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </PageContainer>
  )
}
