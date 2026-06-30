'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type NavItem = { href: string; label: string; icon: (p: { size?: number; color?: string }) => React.ReactNode; adminOnly?: boolean }

const nav: { label: string; items: NavItem[] }[] = [
  {
    label: 'Algemeen',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: IconGrid },
      { href: '/taken', label: 'Taken', icon: IconCheck },
      { href: '/afspraken', label: 'Afspraken', icon: IconCalendar },
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
  {
    label: 'Leads',
    items: [
      // SEO- en TikTok-leads komen alleen bij admin binnen
      { href: '/seo-leads', label: 'SEO Leads', icon: IconGlobe, adminOnly: true },
      { href: '/tiktok-leads', label: 'TikTok Leads', icon: IconTikTok, adminOnly: true },
      { href: '/leads', label: 'Alle leads', icon: IconLeads },
      { href: '/lead-mailing', label: 'Lead mailing', icon: IconMail },
    ],
  },
]

export default function Sidebar({ role }: { role?: string }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const isAdmin = role === 'ADMIN'

  // Verberg admin-only items voor niet-admins; laat lege groepen weg.
  const visibleNav = nav
    .map((group) => ({ ...group, items: group.items.filter((i) => isAdmin || !i.adminOnly) }))
    .filter((group) => group.items.length > 0)

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
          {/* Windows, left column */}
          <rect x="5" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.22"/>
          <rect x="5" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.22"/>
          {/* Windows, middle column */}
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
        {visibleNav.map((group) => (
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
                item.href === '/dashboard'
                  ? path === '/dashboard'
                  : path.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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

      {/* Account / instellingen */}
      <div style={{ padding: '8px 8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {[
          { href: '/account',      label: 'Mijn account',  icon: IconPerson },
          { href: '/instellingen', label: 'Instellingen',  icon: IconSettings },
        ].map((item) => {
          const active = path.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '6px 8px', borderRadius: 'var(--radius-md)',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-muted)' : 'transparent',
                fontWeight: active ? 600 : 400, fontSize: 13.5,
                transition: 'all 0.1s', marginBottom: 1,
              }}
            >
              <item.icon size={15} color={active ? 'var(--accent)' : 'var(--text-tertiary)'} />
              {item.label}
            </Link>
          )
        })}
        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', padding: '6px 8px 2px' }}>v0.1.0, beta</p>
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

function IconGlobe({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3" />
      <path d="M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5M8 1.5c2 2 3 4 3 6.5s-1 4.5-3 6.5M1.5 8h13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconTikTok({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <path d="M10 2c.2 1.4 1.1 2.5 2.5 2.8v1.7c-.9 0-1.8-.3-2.5-.8v3.8a3.4 3.4 0 11-3.4-3.4c.2 0 .3 0 .5.05v1.8a1.7 1.7 0 101.2 1.6V2H10z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCheck({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <path d="M2 4h7M2 8h7M2 12h4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 11.5l1.6 1.6 3-3.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCalendar({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <rect x="2" y="3" width="12" height="11" rx="2" stroke={color} strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconMail({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <rect x="1.5" y="3" width="13" height="10" rx="2" stroke={color} strokeWidth="1.3" />
      <path d="M2 4.5l6 4 6-4" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconLeads({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="5" r="2.5" stroke={color} strokeWidth="1.3" />
      <path d="M2.5 13c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 9.5l1.5 1.5-1.5 1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPerson({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="5.5" r="2.5" stroke={color} strokeWidth="1.3" />
      <path d="M2.5 13.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconSettings({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.3" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
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
