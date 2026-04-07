import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import {
  PageContainer, PageHeader, Card, CardHeader, SecondaryButton, PrimaryButton,
  Badge, Table, Thead, Tbody, Tr, Th, Td, EmptyState,
} from '@/components/ui'
import ConfirmButton from '@/components/ui/ConfirmButton'
import {
  archiveCustomer, unarchiveCustomer, deleteCustomer,
} from '@/lib/actions/customer.actions'
import { formatDate, formatCurrency, STATUS_META } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      quotes: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { lines: true } } },
      },
    },
  })

  if (!customer) notFound()

  const corrAddr = customer.addresses.find((a) => a.type === 'CORRESPONDENCE')
  const delAddr  = customer.addresses.find((a) => a.type === 'DELIVERY')
  const isArchived = !!customer.archivedAt
  const quoteCount = customer.quotes.length

  return (
    <PageContainer>
      {/* Archived banner */}
      {isArchived && (
        <div style={{
          background: 'var(--warning-muted)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          fontSize: 13,
          color: 'var(--warning)',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}>
          <span>
            Deze klant is gearchiveerd op {formatDate(customer.archivedAt)} en is niet zichtbaar in de normale lijst.
          </span>
          <ConfirmButton
            action={unarchiveCustomer.bind(null, id)}
            label="Terugzetten"
            confirmMessage="Klant terugzetten uit archief?"
            size="sm"
          />
        </div>
      )}

      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        back={{ href: isArchived ? '/customers?archived=1' : '/customers', label: 'Klanten' }}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <SecondaryButton href={`/customers/${id}/edit`}>Bewerken</SecondaryButton>
            {!isArchived && (
              <ConfirmButton
                action={archiveCustomer.bind(null, id)}
                label="Archiveren"
                confirmMessage={`"${customer.firstName} ${customer.lastName}" archiveren? De klant verdwijnt uit de normale lijst.`}
                variant="warning"
              />
            )}
            <ConfirmButton
              action={deleteCustomer.bind(null, id)}
              label="Verwijderen"
              confirmMessage={
                quoteCount > 0
                  ? `⚠️ Waarschuwing: "${customer.firstName} ${customer.lastName}" heeft nog ${quoteCount} offerte${quoteCount !== 1 ? 's' : ''}.\n\nAlle offertes, productregels en acceptatiegegevens worden ook definitief verwijderd.\n\nDit kan NIET ongedaan worden gemaakt. Doorgaan?`
                  : `"${customer.firstName} ${customer.lastName}" definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`
              }
              variant="danger"
            />
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Contact */}
        <Card>
          <CardHeader title="Contactgegevens" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Email',         value: customer.email },
              { label: 'Telefoon',      value: customer.phone },
              { label: 'IBAN',          value: customer.iban },
              { label: 'Geboortedatum', value: formatDate(customer.dateOfBirth) },
              { label: 'Aangemaakt',    value: formatDate(customer.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', width: 110, flexShrink: 0 }}>
                  {label}
                </span>
                <span style={{ fontSize: 13, color: value ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader title="Adressen" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Correspondentie', addr: corrAddr },
              { label: 'Levering',        addr: delAddr },
            ].map(({ label, addr }) => (
              <div key={label}>
                <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </p>
                {addr ? (
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                    <div>{addr.street} {addr.houseNumber}</div>
                    <div>{addr.postalCode} {addr.city}</div>
                    <div style={{ color: 'var(--text-tertiary)' }}>{addr.country}</div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Niet ingevuld</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quotes */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Offertes</span>
          {!isArchived && (
            <PrimaryButton href={`/quotes/new?customerId=${id}`}>+ Nieuwe offerte</PrimaryButton>
          )}
        </div>

        {customer.quotes.length === 0 ? (
          <EmptyState
            title="Nog geen offertes"
            description="Maak een offerte aan voor deze klant."
            action={!isArchived ? <PrimaryButton href={`/quotes/new?customerId=${id}`}>Offerte aanmaken</PrimaryButton> : undefined}
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Nummer</Th>
                <Th>Titel</Th>
                <Th>Status</Th>
                <Th right>Totaal</Th>
                <Th>Geldig tot</Th>
                <Th>Aangemaakt</Th>
              </tr>
            </Thead>
            <Tbody>
              {customer.quotes.map((q) => {
                const meta = STATUS_META[q.status] ?? STATUS_META.DRAFT
                return (
                  <Tr key={q.id} href={`/quotes/${q.id}`}>
                    <Td muted style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{q.quoteNumber}</Td>
                    <Td>
                      <span style={{ fontWeight: 500 }}>{q.title}</span>
                      {q.archivedAt && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--warning)', background: 'var(--warning-muted)', padding: '1px 6px', borderRadius: 4 }}>
                          gearchiveerd
                        </span>
                      )}
                    </Td>
                    <Td><Badge label={meta.label} color={meta.color} bg={meta.bg} /></Td>
                    <Td right>{formatCurrency(q.total)}</Td>
                    <Td muted>{formatDate(q.validUntil)}</Td>
                    <Td muted>{formatDate(q.createdAt)}</Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </PageContainer>
  )
}
