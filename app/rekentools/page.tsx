import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import BackupCalculator from '@/components/marketing/BackupCalculator'
import BillAdviceCalculator from '@/components/marketing/BillAdviceCalculator'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'

export const metadata: Metadata = {
  title: 'Rekentools — Bespaarhulp Friesland',
  description: 'Bereken gratis hoeveel u kunt besparen met zonnepanelen, een thuisbatterij of warmtepomp, en hoe lang u doordraait bij stroomuitval. Nederlandse tarieven en regels.',
  alternates: { canonical: '/rekentools' },
}

const gold = '#f5c442'
const dark = '#0a1410'

export default function RekentoolsPage() {
  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: dark, minHeight: '100vh', color: '#fff' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,20,16,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', background: '#fff', borderRadius: 9, padding: '5px 9px' }}>
              <Image src="/logo-bespaarhulp.png" alt="Bespaarhulp Friesland" width={57} height={32} priority style={{ display: 'block' }} />
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/producten" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '7px 12px' }}>Producten</Link>
            <Link href="/gratis-advies" style={{ fontSize: 13, fontWeight: 700, color: '#052e1a', background: gold, textDecoration: 'none', padding: '8px 16px', borderRadius: 8, whiteSpace: 'nowrap' }}>Gratis advies</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `radial-gradient(120% 100% at 50% 0%, rgba(10,92,53,0.55) 0%, ${dark} 70%)`, padding: 'clamp(48px,8vw,88px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: gold, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Gratis rekentools</span>
          <h1 style={{ fontSize: 'clamp(30px,5.5vw,52px)', fontWeight: 900, marginTop: 12, marginBottom: 16, letterSpacing: '-0.03em', lineHeight: 1.08 }}>
            Reken zelf uit wat u <span style={{ color: gold }}>bespaart</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,1.8vw,17px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
            Op basis van Nederlandse tarieven en regels. Geen verkooppraatjes — wij rekenen het eerlijk voor en u beslist.
          </p>
        </div>
      </section>

      {/* Tool 1 — Besparing uit maandbedrag */}
      <section style={{ padding: '0 clamp(16px,4vw,48px) clamp(40px,6vw,72px)' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 'clamp(24px,4vw,44px)' }}>
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Besparingscalculator</span>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}>Wat levert verduurzamen u op?</h2>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)', marginTop: 8, maxWidth: 560 }}>
              Vul uw maandbedrag in en zie direct welke stappen het meeste opleveren voor uw situatie.
            </p>
          </div>
          <BillAdviceCalculator />
        </div>
      </section>

      {/* Tool 2 — Backup-tijd */}
      <section style={{ padding: '0 clamp(16px,4vw,48px) clamp(56px,8vw,96px)' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 'clamp(24px,4vw,44px)' }}>
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Backup-tijd calculator</span>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}>Hoelang draait u door bij stroomuitval?</h2>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)', marginTop: 8, maxWidth: 560 }}>
              Kies uw batterij en de apparaten die u wilt blijven gebruiken. De berekening gaat uit van een backup-box met automatische omschakeling.
            </p>
          </div>
          <BackupCalculator />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland · KVK 71128174</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/producten" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Producten</Link>
            <Link href="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/voorwaarden" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Voorwaarden</Link>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  )
}
