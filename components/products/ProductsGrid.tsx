'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { bulkToggleProductActive, bulkDeleteProducts } from '@/lib/actions/product.actions'

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
  _count: { quoteLines: number }
}

const CATEGORIES: Record<string, { label: string; icon: string; gradient: string; iconBg: string }> = {
  BATTERY:        { label: 'Thuisbatterij', icon: '🔋', gradient: 'linear-gradient(145deg, #0f2444 0%, #1e3a5f 50%, #1d4ed8 100%)', iconBg: '#1e40af' },
  SOLAR:          { label: 'Zonnepanelen',  icon: '☀️', gradient: 'linear-gradient(145deg, #431407 0%, #9a3412 50%, #ea580c 100%)', iconBg: '#c2410c' },
  HEAT_PUMP:      { label: 'Warmtepomp',    icon: '🌡️', gradient: 'linear-gradient(145deg, #052e16 0%, #065f46 50%, #059669 100%)', iconBg: '#047857' },
  CHARGER:        { label: 'Laadpaal',      icon: '⚡',  gradient: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #6366f1 100%)', iconBg: '#4f46e5' },
  EMERGENCY_POWER:{ label: 'Noodstroom',   icon: '🔌',  gradient: 'linear-gradient(145deg, #1c0a00 0%, #7c2d12 50%, #dc2626 100%)', iconBg: '#b91c1c' },
  FULL_INSTALLATION:{ label: 'Volledige installatie', icon: '🏠', gradient: 'linear-gradient(145deg, #052e16 0%, #0a5c35 50%, #16a34a 100%)', iconBg: '#0a5c35' },
}

const FILTER_TABS = [
  { key: 'all', label: 'Alle producten' },
  { key: 'FULL_INSTALLATION', label: 'Volledige installaties' },
  { key: 'BATTERY',         label: 'Thuisbatterij' },
  { key: 'SOLAR',           label: 'Zonnepanelen' },
  { key: 'HEAT_PUMP',       label: 'Warmtepomp' },
  { key: 'CHARGER',         label: 'Laadpaal' },
  { key: 'EMERGENCY_POWER', label: 'Noodstroom' },
]

function ProductImage({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false)
  const cat = CATEGORIES[product.category ?? '']

  if (product.imageUrl && !imgError) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        onError={() => setImgError(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    )
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: cat?.gradient ?? 'linear-gradient(145deg, #1f2937, #374151)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
      }}>
        {cat?.icon ?? '📦'}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {cat?.label ?? 'Product'}
      </span>
    </div>
  )
}

const bulkBtnStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface)', color: 'var(--text-secondary)',
  fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
}

