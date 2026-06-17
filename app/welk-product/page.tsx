export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import BatterijCheck from '@/components/marketing/BatterijCheck'
import Link from 'next/link'
import Image from 'next/image'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'

export default async function WelkProductPage() {
  const products = await prisma.product.findMany({
    where: { active: true, shopVisible: true, category: 'BATTERY' },
    orderBy: { capacityKwh: 'asc' },
    select: {
      id: true, name: true, unitPrice: true, vatRate: true,
      imageUrl: true, category: true, capacityKwh: true,
    },
  })

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo-bespaarhulp.png" alt="Bespaarhulp Friesland" width={96} height={54} priority style={{ display: 'block' }} />
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/producten" style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '7px 14px' }}>Alle producten</Link>
            <Link href="/gratis-advies" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#0a5c35', padding: '7px 16px', borderRadius: 8, textDecoration: 'none' }}>Gratis advies</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #052e1a 0%, #0a5c35 100%)', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(245,196,66,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Gratis tool</span>
          <h1 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, color: '#fff', marginTop: 10, marginBottom: 12, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Welke batterijmaat past bij u?
          </h1>
          <p style={{ fontSize: 'clamp(13px,1.5vw,16px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
            Dezelfde berekening die wij in onze offertes gebruiken — op basis van uw teruglevering en paneelvermogen.
          </p>
        </div>
      </div>

      {/* Calculator */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,48px)' }}>
        <BatterijCheck products={products} variant="page" />
      </div>

      {/* Footer */}
      <footer style={{ background: '#03180d', marginTop: 64, padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', marginLeft: 7, textTransform: 'uppercase' }}>Friesland</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland</p>
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Medewerker login</Link>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  )
}
