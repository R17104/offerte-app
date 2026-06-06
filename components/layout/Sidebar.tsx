'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

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
      { href: '/getekende-offertes', label: 'Getekende offertes', icon: IconSigned },
    ],
  },
]

export default function Sidebar() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [path])

  return (
    <>
      {/* Hamburger toggle (mobile only) */}
      <button className="hamburger-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">
        {open ? (
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Overlay (mobile only) */}
      <div
        className={`sidebar-overlay${open ? ' overlay-open' : ''}`}
        onClick={() => setOpen(false)}
      />

    <aside
      className={`sidebar${open ? ' sidebar-open' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 220,
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
        {/* House logo */}
        <svg width="36" height="34" viewBox="0 0 36 34" fill="none" style={{ flexShrink: 0 }}>
          {/* Chimney */}
          <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill="#f5c442"/>
          {/* Roof */}
          <path d="M0 15L18 2L36 15H0Z" fill="#f5c442"/>
          {/* House body */}
          <rect x="2" y="15" width="32" height="19" rx="1.5" fill="#0a5c35"/>
          {/* Windows — left column */}
          <rect x="5" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.22"/>
          <rect x="5" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.22"/>
          {/* Windows — middle column */}
          <rect x="14" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.22"/>
          <rect x="14" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.22"/>
          {/* Crescent / sun on right */}
          <circle cx="28" cy="22" r="4.5" fill="#f5c442"/>
          <circle cx="26.5" cy="20.5" r="3" fill="#0a5c35"/>
        </svg>

        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
            <span style={{ color: '#0a5c35' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 3 }}>
            Friesland
          </div>
        </div>
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
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-muted)' : 'transparent',
                    fontWeight: active ? 600 : 400,
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
    </>
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

function IconSigned({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <rect x="2" y="1" width="12" height="14" rx="2" stroke={color} strokeWidth="1.3" />
      <path d="M5 5h6M5 8h3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 12c.5-.8 1-1.5 1.8-1.2.8.3.4 1.2 1 1.2s1-.8 1.7-1" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.5" cy="12.5" r="2.5" fill={color} opacity=".15" stroke={color} strokeWidth="1.2" />
      <path d="M11.5 12.5l.7.7 1.3-1.2" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
