import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacyverklaring — Bespaarhulp Friesland',
  description: 'Hoe Bespaarhulp Friesland omgaat met uw persoonsgegevens.',
  alternates: { canonical: '/privacy' },
}

const h2: React.CSSProperties = { fontSize: 19, fontWeight: 800, color: '#111827', marginTop: 36, marginBottom: 12, letterSpacing: '-0.01em' }
const p: React.CSSProperties = { fontSize: 14.5, color: '#374151', lineHeight: 1.8, marginBottom: 14 }
const li: React.CSSProperties = { fontSize: 14.5, color: '#374151', lineHeight: 1.8, marginBottom: 6 }

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', marginBottom: 8 }}>Privacyverklaring</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>Laatst bijgewerkt: juni 2026 · Bespaarhulp Friesland · KVK 71128174</p>

        <p style={p}>
          Bespaarhulp Friesland respecteert uw privacy en verwerkt persoonsgegevens in overeenstemming met de
          Algemene Verordening Gegevensbescherming (AVG). In deze verklaring leest u welke gegevens wij verzamelen,
          waarom, en welke rechten u heeft.
        </p>

        <h2 style={h2}>Welke gegevens verzamelen wij?</h2>
        <p style={p}>Wanneer u een adviesgesprek of offerte aanvraagt, verwerken wij:</p>
        <ul style={{ paddingLeft: 22, marginBottom: 14 }}>
          <li style={li}>Naam, e-mailadres en telefoonnummer</li>
          <li style={li}>Adresgegevens (voor zover u die opgeeft)</li>
          <li style={li}>Energiegegevens die u invult, zoals verbruik, teruglevering en woningtype</li>
          <li style={li}>Bij ondertekening van een offerte: geboortedatum, IBAN (optioneel) en uw digitale handtekening</li>
        </ul>

        <h2 style={h2}>Waarvoor gebruiken wij deze gegevens?</h2>
        <ul style={{ paddingLeft: 22, marginBottom: 14 }}>
          <li style={li}>Om contact met u op te nemen over uw aanvraag</li>
          <li style={li}>Om een offerte op maat op te stellen en de installatie in te plannen</li>
          <li style={li}>Om te voldoen aan wettelijke (administratie)verplichtingen</li>
        </ul>
        <p style={p}>
          Wij verkopen uw gegevens nooit aan derden en gebruiken ze niet voor doeleinden waarvoor u ze niet heeft verstrekt.
          Gegevens worden alleen gedeeld met partijen die nodig zijn voor de uitvoering, zoals onze installateurs.
        </p>

        <h2 style={h2}>Hoe lang bewaren wij uw gegevens?</h2>
        <p style={p}>
          Aanvragen die niet tot een opdracht leiden bewaren wij maximaal 2 jaar. Offertes en getekende overeenkomsten
          bewaren wij 7 jaar in verband met de fiscale bewaarplicht.
        </p>

        <h2 style={h2}>Uw rechten</h2>
        <p style={p}>
          U heeft het recht om uw gegevens in te zien, te laten corrigeren of te laten verwijderen. Ook kunt u bezwaar
          maken tegen de verwerking of uw gegevens laten overdragen. Neem hiervoor contact met ons op via WhatsApp
          (06 38 92 25 13) of via het contactformulier. U heeft daarnaast het recht een klacht in te dienen bij de
          Autoriteit Persoonsgegevens.
        </p>

        <h2 style={h2}>Beveiliging</h2>
        <p style={p}>
          Uw gegevens worden opgeslagen in beveiligde systemen binnen de Europese Unie en zijn alleen toegankelijk
          voor medewerkers die ze nodig hebben voor hun werk.
        </p>

        <h2 style={h2}>Contact</h2>
        <p style={p}>
          Vragen over deze privacyverklaring? Neem contact op via WhatsApp (06 38 92 25 13) of het{' '}
          <Link href="/#contact" style={{ color: '#0a5c35', fontWeight: 600 }}>contactformulier</Link>.
        </p>
      </main>
    </div>
  )
}