function exportProductsCSV(products: Product[]) {
  const headers = ['Naam', 'Categorie', 'Prijs excl. BTW', 'BTW%', 'Capaciteit (kWh)', 'Vermogen (kW)', 'Actief']
  const rows = products.map((p) => [
    p.name, p.category ?? '', String(p.unitPrice), String(p.vatRate),
    p.capacityKwh != null ? String(p.capacityKwh) : '',
    p.powerKw != null ? String(p.powerKw) : '',
    p.active ? 'Ja' : 'Nee',
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `producten-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function ProductsGrid({ products: initialProducts, isAdmin }: { products: Product[]; isAdmin: boolean }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setProducts(initialProducts) }, [initialProducts])

  const filtered = products.filter(p => {
    if (activeTab !== 'all' && p.category !== activeTab) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const priceIncl = (p: Product) => p.unitPrice * (1 + p.vatRate / 100)

  function toggle(id: string) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) } return n })
  }

  function run(action: () => Promise<void>, removeIds?: string[]) {
    startTransition(async () => {
      if (removeIds) setProducts((prev) => prev.filter((p) => !removeIds.includes(p.id)))
      setSelected(new Set())
      await action()
      router.refresh()
    })
  }

  function runUpdate(action: () => Promise<void>, updateIds: string[], active: boolean) {
    startTransition(async () => {
      setProducts((prev) => prev.map((p) => updateIds.includes(p.id) ? { ...p, active } : p))
      setSelected(new Set())
      await action()
      router.refresh()
    })
  }

  return (
    <div>
      {/* Zoekbalk */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="15" height="15" fill="none" viewBox="0 0 16 16">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op naam of omschrijving…"
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              borderRadius: 9, border: '1px solid var(--border-strong)',
              background: 'var(--bg-surface)', color: 'var(--text-primary)',
              fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          {filtered.length} product{filtered.length !== 1 ? 'en' : ''}
        </span>
      </div>

      {/* Categorie tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: isAdmin && selected.size > 0 ? 16 : 28, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'all'
            ? products.length
            : products.filter(p => p.category === tab.key).length
          if (tab.key !== 'all' && count === 0) return null
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: '1.5px solid',
                borderColor: activeTab === tab.key ? 'var(--accent)' : 'var(--border)',
                background: activeTab === tab.key ? 'var(--accent-muted)' : 'var(--bg-surface)',
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab.key !== 'all' && CATEGORIES[tab.key]?.icon} {tab.label}
              <span style={{
                fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: activeTab === tab.key ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeTab === tab.key ? '#fff' : 'var(--text-tertiary)',
                padding: '0 5px',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Bulk action bar (admin only) */}
      {isAdmin && selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          marginBottom: 20, padding: '10px 16px', borderRadius: 10,
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1.5px solid #86efac',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0a5c35', marginRight: 4 }}>
            {selected.size} geselecteerd
          </span>
          <button
            onClick={() => { const ids = [...selected]; runUpdate(() => bulkToggleProductActive(ids, true), ids, true) }}
            disabled={isPending} style={bulkBtnStyle}
          >
            Activeer
          </button>
          <button
            onClick={() => { const ids = [...selected]; runUpdate(() => bulkToggleProductActive(ids, false), ids, false) }}
            disabled={isPending} style={bulkBtnStyle}
          >
            Deactiveer
          </button>
          <button
            onClick={() => exportProductsCSV(products.filter((p) => selected.has(p.id)))}
            style={bulkBtnStyle}
          >
            Exporteer CSV
          </button>
          <button
            onClick={() => {
              if (!confirm(`${selected.size} product(en) verwijderen? Producten die in offertes worden gebruikt worden gedeactiveerd.`)) return
              const ids = [...selected]; run(() => bulkDeleteProducts(ids), ids)
            }}
            disabled={isPending}
            style={{ ...bulkBtnStyle, color: '#dc2626', borderColor: '#fca5a5' }}
          >
            Verwijder
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
          >
            Deselecteer alles
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
          Geen producten gevonden.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
          {filtered.map(p => {
            const cat = CATEGORIES[p.category ?? '']
            const inclPrice = priceIncl(p)
            const isSelected = selected.has(p.id)

            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-surface)', borderRadius: 14,
                  border: isSelected ? '2px solid #0a5c35' : '1px solid var(--border)',
                  overflow: 'hidden',
                  boxShadow: isSelected ? '0 0 0 3px rgba(10,92,53,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.1s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isSelected) { const el = e.currentTarget; el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; el.style.transform = 'translateY(-2px)' }}}
                onMouseLeave={e => { if (!isSelected) { const el = e.currentTarget; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; el.style.transform = '' }}}
              >
                {/* Product image */}
                <div style={{ height: 200, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <ProductImage product={p} />
                  {/* Checkbox (admin only) */}
                  {isAdmin && (
                    <div
                      onClick={(e) => { e.stopPropagation(); toggle(p.id) }}
                      style={{
                        position: 'absolute', top: 10, right: 10, zIndex: 10,
                        width: 22, height: 22, borderRadius: 6,
                        background: isSelected ? '#0a5c35' : 'rgba(255,255,255,0.9)',
                        border: `2px solid ${isSelected ? '#0a5c35' : 'rgba(0,0,0,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.1s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }}
                    >
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                  {/* Category badge */}
                  {cat && (
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      padding: '4px 10px', borderRadius: 20,
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                      fontSize: 11.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span>{cat.icon}</span> {cat.label}
                    </div>
                  )}
                  {!p.active && (
                    <div style={{
                      position: 'absolute', bottom: 12, right: 12,
                      padding: '3px 9px', borderRadius: 20,
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                      fontSize: 11, fontWeight: 700, color: '#fca5a5',
                    }}>
                      Inactief
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
                    {p.name}
                  </h3>

                  {p.description && (
                    <p style={{
                      fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 12,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                    }}>
                      {p.description}
                    </p>
                  )}

                  {/* Specs chips */}
                  {(p.capacityKwh || p.powerKw || p.warrantyYears) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {p.capacityKwh != null && (
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          {p.capacityKwh} kWh
                        </span>
                      )}
                      {p.powerKw != null && (
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          {p.powerKw} kW
                        </span>
                      )}
                      {p.warrantyYears != null && (
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          {p.warrantyYears} jr garantie
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto' }}>
                    {/* Price */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
                          {formatCurrency(inclPrice)}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                          incl. {p.vatRate}% btw
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                        {formatCurrency(p.unitPrice)} excl. btw
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href="/quotes/new"
                        style={{
                          flex: 1, padding: '9px 14px', borderRadius: 9,
                          background: 'var(--accent)', color: '#fff',
                          fontSize: 13, fontWeight: 700, textAlign: 'center',
                          textDecoration: 'none', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        + Offerte aanmaken
                      </Link>
                      {isAdmin && (
                        <Link
                          href={`/products/${p.id}/edit`}
                          style={{
                            padding: '9px 12px', borderRadius: 9,
                            border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                            textDecoration: 'none', display: 'flex', alignItems: 'center',
                          }}
                        >
                          Bewerken
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
