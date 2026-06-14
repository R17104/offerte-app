'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'
import { useWindowWidth } from '@/lib/hooks/useWindowWidth'

type Product = {
  id: string
  name: string
  description: string | null
  unitPrice: number
  vatRate: number
  imageUrl: string | null
  category: string | null
  capacityKwh: number | null
  powerKw: number | null
  warrantyYears: number | null
  active: boolean
  isMaatwerk: boolean
}

const CAT: Record<string, { label: string; icon: string; gradient: string }> = {
  BATTERY:         { label: 'Thuisbatterij', icon: '🔋', gradient: 'linear-gradient(145deg,#0f2444,#1d4ed8)' },
  SOLAR:           { label: 'Zonnepanelen',  icon: '☀️', gradient: 'linear-gradient(145deg,#78350f,#ea580c)' },
  HEAT_PUMP:       { label: 'Warmtepomp',    icon: '🌡️', gradient: 'linear-gradient(145deg,#052e16,#059669)' },
  CHARGER:         { label: 'Laadpaal',      icon: '⚡',  gradient: 'linear-gradient(145deg,#1e1b4b,#6366f1)' },
  EMERGENCY_POWER: { label: 'Noodstroom',   icon: '🔌',  gradient: 'linear-gradient(145deg,#450a0a,#dc2626)' },
}

const TABS = [
  { key: 'all',            label: 'Alles' },
  { key: 'BATTERY',        label: 'Thuisbatterij' },
  { key: 'SOLAR',          label: 'Zonnepanelen' },
  { key: 'HEAT_PUMP',      label: 'Warmtepomp' },
  { key: 'CHARGER',        label: 'Laadpaal' },
  { key: 'EMERGENCY_POWER',label: 'Noodstroom' },
]

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

