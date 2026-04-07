'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createQuote, type QuoteLineInput } from '@/lib/actions/quote.actions'
import { formatCurrency, calculateQuoteTotals } from '@/lib/utils'

type Product = {
  id: string
  name: string
  description: string | null
  unitPrice: number
  vatRate: number
  defaultQty: number | null
}

type Props = {
  customerId: string
  customers: { id: string; firstName: string; lastName: string }[]
  products: Product[]
  preselectedCustomerId?: string
}

type Line = {
  key: string
  productId: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

const DEFAULT_INCLUDED_ITEMS = `Dit aanbod is inclusief:
- Batterij en omvormer(s) zoals genoemd in deze offerte
- Montage & Transportkosten
- Klein materiaal
- Werkschakelaar en extra groep in de meterkast (indien noodzakelijk)
- Bekabeling (tot 20 meter)`

let keyCounter = 0
function newKey() { return String(++keyCounter) }

function emptyLine(): Line {
  return {
    key: newKey(),
    productId: '',
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: 21,
  }
}

export default function QuoteLineEditor({ customerId: defaultCustomerId, customers, products, preselectedCustomerId }: Props) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState(preselectedCustomerId || defaultCustomerId || '')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [includedItems, setIncludedItems] = useState(DEFAULT_INCLUDED_ITEMS)
  const [validUntil, setValidUntil] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [lines, setLines] = useState<Line[]>([emptyLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateLine = useCallback((key: string, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    )
  }, [])

  const addLine = () => setLines((prev) => [...prev, emptyLine()])
  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key))

  const pickProduct = (key: string, productId: string) => {
    const p = products.find((p) => p.id === productId)
    if (!p) return updateLine(key, { productId: '' })
    updateLine(key, {
      productId: p.id,
      name: p.name,
      description: p.description ?? '',
      unitPrice: p.unitPrice,
      vatRate: p.vatRate,
      quantity: p.defaultQty ?? 1,
    })
  }

  const { subtotal, vatTotal, total } = calculateQuoteTotals(
    lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate })),
    discountAmount,
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!customerId) return setError('Selecteer een klant')
    if (!title.trim()) return setError('Vul een titel in')
    if (lines.some((l) => !l.name.trim())) return setError('Vul alle regelomschrijvingen in')

    setSaving(true)
    try {
      const input: Parameters<typeof createQuote>[0] = {
        customerId,
        title,
        notes: notes || undefined,
        includedItems: includedItems || undefined,
        validUntil: validUntil || undefined,
        discountAmount,
        lines: lines.map((l): QuoteLineInput => ({
          productId: l.productId || undefined,
          name: l.name,
          description: l.description || undefined,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
        })),
      }
      const result = await createQuote(input)
      router.push(`/quotes/${result.id}`)
    } catch (err: unknown) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    }
  }

  const s = styles

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ background: 'var(--danger-muted)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Quote meta */}
      <div style={s.card}>
        <p style={s.cardTitle}>Offertegegevens</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={s.field}>
            <label style={s.label}>Klant <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              style={s.input}
            >
              <option value="">— Selecteer klant —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>Titel <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Webdesign project 2026"
              required
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Geldig tot</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Korting (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountAmount || ''}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={s.input}
            />
          </div>
          <div style={{ ...s.field, gridColumn: '1 / -1' }}>
            <label style={s.label}>Notities (intern)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interne opmerkingen bij deze offerte"
              rows={2}
              style={{ ...s.input, resize: 'vertical' }}
            />
          </div>
          <div style={{ ...s.field, gridColumn: '1 / -1' }}>
            <label style={s.label}>Inbegrepen in dit aanbod</label>
            <textarea
              value={includedItems}
              onChange={(e) => setIncludedItems(e.target.value)}
              placeholder="Wat is inbegrepen in deze offerte..."
              rows={6}
              style={{ ...s.input, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Wordt zichtbaar voor de klant op de offertepagina. Gebruik - voor opsommingspunten.
            </span>
          </div>
        </div>
      </div>

      {/* Lines */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={s.cardTitle}>Productregels</p>
          <button
            type="button"
            onClick={addLine}
            style={{
              padding: '5px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            + Regel toevoegen
          </button>
        </div>

        {/* Header */}
        <div style={s.lineHeader}>
          <span style={{ flex: '0 0 200px' }}>Product</span>
          <span style={{ flex: 1 }}>Omschrijving</span>
          <span style={{ width: 70, textAlign: 'right' }}>Aantal</span>
          <span style={{ width: 110, textAlign: 'right' }}>Prijs excl.</span>
          <span style={{ width: 70, textAlign: 'right' }}>BTW%</span>
          <span style={{ width: 110, textAlign: 'right' }}>Totaal</span>
          <span style={{ width: 28 }}></span>
        </div>

        {lines.map((line) => {
          const lineTotal = line.quantity * line.unitPrice * (1 + line.vatRate / 100)
          return (
            <div key={line.key} style={s.lineRow}>
              {/* Product picker */}
              <div style={{ flex: '0 0 200px' }}>
                <select
                  value={line.productId}
                  onChange={(e) => pickProduct(line.key, e.target.value)}
                  style={{ ...s.input, padding: '6px 8px', fontSize: 12.5 }}
                >
                  <option value="">Handmatig</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Name / description */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input
                  value={line.name}
                  onChange={(e) => updateLine(line.key, { name: e.target.value })}
                  placeholder="Naam *"
                  required
                  style={{ ...s.input, padding: '6px 8px', fontSize: 12.5 }}
                />
                <input
                  value={line.description}
                  onChange={(e) => updateLine(line.key, { description: e.target.value })}
                  placeholder="Omschrijving"
                  style={{ ...s.input, padding: '5px 8px', fontSize: 11.5 }}
                />
              </div>

              {/* Quantity */}
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.quantity}
                onChange={(e) => updateLine(line.key, { quantity: parseFloat(e.target.value) || 0 })}
                style={{ ...s.input, width: 70, textAlign: 'right', padding: '6px 8px', fontSize: 12.5 }}
              />

              {/* Unit price */}
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => updateLine(line.key, { unitPrice: parseFloat(e.target.value) || 0 })}
                style={{ ...s.input, width: 110, textAlign: 'right', padding: '6px 8px', fontSize: 12.5 }}
              />

              {/* VAT */}
              <select
                value={line.vatRate}
                onChange={(e) => updateLine(line.key, { vatRate: parseFloat(e.target.value) })}
                style={{ ...s.input, width: 70, padding: '6px 6px', fontSize: 12.5 }}
              >
                <option value="0">0%</option>
                <option value="9">9%</option>
                <option value="21">21%</option>
              </select>

              {/* Line total */}
              <span style={{ width: 110, textAlign: 'right', fontSize: 13, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(lineTotal)}
              </span>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                disabled={lines.length === 1}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: lines.length === 1 ? 'not-allowed' : 'pointer',
                  borderRadius: 4,
                  flexShrink: 0,
                  opacity: lines.length === 1 ? 0.3 : 1,
                }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                  <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ ...s.card, width: 320 }}>
          {[
            { label: 'Subtotaal',  value: formatCurrency(subtotal) },
            { label: 'Korting',    value: discountAmount > 0 ? `- ${formatCurrency(discountAmount)}` : '—' },
            { label: 'BTW',        value: formatCurrency(vatTotal) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
              <span>{label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            <span>Totaal incl. BTW</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '8px 18px',
            background: saving ? 'var(--bg-elevated)' : 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Opslaan...' : 'Offerte aanmaken'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '8px 14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          Annuleren
        </button>
      </div>
    </form>
  )
}

const styles = {
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 20,
  } as React.CSSProperties,
  cardTitle: {
    fontWeight: 600,
    fontSize: 13.5,
    marginBottom: 16,
  } as React.CSSProperties,
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  } as React.CSSProperties,
  label: {
    fontSize: 12.5,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  input: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: 13.5,
    outline: 'none',
    width: '100%',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  lineHeader: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    padding: '6px 0 10px',
    borderBottom: '1px solid var(--border)',
    marginBottom: 10,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  lineRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  } as React.CSSProperties,
}
