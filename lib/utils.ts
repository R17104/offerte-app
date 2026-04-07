export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

export type LineInput = {
  quantity: number
  unitPrice: number
  vatRate: number
}

export function calculateLineTotals(line: LineInput) {
  const lineBase = line.quantity * line.unitPrice
  const lineVat = lineBase * (line.vatRate / 100)
  const lineTotal = lineBase + lineVat
  return { lineBase, lineVat, lineTotal }
}

export function calculateQuoteTotals(
  lines: LineInput[],
  discountAmount: number = 0,
) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const ratio = subtotal > 0 ? afterDiscount / subtotal : 1

  const vatTotal = lines.reduce((s, l) => {
    const base = l.quantity * l.unitPrice * ratio
    return s + base * (l.vatRate / 100)
  }, 0)

  const total = afterDiscount + vatTotal
  return { subtotal, vatTotal, total }
}

export const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  DRAFT:    { label: 'Concept',       color: 'var(--text-secondary)', bg: 'var(--bg-elevated)' },
  SENT:     { label: 'Verstuurd',     color: '#60a5fa',               bg: 'rgba(59,130,246,0.1)' },
  ACCEPTED: { label: 'Geaccepteerd',  color: 'var(--success)',        bg: 'var(--success-muted)' },
  REJECTED: { label: 'Afgewezen',     color: 'var(--danger)',         bg: 'var(--danger-muted)' },
  EXPIRED:  { label: 'Verlopen',      color: 'var(--warning)',        bg: 'var(--warning-muted)' },
}
