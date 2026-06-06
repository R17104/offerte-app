export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import QuoteAcceptanceForm from '@/components/quotes/QuoteAcceptanceForm'
import PrintButton from '@/components/quotes/PrintButton'
import TermsAndConditions from '@/components/quotes/TermsAndConditions'
import { formatDate, formatCurrency } from '@/lib/utils'

type Props = { params: Promise<{ token: string }> }

const CATEGORY_EMOJI: Record<string, string> = {
  BATTERY: '🔋', SOLAR: '☀️', HEAT_PUMP: '♨️', CHARGER: '⚡', EMERGENCY_POWER: '🔌',
}

const font = '"DM Sans", system-ui, sans-serif'
const green = '#0a5c35'
const gold = '#f5c442'

// ── Congestion data for chart ──────────────────────────────────────────────
const CONGESTION = [
  { year: '2020', pct: 8,  label: '8%' },
  { year: '2021', pct: 20, label: '20%' },
  { year: '2022', pct: 35, label: '35%' },
  { year: '2023', pct: 51, label: '51%' },
  { year: '2024', pct: 64, label: '64%' },
  { year: '2025', pct: 74, label: '74%' },
  { year: '2026', pct: 82, label: '82%' },
  { year: '2027', pct: 89, label: '89%' },
]

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: {
      customer: { include: { addresses: { where: { type: 'CORRESPONDENCE' }, take: 1 } } },
      lines: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            select: {
              imageUrl: true, category: true,
              capacityKwh: true, powerKw: true, warrantyYears: true,
              savingsKwhYear: true, gasReductionM3Year: true,
            },
          },
        },
      },
      acceptance: true,
    },
  })

  if (!quote) notFound()

  const canInteract = ['DRAFT', 'SENT'].includes(quote.status)
  const addr = quote.customer.addresses[0]
  const customerName = `${quote.customer.firstName} ${quote.customer.lastName}`

  // ── Energie data ──────────────────────────────────────────────────────────
  const feedbackKwh   = quote.electricityFeedbackKwh ?? 0
  const usageKwh      = quote.electricityUsageKwh ?? 0
  const solarKwh      = quote.solarProductionKwh ?? 0
  const directUseKwh  = Math.max(0, solarKwh - feedbackKwh)

  // Sectie 1: Saldering — wat kost het als je niets doet
  // Na 2027: feedbackKwh terug naar net levert bijna niets op, maar je koopt het
  // wel in. Rekening stijgt met feedbackKwh × tarief.
  const saldingYearlyExtra  = Math.round(feedbackKwh * quote.electricityTariff)
  const saldingMonthlyExtra = Math.round(saldingYearlyExtra / 12)
  const feedbackIncomeLow   = Math.round(feedbackKwh * quote.feedbackTariff)

  // Sectie 2: Terugleverkosten — nu al kosten die je vermijdt met batterij
  const feedInYearlyCost    = Math.round(feedbackKwh * quote.feedInCostTariff)

  // Sectie 3: EMS — batterijcapaciteit en onbalansmarkt opbrengst
  const totalBatteryKwh = quote.lines
    .filter(l => l.product?.category === 'BATTERY')
    .reduce((sum, l) => sum + (l.product?.capacityKwh ?? 0) * l.quantity, 0)

  const emsRevenue = quote.emsAnnualRevenueEur > 0
    ? Math.round(quote.emsAnnualRevenueEur)
    : 0

  // Sectie 4: Woningwaarde — schatting op basis van woningtype
  const homeValueMap: Record<string, number> = {
    APARTMENT: 280_000, TERRACED: 360_000, CORNER: 420_000, DETACHED: 620_000,
  }
  const estimatedHomeValue = quote.houseType ? (homeValueMap[quote.houseType] ?? 400_000) : 400_000
  const homeLow  = Math.round(estimatedHomeValue * 0.03)
  const homeHigh = Math.round(estimatedHomeValue * 0.08)

  // Totaal jaarlijks voordeel
  const totalYearlyBenefit = saldingYearlyExtra + feedInYearlyCost + emsRevenue
  const totalMonthlyBenefit = Math.round(totalYearlyBenefit / 12)

  const showBespaarplan = quote.hasSolarPanels || emsRevenue > 0 || feedbackKwh > 0 || totalBatteryKwh > 0

  return (
    <div style={{ fontFamily: font, background: '#f5f7f5', minHeight: '100vh', color: '#111827' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '10px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="26" viewBox="0 0 36 34" fill="none">
            <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill={gold}/>
            <path d="M0 15L18 2L36 15H0Z" fill={gold}/>
            <rect x="2" y="15" width="32" height="19" rx="1.5" fill={green}/>
            <rect x="5" y="18" width="6" height="6" rx="0.5" fill={gold} opacity="0.7"/>
            <rect x="14" y="18" width="6" height="6" rx="0.5" fill={gold} opacity="0.7"/>
            <circle cx="28" cy="22" r="4.5" fill={gold}/>
            <circle cx="26.5" cy="20.5" r="3" fill={green}/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 14, color: green }}>
            Bespaarhulp<span style={{ color: gold }}> Friesland</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, color: '#6b7280' }}>#{quote.quoteNumber}</span>
          <PrintButton />
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${green} 0%, #0d7a47 100%)`,
        padding: '56px 24px 64px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Persoonlijk energieplan
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Uw energieplan,<br /><span style={{ color: gold }}>op maat gemaakt</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>Voor {customerName}</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          {quote.quoteNumber} · {formatDate(quote.createdAt)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {[
            { icon: '🏠', label: '250+ installaties', sub: 'in Friesland' },
            { icon: '⭐', label: '4,8 / 5', sub: 'beoordeling' },
            { icon: '🏦', label: 'Warmtefonds & SVn', sub: 'financiering' },
            { icon: '📋', label: 'BTW-teruggave', sub: 'wij regelen het' },
          ].map((b) => (
            <div key={b.label} style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 120,
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{b.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{b.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{b.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bespaarplan ─────────────────────────────────────────────────── */}
      {showBespaarplan && (
        <>
          {/* Header */}
          <div style={{ background: '#fff', padding: '52px 24px 0', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Situatie-analyse
              </p>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 10 }}>
                De energiemarkt verandert
              </h2>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, maxWidth: 620, marginBottom: 44 }}>
                Drie ontwikkelingen beïnvloeden uw energiekosten de komende jaren direct. Hieronder vindt u een analyse op basis van uw persoonlijke situatie.
              </p>
            </div>
          </div>

          {/* S1 — Saldering */}
          {quote.hasSolarPanels && feedbackKwh > 0 && (
            <div style={{ background: '#fff', padding: '0 24px 52px' }}>
              <div style={{ maxWidth: 760, margin: '0 auto', borderTop: '2px solid #2563eb', paddingTop: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                  Energiemarktrisico 1 — Afschaffing saldering
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Jaarlijkse kostenstijging na 2027</p>
                    <p style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      +€{saldingYearlyExtra.toLocaleString('nl-NL')}
                    </p>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>per jaar · +€{saldingMonthlyExtra}/maand</p>
                    <div style={{ marginTop: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                        Waarde teruggeleverde stroom ({feedbackKwh.toLocaleString('nl-NL')} kWh/jr)
                      </p>
                      {[
                        { label: 'Nu — via saldering', value: saldingYearlyExtra, max: saldingYearlyExtra },
                        { label: `Na 2027 — teruglevertarief`, value: feedbackIncomeLow, max: saldingYearlyExtra },
                      ].map((bar, i) => (
                        <div key={bar.label} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#374151' }}>{bar.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>€{bar.value.toLocaleString('nl-NL')}</span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 3 }}>
                            <div style={{ height: '100%', width: `${Math.round(bar.value / bar.max * 100)}%`, background: i === 0 ? '#94a3b8' : '#cbd5e1', borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 16 }}>
                      De salderingsregeling vervalt per <strong>1 januari 2027</strong>. Uw {feedbackKwh.toLocaleString('nl-NL')} kWh teruglevering wordt dan niet meer verrekend à €{quote.electricityTariff.toFixed(2).replace('.', ',')}/kWh, maar uitbetaald à €{quote.feedbackTariff.toFixed(2).replace('.', ',')}/kWh.
                    </p>
                    <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6 }}>
                          <span>{feedbackKwh.toLocaleString('nl-NL')} kWh × €{quote.electricityTariff.toFixed(2).replace('.', ',')} <span style={{ color: '#9ca3af' }}>(nu)</span></span>
                          <span style={{ fontWeight: 600 }}>€{saldingYearlyExtra.toLocaleString('nl-NL')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8 }}>
                          <span>{feedbackKwh.toLocaleString('nl-NL')} kWh × €{quote.feedbackTariff.toFixed(2).replace('.', ',')} <span style={{ color: '#9ca3af' }}>(na 2027)</span></span>
                          <span style={{ fontWeight: 600 }}>€{feedbackIncomeLow.toLocaleString('nl-NL')}</span>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                        <span>Verschil per jaar</span>
                        <span style={{ color: '#2563eb' }}>€{saldingYearlyExtra.toLocaleString('nl-NL')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* S2 — Terugleverkosten */}
          {quote.hasSolarPanels && feedbackKwh > 0 && feedInYearlyCost > 0 && (
            <div style={{ background: '#f8f9fa', padding: '52px 24px' }}>
              <div style={{ maxWidth: 760, margin: '0 auto', borderTop: '2px solid #2563eb', paddingTop: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                  Energiemarktrisico 2 — Terugleverkosten
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Jaarlijkse kosten — nu al</p>
                    <p style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      €{feedInYearlyCost.toLocaleString('nl-NL')}
                    </p>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>per jaar · €{Math.round(feedInYearlyCost / 12)}/maand</p>
                    <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6 }}>
                          <span>Teruglevering per jaar</span>
                          <span style={{ fontWeight: 600 }}>{feedbackKwh.toLocaleString('nl-NL')} kWh</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8 }}>
                          <span>Tarief terugleverkosten</span>
                          <span style={{ fontWeight: 600 }}>€{quote.feedInCostTariff.toFixed(3).replace('.', ',')}/kWh</span>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                        <span>Jaarlijkse kosten</span>
                        <span style={{ color: '#2563eb' }}>€{feedInYearlyCost.toLocaleString('nl-NL')}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
                      Energieleveranciers rekenen terugleverkosten van €{quote.feedInCostTariff.toFixed(2).replace('.', ',')}/kWh voor elke kWh die u terugstuurt. Dit is een kostenpost die <strong>nu al geldt</strong> — los van de salderingswijziging in 2027.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* S3 — Netcongestie & EMS */}
          <div style={{ background: '#fff', padding: '52px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', borderTop: '2px solid #2563eb', paddingTop: 28 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                Marktachtergrond — Netcongestie & onbalansmarkt
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Netgebieden met congestie</p>
                  <p style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>74%</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>2025 · Bron: Netbeheer Nederland</p>
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                      % netgebieden met congestie (2020–2027)
                    </p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 70 }}>
                      {CONGESTION.map((d) => (
                        <div key={d.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{
                            width: '100%',
                            height: `${Math.round(d.pct * 0.68)}px`,
                            background: d.year >= '2026' ? '#93c5fd' : d.year >= '2025' ? '#2563eb' : '#cbd5e1',
                            borderRadius: '2px 2px 0 0',
                          }} />
                          <span style={{ fontSize: 8, color: '#9ca3af' }}>{d.year.slice(2)}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>
                      Netbeheer Nederland / TenneT · lichtblauwe balken = prognose
                    </p>
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 14 }}>
                    <strong>74%</strong> van de Nederlandse netgebieden kampt met congestie. Netbeheerders schatten dat er <strong>€180 miljard nodig is</strong> om het stroomnet toekomstbestendig te maken (Netbeheer Nederland, 2024).
                  </p>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 20 }}>
                    Door deze schaarste heeft lokale opslagcapaciteit financiële waarde: EMS-systemen handelen op de <strong>onbalansmarkt</strong>, waar netbeheerders stroom inkopen om de netfrequentie (50 Hz) stabiel te houden.
                  </p>
                  <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>EMS-opbrengst — illustratief voorbeeld</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 6 }}>
                      <span>Alpha ESS 9,3 kWh batterij</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>€1.314/jaar</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                      Gemiddelde op basis van de Alpha ESS-vloot over de afgelopen 3 jaar. Werkelijke opbrengst kan afwijken.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* S4 — Woningwaarde */}
          <div style={{ background: '#f8f9fa', padding: '52px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', borderTop: '2px solid #2563eb', paddingTop: 28 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                Vastgoedprestatie — Energielabel & woningwaarde
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Waardeverschil label A vs. D</p>
                  <p style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>+14%</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Bron: PBL / Calcasa 2023</p>
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                      Relatieve woningwaarde per energielabel
                    </p>
                    {[
                      { label: 'A', pct: 100, accent: true },
                      { label: 'B', pct: 97 },
                      { label: 'C', pct: 93 },
                      { label: 'D', pct: 88 },
                      { label: 'E', pct: 83 },
                      { label: 'F', pct: 78 },
                      { label: 'G', pct: 72 },
                    ].map((row) => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: row.accent ? '#2563eb' : '#9ca3af', width: 12 }}>{row.label}</span>
                        <div style={{ flex: 1, height: 7, background: '#e5e7eb', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${row.pct}%`, background: row.accent ? '#2563eb' : '#cbd5e1', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#9ca3af', width: 32, textAlign: 'right' }}>{row.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 14 }}>
                    Woningen met energielabel A zijn gemiddeld <strong>14% meer waard</strong> dan vergelijkbare woningen met label D, en circa <strong>28% meer</strong> dan label G (PBL Planbureau voor de Leefomgeving, 2023).
                  </p>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
                    Een thuisbatterij gecombineerd met zonnepanelen kan uw energielabel met <strong>1 tot 3 klassen</strong> verbeteren.
                  </p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, lineHeight: 1.6 }}>
                    Bron: PBL Planbureau voor de Leefomgeving · NVM Woningmarktrapport 2023 · Calcasa Woningwaardemeter
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Battery reveal */}
          <div style={{ background: '#fff', padding: '52px 24px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Het antwoord
              </p>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Hoe de thuisbatterij inspeelt op elke ontwikkeling
              </h2>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, maxWidth: 600, marginBottom: 32 }}>
                Elk van de bovenstaande ontwikkelingen heeft een directe financiële impact. Hieronder de respons op elk punt.
              </p>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
                {((): { title: string; desc: string; value: string | null; note?: boolean }[] => [
                  ...(quote.hasSolarPanels && feedbackKwh > 0 && saldingYearlyExtra > 0 ? [{
                    title: 'Afschaffing saldering (2027)',
                    desc: 'Batterij slaat overdag overschot op — geen teruglevering, geen tariefverlies na 2027.',
                    value: `€${saldingYearlyExtra.toLocaleString('nl-NL')}/jr`,
                  }] : []),
                  ...(feedInYearlyCost > 0 ? [{
                    title: 'Terugleverkosten',
                    desc: 'Nul teruglevering betekent nul terugleverkosten.',
                    value: `€${feedInYearlyCost.toLocaleString('nl-NL')}/jr`,
                  }] : []),
                  {
                    title: 'Netcongestie / onbalansmarkt',
                    desc: emsRevenue > 0
                      ? 'Uw Alpha ESS EMS handelt automatisch op de onbalansmarkt.'
                      : 'Voorbeeld: 9,3 kWh Alpha ESS genereert gemiddeld €1.314/jr via de onbalansmarkt.*',
                    value: emsRevenue > 0 ? `€${emsRevenue.toLocaleString('nl-NL')}/jr` : '€1.314/jr*',
                  },
                  {
                    title: 'Energielabel & woningwaarde',
                    desc: 'Beter energielabel verhoogt de marktwaarde van uw woning structureel.',
                    value: '+14–28%',
                    note: true,
                  },
                ])().map((row, i, arr) => (
                  <div key={row.title} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto',
                    gap: 16, alignItems: 'center',
                    padding: '16px 20px',
                    background: i % 2 === 0 ? '#fff' : '#f8f9fa',
                    borderBottom: i < arr.length - 1 ? '1px solid #e5e7eb' : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{row.title}</p>
                      <p style={{ fontSize: 13, color: '#6b7280' }}>{row.desc}</p>
                    </div>
                    {row.value && (
                      <p style={{ fontSize: 15, fontWeight: 700, color: row.note ? '#374151' : '#2563eb', whiteSpace: 'nowrap' }}>{row.value}</p>
                    )}
                  </div>
                ))}
              </div>

              {totalYearlyBenefit > 0 && (
                <div style={{ background: '#111827', borderRadius: 14, padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Totaal financieel voordeel per jaar</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      {[
                        quote.hasSolarPanels && feedbackKwh > 0 && saldingYearlyExtra > 0 ? 'saldering' : null,
                        feedInYearlyCost > 0 ? 'terugleverkosten' : null,
                        emsRevenue > 0 ? 'EMS' : null,
                      ].filter(Boolean).join(' + ')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      €{totalYearlyBenefit.toLocaleString('nl-NL')}
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>= €{totalMonthlyBenefit}/maand</p>
                  </div>
                </div>
              )}

              {emsRevenue === 0 && (
                <p style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.6 }}>
                  * Gemiddelde op basis van de Alpha ESS-vloot over de afgelopen 3 jaar. Werkelijke opbrengst is afhankelijk van marktprijzen en kan hiervan afwijken.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Producten ────────────────────────────────────────────────────── */}
      <div style={{ background: '#f5f7f5', padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: green, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Uw installatie</p>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', marginBottom: 24 }}>{quote.title}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {quote.lines.map((line) => {
              const p = line.product
              const emoji = p?.category ? (CATEGORY_EMOJI[p.category] ?? '📦') : '📦'
              return (
                <div key={line.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: 120, minWidth: 120, background: p?.imageUrl ? '#f9fafb' : '#f0faf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p?.imageUrl
                      ? <img src={p.imageUrl} alt={line.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 36 }}>{emoji}</span>
                    }
                  </div>
                  <div style={{ flex: 1, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
                          {line.quantity > 1 && <span style={{ color: green, marginRight: 6 }}>{line.quantity}×</span>}
                          {line.name}
                        </p>
                        {line.description && <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{line.description}</p>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(line.quantity * line.unitPrice * (1 + line.vatRate / 100))}
                        </p>
                        <p style={{ fontSize: 11.5, color: '#9ca3af' }}>incl. BTW</p>
                      </div>
                    </div>
                    {p && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {p.capacityKwh && <span style={{ background: '#f0faf4', color: green, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{p.capacityKwh} kWh</span>}
                        {p.powerKw && <span style={{ background: '#f0faf4', color: green, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{p.powerKw} kW</span>}
                        {p.warrantyYears && <span style={{ background: '#f9fafb', color: '#6b7280', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{p.warrantyYears} jaar garantie</span>}
                        {p.savingsKwhYear && p.savingsKwhYear > 0 && <span style={{ background: '#f0faf4', color: '#166534', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>↓ {(p.savingsKwhYear * line.quantity).toLocaleString('nl-NL')} kWh/jr</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {quote.includedItems && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 24px', marginTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: green, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Dit is inbegrepen</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quote.includedItems.split('\n').map((l, i) => {
                  const t = l.trim()
                  if (!t) return null
                  if (t.startsWith('-')) return (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ color: green, fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: 14, color: '#374151' }}>{t.replace(/^-\s*/, '')}</span>
                    </div>
                  )
                  return <p key={i} style={{ fontWeight: 700, fontSize: 14 }}>{t}</p>
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sociale bewijskracht ─────────────────────────────────────────── */}
      <div style={{ background: green, padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 28 }}>250+ tevreden huishoudens gingen u voor</h2>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            {[
              { icon: '⭐', title: '4,8/5', sub: 'gemiddeld' },
              { icon: '🏠', title: '250+', sub: 'installaties' },
              { icon: '🏦', title: 'Warmtefonds', sub: 'lage rente' },
              { icon: '📋', title: 'BTW-teruggave', sub: 'wij regelen het' },
            ].map((b) => (
              <div key={b.title} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '18px 20px', minWidth: 130 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: gold }}>{b.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{b.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '20px 24px', textAlign: 'left', maxWidth: 520, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
              {[1,2,3,4,5].map((s) => <span key={s} style={{ color: gold, fontSize: 16 }}>★</span>)}
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontStyle: 'italic' }}>
              "Bespaarhulp Friesland heeft alles van A tot Z geregeld. De thuisbatterij werkt perfect en we merken het direct op onze energierekening."
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>— Familie de Jong, Leeuwarden</p>
          </div>
        </div>
      </div>

      {/* ── Investeringsoverzicht ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: green, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Investering</p>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', marginBottom: 24 }}>Transparante prijsopbouw</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              {quote.lines.map((line) => (
                <div key={line.id} style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600 }}>{line.name}</p>
                    {line.description && <p style={{ fontSize: 12, color: '#9ca3af' }}>{line.description}</p>}
                  </div>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{line.quantity}×</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: green, borderRadius: 14, padding: '22px', color: '#fff' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Totaal</p>
              {[
                { label: 'Subtotaal', value: formatCurrency(quote.subtotal) },
                ...(quote.discountAmount > 0 ? [{ label: 'Korting', value: `- ${formatCurrency(quote.discountAmount)}` }] : []),
                { label: 'BTW', value: formatCurrency(quote.vatTotal) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13.5, borderBottom: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
                  <span>{label}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontSize: 20, fontWeight: 800 }}>
                <span>Totaal</span>
                <span style={{ color: gold, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(quote.total)}</span>
              </div>
              {quote.subsidyAmount > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
                  <p>Na subsidie: <strong style={{ color: gold }}>{formatCurrency(Math.max(0, quote.total - quote.subsidyAmount))}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status banners ────────────────────────────────────────────────── */}
      {quote.status === 'ACCEPTED' && (
        <div style={{ background: '#dcfce7', borderTop: '3px solid #16a34a', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>✓ Geaccepteerd op {formatDate(quote.acceptedAt)}</p>
          {quote.acceptance && <p style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>Ondertekend door {quote.acceptance.firstName} {quote.acceptance.lastName}</p>}
          {quote.acceptance?.signatureData && (
            <div style={{ marginTop: 16, display: 'inline-block', background: '#fff', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px' }}>
              <img src={quote.acceptance.signatureData} alt="Handtekening" style={{ display: 'block', maxWidth: 300, height: 'auto' }} />
            </div>
          )}
        </div>
      )}
      {quote.status === 'REJECTED' && (
        <div style={{ background: '#fee2e2', borderTop: '3px solid #ef4444', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>✕ Afgewezen op {formatDate(quote.rejectedAt)}</p>
        </div>
      )}

      {/* ── Voorwaarden ───────────────────────────────────────────────────── */}
      <div style={{ background: '#f9fafb', padding: '40px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <TermsAndConditions text={quote.termsText} />
        </div>
      </div>

      {/* ── Acceptatieformulier ───────────────────────────────────────────── */}
      {canInteract && (
        <div style={{ background: '#fff', borderTop: `3px solid ${green}`, padding: '48px 24px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: green, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, textAlign: 'center' }}>Klaar om te starten?</p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 6, textAlign: 'center', letterSpacing: '-0.02em' }}>Offerte accepteren</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, textAlign: 'center' }}>Na acceptatie nemen wij binnen 24 uur contact op voor de planning.</p>
            <QuoteAcceptanceForm token={token} customerName={customerName} />
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ background: green, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Bespaarhulp <span style={{ color: gold }}>Friesland</span></p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Sjouke van der Kooistrjitte 15 · 9088BB Wirdum · 06-24992098 · KVK 71128174</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Offerte {quote.quoteNumber}</p>
      </div>
    </div>
  )
}
