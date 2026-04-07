'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  {
    label: 'Algemeen',
    items: [
      { href: '/', label: 'Dashboard', icon: IconGrid },
    ],
  },
  {
    label: 'Beheer',
    items: [
      { href: '/customers', label: 'Klanten', icon: IconUsers },
      { href: '/products', label: 'Producten', icon: IconBox },
      { href: '/quotes', label: 'Offertes', icon: IconDoc },
    ],
  },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-w)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 'var(--topbar-h)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          borderBottom: '1px solid var(--border)',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            background: 'var(--accent)',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 13 13">
            <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" />
            <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" opacity=".6" />
            <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" opacity=".6" />
            <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" opacity=".4" />
          </svg>
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.02em' }}>
          QuoteApp
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {nav.map((group) => (
          <div key={group.label} style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.07em',
                color: 'var(--text-tertiary)',
                padding: '0 8px',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              {group.label}
            </p>

            {group.items.map((item) => {
              const active =
                item.href === '/'
                  ? path === '/'
                  : path.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-md)',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: active ? 'var(--bg-active)' : 'transparent',
                    fontWeight: active ? 500 : 400,
                    fontSize: 13.5,
                    transition: 'all 0.1s',
                    marginBottom: 1,
                  }}
                >
                  <item.icon
                    size={15}
                    color={active ? 'var(--accent)' : 'var(--text-tertiary)'}
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border)',
          fontSize: 11.5,
          color: 'var(--text-tertiary)',
          flexShrink: 0,
        }}
      >
        v0.1.0 — beta
      </div>
    </aside>
  )
}

function IconGrid({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.3" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.3" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.3" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.3" />
    </svg>
  )
}

function IconUsers({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <circle cx="6" cy="5" r="2.5" stroke={color} strokeWidth="1.3" />
      <path d="M1 13c0-2.76 2.24-5 5-5h0c2.76 0 5 2.24 5 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 7.5c1.38 0 2.5 1.12 2.5 2.5v2.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 3.5a2 2 0 010 3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconBox({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <path d="M2 5.5l6-3 6 3v5l-6 3-6-3v-5z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M2 5.5l6 3 6-3M8 8.5v5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconDoc({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <rect x="2" y="1" width="12" height="14" rx="2" stroke={color} strokeWidth="1.3" />
      <path d="M5 5h6M5 8h6M5 11h4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
