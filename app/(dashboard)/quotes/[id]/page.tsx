import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { updateQuoteStatus, archiveQuote, unarchiveQuote, deleteQuote } from '@/lib/actions/quote.actions'
import {
  PageContainer, PageHeader, Card, CardHeader, SecondaryButton,
  Badge, Table, Thead, Tbody, Tr, Th, Td, Divider,
} from '@/components/ui'
import ConfirmButton from '@/components/ui/ConfirmButton'
import { formatDate, formatCurrency, STATUS_META } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

const TRANSITIONS: Record<string, { status: string; label: string; danger?: boolean }[]> = {
  DRAFT:    [{ status: 'SENT', label: 'Markeer als verstuurd' }, { status: 'EXPIRED', label: 'Verlopen', danger: true }],
  SENT:     [{ status: 'ACCEPTED', label: 'Accepteren' }, { status: 'REJECTED', label: 'Afwijzen', danger: true }, { status: 'EXPIRED', label: 'Verlopen', danger: true }],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED:  [],
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: { include: { addresses: { where: { type: 'CORRESPONDENCE' }, take: 1 } } },
      lines: { orderBy: { sortOrder: 'asc' } },
      acceptance: true,
    },
  })

  if (!quote) notFound()

  const meta = STATUS_META[quote.status] ?? STATUS_META.DRAFT
  const actions = TRANSITIONS[quote.status] ?? []
  const publicUrl = `/offerte/${quote.publicToken}`
  const isArchived = !!quote.archivedAt
  const isAccepted = quote.status === 'ACCEPTED'

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
            Deze offerte is gearchiveerd op {formatDate(quote.archivedAt)} en is niet zichtbaar in de normale lijst.
          </span>
          <ConfirmButton
            action={unarchiveQuote.bind(null, id)}
            label="Terugzetten"
            confirmMessage="Offerte terugzetten uit archief?"
            size="sm"
          />
        </div>
      )}

      <PageHeader
        title={quote.title}
        back={{ href: isArchived ? '/quotes?archived=1' : '/quotes', label: 'Offertes' }}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <SecondaryButton href={publicUrl} style={{ fontSize: 12.5, padding: '6px 12px' }}>
              Publieke link ↗
            </SecondaryButton>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Lines */}
          <Card padding={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Productregels</span>
            </div>
            <Table>
              <Thead>
                <tr>
                  <Th>#</Th>
                  <Th>Omschrijving</Th>
                  <Th right>Aantal</Th>
                  <Th right>Prijs excl.</Th>
                  <Th right>BTW%</Th>
                  <Th right>Totaal incl.</Th>
                </tr>
              </Thead>
              <Tbody>
                {quote.lines.map((line, i) => (
                  <Tr key={line.id}>
                    <Td muted style={{ width: 36 }}>{i + 1}</Td>
                    <Td>
                      <span style={{ fontWeight: 500 }}>{line.name}</span>
                      {line.description && (
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {line.description}
                        </p>
                      )}
                    </Td>
                    <Td right muted>{line.quantity}</Td>
                    <Td right muted>{formatCurrency(line.unitPrice)}</Td>
                    <Td right muted>{line.vatRate}%</Td>
                    <Td right>{formatCurrency(line.lineTotal)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {/* Totals */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 260 }}>
                {[
                  { label: 'Subtotaal',  value: formatCurrency(quote.subtotal) },
                  { label: 'Korting',    value: quote.discountAmount > 0 ? `- ${formatCurrency(quote.discountAmount)}` : '—' },
                  { label: 'BTW',        value: formatCurrency(quote.vatTotal) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <span>{label}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>Totaal</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader title="Notities (intern)" />
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {quote.notes}
              </p>
            </Card>
          )}

          {/* Included items */}
          {quote.includedItems && (
            <Card>
              <CardHeader title="Inbegrepen in dit aanbod" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {quote.includedItems.split('\n').map((line, i) => {
                  const t = line.trim()
                  if (!t) return null
                  const isBullet = t.startsWith('-')
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.5 }}>
                      {isBullet ? (
                        <>
                          <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{t.replace(/^-\s*/, '')}</span>
                        </>
                      ) : (
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Acceptance */}
          {quote.acceptance && (
            <Card>
              <CardHeader title="Acceptatiegegevens" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Naam',           value: `${quote.acceptance.firstName} ${quote.acceptance.lastName}` },
                  { label: 'Geboortedatum',  value: formatDate(quote.acceptance.dateOfBirth) },
                  { label: 'IBAN',           value: quote.acceptance.iban || '—' },
                  { label: 'Geaccepteerd op', value: formatDate(quote.acceptance.acceptedAt) },
                  { label: 'IP-adres',       value: quote.acceptance.ipAddress || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-tertiary)', width: 140, flexShrink: 0 }}>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
                {quote.acceptance.signatureData && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>Handtekening</p>
                    <img
                      src={quote.acceptance.signatureData}
                      alt="Handtekening"
                      style={{ maxWidth: 280, border: '1px solid var(--border)', borderRadius: 8, background: '#fff', padding: 8 }}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>
          <Card>
            <CardHeader title="Status" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Badge label={meta.label} color={meta.color} bg={meta.bg} />
            </div>

            {actions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Status wijzigen</p>
                {actions.map((a) => {
                  const action = updateQuoteStatus.bind(null, quote.id, a.status)
                  return (
                    <form key={a.status} action={action}>
                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          padding: '7px 12px',
                          background: a.danger ? 'var(--danger-muted)' : 'var(--bg-elevated)',
                          border: `1px solid ${a.danger ? 'rgba(239,68,68,0.2)' : 'var(--border-strong)'}`,
                          borderRadius: 8,
                          color: a.danger ? 'var(--danger)' : 'var(--text-primary)',
                          fontSize: 13,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          textAlign: 'left',
                        }}
                      >
                        {a.label}
                      </button>
                    </form>
                  )
                })}
              </div>
            )}

            <Divider />

            {/* Archive / delete */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Beheer</p>

              {isArchived ? (
                <ConfirmButton
                  action={unarchiveQuote.bind(null, id)}
                  label="Terugzetten uit archief"
                  confirmMessage="Offerte terugzetten uit archief?"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                />
              ) : (
                <ConfirmButton
                  action={archiveQuote.bind(null, id)}
                  label="Archiveren"
                  confirmMessage={`Offerte "${quote.quoteNumber}" archiveren? De offerte verdwijnt uit de normale lijst.`}
                  variant="warning"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                />
              )}

              <ConfirmButton
                action={deleteQuote.bind(null, id)}
                label="Definitief verwijderen"
                confirmMessage={
                  isAccepted
                    ? `⚠️ Waarschuwing: deze offerte is GEACCEPTEERD.\n\nWeet je zeker dat je offerte "${quote.quoteNumber}" definitief wilt verwijderen? Dit verwijdert ook de acceptatiegegevens en handtekening. Dit kan NIET ongedaan worden gemaakt.`
                    : `Offerte "${quote.quoteNumber}" definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`
                }
                variant="danger"
                style={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Offerte details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Nummer',     value: quote.quoteNumber },
                { label: 'Klant',      value: `${quote.customer.firstName} ${quote.customer.lastName}`, href: `/customers/${quote.customer.id}` },
                { label: 'Aangemaakt', value: formatDate(quote.createdAt) },
                { label: 'Geldig tot', value: formatDate(quote.validUntil) },
                { label: 'Verstuurd',  value: formatDate(quote.sentAt) },
              ].map(({ label, value, href }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                  {href ? (
                    <Link href={href} style={{ color: 'var(--text-link)', textAlign: 'right' }}>{value}</Link>
                  ) : (
                    <span style={{ color: 'var(--text-primary)', textAlign: 'right', fontFamily: label === 'Nummer' ? 'var(--font-mono)' : undefined, fontSize: label === 'Nummer' ? 11.5 : undefined }}>{value}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Publieke link" />
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginBottom: 10 }}>
              /offerte/{quote.publicToken}
            </div>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '7px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Offerte openen ↗
            </a>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
