export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import QuoteAcceptanceForm from '@/components/quotes/QuoteAcceptanceForm'
import PrintButton from '@/components/quotes/PrintButton'
import TermsAndConditions from '@/components/quotes/TermsAndConditions'
import { formatDate, formatCurrency } from '@/lib/utils'
import { calculateSavings } from '@/lib/savings'

type Props = { params: Promise<{ token: string }> }

const CATEGORY_EMOJI: Record<string, string> = {
  BATTERY: '🔋',
  SOLAR: '☀️',
  HEAT_PUMP: '♨️',
  CHARGER: '⚡',
  EMERGENCY_POWER: '🔌',
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: '#0a5c35', textTransform: 'uppercase',
      letterSpacing: '0.12em', marginBottom: 8,
    }}>{text}</p>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? '#0a5c35' : '#fff',
      color: accent ? '#fff' : '#111',
      border: accent ? 'none' : '1px solid #e5e7eb',
      borderRadius: 14,
      padding: '20px 22px',
      flex: 1,
      minWidth: 140,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: sub ? 2 : 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, opacity: 0.7 }}>{sub}</p>}
    </div>
  )
}

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
              imageUrl: true,
              category: true,
              capacityKwh: true,
              powerKw: true,
              warrantyYears: true,
              savingsKwhYear: true,
              gasReductionM3Year: true,
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

  // Compute total product savings
  const totalSavingsKwh = quote.lines.reduce((sum, l) => {
    return sum + (l.product?.savingsKwhYear ?? 0) * l.quantity
  }, 0)
  const totalGasReductionM3 = quote.lines.reduce((sum, l) => {
    return sum + (l.product?.gasReductionM3Year ?? 0) * l.quantity
  }, 0)

  // Run savings calculation if we have enough data
  const hasEnergyData = quote.electricityTariff > 0 && (totalSavingsKwh > 0 || totalGasReductionM3 > 0)
  const savings = hasEnergyData ? calculateSavings(
    {
      electricityUsageKwh: quote.electricityUsageKwh ?? 0,
      electricityFeedbackKwh: quote.electricityFeedbackKwh ?? 0,
      solarProductionKwh: quote.solarProductionKwh ?? 0,
      gasUsageM3: quote.gasUsageM3 ?? 0,
      hasSolarPanels: quote.hasSolarPanels,
      electricityTariff: quote.electricityTariff,
      feedbackTariff: quote.feedbackTariff,
      gasTariff: quote.gasTariff,
      feedInCostTariff: quote.feedInCostTariff,
      emsAnnualRevenueEur: quote.emsAnnualRevenueEur,
      savingsKwhYear: totalSavingsKwh,
      gasReductionM3Year: totalGasReductionM3,
      totalInvestment: quote.total,
      subsidyAmount: quote.subsidyAmount,
    },
    {
      loanInterestRate: quote.loanInterestRate,
      loanTermYears: quote.loanTermYears,
      subsidyAmount: quote.subsidyAmount,
      totalInvestment: quote.total,
    }
  ) : null

  const isFinanced = quote.quoteType === 'GEFINANCIERD'
  const font = '"DM Sans", system-ui, sans-serif'

  return (
    <div style={{ fontFamily: font, background: '#f5f7f5', minHeight: '100vh', color: '#111827' }}>

      {/* ── Sticky nav bar ─────────────────────────────────────────────── */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '10px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="26" viewBox="0 0 36 34" fill="none">
            <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill="#f5c442"/>
            <path d="M0 15L18 2L36 15H0Z" fill="#f5c442"/>
            <rect x="2" y="15" width="32" height="19" rx="1.5" fill="#0a5c35"/>
            <rect x="5" y="18" width="6" height="6" rx="0.5" fill="#f5c442" opacity="0.7"/>
            <rect x="14" y="18" width="6" height="6" rx="0.5" fill="#f5c442" opacity="0.7"/>
            <rect x="5" y="26" width="6" height="7" rx="0.5" fill="#f5c442" opacity="0.5"/>
            <circle cx="28" cy="22" r="4.5" fill="#f5c442"/>
            <circle cx="26.5" cy="20.5" r="3" fill="#0a5c35"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0a5c35' }}>
            Bespaarhulp<span style={{ color: '#f5c442' }}> Friesland</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, color: '#6b7280' }}>#{quote.quoteNumber}</span>
          <PrintButton />
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a5c35 0%, #0d7a47 100%)',
        padding: '56px 24px 64px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#f5c442', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Persoonlijke offerte
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Uw energieplan,<br />
          <span style={{ color: '#f5c442' }}>op maat gemaakt</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
          Voor {customerName}
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          {quote.quoteNumber} · {formatDate(quote.createdAt)}
        </p>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {[
            { icon: '🏠', label: '250+ installaties', sub: 'in Friesland' },
            { icon: '⭐', label: '4,8 / 5', sub: 'gemiddelde beoordeling' },
            { icon: '🏦', label: 'Warmtefonds & SVn', sub: 'financiering mogelijk' },
            { icon: '📋', label: 'BTW-teruggave', sub: 'wij regelen het voor u' },
          ].map((b) => (
            <div key={b.label} style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '10px 16px',
              backdropFilter: 'blur(4px)',
              textAlign: 'center',
              minWidth: 130,
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{b.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{b.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{b.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Saldering alarm ─────────────────────────────────────────────── */}
      {quote.hasSolarPanels && savings && savings.annualSaldingLossEur > 0 && (
        <div style={{ background: '#fffbeb', borderTop: '3px solid #f5c442', padding: '28px 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              ⚠️ Saldering vervalt volledig in 2027
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#92400e', letterSpacing: '-0.01em', marginBottom: 8 }}>
              Zonder thuisbatterij verliest u{' '}
              <span style={{ color: '#b45309' }}>€{savings.annualSaldingLossEur.toLocaleString('nl-NL')}</span> per jaar
            </h2>
            <p style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6, maxWidth: 580 }}>
              U levert nu {quote.electricityFeedbackKwh?.toLocaleString('nl-NL') ?? '—'} kWh per jaar terug aan het net.
              Vanaf 2027 ontvangt u daarvoor nog maar €{quote.feedbackTariff}/kWh in plaats van de huidige stroombesparing van €{quote.electricityTariff}/kWh.
              Met een thuisbatterij gebruikt u die stroom zelf en behoudt u het volledige voordeel.
            </p>
          </div>
        </div>
      )}

      {/* ── Bespaarplan ─────────────────────────────────────────────────── */}
      {savings && (
        <div style={{ background: '#fff', padding: '48px 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <SectionLabel text="Uw bespaarplan" />
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', marginBottom: 6 }}>
              {isFinanced
                ? 'Financieel voordeel vanaf dag 1'
                : 'Wat levert deze investering u op?'
              }
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, maxWidth: 560 }}>
              {isFinanced
                ? `Uw maandelijkse besparing is hoger dan de leningsbetaling — u verdient direct al terug.`
                : `Gebaseerd op uw energieverbruik en de geselecteerde producten.`
              }
            </p>

            {isFinanced ? (
              /* Gefinancierd layout */
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
                <StatCard accent
                  label="Netto voordeel per maand"
                  value={savings.monthlyNetBenefit > 0 ? `€${savings.monthlyNetBenefit}` : '—'}
                  sub="besparing minus leningsbetaling"
                />
                <StatCard
                  label="Maandelijkse besparing"
                  value={`€${savings.monthlySavings}`}
                  sub="op energie"
                />
                <StatCard
                  label="Maandelijkse afbetaling"
                  value={`€${savings.monthlyLoanPayment}`}
                  sub={`${quote.loanTermYears} jaar · ${(quote.loanInterestRate * 100).toFixed(1)}% rente`}
                />
                <StatCard
                  label="Besparing in 10 jaar"
                  value={`€${savings.savingsOver10Years.toLocaleString('nl-NL')}`}
                  sub="na lening"
                />
              </div>
            ) : (
              /* Eigen investering layout */
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
                <StatCard accent
                  label="Terugverdientijd"
                  value={`${savings.paybackYears} jaar`}
                  sub="op netto investering"
                />
                <StatCard
                  label="Jaarlijkse besparing"
                  value={`€${savings.totalAnnualSavingsEur.toLocaleString('nl-NL')}`}
                  sub="op energie"
                />
                <StatCard
                  label="Besparing in 10 jaar"
                  value={`€${savings.savingsOver10Years.toLocaleString('nl-NL')}`}
                  sub="netto na investering"
                />
                <StatCard
                  label="Besparing in 20 jaar"
                  value={`€${savings.savingsOver20Years.toLocaleString('nl-NL')}`}
                  sub="netto"
                />
              </div>
            )}

            {/* Breakdown bar */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 22px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Besparing opbouw
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Stroomkosten besparing', value: savings.electricitySavingsEur, icon: '⚡' },
                  ...(savings.gasSavingsEur > 0 ? [{ label: 'Gaskosten besparing', value: savings.gasSavingsEur, icon: '🔥' }] : []),
                  ...(savings.saldingSavingsEur > 0 ? [{ label: 'Salderings voordeel (na 2027)', value: savings.saldingSavingsEur, icon: '☀️' }] : []),
                  ...(savings.feedInSavingsEur > 0 ? [{ label: 'Vermeden terugleverkosten', value: savings.feedInSavingsEur, icon: '🔌' }] : []),
                  ...(savings.emsRevenueEur > 0 ? [{ label: 'EMS / onbalansmarkt opbrengst', value: savings.emsRevenueEur, icon: '📈' }] : []),
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1, fontSize: 13.5, color: '#374151' }}>{item.label}</span>
                    <div style={{ width: 160, height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: 99,
                        background: '#0a5c35',
                        width: `${Math.min(100, (item.value / savings.totalAnnualSavingsEur) * 100)}%`,
                      }} />
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0a5c35', width: 64, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      €{item.value.toLocaleString('nl-NL')}/jr
                    </span>
                  </div>
                ))}
              </div>
              {savings.co2ReductionKgYear > 0 && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15 }}>🌱</span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    CO₂ reductie: <strong style={{ color: '#0a5c35' }}>{savings.co2ReductionKgYear.toLocaleString('nl-NL')} kg</strong> per jaar
                    — vergelijkbaar met {Math.round(savings.co2ReductionKgYear / 120)} bomen
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Producten ────────────────────────────────────────────────────── */}
      <div style={{ background: '#f5f7f5', padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <SectionLabel text="Uw installatie" />
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', marginBottom: 24 }}>
            {quote.title}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {quote.lines.map((line) => {
              const p = line.product
              const emoji = p?.category ? (CATEGORY_EMOJI[p.category] ?? '📦') : '📦'
              const lineTotal = line.quantity * line.unitPrice * (1 + line.vatRate / 100)
              return (
                <div key={line.id} style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'stretch',
                }}>
                  {/* Image / emoji */}
                  <div style={{
                    width: 120,
                    minWidth: 120,
                    background: p?.imageUrl ? '#f9fafb' : '#f0faf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {p?.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={line.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 36 }}>{emoji}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 3 }}>
                          {line.quantity > 1 && <span style={{ color: '#0a5c35', marginRight: 6 }}>{line.quantity}×</span>}
                          {line.name}
                        </p>
                        {line.description && (
                          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{line.description}</p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 16, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(lineTotal)}
                        </p>
                        <p style={{ fontSize: 11.5, color: '#9ca3af' }}>incl. BTW</p>
                      </div>
                    </div>

                    {/* Specs pills */}
                    {p && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {p.capacityKwh && (
                          <span style={{ background: '#f0faf4', color: '#0a5c35', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                            {p.capacityKwh} kWh
                          </span>
                        )}
                        {p.powerKw && (
                          <span style={{ background: '#f0faf4', color: '#0a5c35', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                            {p.powerKw} kW
                          </span>
                        )}
                        {p.warrantyYears && (
                          <span style={{ background: '#f9fafb', color: '#6b7280', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                            {p.warrantyYears} jaar garantie
                          </span>
                        )}
                        {p.savingsKwhYear && p.savingsKwhYear > 0 && (
                          <span style={{ background: '#f0faf4', color: '#166534', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                            ↓ {(p.savingsKwhYear * line.quantity).toLocaleString('nl-NL')} kWh/jr
                          </span>
                        )}
                        {p.gasReductionM3Year && p.gasReductionM3Year > 0 && (
                          <span style={{ background: '#fff7ed', color: '#c2410c', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                            ↓ {(p.gasReductionM3Year * line.quantity).toLocaleString('nl-NL')} m³ gas/jr
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Included items */}
          {quote.includedItems && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 24px', marginTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
                Dit is inbegrepen
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quote.includedItems.split('\n').map((line, i) => {
                  const t = line.trim()
                  if (!t) return null
                  const bullet = t.startsWith('-')
                  if (bullet) {
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: '#0a5c35', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 14, color: '#374151' }}>{t.replace(/^-\s*/, '')}</span>
                      </div>
                    )
                  }
                  return <p key={i} style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{t}</p>
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sociale bewijskracht ────────────────────────────────────────── */}
      <div style={{ background: '#0a5c35', padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#f5c442', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Waarom Bespaarhulp Friesland?
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 32, letterSpacing: '-0.01em' }}>
            250+ tevreden huishoudens gingen u voor
          </h2>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              { icon: '⭐', title: '4,8 / 5', sub: 'gemiddelde klantbeoordeling' },
              { icon: '🏠', title: '250+', sub: 'succesvolle installaties' },
              { icon: '🏦', title: 'Warmtefonds', sub: 'lage rente, lange looptijd' },
              { icon: '📋', title: 'BTW-teruggave', sub: 'bij warmtepomp of zonnepanelen' },
            ].map((item) => (
              <div key={item.title} style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 14,
                padding: '20px 22px',
                textAlign: 'center',
                minWidth: 150,
              }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f5c442', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{item.sub}</div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 14,
            padding: '20px 24px',
            textAlign: 'left',
            maxWidth: 540,
            margin: '0 auto',
          }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[1,2,3,4,5].map((s) => <span key={s} style={{ color: '#f5c442', fontSize: 16 }}>★</span>)}
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontStyle: 'italic' }}>
              "Bespaarhulp Friesland heeft alles van A tot Z geregeld. De thuisbatterij werkt perfect en we merken
              het direct op onze energierekening. Aanrader!"
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>— Familie de Jong, Leeuwarden</p>
          </div>
        </div>
      </div>

      {/* ── Investeringsoverzicht ────────────────────────────────────────── */}
      <div style={{ background: '#fff', padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <SectionLabel text="Investeringsoverzicht" />
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', marginBottom: 24 }}>
            Transparante prijsopbouw
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            {/* Line items */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                <span>Product</span>
                <span style={{ textAlign: 'right' }}>Aantal</span>
                <span style={{ textAlign: 'right', width: 80 }}>Prijs</span>
                <span style={{ textAlign: 'right', width: 90 }}>Totaal</span>
              </div>
              {quote.lines.map((line) => (
                <div key={line.id} style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{line.name}</p>
                    {line.description && <p style={{ fontSize: 12, color: '#9ca3af' }}>{line.description}</p>}
                  </div>
                  <span style={{ fontSize: 13, color: '#6b7280', textAlign: 'right' }}>{line.quantity}×</span>
                  <span style={{ fontSize: 13, color: '#6b7280', textAlign: 'right', width: 80, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.unitPrice)}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right', width: 90, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.lineTotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals card */}
            <div style={{ background: '#0a5c35', borderRadius: 14, padding: '22px 22px', color: '#fff' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Totaaloverzicht
              </p>
              {[
                { label: 'Subtotaal', value: formatCurrency(quote.subtotal) },
                ...(quote.discountAmount > 0 ? [{ label: 'Korting', value: `- ${formatCurrency(quote.discountAmount)}` }] : []),
                { label: 'BTW', value: formatCurrency(quote.vatTotal) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13.5, borderBottom: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
                  <span>{label}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontSize: 20, fontWeight: 800 }}>
                <span>Totaal</span>
                <span style={{ color: '#f5c442', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(quote.total)}</span>
              </div>
              {quote.subsidyAmount > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
                  <p>Subsidie/teruggave: <strong style={{ color: '#fff' }}>€{quote.subsidyAmount.toLocaleString('nl-NL')}</strong></p>
                  <p style={{ marginTop: 4 }}>Netto investering: <strong style={{ color: '#f5c442' }}>{formatCurrency(Math.max(0, quote.total - quote.subsidyAmount))}</strong></p>
                </div>
              )}
              {isFinanced && savings && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
                  <p>Maandlasten: <strong style={{ color: '#fff' }}>€{savings.monthlyLoanPayment}/mnd</strong></p>
                  <p style={{ marginTop: 2 }}>{quote.loanTermYears} jaar · {(quote.loanInterestRate * 100).toFixed(1)}% rente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status banners ───────────────────────────────────────────────── */}
      {quote.status === 'ACCEPTED' && (
        <div style={{ background: '#dcfce7', borderTop: '3px solid #16a34a', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>
            ✓ Offerte geaccepteerd op {formatDate(quote.acceptedAt)}
          </p>
          {quote.acceptance && (
            <p style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
              Ondertekend door {quote.acceptance.firstName} {quote.acceptance.lastName}
            </p>
          )}
          {quote.acceptance?.signatureData && (
            <div style={{ marginTop: 16, display: 'inline-block', background: '#fff', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Handtekening</p>
              <img src={quote.acceptance.signatureData} alt="Handtekening" style={{ display: 'block', maxWidth: 300, height: 'auto' }} />
            </div>
          )}
        </div>
      )}
      {quote.status === 'REJECTED' && (
        <div style={{ background: '#fee2e2', borderTop: '3px solid #ef4444', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>✕ Deze offerte is afgewezen op {formatDate(quote.rejectedAt)}</p>
        </div>
      )}
      {quote.status === 'EXPIRED' && (
        <div style={{ background: '#fef3c7', borderTop: '3px solid #f59e0b', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>Deze offerte is verlopen.</p>
        </div>
      )}

      {/* ── Algemene voorwaarden ─────────────────────────────────────────── */}
      <div style={{ background: '#f9fafb', padding: '40px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <SectionLabel text="Algemene voorwaarden" />
          <TermsAndConditions text={quote.termsText} />
        </div>
      </div>

      {/* ── Acceptatieformulier ──────────────────────────────────────────── */}
      {canInteract && (
        <div style={{ background: '#fff', borderTop: '3px solid #0a5c35', padding: '48px 24px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#0a5c35', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, textAlign: 'center' }}>
              Klaar om te starten?
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 6, textAlign: 'center', letterSpacing: '-0.02em' }}>
              Offerte accepteren
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, textAlign: 'center' }}>
              Na acceptatie nemen wij binnen 24 uur contact met u op voor de planning.
            </p>
            <QuoteAcceptanceForm token={token} customerName={customerName} />
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#0a5c35', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <svg width="22" height="20" viewBox="0 0 36 34" fill="none">
            <path d="M0 15L18 2L36 15H0Z" fill="#f5c442"/>
            <rect x="2" y="15" width="32" height="19" rx="1.5" fill="rgba(255,255,255,0.2)"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Bespaarhulp Friesland</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          Sjouke van der Kooistrjitte 15 · 9088BB Wirdum · 06-24992098 · KVK 71128174
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          Offerte {quote.quoteNumber}
        </p>
      </div>
    </div>
  )
}
