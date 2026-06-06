export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import QuoteAcceptanceForm from '@/components/quotes/QuoteAcceptanceForm'
import PrintButton from '@/components/quotes/PrintButton'
import TermsAndConditions from '@/components/quotes/TermsAndConditions'
import { formatDate, formatCurrency } from '@/lib/utils'

type Props = { params: Promise<{ token: string }> }

const font = '"DM Sans", system-ui, sans-serif'
const green = '#0a5c35'
const gold = '#f5c442'

const CONGESTION = [
  { year: '2020', pct: 8 },
  { year: '2021', pct: 20 },
  { year: '2022', pct: 35 },
  { year: '2023', pct: 51 },
  { year: '2024', pct: 64 },
  { year: '2025', pct: 74 },
  { year: '2026', pct: 82 },
  { year: '2027', pct: 89 },
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
      createdBy: { select: { name: true } },
    },
  })

  if (!quote) notFound()

  const canInteract = ['DRAFT', 'SENT'].includes(quote.status)
  const addr = quote.customer.addresses[0]
  const customerName = `${quote.customer.firstName} ${quote.customer.lastName}`
  const addrLine = addr ? `${addr.street} ${addr.houseNumber}, ${addr.postalCode} ${addr.city}` : ''
  const signatoryName = quote.createdBy?.name ?? 'Bespaarhulp Friesland'

  // ── Energie data ──────────────────────────────────────────────────────────
  const feedbackKwh   = quote.electricityFeedbackKwh ?? 0
  const usageKwh      = quote.electricityUsageKwh ?? 0
  const solarKwh      = quote.solarProductionKwh ?? 0
  const directUseKwh  = Math.max(0, solarKwh - feedbackKwh)

  // Saldering is begrensd op netto afname van het net (= usageKwh in dit model)
  const saldeerbaar           = Math.min(feedbackKwh, usageKwh)
  const currentSalderingValue = Math.round(saldeerbaar * quote.electricityTariff)
  // Verlies door afschaffing = alleen het tariffsverschil over het gesaldeerde deel
  const saldingYearlyExtra    = Math.round(saldeerbaar * (quote.electricityTariff - quote.feedbackTariff))
  const saldingMonthlyExtra   = Math.round(saldingYearlyExtra / 12)
  const feedbackIncomeLow     = Math.round(feedbackKwh * quote.feedbackTariff)
  const feedInYearlyCost      = Math.round(feedbackKwh * quote.feedInCostTariff)

  const totalBatteryKwh = quote.lines
    .filter(l => l.product?.category === 'BATTERY')
    .reduce((sum, l) => sum + (l.product?.capacityKwh ?? 0) * l.quantity, 0)

  const emsRevenue = quote.emsAnnualRevenueEur > 0
    ? Math.round(quote.emsAnnualRevenueEur)
    : 0

  const totalYearlyBenefit  = saldingYearlyExtra + feedInYearlyCost + emsRevenue
  const totalMonthlyBenefit = Math.round(totalYearlyBenefit / 12)

  const showBespaarplan = quote.hasSolarPanels || emsRevenue > 0 || feedbackKwh > 0 || totalBatteryKwh > 0

  // ── Page footer helper ────────────────────────────────────────────────────
  const PageFooter = ({ n, total }: { n: number; total: number }) => (
    <div className="pf" style={{ background: green, padding: '16px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 28 }}>
        {[
          { v: '250+', l: 'installaties' },
          { v: 'KVK', l: '71128174' },
        ].map(b => (
          <div key={b.v}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{b.v} </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{b.l}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Pagina {n} / {total} · {quote.quoteNumber}</p>
    </div>
  )

  // ── Page wrapper ─────────────────────────────────────────────────────────
  const PAGE: React.CSSProperties = {
    maxWidth: 840, margin: '0 auto 28px', background: '#fff',
    boxShadow: '0 4px 28px rgba(0,0,0,0.22)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    minHeight: 1040,
  }

  const showSalderingPage = quote.hasSolarPanels && feedbackKwh > 0 && solarKwh > 0
  const currentMonthlyBill = quote.currentMonthlyBill ?? 0
  const totalMonthlyExtra = Math.round((saldingYearlyExtra + feedInYearlyCost) / 12)
  const monthlyBill2027 = currentMonthlyBill > 0
    ? Math.round(currentMonthlyBill + totalMonthlyExtra)
    : 0

  // ── Batterijadvies berekening (herbruikbaar op offertepagina) ─────────────
  const kwp             = quote.solarPanelKwp ?? 0
  const summerSurplus   = feedbackKwh > 0 ? (feedbackKwh * 0.65) / 182 : 0
  const heatPumpExtra   = quote.hasHeatPump ? 2.5 : 0
  let advBaseKwh        = summerSurplus + heatPumpExtra
  let kwpExtra          = 0
  if (kwp >= 8)       { kwpExtra = kwp * 0.15; advBaseKwh = Math.max(advBaseKwh, kwp * 1.2) }
  else if (kwp >= 5)  { kwpExtra = kwp * 0.1;  advBaseKwh = Math.max(advBaseKwh, kwp * 1.0) }
  advBaseKwh = Math.max(4, advBaseKwh)
  const ALPHA_SIZES     = [9.3, 18.6, 27.9, 37.2, 46.5, 55.8]
  const advRecommended  = ALPHA_SIZES.find(s => s >= advBaseKwh) ?? 55.8
  const tariffDiff      = quote.electricityTariff - quote.feedbackTariff
  const advAbsorbable   = Math.min(advRecommended * 365 * 0.9, feedbackKwh * 0.85)
  const advAnnualSavings = Math.round(advAbsorbable * tariffDiff)
  const advSelfUseKwh   = Math.round(advAbsorbable)
  const showBatteryAdvicePage = quote.includeBatteryAdvice && quote.hasSolarPanels && feedbackKwh > 0 && solarKwh > 0

  const pageCount = 1
    + (showSalderingPage ? 1 : 0)
    + (showBatteryAdvicePage ? 1 : 0)
    + (showBespaarplan ? 2 : 0)
    + 1 // installatie
    + 1 // investering
    + 1 // ondertekening

  let pg = 0
  const nextPage = () => ++pg

  return (
    <div style={{ fontFamily: font, background: '#d4d4d4', minHeight: '100vh', color: '#111827' }}>

      {/* Print + responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .doc-page { box-shadow: none !important; page-break-after: always; margin-bottom: 0 !important; }
          body { background: white !important; }
        }
        /* Tablet */
        @media (max-width: 900px) {
          .lh  { padding: 20px 28px !important; }
          .li  { padding: 32px 28px !important; }
          .ph  { padding: 24px 28px !important; }
          .sec { padding: 32px 28px !important; }
          .pf  { padding: 12px 28px !important; }
          .g2  { grid-template-columns: 1fr !important; }
          .g2r { grid-template-columns: 1fr !important; }
        }
        /* Mobile */
        @media (max-width: 600px) {
          .doc-page { margin-bottom: 12px !important; }
          .lh  { padding: 16px 18px !important; flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .lh-right { text-align: left !important; }
          .li  { padding: 24px 18px !important; }
          .ph  { padding: 20px 18px !important; }
          .sec { padding: 24px 18px !important; }
          .pf  { padding: 10px 18px !important; flex-direction: column !important; gap: 6px !important; }
          .g2  { grid-template-columns: 1fr !important; gap: 20px !important; }
          .g2r { grid-template-columns: 1fr !important; }
          .hide-mobile { display: none !important; }
          .doc-page h2 { font-size: 20px !important; }
          .num-big { font-size: 36px !important; }
        }
      ` }} />

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="26" height="24" viewBox="0 0 36 34" fill="none">
            <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill={gold}/>
            <path d="M0 15L18 2L36 15H0Z" fill={gold}/>
            <rect x="2" y="15" width="32" height="19" rx="1.5" fill={green}/>
            <rect x="5" y="18" width="6" height="6" rx="0.5" fill={gold} opacity="0.7"/>
            <rect x="14" y="18" width="6" height="6" rx="0.5" fill={gold} opacity="0.7"/>
            <circle cx="28" cy="22" r="4.5" fill={gold}/>
            <circle cx="26.5" cy="20.5" r="3" fill={green}/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: green }}>
            Bespaarhulp<span style={{ color: gold }}> Friesland</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>#{quote.quoteNumber}</span>
          <PrintButton />
        </div>
      </div>

      {/* ── Document ───────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 32, paddingBottom: 60, paddingLeft: 16, paddingRight: 16 }}>

        {/* ══════════════════════════════════════════════════════════════════
            PAGINA 1 — BEGELEIDENDE BRIEF
        ══════════════════════════════════════════════════════════════════ */}
        {(() => { const p = nextPage(); return (
        <div className="doc-page" style={PAGE}>

          {/* Letterhead */}
          <div className="lh" style={{ background: green, padding: '28px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill={gold}/>
                <path d="M0 15L18 2L36 15H0Z" fill={gold}/>
                <rect x="2" y="15" width="32" height="19" rx="1.5" fill="rgba(255,255,255,0.15)"/>
                <rect x="5" y="18" width="6" height="6" rx="0.5" fill={gold} opacity="0.7"/>
                <rect x="14" y="18" width="6" height="6" rx="0.5" fill={gold} opacity="0.7"/>
                <circle cx="28" cy="22" r="4.5" fill={gold}/>
                <circle cx="26.5" cy="20.5" r="3" fill={green}/>
              </svg>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                  Bespaarhulp <span style={{ color: gold }}>Friesland</span>
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  Sjouke van der Kooistrjitte 15 · 9088BB Wirdum
                </p>
              </div>
            </div>
            <div className="lh-right" style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>058-2038054</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>info@bespaarhulpfriesland.nl</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>KVK 71128174</p>
            </div>
          </div>

          {/* Letter body */}
          <div className="li" style={{ padding: '52px 64px', flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* Date + reference — right aligned */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 44 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13.5, color: '#374151' }}>
                  {formatDate(quote.createdAt)}
                </p>
                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                  Offertenummer: <strong style={{ color: '#374151' }}>{quote.quoteNumber}</strong>
                </p>
                {quote.validUntil && (
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    Geldig tot: {formatDate(quote.validUntil)}
                  </p>
                )}
              </div>
            </div>

            {/* Recipient address */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{customerName}</p>
              {addr && (
                <>
                  <p style={{ fontSize: 13.5, color: '#374151' }}>{addr.street} {addr.houseNumber}</p>
                  <p style={{ fontSize: 13.5, color: '#374151' }}>{addr.postalCode} {addr.city}</p>
                </>
              )}
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 13.5, color: '#374151' }}>
                <strong>Betreft:</strong> {quote.title}
              </p>
            </div>

            {/* Salutation */}
            <p style={{ fontSize: 14.5, marginBottom: 22 }}>
              Beste {quote.customer.lastName},
            </p>

            {/* Body */}
            {quote.introText ? (
              <div style={{ flex: 1 }}>
                {quote.introText.split(/\n\n+/).map((para, i) => (
                  <p key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, marginBottom: 16 }}>
                    {para.replace(/\n/g, ' ')}
                  </p>
                ))}
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, marginBottom: 16 }}>
                  Hartelijk dank voor uw aanvraag bij Bespaarhulp Friesland. Bij deze ontvangt u uw persoonlijk maatwerkaanbod
                  voor <strong>{quote.title}</strong>{addrLine ? ` op het adres ${addrLine}` : ''}.
                </p>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, marginBottom: 16 }}>
                  Wij hebben uw situatie zorgvuldig doorgerekend en stellen een oplossing voor die optimaal aansluit bij uw
                  woonsituatie en energieverbruik. In deze offerte vindt u een volledig overzicht van het aanbod, inclusief
                  een persoonlijke situatie-analyse en transparante prijsopbouw.
                </p>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, marginBottom: 16 }}>
                  Voor vragen staat ons team voor u klaar via 058-2038054 of info@bespaarhulpfriesland.nl.
                </p>
              </div>
            )}

            {/* Closing */}
            <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 20 }}>Met vriendelijke groet,</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{signatoryName}</p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Bespaarhulp Friesland</p>
            </div>
          </div>

          <PageFooter n={p} total={pageCount} />
        </div>
        )})()}

        {/* ══════════════════════════════════════════════════════════════════
            PAGINA 2 — SALDERINGSREGELING
        ══════════════════════════════════════════════════════════════════ */}
        {showSalderingPage && (() => { const p = nextPage(); return (
        <div className="doc-page" style={PAGE}>

          {/* Dark header */}
          <div className="ph" style={{ background: '#111827', padding: '36px 52px', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Energiebeleid Nederland
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Het einde van de salderingsregeling
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
              Wat verandert er in 2027 en wat betekent dat concreet voor uw energierekening?
            </p>
          </div>

          {/* Context tekst */}
          <div className="sec" style={{ padding: '44px 52px', borderBottom: '1px solid #e5e7eb' }}>
            <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Achtergrond</p>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, marginBottom: 14 }}>
                  Nederland was jarenlang een van de <strong>weinige landen ter wereld</strong> met een volledige salderingsregeling voor zonnepanelen. Iedere kWh die u terugleverde aan het net, mocht u direct verrekenen met uw verbruik, alsof u de stroom zelf had opgeslagen.
                </p>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85 }}>
                  Dat was uniek. De meeste Europese landen hanteren al jaren een veel lager teruglevertarief. Per <strong>1 januari 2027</strong> volgt Nederland dat voorbeeld. De salderingsregeling stopt en teruggeleverde stroom wordt voortaan uitbetaald tegen het lage teruglevertarief van circa €{quote.feedbackTariff.toFixed(2).replace('.', ',')}/kWh, in plaats van verrekend tegen uw stroomtarief van €{quote.electricityTariff.toFixed(2).replace('.', ',')}/kWh.
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Tijdlijn</p>
                {[
                  { year: 'Tot 2023', text: 'Volledige saldering: 100% verrekening', done: true },
                  { year: '2023–2027', text: 'Afbouw saldering via staffel', done: true },
                  { year: '1 jan 2027', text: 'Saldering vervalt volledig', done: false, highlight: true },
                  { year: 'Na 2027', text: `Teruglevering uitbetaald à €${quote.feedbackTariff.toFixed(2).replace('.', ',')}/kWh`, done: false },
                ].map((item) => (
                  <div key={item.year} style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.highlight ? '#2563eb' : item.done ? '#9ca3af' : '#e5e7eb', border: item.highlight ? 'none' : '2px solid #d1d5db', marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: item.highlight ? '#2563eb' : '#6b7280' }}>{item.year}</p>
                      <p style={{ fontSize: 13.5, color: item.highlight ? '#111827' : '#374151', fontWeight: item.highlight ? 600 : 400 }}>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wat betekent dit voor jou */}
          <div className="sec" style={{ padding: '44px 52px', flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 28 }}>Wat betekent dit voor u?</p>
            <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

              {/* Cirkeldiagram */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 20, alignSelf: 'flex-start' }}>Uw jaarlijkse stroomsituatie</p>
                {(() => {
                  const r = 88
                  const cx = 110
                  const cy = 110
                  const circ = 2 * Math.PI * r
                  const feedPct = solarKwh > 0 ? feedbackKwh / solarKwh : 0
                  const selfPct = solarKwh > 0 ? (solarKwh - feedbackKwh) / solarKwh : 0
                  const feedDash = feedPct * circ
                  const selfDash = selfPct * circ
                  const selfOffset = -circ * 0.25
                  const feedOffset = selfOffset - selfDash
                  return (
                    <svg width={220} height={220} viewBox="0 0 220 220">
                      {/* Achtergrond ring */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={22} />
                      {/* Zelf gebruik — blauw */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2563eb" strokeWidth={22}
                        strokeDasharray={`${selfDash} ${circ - selfDash}`}
                        strokeDashoffset={selfOffset}
                        strokeLinecap="butt" />
                      {/* Teruglevering — grijs */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#cbd5e1" strokeWidth={22}
                        strokeDasharray={`${feedDash} ${circ - feedDash}`}
                        strokeDashoffset={feedOffset}
                        strokeLinecap="butt" />
                      {/* Midden tekst */}
                      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={13} fill="#6b7280">Totale opwek</text>
                      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#111827">{solarKwh.toLocaleString('nl-NL')}</text>
                      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={12} fill="#9ca3af">kWh / jaar</text>
                    </svg>
                  )
                })()}
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: '#2563eb' }} />
                    <span style={{ fontSize: 12, color: '#374151' }}>Eigen gebruik ({Math.round((solarKwh - feedbackKwh) / solarKwh * 100)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: '#cbd5e1' }} />
                    <span style={{ fontSize: 12, color: '#374151' }}>Teruglevering ({Math.round(feedbackKwh / solarKwh * 100)}%)</span>
                  </div>
                </div>
              </div>

              {/* Rekensom */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Gevolg voor uw termijnbedrag</p>
                <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Berekening</p>
                    {[
                      { label: 'Teruglevering per jaar', value: `${feedbackKwh.toLocaleString('nl-NL')} kWh` },
                      { label: 'Gesaldeerd deel (max. eigen verbruik)', value: `${saldeerbaar.toLocaleString('nl-NL')} × €${quote.electricityTariff.toFixed(2).replace('.', ',')}`, sub: `€${currentSalderingValue.toLocaleString('nl-NL')}/jr (huidig voordeel)` },
                      { label: 'Datzelfde deel na 2027', value: `${saldeerbaar.toLocaleString('nl-NL')} × €${quote.feedbackTariff.toFixed(2).replace('.', ',')}`, sub: `€${Math.round(saldeerbaar * quote.feedbackTariff).toLocaleString('nl-NL')}/jr` },
                      { label: 'Verlies door afschaffing saldering', value: `€${saldingYearlyExtra.toLocaleString('nl-NL')}/jr`, sub: `(€${currentSalderingValue.toLocaleString('nl-NL')} - €${Math.round(saldeerbaar * quote.feedbackTariff).toLocaleString('nl-NL')})` },
                      { label: 'Terugleverkosten leverancier', value: `${feedbackKwh.toLocaleString('nl-NL')} × €${quote.feedInCostTariff.toFixed(3).replace('.', ',')}`, sub: `€${feedInYearlyCost.toLocaleString('nl-NL')}/jr` },
                      { label: 'Totaal extra kosten per jaar', value: `€${(saldingYearlyExtra + feedInYearlyCost).toLocaleString('nl-NL')}`, bold: true },
                      { label: 'Totaal extra kosten per maand', value: `€${Math.round((saldingYearlyExtra + feedInYearlyCost) / 12)}`, bold: true },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#374151', background: row.bold ? '#f1f5f9' : 'transparent', marginLeft: row.bold ? -18 : 0, marginRight: row.bold ? -18 : 0, paddingLeft: row.bold ? 18 : 0, paddingRight: row.bold ? 18 : 0 }}>
                        <span style={{ fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: row.bold ? 700 : 600, fontVariantNumeric: 'tabular-nums', color: row.bold ? '#b91c1c' : '#374151' }}>{row.value}</span>
                          {'sub' in row && row.sub && <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>{row.sub}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {currentMonthlyBill > 0 ? (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px' }}>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>Huidig termijnbedrag</p>
                      <p style={{ fontSize: 26, fontWeight: 800, color: '#374151' }}>€{currentMonthlyBill}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>per maand</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: '#9ca3af' }}>→</div>
                    <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px' }}>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>Na 2027 (zonder actie)</p>
                      <p style={{ fontSize: 26, fontWeight: 800, color: '#b91c1c' }}>€{monthlyBill2027}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>per maand</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 13, color: '#92400e' }}>
                      Uw maandelijkse kostenstijging bedraagt <strong>€{totalMonthlyExtra} per maand</strong> na 2027 (saldering + terugleverkosten).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <PageFooter n={p} total={pageCount} />
        </div>
        )})()}

        {/* ══════════════════════════════════════════════════════════════════
            PAGINA 2B — PERSOONLIJK BATTERIJADVIES
        ══════════════════════════════════════════════════════════════════ */}
        {showBatteryAdvicePage && (() => { const p = nextPage(); return (
        <div className="doc-page" style={PAGE}>

          {/* Page header */}
          <div className="ph" style={{ background: green, padding: '36px 52px', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Persoonlijk batterijadvies
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              De juiste batterij voor uw situatie
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 520 }}>
              Op basis van uw energieprofiel hebben wij berekend welke batterijcapaciteit het beste bij u past.
            </p>
          </div>

          {/* Hero: aanbeveling */}
          <div className="sec" style={{ padding: '36px 52px', background: '#f8faf9', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
            <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Aanbevolen batterijcapaciteit
                </p>
                <div style={{ fontSize: 72, fontWeight: 900, color: green, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {advRecommended.toString().replace('.', ',')}
                  <span style={{ fontSize: 28, fontWeight: 600, color: '#6b7280', marginLeft: 6 }}>kWh</span>
                </div>
                <p style={{ fontSize: 14, color: '#374151', marginTop: 10 }}>
                  Alpha ESS thuisbatterij — specifiek gekozen op basis van uw dagelijks overschot en verbruikspatroon.
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>€{advAnnualSavings.toLocaleString('nl-NL')}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>verwachte besparing/jaar</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: green }}>{advSelfUseKwh.toLocaleString('nl-NL')}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>kWh extra zelfgebruik/jaar</div>
                  </div>
                </div>
              </div>

              {/* Visueel: overschot vóór vs na batterij */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 22px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Uw zonne-energie: nu vs. met batterij
                </p>
                {(() => {
                  const selfNow = solarKwh > 0 ? Math.round((solarKwh - feedbackKwh) / solarKwh * 100) : 0
                  const feedNow = 100 - selfNow
                  const extraSelf = solarKwh > 0 ? Math.round(advSelfUseKwh / solarKwh * 100) : 0
                  const selfAfter = Math.min(100, selfNow + extraSelf)
                  const feedAfter = 100 - selfAfter
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {[
                        { label: 'Nu (zonder batterij)', selfPct: selfNow, feedPct: feedNow },
                        { label: 'Met batterij', selfPct: selfAfter, feedPct: feedAfter },
                      ].map((row, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: i === 1 ? 700 : 400 }}>{row.label}</span>
                            <span style={{ fontSize: 12, color: green, fontWeight: 700 }}>{row.selfPct}% eigen gebruik</span>
                          </div>
                          <div style={{ height: 18, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9', display: 'flex' }}>
                            <div style={{ width: `${row.selfPct}%`, background: green, transition: 'width 0.3s' }} />
                            <div style={{ width: `${row.feedPct}%`, background: '#d1d5db' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 14, marginTop: 5 }}>
                            <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 8, height: 8, background: green, borderRadius: 2, display: 'inline-block' }} /> Eigen gebruik
                            </span>
                            <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 8, height: 8, background: '#d1d5db', borderRadius: 2, display: 'inline-block' }} /> Teruglevering
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Berekeningsonderbouwing */}
          <div className="sec" style={{ padding: '32px 52px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>
              Hoe komt dit advies tot stand?
            </p>
            <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '18px 20px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>Stap-voor-stap berekening</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {([
                      ['Teruglevering per jaar', `${feedbackKwh.toLocaleString('nl-NL')} kWh`],
                      ['Gemiddeld dagelijks overschot', `${(Math.round(feedbackKwh / 365 * 10) / 10).toString().replace('.', ',')} kWh/dag`],
                      ['Zomers dagelijks overschot', `${(Math.round(feedbackKwh * 0.65 / 182 * 10) / 10).toString().replace('.', ',')} kWh/dag`],
                      ...(quote.hasHeatPump ? [['Warmtepomp toeslag', '+2,5 kWh']] : []),
                      ...(kwp >= 5 ? [[`Hoog vermogen (${kwp.toString().replace('.', ',')} kWp)`, `+${(Math.round(kwpExtra * 10) / 10).toString().replace('.', ',')} kWh`]] : []),
                      ['Minimaal benodigde capaciteit', `${(Math.round(advBaseKwh * 10) / 10).toString().replace('.', ',')} kWh`],
                      ['Aanbevolen Alpha ESS maat', `${advRecommended.toString().replace('.', ',')} kWh`],
                    ] as [string, string][]).map(([label, val], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e9ecef' }}>
                        <td style={{ padding: '7px 0', fontSize: 12.5, color: '#4b5563' }}>{label}</td>
                        <td style={{ padding: '7px 0', fontSize: 12.5, fontWeight: 700, textAlign: 'right', color: '#111827' }}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#fff', border: `2px solid ${green}`, borderRadius: 10, padding: '16px 18px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: green, marginBottom: 8 }}>Waarom dit formaat?</p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                    De zomer levert circa 65% van uw jaarlijkse teruglevering in slechts 182 dagen. Op een goede zomerdag
                    stroomt er {(Math.round(feedbackKwh * 0.65 / 182 * 10) / 10).toString().replace('.', ',')} kWh terug naar het net.
                    Een batterij van {advRecommended.toString().replace('.', ',')} kWh vangt dit dagelijks overschot volledig op.
                  </p>
                </div>
                {quote.hasHeatPump && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>Warmtepomp meegerekend</p>
                    <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                      Uw warmtepomp heeft extra opslagcapaciteit nodig voor piekverplaatsing.
                      Wij hebben 2,5 kWh extra capaciteit meegenomen in het advies.
                    </p>
                  </div>
                )}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>Zelfvoorzieningsgraad stijgt</p>
                  <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                    Door {advSelfUseKwh.toLocaleString('nl-NL')} kWh/jaar zelf te gebruiken in plaats van terug te leveren,
                    ontvangt u €{tariffDiff.toFixed(2).replace('.', ',')} meer per kWh.
                    Dat levert u circa <strong>€{advAnnualSavings.toLocaleString('nl-NL')}/jaar</strong> op.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wat lost de batterij op */}
          <div className="sec" style={{ padding: '28px 52px', flexGrow: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              Wat lost de batterij voor u op?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                {
                  icon: '⚡',
                  title: 'Salderingsverlies',
                  body: `Na 2027 vervalt de salderingsregeling. De batterij slaat uw overschot op zodat u het zelf gebruikt — voor €${quote.electricityTariff.toFixed(2).replace('.', ',')} i.p.v. het terug te leveren voor €${quote.feedbackTariff.toFixed(2).replace('.', ',')}/kWh.`,
                  color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
                },
                {
                  icon: '💸',
                  title: 'Terugleverkosten',
                  body: `Uw energieleverancier rekent terugleverkosten per kWh. Met een batterij levert u minder terug en betaalt u minder terugleverkosten.`,
                  color: '#d97706', bg: '#fffbeb', border: '#fcd34d',
                },
                {
                  icon: '📈',
                  title: 'EMS onbalansmarkt',
                  body: `De Alpha ESS EMS handelt automatisch op de onbalansmarkt. Gemiddeld levert dit €1.314/jaar extra op (3-jaarsgemiddelde, 9,3 kWh systeem).`,
                  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
                },
              ].map((card, i) => (
                <div key={i} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: '16px' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{card.icon}</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: card.color, marginBottom: 6 }}>{card.title}</p>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{card.body}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, fontStyle: 'italic' }}>
              * Niet meegenomen in dit advies: dakoriëntatie, schaduw, EV-laden thuis. Dit is een indicatie op basis van uw opgegeven verbruiksgegevens.
            </p>
          </div>

          <PageFooter n={p} total={pageCount} />
        </div>
        )})()}

        {/* ══════════════════════════════════════════════════════════════════
            PAGINA 3 — SITUATIE-ANALYSE
        ══════════════════════════════════════════════════════════════════ */}
        {showBespaarplan && (() => { const p = nextPage(); return (
        <div className="doc-page" style={{ ...PAGE, minHeight: 0 }}>

          {/* Page header */}
          <div className="ph" style={{ background: '#111827', padding: '36px 52px', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Situatie-analyse
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              De energiemarkt verandert
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
              Drie ontwikkelingen beïnvloeden uw energiekosten de komende jaren direct, op basis van uw persoonlijke situatie.
            </p>
          </div>

          {/* S1 — Saldering */}
          {quote.hasSolarPanels && feedbackKwh > 0 && (
            <div className="sec" style={{ padding: '44px 52px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ borderTop: '2px solid #2563eb', paddingTop: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                  Energiemarktrisico 1: Afschaffing saldering
                </p>
                <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Jaarlijkse kostenstijging na 2027</p>
                    <p className="num-big" style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      +€{saldingYearlyExtra.toLocaleString('nl-NL')}
                    </p>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>per jaar · +€{saldingMonthlyExtra}/maand</p>
                    <div style={{ marginTop: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                        Waarde teruggeleverde stroom ({feedbackKwh.toLocaleString('nl-NL')} kWh/jr)
                      </p>
                      {(() => {
                        const futureVal = Math.round(saldeerbaar * quote.feedbackTariff)
                        const bars = [
                          { label: 'Nu via saldering', value: currentSalderingValue, shade: '#94a3b8' },
                          { label: 'Na 2027 via teruglevertarief', value: futureVal, shade: '#cbd5e1' },
                        ]
                        return bars.map((bar, i) => (
                          <div key={i} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: '#374151' }}>{bar.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>€{bar.value.toLocaleString('nl-NL')}</span>
                            </div>
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 3 }}>
                              <div style={{ height: '100%', width: `${Math.round(bar.value / Math.max(currentSalderingValue, 1) * 100)}%`, background: bar.shade, borderRadius: 3 }} />
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 16 }}>
                      De salderingsregeling vervalt per <strong>1 januari 2027</strong>. Van uw {feedbackKwh.toLocaleString('nl-NL')} kWh teruglevering kan {saldeerbaar.toLocaleString('nl-NL')} kWh worden gesaldeerd (maximaal uw eigen netto verbruik). Dat deel wordt straks niet meer verrekend à €{quote.electricityTariff.toFixed(2).replace('.', ',')}/kWh, maar uitbetaald à €{quote.feedbackTariff.toFixed(2).replace('.', ',')}/kWh.
                    </p>
                    <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6 }}>
                          <span>{saldeerbaar.toLocaleString('nl-NL')} kWh × €{quote.electricityTariff.toFixed(2).replace('.', ',')} <span style={{ color: '#9ca3af' }}>(nu, via saldering)</span></span>
                          <span style={{ fontWeight: 600 }}>€{currentSalderingValue.toLocaleString('nl-NL')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8 }}>
                          <span>{saldeerbaar.toLocaleString('nl-NL')} kWh × €{quote.feedbackTariff.toFixed(2).replace('.', ',')} <span style={{ color: '#9ca3af' }}>(na 2027)</span></span>
                          <span style={{ fontWeight: 600 }}>€{Math.round(saldeerbaar * quote.feedbackTariff).toLocaleString('nl-NL')}</span>
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
          {quote.hasSolarPanels && feedInYearlyCost > 0 && (
            <div className="sec" style={{ padding: '44px 52px', background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ borderTop: '2px solid #2563eb', paddingTop: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                  Energiemarktrisico 2: Terugleverkosten
                </p>
                <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Jaarlijkse kosten, nu al</p>
                    <p className="num-big" style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      €{feedInYearlyCost.toLocaleString('nl-NL')}
                    </p>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>per jaar · €{Math.round(feedInYearlyCost / 12)}/maand</p>
                    <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6 }}>
                          <span>Teruglevering per jaar</span><span style={{ fontWeight: 600 }}>{feedbackKwh.toLocaleString('nl-NL')} kWh</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8 }}>
                          <span>Tarief</span><span style={{ fontWeight: 600 }}>€{quote.feedInCostTariff.toFixed(3).replace('.', ',')}/kWh</span>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                        <span>Kosten per jaar</span><span style={{ color: '#2563eb' }}>€{feedInYearlyCost.toLocaleString('nl-NL')}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
                      Energieleveranciers rekenen terugleverkosten van €{quote.feedInCostTariff.toFixed(2).replace('.', ',')}/kWh voor elke kWh die u terugstuurt. Dit is een kostenpost die <strong>nu al geldt</strong>, los van de salderingswijziging in 2027.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* S3 — Netcongestie & EMS */}
          <div className="sec" style={{ padding: '44px 52px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ borderTop: '2px solid #2563eb', paddingTop: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                Marktachtergrond: Netcongestie en onbalansmarkt
              </p>
              <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Netgebieden met congestie</p>
                  <p className="num-big" style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>74%</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>2025 · Bron: Netbeheer Nederland</p>
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 10 }}>% netgebieden met congestie (2020–2027)</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 70 }}>
                      {CONGESTION.map((d) => (
                        <div key={d.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: '100%', height: `${Math.round(d.pct * 0.68)}px`, background: d.year >= '2026' ? '#93c5fd' : d.year >= '2025' ? '#2563eb' : '#cbd5e1', borderRadius: '2px 2px 0 0' }} />
                          <span style={{ fontSize: 8, color: '#9ca3af' }}>{d.year.slice(2)}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>Netbeheer Nederland / TenneT · lichtblauw = prognose</p>
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 14 }}>
                    <strong>74%</strong> van de Nederlandse netgebieden kampt met congestie. Netbeheerders schatten dat er <strong>€180 miljard nodig is</strong> om het stroomnet toekomstbestendig te maken (Netbeheer Nederland, 2024).
                  </p>
                  <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>EMS-opbrengst: illustratief voorbeeld</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
                      <span>Alpha ESS 9,3 kWh batterij</span>
                      <span style={{ fontWeight: 700 }}>€1.314/jaar</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, lineHeight: 1.5 }}>Gemiddelde op basis van de Alpha ESS-vloot over de afgelopen 3 jaar.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* S4 — Woningwaarde */}
          <div className="sec" style={{ padding: '44px 52px', background: '#f8f9fa' }}>
            <div style={{ borderTop: '2px solid #2563eb', paddingTop: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                Vastgoedprestatie: Energielabel en woningwaarde
              </p>
              <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                <div>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Waardeverschil label A vs. D</p>
                  <p className="num-big" style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>+14%</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Bron: PBL / Calcasa 2023</p>
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Relatieve woningwaarde per energielabel</p>
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
                    Woningen met energielabel A zijn gemiddeld <strong>14% meer waard</strong> dan vergelijkbare woningen met label D, en circa <strong>28% meer</strong> dan label G (PBL, 2023).
                  </p>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
                    Een thuisbatterij gecombineerd met zonnepanelen kan uw energielabel met <strong>1 tot 3 klassen</strong> verbeteren.
                  </p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, lineHeight: 1.6 }}>
                    Bron: PBL Planbureau voor de Leefomgeving · NVM Woningmarktrapport 2023 · Calcasa
                  </p>
                </div>
              </div>
            </div>
          </div>

          <PageFooter n={p} total={pageCount} />
        </div>
        )})()}

        {/* ══════════════════════════════════════════════════════════════════
            PAGINA 3 — HET ANTWOORD
        ══════════════════════════════════════════════════════════════════ */}
        {showBespaarplan && (() => { const p = nextPage(); return (
        <div className="doc-page" style={PAGE}>

          {/* Dark header */}
          <div className="ph" style={{ background: '#111827', padding: '36px 52px', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Het antwoord
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Hoe de thuisbatterij inspeelt op elke ontwikkeling
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
              Elk van de bovenstaande ontwikkelingen heeft een directe financiële impact. Hieronder de respons op elk punt.
            </p>
          </div>

          {/* Table */}
          <div className="sec" style={{ padding: '44px 52px' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
              {((): { title: string; desc: string; value: string | null; note?: boolean }[] => [
                ...(quote.hasSolarPanels && feedbackKwh > 0 && saldingYearlyExtra > 0 ? [{
                  title: 'Afschaffing saldering (2027)',
                  desc: 'Batterij slaat overdag overschot op. Geen teruglevering en geen tariefverlies na 2027.',
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
                  value: '+14 tot 28%', note: true,
                },
              ])().map((row, i, arr) => (
                <div key={row.title} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
                  padding: '18px 24px',
                  background: i % 2 === 0 ? '#fff' : '#f8f9fa',
                  borderBottom: i < arr.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{row.title}</p>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>{row.desc}</p>
                  </div>
                  {row.value && (
                    <p style={{ fontSize: 16, fontWeight: 700, color: row.note ? '#374151' : '#2563eb', whiteSpace: 'nowrap' }}>{row.value}</p>
                  )}
                </div>
              ))}
            </div>

            {totalYearlyBenefit > 0 && (
              <div style={{ background: '#111827', borderRadius: 14, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Totaal financieel voordeel per jaar</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    {[
                      quote.hasSolarPanels && saldingYearlyExtra > 0 ? 'saldering' : null,
                      feedInYearlyCost > 0 ? 'terugleverkosten' : null,
                      emsRevenue > 0 ? 'EMS' : null,
                    ].filter(Boolean).join(' + ')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    €{totalYearlyBenefit.toLocaleString('nl-NL')}
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>= €{totalMonthlyBenefit}/maand</p>
                </div>
              </div>
            )}

            {emsRevenue === 0 && (
              <p style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.6 }}>
                * Gemiddelde op basis van de Alpha ESS-vloot over de afgelopen 3 jaar. Werkelijke opbrengst is afhankelijk van marktprijzen.
              </p>
            )}
          </div>

          {/* Decorative fill */}
          <div style={{ flex: 1, background: `linear-gradient(135deg, ${green} 0%, #052e1a 100%)`, padding: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                Energie-onafhankelijkheid begint hier
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: 340 }}>
                Slim opslaan,<br />meer besparen.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { n: '250+', l: 'installaties in Friesland' },
                { n: '10 jr', l: 'garantie Alpha ESS' },
                { n: 'UL9540A', l: 'veiligheidskeurmerk' },
              ].map(b => (
                <div key={b.n} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: gold, minWidth: 80 }}>{b.n}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{b.l}</p>
                </div>
              ))}
            </div>
          </div>

          <PageFooter n={p} total={pageCount} />
        </div>
        )})()}

        {/* ══════════════════════════════════════════════════════════════════
            PAGINA 4 — UW INSTALLATIE
        ══════════════════════════════════════════════════════════════════ */}
        {(() => { const p = nextPage(); return (
        <div className="doc-page" style={{ ...PAGE, minHeight: 0 }}>

          {/* Header */}
          <div className="ph" style={{ background: green, padding: '36px 52px', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Uw installatie
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              {quote.title}
            </h2>
          </div>

          {/* Products */}
          <div className="sec" style={{ padding: '36px 52px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              {quote.lines.map((line) => {
                const p2 = line.product
                return (
                  <div key={line.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: 140, minWidth: 140, background: p2?.imageUrl ? '#f9fafb' : '#f0faf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {p2?.imageUrl
                        ? <img src={p2.imageUrl} alt={line.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 40 }}>
                            {p2?.category === 'BATTERY' ? '🔋' : p2?.category === 'SOLAR' ? '☀️' : p2?.category === 'HEAT_PUMP' ? '♨️' : p2?.category === 'CHARGER' ? '⚡' : '📦'}
                          </span>
                      }
                    </div>
                    <div style={{ flex: 1, padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 3 }}>
                            {line.quantity > 1 && <span style={{ color: green, marginRight: 6 }}>{line.quantity}×</span>}
                            {line.name}
                          </p>
                          {line.description && <p style={{ fontSize: 13, color: '#6b7280' }}>{line.description}</p>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(line.quantity * line.unitPrice * (1 + line.vatRate / 100))}
                          </p>
                          <p style={{ fontSize: 11.5, color: '#9ca3af' }}>incl. BTW</p>
                        </div>
                      </div>
                      {p2 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {p2.capacityKwh && <span style={{ background: '#f0faf4', color: green, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{p2.capacityKwh} kWh</span>}
                          {p2.powerKw && <span style={{ background: '#f0faf4', color: green, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{p2.powerKw} kW</span>}
                          {p2.warrantyYears && <span style={{ background: '#f9fafb', color: '#6b7280', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{p2.warrantyYears} jaar garantie</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {quote.includedItems && (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '22px 24px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: green, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Dit is inbegrepen</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quote.includedItems.split('\n').map((l, i) => {
                    const t = l.trim()
                    if (!t) return null
                    if (t.startsWith('-')) return (
                      <div key={i} style={{ display: 'flex', gap: 10 }}>
                        <span style={{ color: green, fontWeight: 700 }}>✓</span>
                        <span style={{ fontSize: 13.5, color: '#374151' }}>{t.replace(/^-\s*/, '')}</span>
                      </div>
                    )
                    return <p key={i} style={{ fontWeight: 700, fontSize: 14 }}>{t}</p>
                  })}
                </div>
              </div>
            )}
          </div>

          <PageFooter n={p} total={pageCount} />
        </div>
        )})()}

        {/* ══════════════════════════════════════════════════════════════════
            PAGINA 5 — INVESTERING
        ══════════════════════════════════════════════════════════════════ */}
        {(() => { const p = nextPage(); return (
        <div className="doc-page" style={PAGE}>

          {/* Header */}
          <div className="ph" style={{ background: '#111827', padding: '36px 52px', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Investering
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Prijsopbouw
            </h2>
          </div>

          <div className="sec" style={{ padding: '44px 52px', flex: 1 }}>
            <div className="g2r" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start', marginBottom: 36 }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                {quote.lines.map((line, i) => (
                  <div key={line.id} style={{ padding: '14px 20px', borderBottom: i < quote.lines.length - 1 ? '1px solid #e5e7eb' : 'none', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600 }}>{line.name}</p>
                      {line.description && <p style={{ fontSize: 12, color: '#9ca3af' }}>{line.description}</p>}
                    </div>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{line.quantity}×</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: green, borderRadius: 12, padding: '24px', color: '#fff' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Totaal</p>
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

            {/* Status banners */}
            {quote.status === 'ACCEPTED' && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>Geaccepteerd op {formatDate(quote.acceptedAt)}</p>
                {quote.acceptance && <p style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>Ondertekend door {quote.acceptance.firstName} {quote.acceptance.lastName}</p>}
              </div>
            )}
            {quote.status === 'REJECTED' && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>Afgewezen op {formatDate(quote.rejectedAt)}</p>
              </div>
            )}
          </div>

          {/* Social proof fill */}
          <div className="sec" style={{ background: '#f8f9fa', borderTop: '1px solid #e5e7eb', padding: '36px 52px', flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              250+ tevreden huishoudens gingen u voor
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { title: '4 weken', sub: 'gemiddelde installatietijd bij u thuis' },
                { title: '250+', sub: 'installaties in Friesland' },
                { title: 'Warmtefonds', sub: 'lage rente financiering' },
                { title: 'BTW-teruggave', sub: 'wij regelen het volledig' },
              ].map((b) => (
                <div key={b.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 20px', minWidth: 140, flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 3 }}>{b.title}</p>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>{b.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptatie — 3 knoppen + formulier */}
          {canInteract && (
            <div className="sec" style={{ padding: '36px 52px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Wat wilt u doen?</p>
              <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 22 }}>
                Kies een optie en onderteken digitaal. Na ondertekening nemen wij binnen 24 uur contact op.
              </p>
              <QuoteAcceptanceForm token={token} customerName={customerName} />
            </div>
          )}

          {quote.status === 'ACCEPTED' && quote.acceptance && (
            <div style={{ padding: '24px 52px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                Geaccepteerd op {formatDate(quote.acceptedAt)}
              </p>
              <p style={{ fontSize: 13, color: '#166534' }}>
                Ondertekend door {quote.acceptance.firstName} {quote.acceptance.lastName}
              </p>
            </div>
          )}

          <PageFooter n={p} total={pageCount} />
        </div>
        )})()}

        {/* ══════════════════════════════════════════════════════════════════
            PAGINA 6 — VOORWAARDEN & HANDTEKENING
        ══════════════════════════════════════════════════════════════════ */}
        {(() => { const p = nextPage(); return (
        <div className="doc-page" style={{ ...PAGE, minHeight: 0 }}>

          {/* Header */}
          <div className="ph" style={{ background: green, padding: '36px 52px', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Algemene voorwaarden
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              {quote.status === 'ACCEPTED' ? 'Getekend document' : 'Voorwaarden'}
            </h2>
          </div>

          {/* Terms */}
          <div className="sec" style={{ padding: '36px 52px', borderBottom: '1px solid #e5e7eb' }}>
            <TermsAndConditions text={quote.termsText} />
          </div>

          {/* Handtekening weergave na acceptatie */}
          {quote.status === 'ACCEPTED' && quote.acceptance && (
            <div className="sec" style={{ padding: '32px 52px', background: '#f0fdf4' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>
                Geaccepteerd op {formatDate(quote.acceptedAt)}
              </p>
              <p style={{ fontSize: 13, color: '#166534', marginBottom: 16 }}>
                Ondertekend door {quote.acceptance.firstName} {quote.acceptance.lastName}
              </p>
              {quote.acceptance.signatureData && (
                <div style={{ display: 'inline-block', background: '#fff', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px' }}>
                  <img src={quote.acceptance.signatureData} alt="Handtekening" style={{ display: 'block', maxWidth: 280, height: 'auto' }} />
                </div>
              )}
            </div>
          )}

          {!quote.termsText && quote.status !== 'ACCEPTED' && (
            <div className="sec" style={{ padding: '36px 52px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 14, color: '#9ca3af' }}>Geen algemene voorwaarden toegevoegd aan deze offerte.</p>
            </div>
          )}

          <PageFooter n={p} total={pageCount} />
        </div>
        )})()}

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#111827', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Bespaarhulp <span style={{ color: gold }}>Friesland</span>
        </p>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>
          Sjouke van der Kooistrjitte 15 · 9088BB Wirdum · 058-2038054 · KVK 71128174
        </p>
      </div>
    </div>
  )
}
