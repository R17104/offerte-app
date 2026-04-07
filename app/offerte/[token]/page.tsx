export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import QuoteAcceptanceForm from '@/components/quotes/QuoteAcceptanceForm'
import PrintButton from '@/components/quotes/PrintButton'
import TermsAndConditions from '@/components/quotes/TermsAndConditions'
import { formatDate, formatCurrency } from '@/lib/utils'

type Props = { params: Promise<{ token: string }> }

const STATUS_NL: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Concept',       color: '#6b7280', bg: '#f3f4f6' },
  SENT:     { label: 'Verstuurd',     color: '#1d4ed8', bg: '#dbeafe' },
  ACCEPTED: { label: 'Geaccepteerd',  color: '#15803d', bg: '#dcfce7' },
  REJECTED: { label: 'Afgewezen',     color: '#b91c1c', bg: '#fee2e2' },
  EXPIRED:  { label: 'Verlopen',      color: '#92400e', bg: '#fef3c7' },
}

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: {
      customer: { include: { addresses: { where: { type: 'CORRESPONDENCE' }, take: 1 } } },
      lines: { orderBy: { sortOrder: 'asc' } },
      acceptance: true,
    },
  })

  if (!quote) notFound()

  const status = STATUS_NL[quote.status] ?? STATUS_NL.DRAFT
  const addr = quote.customer.addresses[0]
  const canInteract = ['DRAFT', 'SENT'].includes(quote.status)

  return (
    <>
      {/* Print button */}
      <div
        className="no-print"
        style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e5e7eb',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}
      >
        <PrintButton />
      </div>

      <div
        className="print-container"
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '48px 40px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#111827',
          background: '#fff',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          {/* Left: quote title + number */}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.02em' }}>
              Offerte
            </h1>
            <p style={{ fontSize: 16, color: '#6b7280', marginTop: 4, fontFamily: 'system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
              {quote.quoteNumber}
            </p>
          </div>

          {/* Right: logo + company info + status badge */}
          <div style={{ textAlign: 'right', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {/* Logo */}
            <img
              src="/logo-bespaarhulp.jpg"
              alt="Bespaarhulp Friesland"
              style={{
                height: 64,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {/* Contact details */}
            <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.8, margin: 0 }}>
              Sjouke van der Kooistrjitte 15 · 9088BB Wirdum<br />
              06-24992098 · www.bespaarhulpfriesland.nl<br />
              KVK: 71128174
            </p>
            {/* Status badge */}
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                background: status.bg,
                color: status.color,
              }}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
              Aan
            </p>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {quote.customer.firstName} {quote.customer.lastName}
            </p>
            {addr && (
              <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>
                <div>{addr.street} {addr.houseNumber}</div>
                <div>{addr.postalCode} {addr.city}</div>
                <div>{addr.country}</div>
              </div>
            )}
            {quote.customer.email && (
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{quote.customer.email}</p>
            )}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
              Details
            </p>
            {[
              { label: 'Offerte datum',  value: formatDate(quote.createdAt) },
              { label: 'Geldig tot',     value: formatDate(quote.validUntil) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#9ca3af', width: 120, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', fontFamily: 'system-ui, sans-serif', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #111827' }}>
          {quote.title}
        </h2>

        {/* Lines */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontFamily: 'system-ui, sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              {['Omschrijving', 'Aantal', 'Prijs excl. BTW', 'BTW%', 'Totaal incl. BTW'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 12px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: i > 0 ? 'right' : 'left',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line) => (
              <tr key={line.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px', fontSize: 14 }}>
                  <div style={{ fontWeight: 600 }}>{line.name}</div>
                  {line.description && (
                    <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>{line.description}</div>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: 14 }}>{line.quantity}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(line.unitPrice)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: 14, color: '#6b7280' }}>{line.vatRate}%</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
          <div style={{ width: 280, fontFamily: 'system-ui, sans-serif' }}>
            {[
              { label: 'Subtotaal',  value: formatCurrency(quote.subtotal) },
              ...(quote.discountAmount > 0 ? [{ label: 'Korting', value: `- ${formatCurrency(quote.discountAmount)}` }] : []),
              { label: 'BTW',        value: formatCurrency(quote.vatTotal) },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#4b5563', borderBottom: '1px solid #f3f4f6' }}
              >
                <span>{label}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 17, fontWeight: 700, color: '#111827' }}>
              <span>Totaal incl. BTW</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Included items */}
        {quote.includedItems && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '20px 24px', marginBottom: 28, fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Inbegrepen in dit aanbod
            </p>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
              {quote.includedItems.split('\n').map((line, i) => {
                const trimmed = line.trim()
                if (!trimmed) return null
                const isBullet = trimmed.startsWith('-')
                if (isBullet) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{trimmed.replace(/^-\s*/, '')}</span>
                    </div>
                  )
                }
                return <p key={i} style={{ fontWeight: 600, marginBottom: 6, color: '#111827' }}>{trimmed}</p>
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '16px 20px', marginBottom: 32, fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Opmerkingen
            </p>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>{quote.notes}</p>
          </div>
        )}

        {/* Already finalized */}
        {quote.status === 'ACCEPTED' && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '16px 20px', marginBottom: 32, fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#15803d' }}>
              ✓ Deze offerte is geaccepteerd op {formatDate(quote.acceptedAt)}
            </p>
            {quote.acceptance && (
              <p style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
                Ondertekend door {quote.acceptance.firstName} {quote.acceptance.lastName}
              </p>
            )}
          </div>
        )}

        {quote.status === 'REJECTED' && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '16px 20px', marginBottom: 32, fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>
              ✕ Deze offerte is afgewezen op {formatDate(quote.rejectedAt)}
            </p>
          </div>
        )}

        {quote.status === 'EXPIRED' && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '16px 20px', marginBottom: 32, fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>
              Deze offerte is verlopen.
            </p>
          </div>
        )}

        {/* Terms & Conditions */}
        <TermsAndConditions />

        {/* Acceptance form */}
        {canInteract && (
          <QuoteAcceptanceForm
            token={token}
            customerName={`${quote.customer.firstName} ${quote.customer.lastName}`}
          />
        )}

        {/* Company footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 16,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="/logo-bespaarhulp.jpg"
              alt="Bespaarhulp Friesland"
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            />
            <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.7 }}>
              Sjouke van der Kooistrjitte 15 · 9088BB Wirdum<br />
              06-24992098 · www.bespaarhulpfriesland.nl · KVK: 71128174
            </p>
          </div>
          <p style={{ fontSize: 11.5, color: '#d1d5db' }}>
            Offerte {quote.quoteNumber} · {new Date(quote.createdAt).getFullYear()}
          </p>
        </div>
      </div>
    </>
  )
}