function ProductImage({ product }: { product: Product }) {
  const [err, setErr] = useState(false)
  const cat = CAT[product.category ?? '']
  if (product.imageUrl && !err) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: 16, boxSizing: 'border-box', background: '#f9fafb' }}
      />
    )
  }
  return (
    <div style={{ width: '100%', height: '100%', background: cat?.gradient ?? 'linear-gradient(145deg,#1f2937,#374151)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>
        {cat?.icon ?? '📦'}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{cat?.label ?? 'Product'}</span>
    </div>
  )
}

const SORT_OPTIONS = [
  { key: 'default',    label: 'Aanbevolen' },
  { key: 'price-asc',  label: 'Prijs: laag → hoog' },
  { key: 'price-desc', label: 'Prijs: hoog → laag' },
  { key: 'name',       label: 'Naam (A-Z)' },
]

export default function ShopPage({ products, initialCategory }: { products: Product[]; initialCategory?: string }) {
  const w = useWindowWidth()
  const isMobile = w < 768
  const validCats = Object.keys(CAT)
  const [tab, setTab] = useState(initialCategory && validCats.includes(initialCategory) ? initialCategory : 'all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')

  const visible = products.filter(p => {
    if (!p.active) return false
    if (tab !== 'all' && p.category !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => {
    if (sort === 'price-asc')  return a.unitPrice - b.unitPrice
    if (sort === 'price-desc') return b.unitPrice - a.unitPrice
    if (sort === 'name')       return a.name.localeCompare(b.name, 'nl')
    return 0
  })

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo-bespaarhulp.jpg" alt="Bespaarhulp Friesland" width={isMobile ? 150 : 200} height={isMobile ? 38 : 50} priority style={{ display: 'block' }} />
          </Link>

          {/* Search — verborgen op mobiel (staat hieronder) */}
          {!isMobile && (
            <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} width="15" height="15" fill="none" viewBox="0 0 16 16">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek op naam of type..."
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link href="/#contact" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#0a5c35', padding: '7px 14px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Gratis advies
            </Link>
            {!isMobile && <Link href="/login" style={{ fontSize: 12.5, color: '#9ca3af', textDecoration: 'none', padding: '7px 10px' }}>Login</Link>}
          </div>
        </div>
      </header>

      {/* Trust bar */}
      <div style={{ background: '#0a5c35', padding: '10px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 'clamp(16px,3vw,40px)', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '✓', text: 'Gratis en vrijblijvend advies' },
            { icon: '✓', text: 'Gecertificeerde installateurs' },
            { icon: '✓', text: 'Heel Friesland' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 17, height: 17, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,48px)' }}>

        {/* Page title + breadcrumb */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#9ca3af', marginBottom: 10 }}>
            <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#374151' }}>Producten</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
                Productcatalogus
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Levering én installatie door heel Friesland · {visible.length} product{visible.length !== 1 ? 'en' : ''}
              </p>
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontFamily: 'inherit', color: '#374151', cursor: 'pointer', outline: 'none' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>

          {/* Merkenbalk */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Wij leveren o.a.</span>
            {['AlphaESS', 'Sigenergy', 'WeHeat'].map(brand => (
              <span key={brand} style={{ fontSize: 13.5, fontWeight: 800, color: '#374151', padding: '4px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7 }}>
                {brand}
              </span>
            ))}
          </div>
        </div>

        {/* Zoekbalk op mobiel */}
        {isMobile && (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} width="15" height="15" fill="none" viewBox="0 0 16 16">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op naam of type..."
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827' }}
            />
          </div>
        )}

        {/* Categorie filter: horizontaal scrollbaar op mobiel, sidebar op desktop */}
        {isMobile ? (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
            {TABS.map(t => {
              const count = t.key === 'all' ? products.filter(p => p.active).length : products.filter(p => p.active && p.category === t.key).length
              if (t.key !== 'all' && count === 0) return null
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: tab === t.key ? '#0a5c35' : '#f3f4f6',
                    color: tab === t.key ? '#fff' : '#374151',
                    fontWeight: tab === t.key ? 700 : 500, fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
                  {t.key !== 'all' && <span>{CAT[t.key]?.icon}</span>}
                  {t.label}
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{count}</span>
                </button>
              )
            })}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

          {/* Sidebar filters — alleen op desktop */}
          <aside style={{ width: isMobile ? 0 : 220, flexShrink: 0, display: isMobile ? 'none' : 'block' }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Categorie</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {TABS.map(t => {
                const count = t.key === 'all' ? products.filter(p => p.active).length : products.filter(p => p.active && p.category === t.key).length
                if (t.key !== 'all' && count === 0) return null
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: tab === t.key ? '#f0fdf4' : 'transparent',
                      color: tab === t.key ? '#0a5c35' : '#374151',
                      fontWeight: tab === t.key ? 700 : 400, fontSize: 13.5, fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.key !== 'all' && <span>{CAT[t.key]?.icon}</span>}
                      {t.label}
                    </span>
                    <span style={{ fontSize: 12, color: tab === t.key ? '#0a5c35' : '#9ca3af', fontWeight: 600 }}>{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Batterij check block */}
            <div style={{ marginTop: 28, background: '#f0fdf4', borderRadius: 12, padding: '16px 14px', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0a5c35', marginBottom: 6 }}>Welke batterij past bij u?</p>
              <p style={{ fontSize: 12.5, color: '#4b7c5e', lineHeight: 1.6, marginBottom: 12 }}>
                Doe de gratis batterijcheck en ontdek in 2 minuten welk formaat het beste bij uw situatie past.
              </p>
              <Link href="/welk-product" style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: 8, background: '#0a5c35', color: '#fff', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                Start de batterijcheck →
              </Link>
              <Link href="/gratis-advies" style={{ display: 'block', textAlign: 'center', padding: '7px', borderRadius: 8, border: '1px solid #bbf7d0', color: '#0a5c35', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginTop: 6 }}>
                Of vraag gratis advies
              </Link>
            </div>

            {/* Pricing note */}
            <div style={{ marginTop: 14, background: '#fffbeb', borderRadius: 10, padding: '12px 14px', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.55 }}>
                💡 <strong>Prijzen zijn exclusief installatie.</strong> Installatiekosten worden besproken in het gratis adviesgesprek.
              </p>
            </div>
          </aside>

          {/* Product grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: 14 }}>
                Geen producten gevonden{search && ` voor "${search}"`}.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {visible.map(p => {
                  const cat = CAT[p.category ?? '']
                  const inclPrice = p.unitPrice * (1 + p.vatRate / 100)
                  const isBestSeller = p.name.includes('9,3 kWh') || p.name.includes('9.3 kWh')
                  const isPopular = p.name.includes('9.3kWh') || p.name.includes('9,3kWh')

                  return (
                    <div
                      key={p.id}
                      style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s, transform 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; el.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; el.style.transform = '' }}
                    >
                      {/* Image */}
                      <Link href={`/producten/${p.id}`} style={{ height: 200, overflow: 'hidden', position: 'relative', background: '#f9fafb', flexShrink: 0, display: 'block', textDecoration: 'none' }}>
                        <ProductImage product={p} />
                        {cat && (
                          <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', borderRadius: 20, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {cat.icon} {cat.label}
                          </div>
                        )}
                        {isBestSeller && (
                          <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 9px', borderRadius: 20, background: '#f5c442', fontSize: 10.5, fontWeight: 800, color: '#052e1a' }}>
                            ★ Meest gekozen
                          </div>
                        )}
                        {isPopular && !isBestSeller && (
                          <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 9px', borderRadius: 20, background: '#0a5c35', fontSize: 10.5, fontWeight: 800, color: '#fff' }}>
                            Populair
                          </div>
                        )}
                      </Link>

                      {/* Body */}
                      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Voorraad-indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.isMaatwerk ? '#f59e0b' : '#16a34a', flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: p.isMaatwerk ? '#b45309' : '#15803d' }}>
                            {p.isMaatwerk ? 'Op aanvraag · prijs na schouw' : 'Leverbaar · installatie in ±2 weken'}
                          </span>
                        </div>
                        <Link href={`/producten/${p.id}`} style={{ textDecoration: 'none' }}>
                          <h2 style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 6, lineHeight: 1.35 }}>
                            {p.name}
                          </h2>
                        </Link>

                        {p.description && (
                          <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                            {p.description}
                          </p>
                        )}

                        {/* Specs */}
                        {(p.capacityKwh || p.powerKw || p.warrantyYears) && (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                            {p.capacityKwh != null && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>{p.capacityKwh} kWh</span>}
                            {p.powerKw != null && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>{p.powerKw} kW</span>}
                            {p.warrantyYears != null && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>{p.warrantyYears} jr garantie</span>}
                          </div>
                        )}

                        <div style={{ marginTop: 'auto' }}>
                          {/* Price */}
                          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, marginBottom: 12 }}>
                            {p.isMaatwerk ? (
                              <>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#0a5c35', lineHeight: 1 }}>Maatwerk</div>
                                <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>Prijs bepaald na schouw</div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginRight: 4 }}>vanaf</span>
                                  {fmt(p.unitPrice)}
                                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9ca3af', marginLeft: 5 }}>excl. btw</span>
                                </div>
                                <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{fmt(inclPrice)} incl. {p.vatRate}% btw</div>
                              </>
                            )}
                          </div>

                          {/* CTA */}
                          <div style={{ display: 'flex', gap: 7 }}>
                            <Link
                              href={`/offerte-aanvragen?product=${p.id}`}
                              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: '#0a5c35', color: '#fff', fontSize: 12.5, fontWeight: 700, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                            >
                              Vraag offerte aan
                            </Link>
                            <Link
                              href={`/producten/${p.id}`}
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 12.5, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
                            >
                              Meer info
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#03180d', marginTop: 64, padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', marginLeft: 7, textTransform: 'uppercase' }}>Friesland</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland · KVK 71128174</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/voorwaarden" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Voorwaarden</Link>
            <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Medewerker login</Link>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  )
}
