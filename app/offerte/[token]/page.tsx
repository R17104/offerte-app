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
    : totalBatteryKwh > 0 ? Math.round((totalBatteryKwh / 9.3) * 965) : 0

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

  const showBespaarplan = quote.hasSolarPanels || emsRevenue > 0 || feedbackKwh > 0

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

      {/* ══════════════════════════════════════════════════════════════════
          BESPAARPLAN
      ══════════════════════════════════════════════════════════════════ */}
      {showBespaarplan && (
        <>
          {/* ── Bespaarplan header ─────────────────────────────────────── */}
          <div style={{ background: '#fff', padding: '40px 24px 0' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: green, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Uw persoonlijk bespaarplan
              </p>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Wat levert een thuisbatterij u op?
              </h2>
              <p style={{ fontSize: 14.5, color: '#4b5563', lineHeight: 1.7, maxWidth: 620, marginBottom: 0 }}>
                We hebben uw persoonlijke situatie doorgerekend. Hieronder leggen we stap voor stap uit
                op welke vier manieren een thuisbatterij u direct financieel voordeel oplevert.
              </p>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────
              SECTIE 1 — SALDERING
          ──────────────────────────────────────────────────────────── */}
          {quote.hasSolarPanels && feedbackKwh > 0 && (
            <div style={{ background: '#fff', padding: '32px 24px' }}>
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 16, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ background: '#92400e', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 28 }}>⚡</span>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                        Voordeel 1 van 4
                      </p>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                        Saldering vervalt in 2027 — wat kost u dat?
                      </h3>
                    </div>
                  </div>

                  <div style={{ padding: '24px' }}>
                    {/* Huidige situatie */}
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      Uw huidige situatie
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[
                        { label: 'Jaarverbruik', value: `${usageKwh.toLocaleString('nl-NL')} kWh`, sub: 'totaal van het net' },
                        { label: 'Zonne-opwek', value: `${solarKwh.toLocaleString('nl-NL')} kWh`, sub: 'jaarlijks opgewekt' },
                        { label: 'Teruglevering', value: `${feedbackKwh.toLocaleString('nl-NL')} kWh`, sub: 'naar het net' },
                      ].map((s) => (
                        <div key={s.label} style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                          <p style={{ fontSize: 11, color: '#78350f', fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                          <p style={{ fontSize: 20, fontWeight: 800, color: '#92400e' }}>{s.value}</p>
                          <p style={{ fontSize: 11, color: '#a16207' }}>{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Uitleg */}
                    <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
                      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#374151' }}>
                        U wekt <strong>{solarKwh.toLocaleString('nl-NL')} kWh</strong> op met uw zonnepanelen.
                        Hiervan gebruikt u <strong>{directUseKwh.toLocaleString('nl-NL')} kWh</strong> direct en levert u{' '}
                        <strong>{feedbackKwh.toLocaleString('nl-NL')} kWh</strong> terug aan het net.
                        Dankzij saldering telt die teruglevering nu volledig mee — u betaalt per saldo{' '}
                        <strong style={{ color: green }}>€0</strong> voor die stroom.
                      </p>
                    </div>

                    {/* Na 2027 vergelijking */}
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      Na 2027 — zonder thuisbatterij
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 12, padding: '18px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>😟 U moet bijkopen</p>
                        <p style={{ fontSize: 14, color: '#78350f', lineHeight: 1.7 }}>
                          Uw teruglevering ({feedbackKwh.toLocaleString('nl-NL')} kWh) telt niet meer mee.
                          U moet deze stroom inkopen à €{quote.electricityTariff}/kWh.
                        </p>
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #fde68a' }}>
                          <p style={{ fontSize: 22, fontWeight: 800, color: '#b91c1c' }}>
                            +€{saldingYearlyExtra.toLocaleString('nl-NL')}/jaar
                          </p>
                          <p style={{ fontSize: 12, color: '#92400e' }}>
                            = +€{saldingMonthlyExtra}/maand hogere energierekening
                          </p>
                          <p style={{ fontSize: 11, color: '#a16207', marginTop: 4 }}>
                            (teruglevering levert dan slechts €{feedbackIncomeLow} op via saldering)
                          </p>
                        </div>
                      </div>
                      <div style={{ background: '#f0faf4', border: '2px solid #86efac', borderRadius: 12, padding: '18px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: green, marginBottom: 8 }}>✅ Met thuisbatterij</p>
                        <p style={{ fontSize: 14, color: '#166534', lineHeight: 1.7 }}>
                          De batterij slaat uw overschot op. U gebruikt het 's avonds zelf —
                          geen teruglevering, geen extra kosten.
                        </p>
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #86efac' }}>
                          <p style={{ fontSize: 22, fontWeight: 800, color: green }}>
                            €0 extra/jaar
                          </p>
                          <p style={{ fontSize: 12, color: '#166534' }}>
                            Besparing: <strong>€{saldingYearlyExtra.toLocaleString('nl-NL')}/jaar</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Conclusie */}
                    <div style={{ background: green, borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                        Voordeel door saldering te omzeilen
                      </p>
                      <p style={{ color: gold, fontSize: 22, fontWeight: 800 }}>
                        €{saldingYearlyExtra.toLocaleString('nl-NL')} per jaar
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────
              SECTIE 2 — TERUGLEVERKOSTEN
          ──────────────────────────────────────────────────────────── */}
          {quote.hasSolarPanels && feedbackKwh > 0 && feedInYearlyCost > 0 && (
            <div style={{ background: '#f5f7f5', padding: '32px 24px' }}>
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ background: '#1e40af', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 28 }}>🔌</span>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                        Voordeel 2 van 4
                      </p>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                        Terugleverkosten — u betaalt hier nu al voor
                      </h3>
                    </div>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.8, marginBottom: 20 }}>
                      Veel energieleveranciers rekenen terugleverkosten van gemiddeld{' '}
                      <strong>€{quote.feedInCostTariff.toFixed(2).replace('.', ',')}/kWh</strong> voor
                      stroom die u terug het net op stuurt. U levert{' '}
                      <strong>{feedbackKwh.toLocaleString('nl-NL')} kWh</strong> per jaar terug — dat kost u nu al:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>Berekening</p>
                        <p style={{ fontSize: 14, color: '#1e3a8a', lineHeight: 1.8 }}>
                          {feedbackKwh.toLocaleString('nl-NL')} kWh<br />
                          × €{quote.feedInCostTariff.toFixed(2).replace('.', ',')} /kWh
                        </p>
                        <div style={{ borderTop: '1px solid #bfdbfe', marginTop: 12, paddingTop: 12 }}>
                          <p style={{ fontSize: 22, fontWeight: 800, color: '#1e40af' }}>
                            €{feedInYearlyCost.toLocaleString('nl-NL')}/jaar
                          </p>
                          <p style={{ fontSize: 12, color: '#3b82f6' }}>= €{Math.round(feedInYearlyCost/12)}/maand</p>
                        </div>
                      </div>
                      <div style={{ background: '#f0faf4', border: '2px solid #86efac', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: green, marginBottom: 8 }}>Met batterij</p>
                        <p style={{ fontSize: 14, color: '#166534', lineHeight: 1.8 }}>
                          U slaat uw overschot op in<br />
                          de batterij. Geen teruglevering,<br />
                          geen terugleverkosten.
                        </p>
                        <div style={{ borderTop: '1px solid #86efac', marginTop: 12, paddingTop: 12 }}>
                          <p style={{ fontSize: 22, fontWeight: 800, color: green }}>€0/jaar</p>
                          <p style={{ fontSize: 12, color: '#166534' }}>volledig vermeden</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: green, borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Vermeden terugleverkosten</p>
                      <p style={{ color: gold, fontSize: 22, fontWeight: 800 }}>€{feedInYearlyCost.toLocaleString('nl-NL')} per jaar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────
              SECTIE 3 — NETCONGESTIE / ONBALANSMARKT
          ──────────────────────────────────────────────────────────── */}
          <div style={{ background: '#fff', padding: '32px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 28 }}>📈</span>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                      Voordeel 3 van 4
                    </p>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                      Netcongestie & onbalansmarkt — verdien aan het net
                    </h3>
                  </div>
                </div>

                <div style={{ padding: '0 24px 24px' }}>
                  {/* Het probleem */}
                  <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.8, marginBottom: 24 }}>
                    Nederland investeert massaal in zonnepanelen, windmolens en warmtepompen.
                    Goed nieuws voor het klimaat — maar het stroomnet is niet ontworpen voor deze hoeveelheid
                    duurzame energie tegelijk. Het gevolg: <strong style={{ color: '#f59e0b' }}>netcongestie</strong>.
                    Steeds meer gebieden kunnen geen nieuwe aansluitingen meer verwerken.
                  </p>

                  {/* Congestie grafiek */}
                  <div style={{ background: '#1e293b', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                      % Nederlandse netgebieden met congestie
                    </p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                      {CONGESTION.map((d) => (
                        <div key={d.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, color: d.year >= '2024' ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                            {d.label}
                          </span>
                          <div style={{
                            width: '100%',
                            height: `${d.pct}px`,
                            background: d.year >= '2024'
                              ? 'linear-gradient(to top, #f59e0b, #fde68a)'
                              : 'linear-gradient(to top, #334155, #475569)',
                            borderRadius: '3px 3px 0 0',
                            position: 'relative',
                          }}>
                            {d.year === '2027' && (
                              <span style={{
                                position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                                fontSize: 8, color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap',
                              }}>verwacht</span>
                            )}
                          </div>
                          <span style={{ fontSize: 9, color: '#475569' }}>{d.year}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: '#475569', marginTop: 12 }}>
                      Bron: Netbeheer Nederland / Tennet — gele balken zijn prognose
                    </p>
                  </div>

                  {/* De oplossing */}
                  <div style={{ background: '#1e293b', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 10 }}>
                      Hoe helpt uw thuisbatterij?
                    </p>
                    <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8 }}>
                      Het stroomnet draait op <strong style={{ color: '#fff' }}>50 Hz</strong>. Wanneer er te veel of
                      te weinig stroom op het net is, wijkt de frequentie af — wat problemen geeft.
                      Netbeheerders moeten dit constant corrigeren (<em>regelenergie</em>).
                    </p>
                    <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, marginTop: 10 }}>
                      Uw <strong style={{ color: '#fff' }}>Alpha ESS thuisbatterij</strong> is verbonden met
                      het Alpha Cloud platform. Het EMS-systeem handelt automatisch op de{' '}
                      <strong style={{ color: '#f59e0b' }}>onbalansmarkt</strong>: het laadt wanneer stroom
                      goedkoop of negatief geprijsd is, en levert terug wanneer netbeheerders regelenergie
                      nodig hebben. U helpt het net stabiel te houden — en wordt daarvoor betaald.
                    </p>
                  </div>

                  {/* Opbrengst */}
                  <div style={{ display: 'grid', gridTemplateColumns: totalBatteryKwh > 0 ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 20 }}>
                    {totalBatteryKwh > 0 && (
                      <div style={{ background: '#1e293b', borderRadius: 12, padding: '18px', textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Uw batterijcapaciteit</p>
                        <p style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{totalBatteryKwh} kWh</p>
                        <p style={{ fontSize: 12, color: '#475569' }}>Alpha ESS thuisbatterij</p>
                      </div>
                    )}
                    <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', border: '2px solid #3b82f6', borderRadius: 12, padding: '18px', textAlign: 'center' }}>
                      <p style={{ fontSize: 11, color: '#93c5fd', marginBottom: 6 }}>Geschatte EMS opbrengst</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
                        €{emsRevenue.toLocaleString('nl-NL')}/jaar
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>via Alpha Cloud onbalansmarkt</p>
                      <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                        Gem. €965/jr per 9,3 kWh batterij
                      </p>
                    </div>
                  </div>

                  <div style={{ background: green, borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>EMS / onbalansmarkt opbrengst</p>
                    <p style={{ color: gold, fontSize: 22, fontWeight: 800 }}>€{emsRevenue.toLocaleString('nl-NL')} per jaar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────
              SECTIE 4 — WONINGWAARDE
          ──────────────────────────────────────────────────────────── */}
          <div style={{ background: '#f5f7f5', padding: '32px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #78350f, #b45309)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 28 }}>🏠</span>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                      Voordeel 4 van 4
                    </p>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                      Woningwaarde — uw huis wordt meer waard
                    </h3>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.8, marginBottom: 20 }}>
                    Een beter energielabel heeft direct invloed op de verkoopwaarde van uw woning.
                    Uit onderzoek van het <strong>NVM</strong> en <strong>Calcasa</strong> blijkt dat woningen met
                    energielabel A gemiddeld <strong>3 tot 8% meer waard</strong> zijn dan vergelijkbare woningen
                    met label D of lager.
                  </p>

                  {/* Waarde kaarten */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                      { label: 'Waardestijging', value: '3–8%', sub: 'bij beter energielabel', color: '#92400e' },
                      { label: 'Geschatte stijging', value: `€${Math.round(homeLow/1000)}k–€${Math.round(homeHigh/1000)}k`, sub: 'voor uw woningtype', color: green },
                      { label: 'Snellere verkoop', value: '2–4×', sub: 'sneller op de markt', color: '#1e40af' },
                    ].map((s) => (
                      <div key={s.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>{s.label}</p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Uitleg */}
                  <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
                    <p style={{ fontSize: 14, color: '#78350f', lineHeight: 1.8 }}>
                      Een thuisbatterij gecombineerd met zonnepanelen kan uw energielabel
                      met <strong>1 tot 3 klassen</strong> verbeteren (bijv. van C naar A).
                      Onderzoek van <strong>ABN AMRO</strong> toont aan dat een goede energieprestatie
                      uw woning gemiddeld <strong>€{homeLow.toLocaleString('nl-NL')} – €{homeHigh.toLocaleString('nl-NL')} meer oplevert</strong> bij verkoop —
                      bovenop het dagelijkse energievoordeel.
                    </p>
                    <p style={{ fontSize: 12.5, color: '#a16207', marginTop: 10 }}>
                      Bronnen: NVM Woningmarktrapport 2023 · Calcasa Woningwaardemeter · ABN AMRO Duurzaamheidsonderzoek
                    </p>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #78350f, #b45309)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Geschatte waardestijging woning (eenmalig)</p>
                    <p style={{ color: gold, fontSize: 22, fontWeight: 800 }}>
                      €{homeLow.toLocaleString('nl-NL')} – €{homeHigh.toLocaleString('nl-NL')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Totaal bespaarplan samenvatting ────────────────────────── */}
          <div style={{ background: green, padding: '40px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, textAlign: 'center' }}>
                Totaal bespaarplan
              </p>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24, textAlign: 'center', letterSpacing: '-0.01em' }}>
                Uw totale financiële voordeel
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {[
                  ...(quote.hasSolarPanels && feedbackKwh > 0 ? [{ label: '⚡ Saldering omzeilen (jaarlijks)', value: `€${saldingYearlyExtra.toLocaleString('nl-NL')}` }] : []),
                  ...(feedInYearlyCost > 0 ? [{ label: '🔌 Vermeden terugleverkosten (jaarlijks)', value: `€${feedInYearlyCost.toLocaleString('nl-NL')}` }] : []),
                  ...(emsRevenue > 0 ? [{ label: '📈 EMS / onbalansmarkt opbrengst (jaarlijks)', value: `€${emsRevenue.toLocaleString('nl-NL')}` }] : []),
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 18px' }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{row.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: gold, borderRadius: 10, padding: '14px 18px' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#78350f' }}>Totaal jaarlijks voordeel</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#78350f' }}>€{totalYearlyBenefit.toLocaleString('nl-NL')}/jaar</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Per maand', value: `€${totalMonthlyBenefit}`, sub: 'gemiddeld voordeel' },
                  { label: 'In 10 jaar', value: `€${(totalYearlyBenefit * 10).toLocaleString('nl-NL')}`, sub: 'cumulatief voordeel' },
                  { label: 'Woningwaarde', value: `+€${Math.round(homeLow/1000)}k`, sub: 'minimale stijging (eenmalig)' },
                ].map((s) => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: gold }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.sub}</p>
                  </div>
                ))}
              </div>
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
