import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Algemene voorwaarden — Bespaarhulp Friesland',
  description: 'De algemene voorwaarden van Bespaarhulp Friesland.',
  alternates: { canonical: '/voorwaarden' },
}

const h2: React.CSSProperties = { fontSize: 19, fontWeight: 800, color: '#111827', marginTop: 36, marginBottom: 12, letterSpacing: '-0.01em' }
const p: React.CSSProperties = { fontSize: 14.5, color: '#374151', lineHeight: 1.8, marginBottom: 14 }

export default function VoorwaardenPage() {
  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '0 clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
            <span style={{ color: '#0a5c35' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.1em', marginLeft: 6, textTransform: 'uppercase' }}>Friesland</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Terug naar home</Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,48px) 80px' }}>
        <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', marginBottom: 8 }}>Algemene voorwaarden</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>Laatst bijgewerkt: juni 2026 · Bespaarhulp Friesland · KVK 71128174</p>

        <h2 style={h2}>1. Toepasselijkheid</h2>
        <p style={p}>
          Deze voorwaarden zijn van toepassing op alle aanbiedingen, offertes en overeenkomsten van Bespaarhulp
          Friesland (KVK 71128174), tenzij schriftelijk anders overeengekomen.
        </p>

        <h2 style={h2}>2. Offertes en prijzen</h2>
        <p style={p}>
          Offertes zijn vrijblijvend en geldig tot de op de offerte vermelde datum. Genoemde prijzen op de website
          zijn exclusief installatie, tenzij anders vermeld. Installatiekosten worden vooraf besproken en in de
          offerte opgenomen. Kennelijke fouten of vergissingen in prijzen binden ons niet.
        </p>

        <h2 style={h2}>3. Besparingsindicaties</h2>
        <p style={p}>
          Besparingsberekeningen, terugverdientijden en opbrengstindicaties op de website en in offertes zijn
          zorgvuldig onderbouwde schattingen op basis van de door u verstrekte gegevens en actuele tarieven.
          Werkelijke besparingen zijn afhankelijk van uw verbruik, marktprijzen en wet- en regelgeving en kunnen
          afwijken. Hieraan kunnen geen rechten worden ontleend.
        </p>

        <h2 style={h2}>4. Overeenkomst en uitvoering</h2>
        <p style={p}>
          Een overeenkomst komt tot stand na (digitale) ondertekening van de offerte. Genoemde levertijden en
          installatietermijnen zijn indicatief. De installatie wordt uitgevoerd door gecertificeerde installateurs.
        </p>

        <h2 style={h2}>5. Herroepingsrecht</h2>
        <p style={p}>
          Als consument heeft u bij een overeenkomst op afstand 14 dagen bedenktijd na ondertekening. Het
          herroepingsrecht vervalt voor maatwerk en voor diensten die met uw instemming binnen de bedenktijd
          volledig zijn uitgevoerd.
        </p>

        <h2 style={h2}>6. Garantie</h2>
        <p style={p}>
          Op producten gelden de fabrieksgaranties zoals vermeld op de offerte. Op installatiewerk geldt de
          wettelijke conformiteit; gebreken worden kosteloos hersteld indien tijdig gemeld.
        </p>

        <h2 style={h2}>7. Betaling</h2>
        <p style={p}>
          Betaling geschiedt volgens de op de offerte vermelde voorwaarden. Bij betaling in termijnen wordt het
          betalingsschema vooraf overeengekomen.
        </p>

        <h2 style={h2}>8. Aansprakelijkheid</h2>
        <p style={p}>
          Onze aansprakelijkheid is beperkt tot het bedrag dat in het betreffende geval door onze verzekering wordt
          uitgekeerd, dan wel tot het factuurbedrag van de betreffende opdracht. Wij zijn niet aansprakelijk voor
          indirecte schade, zoals gederfde besparing of gevolgschade, behoudens opzet of grove schuld.
        </p>

        <h2 style={h2}>9. Klachten en geschillen</h2>
        <p style={p}>
          Klachten kunt u melden via WhatsApp (06 38 92 25 13) of het contactformulier; wij reageren binnen 5
          werkdagen. Op alle overeenkomsten is Nederlands recht van toepassing.
        </p>

        <p style={{ ...p, marginTop: 32, fontSize: 13, color: '#9ca3af' }}>
          Zie ook onze <Link href="/privacy" style={{ color: '#0a5c35', fontWeight: 600 }}>privacyverklaring</Link>.
        </p>
      </main>
    </div>
  )
}
