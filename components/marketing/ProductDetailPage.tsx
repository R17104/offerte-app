'use client'

import { useState } from 'react'
import Link from 'next/link'

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
  savingsKwhYear: number | null
  gasReductionM3Year: number | null
  notes: string | null
}

const CAT: Record<string, { label: string; icon: string; gradient: string }> = {
  BATTERY:         { label: 'Thuisbatterij', icon: '🔋', gradient: 'linear-gradient(145deg,#0f2444,#1d4ed8)' },
  SOLAR:           { label: 'Zonnepanelen',  icon: '☀️', gradient: 'linear-gradient(145deg,#78350f,#ea580c)' },
  HEAT_PUMP:       { label: 'Warmtepomp',    icon: '🌡️', gradient: 'linear-gradient(145deg,#052e16,#059669)' },
  CHARGER:         { label: 'Laadpaal',      icon: '⚡',  gradient: 'linear-gradient(145deg,#1e1b4b,#6366f1)' },
  EMERGENCY_POWER: { label: 'Noodstroom',   icon: '🔌',  gradient: 'linear-gradient(145deg,#450a0a,#dc2626)' },
}

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
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 32, boxSizing: 'border-box', background: '#f9fafb' }}
      />
    )
  }
  return (
    <div style={{ width: '100%', height: '100%', background: cat?.gradient ?? 'linear-gradient(145deg,#1f2937,#374151)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
        {cat?.icon ?? '📦'}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{cat?.label ?? 'Product'}</span>
    </div>
  )
}

export default function ProductDetailPage({ product }: { product: Product }) {
  const cat = CAT[product.category ?? '']
  const inclPrice = product.unitPrice * (1 + product.vatRate / 100)
  const articleNr = product.notes?.match(/Art\. nr\. (\S+)/)?.[1]

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <svg width="32" height="30" viewBox="0 0 36 34" fill="none">
              <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill="#f5c442"/>
              <path d="M0 15L18 2L36 15H0Z" fill="#f5c442"/>
              <rect x="2" y="15" width="32" height="19" rx="1.5" fill="#0a5c35"/>
              <rect x="5" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.28"/>
              <rect x="5" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.28"/>
              <rect x="14" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.28"/>
              <rect x="14" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.28"/>
              <circle cx="28" cy="22" r="4.5" fill="#f5c442"/>
              <circle cx="26.5" cy="20.5" r="3" fill="#0a5c35"/>
            </svg>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>
                <span style={{ color: '#0a5c35' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
              </div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Friesland</div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link href="/producten" style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '7px 14px' }}>Alle producten</Link>
            <Link href="/#contact" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#0a5c35', padding: '7px 16px', borderRadius: 8, textDecoration: 'none' }}>
              Gratis advies
            </Link>
          </div>
        </div>
      </header>

      {/* Trust bar */}
      <div style={{ background: '#0a5c35', padding: '10px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 'clamp(16px,3vw,40px)', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Gratis en vrijblijvend advies','Gecertificeerde installateurs','Heel Friesland','Geen verkoopdruk'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 17, height: 17, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,48px)' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#9ca3af', marginBottom: 24 }}>
          <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/producten" style={{ color: '#9ca3af', textDecoration: 'none' }}>Producten</Link>
          <span>/</span>
          <span style={{ color: '#374151' }}>{product.name}</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,480px)', gap: 48, alignItems: 'start' }}>

          {/* Image panel */}
          <div>
            <div style={{ aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <ProductImage product={product} />
            </div>
            {cat && (
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 20, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span>{cat.icon}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0a5c35' }}>{cat.label}</span>
              </div>
            )}
            {articleNr && (
              <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8 }}>Art. nr. {articleNr}</p>
            )}
          </div>

          {/* Info panel */}
          <div>
            <h1 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 16 }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{fmt(inclPrice)}</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{fmt(product.unitPrice)} excl. {product.vatRate}% btw</div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link
                  href="/#contact"
                  style={{ display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 10, background: '#0a5c35', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
                >
                  Vraag offerte aan
                </Link>
                <Link
                  href="/#contact"
                  style={{ display: 'block', textAlign: 'center', padding: '11px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
                >
                  Gratis adviesgesprek inplannen
                </Link>
              </div>
            </div>

            {/* Specs */}
            {(product.capacityKwh || product.powerKw || product.warrantyYears || product.savingsKwhYear || product.gasReductionM3Year) && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Specificaties</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  {product.capacityKwh != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Capaciteit</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.capacityKwh} kWh</span>
                    </div>
                  )}
                  {product.powerKw != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Vermogen</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.powerKw} kW</span>
                    </div>
                  )}
                  {product.warrantyYears != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Garantie</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.warrantyYears} jaar</span>
                    </div>
                  )}
                  {product.savingsKwhYear != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Stroombesparing/jaar</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.savingsKwhYear} kWh</span>
                    </div>
                  )}
                  {product.gasReductionM3Year != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Gasbesparing/jaar</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.gasReductionM3Year} m³</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* USPs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Professionele installatie inbegrepen',
                'Inclusief inbedrijfstelling en uitleg',
                '10 jaar garantie op installatie',
                'Subsidies en BTW-teruggaaf worden geregeld',
              ].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#0a5c35', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div style={{ marginTop: 48, maxWidth: 800 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 14 }}>Productomschrijving</h2>
            <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.75 }}>{product.description}</p>
          </div>
        )}

        {/* CTA block */}
        <div style={{ marginTop: 56, background: 'linear-gradient(160deg,#052e1a,#0a5c35)', borderRadius: 20, padding: 'clamp(28px,4vw,48px)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 900, color: '#fff', maxWidth: 600 }}>
            Interesse in {product.name}?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 500, lineHeight: 1.65 }}>
            Onze adviseurs berekenen gratis of dit product rendabel is voor uw situatie. Geen verkoopdruk, gewoon eerlijk advies.
          </p>
          <Link
            href="/#contact"
            style={{ padding: '14px 32px', borderRadius: 12, background: '#f5c442', color: '#052e1a', fontSize: 15, fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}
          >
            Gratis advies aanvragen →
          </Link>
          <Link href="/producten" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            ← Terug naar alle producten
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#03180d', marginTop: 64, padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', marginLeft: 7, textTransform: 'uppercase' }}>Friesland</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland · Onafhankelijk energieadvies</p>
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Medewerker login</Link>
        </div>
      </footer>
    </div>
  )
}
