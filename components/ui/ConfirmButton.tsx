'use client'

import { useState } from 'react'
import { CSSProperties } from 'react'

type Variant = 'default' | 'danger' | 'warning'

const variantStyles: Record<Variant, CSSProperties> = {
  default: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
  },
  danger: {
    background: 'var(--danger-muted)',
    color: 'var(--danger)',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  warning: {
    background: 'var(--warning-muted)',
    color: 'var(--warning)',
    border: '1px solid rgba(245,158,11,0.2)',
  },
}

type Props = {
  action: () => Promise<void> | void
  label: string
  confirmMessage: string
  variant?: Variant
  disabled?: boolean
  style?: CSSProperties
  size?: 'sm' | 'md'
}

export default function ConfirmButton({
  action,
  label,
  confirmMessage,
  variant = 'default',
  disabled,
  style,
  size = 'md',
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(confirmMessage)) return
    setLoading(true)
    try {
      await action()
    } catch (err: unknown) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : 'Er is een fout opgetreden'
      alert(msg)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'sm' ? '4px 10px' : '6px 13px',
        borderRadius: 'var(--radius-md)',
        fontSize: size === 'sm' ? 12 : 13,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        transition: 'opacity .12s',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {loading ? '...' : label}
    </button>
  )
}
