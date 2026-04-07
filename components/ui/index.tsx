import Link from 'next/link'
import { CSSProperties, ReactNode } from 'react'

// ── Layout ──────────────────────────────────────────────────────────────────

export function PageContainer({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 28px', ...style }}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string
  description?: string
  action?: ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      {back && (
        <Link
          href={back.href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-tertiary)',
            fontSize: 13,
            marginBottom: 12,
            transition: 'color .12s',
          }}
          className="hover:text-[var(--text-secondary)]"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {back.label}
        </Link>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {title}
          </h1>
          {description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
              {description}
            </p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    </div>
  )
}

// ── Cards ────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  padding = 20,
}: {
  children: ReactNode
  style?: CSSProperties
  padding?: number | string
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
      {action}
    </div>
  )
}

export function Section({
  title,
  children,
  action,
}: {
  title?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          {title && (
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// ── Buttons ──────────────────────────────────────────────────────────────────

const btnBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '7px 14px',
  borderRadius: 'var(--radius-md)',
  fontSize: 13.5,
  fontWeight: 500,
  border: 'none',
  transition: 'background .12s, opacity .12s',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  textDecoration: 'none',
}

export function PrimaryButton({
  children,
  href,
  type = 'button',
  onClick,
  disabled,
  style,
}: {
  children: ReactNode
  href?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  style?: CSSProperties
}) {
  const s: CSSProperties = {
    ...btnBase,
    background: 'var(--accent)',
    color: '#fff',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }
  if (href) return <Link href={href} style={s}>{children}</Link>
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={s}>
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  href,
  type = 'button',
  onClick,
  disabled,
  style,
}: {
  children: ReactNode
  href?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  style?: CSSProperties
}) {
  const s: CSSProperties = {
    ...btnBase,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }
  if (href) return <Link href={href} style={s}>{children}</Link>
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={s}>
      {children}
    </button>
  )
}

export function DangerButton({
  children,
  type = 'button',
  onClick,
  disabled,
}: {
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: 'var(--danger-muted)',
        color: 'var(--danger)',
        border: '1px solid rgba(239,68,68,0.2)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function Badge({
  label,
  color,
  bg,
}: {
  label: string
  color: string
  bg: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: '0.01em',
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

// ── Form helpers ──────────────────────────────────────────────────────────────

export function FormGroup({
  label,
  children,
  hint,
  required,
  style,
}: {
  label: string
  children: ReactNode
  hint?: string
  required?: boolean
  style?: CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <label
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          letterSpacing: '0.01em',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{hint}</p>}
    </div>
  )
}

const inputStyle: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 13.5,
  outline: 'none',
  width: '100%',
  transition: 'border-color .12s',
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...props.style,
      }}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        resize: 'vertical',
        minHeight: 88,
        ...props.style,
      }}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%238b8b99' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 32,
        cursor: 'pointer',
        ...props.style,
      }}
    />
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

export function Table({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        {children}
      </table>
    </div>
  )
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead
      style={{
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </thead>
  )
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function Th({
  children,
  right,
}: {
  children?: ReactNode
  right?: boolean
}) {
  return (
    <th
      style={{
        padding: '9px 14px',
        textAlign: right ? 'right' : 'left',
        fontSize: 11.5,
        fontWeight: 500,
        color: 'var(--text-tertiary)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  right,
  muted,
  style,
}: {
  children?: ReactNode
  right?: boolean
  muted?: boolean
  style?: CSSProperties
}) {
  return (
    <td
      style={{
        padding: '11px 14px',
        textAlign: right ? 'right' : 'left',
        color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
        borderBottom: '1px solid var(--border)',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {children}
    </td>
  )
}

export function Tr({
  children,
  href,
  style,
}: {
  children: ReactNode
  href?: string
  style?: CSSProperties
}) {
  const s: CSSProperties = {
    transition: 'background .1s',
    ...style,
  }
  if (href) {
    return (
      <Link href={href} style={{ display: 'contents' }}>
        <tr
          style={s}
          className="hover:bg-[var(--bg-hover)] cursor-pointer"
        >
          {children}
        </tr>
      </Link>
    )
  }
  return <tr style={s}>{children}</tr>
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        gap: 12,
        textAlign: 'center',
      }}
    >
      {icon && (
        <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{icon}</div>
      )}
      <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>{title}</p>
      {description && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, maxWidth: 320 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Card padding="18px 20px">
      <p style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</p>}
    </Card>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
}
