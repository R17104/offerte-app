'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createLeadWithQuote } from '@/lib/actions/lead.actions'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'

type Product = {
  id: string
  name: string
  description: string | null
  unitPrice: number
  vatRate: number
  category: string | null
  capacityKwh: number | null
  powerKw: number | null
  imageUrl: string | null
}

const HOUSE_DEFAULTS: Record<string, { kwh: number; gas: number }> = {
  APARTMENT: { kwh: 2000, gas: 700 },
  TERRACED:  { kwh: 3200, gas: 1400 },
  CORNER:    { kwh: 3600, gas: 1700 },
  DETACHED:  { kwh: 4500, gas: 2500 },
}

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: 9, border: '1.5px solid #d1d5db',
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
  fontFamily: 'inherit', color: '#111827',
}

const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }

function ToggleBtn({ value, label: lbl, active, onClick }: { value: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: '10px 8px', borderRadius: 8,
      border: `2px solid ${active ? '#0a5c35' : '#e5e7eb'}`,
      background: active ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 13.5,
      fontWeight: active ? 700 : 500, color: active ? '#0a5c35' : '#374151',
      fontFamily: 'inherit', transition: 'all 0.15s',
    }}>{lbl}</button>
  )
}

const STEPS = ['Uw gegevens', 'Energieprofiel', 'Bevestiging']

export default function OfferteAanvragen({ product }: { product: Product }) {
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Step 1 state
  const [firstName, setFirstName]   = useState('')
  const [lastName,  setLastName]    = useState('')
  const [email,     setEmail]       = useState('')
  const [phone,     setPhone]       = useState('')
  const [street,    setStreet]      = useState('')
  const [houseNr,   setHouseNr]     = useState('')
  const [postcode,  setPostcode]    = useState('')
  const [city,      setCity]        = useState('')

  // Step 2 state
  const [houseType,        setHouseType]        = useState('')
  const [numPersons,       setNumPersons]       = useState('')
  const [monthlyBill,      setMonthlyBill]      = useState('')
  const [kwhYear,          setKwhYear]          = useState('')
  const [hasSolar,         setHasSolar]         = useState(false)
  const [solarKwp,         setSolarKwp]         = useState('')
  const [feedbackKwh,      setFeedbackKwh]      = useState('')
  const [gasM3,            setGasM3]            = useState('')
  const [hasHeatPump,      setHasHeatPump]      = useState(false)
  const [elTariff,         setElTariff]         = useState('0.28')
  const [fbTariff,         setFbTariff]         = useState('0.07')
  const [includeInstallation, setIncludeInstallation] = useState(false)
  const [opmerkingen,      setOpmerkingen]      = useState('')

  function applyHouseDefaults(type: string) {
    const d = HOUSE_DEFAULTS[type]
    if (!d) return
    if (!kwhYear) setKwhYear(String(d.kwh))
    if (!gasM3)   setGasM3(String(d.gas))
  }

  function canGoNext() {
    if (step === 0) return firstName && lastName && email && phone && postcode
    if (step === 1) return monthlyBill && kwhYear
    return true
  }

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const result = await createLeadWithQuote({
        firstName, lastName, email, phone,
        street: street || undefined,
        houseNumber: houseNr || undefined,
        postalCode: postcode,
        city: city || undefined,
        currentMonthlyBill:    parseFloat(monthlyBill) || 0,
        electricityUsageKwh:   parseFloat(kwhYear)     || 0,
        hasSolarPanels: hasSolar,
        solarPanelKwp:         hasSolar && solarKwp    ? parseFloat(solarKwp)    : undefined,
        electricityFeedbackKwh: hasSolar && feedbackKwh ? parseFloat(feedbackKwh) : undefined,
        gasUsageM3:            gasM3     ? parseFloat(gasM3)     : undefined,
        hasHeatPump,
        houseType: (houseType as 'TERRACED' | 'CORNER' | 'DETACHED' | 'APARTMENT') || undefined,
        numPersons:  numPersons ? parseInt(numPersons) : undefined,
        electricityTariff: parseFloat(elTariff) || 0.28,
        feedbackTariff:    parseFloat(fbTariff)  || 0.07,
        productId: product.id,
        includeInstallation,
        opmerkingen: opmerkingen || undefined,
      })
      if (result.success) {
        setDone(result.quoteNumber ?? '')
      } else {
        setError(result.error ?? 'Er ging iets mis, probeer opnieuw.')
      }
    })
  }

  const inclBtw = product.unitPrice * (1 + product.vatRate / 100)

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo-bespaarhulp.jpg" alt="Bespaarhulp Friesland" width={216} height={54} priority style={{ display: 'block' }} />
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/producten" style={{ fontSize: 13.5, color: '#374151', textDecoration: 'none', padding: '7px 14px' }}>Producten</Link>
            <Link href="/gratis-advies" style={{ fontSize: 13, fontWeight: 600, color: '#0a5c35', textDecoration: 'none', padding: '7px 12px' }}>Bel mij terug</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #052e1a 0%, #0a5c35 100%)', padding: 'clamp(40px,7vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,196,66,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Vrijblijvende offerte</span>
              <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, color: '#fff', marginTop: 8, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Offerte aanvragen
              </h1>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.75)', marginTop: 10, lineHeight: 1.6 }}>
                Vul uw gegevens in. Wij maken direct een offerte op maat en nemen contact op om alles door te nemen.
              </p>
            </div>
            {/* Product card */}
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 18px', minWidth: 220, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,196,66,0.85)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Geselecteerd product</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{product.name}</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#f5c442' }}>{fmt(inclBtw)} <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>incl. BTW</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,32px)' }}>

        {done ? (
          /* ── Bevestiging ──────────────────────────────────────────────── */
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 38 }}>✓</div>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: '#111827', marginBottom: 12 }}>Aanvraag ontvangen!</h2>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 12px' }}>
              Uw offerte <strong style={{ color: '#111827' }}>{done}</strong> is aangemaakt. Een adviseur belt u zo spoedig mogelijk — uiterlijk de volgende werkdag.
            </p>
            <p style={{ fontSize: 13.5, color: '#9ca3af', marginBottom: 32 }}>Controleer ook uw e-mail voor een bevestiging.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/producten" style={{ padding: '11px 24px', borderRadius: 10, background: '#0a5c35', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Terug naar producten
              </Link>
              <Link href="/" style={{ padding: '11px 24px', borderRadius: 10, border: '1.5px solid #e5e7eb', color: '#374151', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Naar homepage
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stappen indicator */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {STEPS.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                        background: i < step ? '#0a5c35' : i === step ? '#0a5c35' : '#f3f4f6',
                        color: i <= step ? '#fff' : '#9ca3af',
                      }}>
                        {i < step ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: i === step ? 700 : 400, color: i === step ? '#0a5c35' : i < step ? '#374151' : '#9ca3af' }}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, margin: '0 12px', background: i < step ? '#0a5c35' : '#e5e7eb', borderRadius: 1 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(24px,4vw,40px)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

              {/* ── STEP 0: Uw gegevens ─────────────────────────────────── */}
              {step === 0 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Uw gegevens</h2>
                  <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 24 }}>Hoe kunnen wij u bereiken?</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={label}>Voornaam *</label>
                      <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jan" style={inp} />
                    </div>
                    <div>
                      <label style={label}>Achternaam *</label>
                      <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="de Vries" style={inp} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                    <div>
                      <label style={label}>E-mailadres *</label>
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" style={inp} />
                    </div>
                    <div>
                      <label style={label}>Telefoonnummer *</label>
                      <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06-12345678" style={inp} />
                    </div>
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Adres (optioneel)</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                      <div>
                        <label style={label}>Straat</label>
                        <input value={street} onChange={e => setStreet(e.target.value)} placeholder="Hoofdstraat" style={inp} />
                      </div>
                      <div style={{ width: 90 }}>
                        <label style={label}>Nr.</label>
                        <input value={houseNr} onChange={e => setHouseNr(e.target.value)} placeholder="12A" style={inp} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, marginTop: 12 }}>
                      <div style={{ width: 110 }}>
                        <label style={label}>Postcode *</label>
                        <input required value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="8888 AB" style={inp} />
                      </div>
                      <div>
                        <label style={label}>Woonplaats</label>
                        <input value={city} onChange={e => setCity(e.target.value)} placeholder="Leeuwarden" style={inp} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1: Energieprofiel ──────────────────────────────── */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Uw energieprofiel</h2>
                  <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 24 }}>Zo kunnen wij de besparing nauwkeurig berekenen.</p>

                  <div style={{ marginBottom: 20 }}>
                    <label style={label}>Type woning</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                      {[['APARTMENT','Appartement'],['TERRACED','Tussenwoning'],['CORNER','Hoekwoning'],['DETACHED','Vrijstaand']].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => { setHouseType(v); applyHouseDefaults(v) }} style={{
                          padding: '10px 6px', borderRadius: 8, border: `2px solid ${houseType === v ? '#0a5c35' : '#e5e7eb'}`,
                          background: houseType === v ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 12.5,
                          fontWeight: houseType === v ? 700 : 500, color: houseType === v ? '#0a5c35' : '#374151',
                          fontFamily: 'inherit', textAlign: 'center',
                        }}>{l}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={label}>Huidig maandtermijn *</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#6b7280' }}>€</span>
                        <input required type="number" min="0" value={monthlyBill} onChange={e => setMonthlyBill(e.target.value)} placeholder="180" style={{ ...inp, paddingLeft: 26 }} />
                      </div>
                    </div>
                    <div>
                      <label style={label}>Aantal personen</label>
                      <input type="number" min="1" max="10" value={numPersons} onChange={e => setNumPersons(e.target.value)} placeholder="2" style={inp} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={label}>Jaarlijks stroomverbruik * <span style={{ fontWeight: 400, color: '#9ca3af' }}>(kWh)</span></label>
                      <input required type="number" min="0" value={kwhYear} onChange={e => setKwhYear(e.target.value)} placeholder="3200" style={inp} />
                    </div>
                    <div>
                      <label style={label}>Jaarlijks gasverbruik <span style={{ fontWeight: 400, color: '#9ca3af' }}>(m³)</span></label>
                      <input type="number" min="0" value={gasM3} onChange={e => setGasM3(e.target.value)} placeholder="1400" style={inp} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={label}>Heeft u al zonnepanelen?</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ToggleBtn value="ja"  label="Ja"  active={hasSolar}  onClick={() => setHasSolar(true)}  />
                      <ToggleBtn value="nee" label="Nee" active={!hasSolar} onClick={() => setHasSolar(false)} />
                    </div>
                    {hasSolar && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, padding: '14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                        <div>
                          <label style={label}>Vermogen <span style={{ fontWeight: 400, color: '#9ca3af' }}>(kWp)</span></label>
                          <input type="number" min="0" step="0.1" value={solarKwp} onChange={e => setSolarKwp(e.target.value)} placeholder="6.0" style={inp} />
                        </div>
                        <div>
                          <label style={label}>Teruglevering <span style={{ fontWeight: 400, color: '#9ca3af' }}>(kWh/jaar)</span></label>
                          <input type="number" min="0" value={feedbackKwh} onChange={e => setFeedbackKwh(e.target.value)} placeholder="2500" style={inp} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={label}>Heeft u al een warmtepomp?</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ToggleBtn value="ja"  label="Ja"  active={hasHeatPump}  onClick={() => setHasHeatPump(true)}  />
                      <ToggleBtn value="nee" label="Nee" active={!hasHeatPump} onClick={() => setHasHeatPump(false)} />
                    </div>
                  </div>

                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer', userSelect: 'none' }}>Geavanceerde tariefinstellingen</summary>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={label}>Stroomtarief <span style={{ fontWeight: 400, color: '#9ca3af' }}>(€/kWh)</span></label>
                        <input type="number" min="0" step="0.01" value={elTariff} onChange={e => setElTariff(e.target.value)} style={inp} />
                      </div>
                      <div>
                        <label style={label}>Teruglevertarief <span style={{ fontWeight: 400, color: '#9ca3af' }}>(€/kWh)</span></label>
                        <input type="number" min="0" step="0.01" value={fbTariff} onChange={e => setFbTariff(e.target.value)} style={inp} />
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* ── STEP 2: Bevestiging ─────────────────────────────────── */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Bevestiging</h2>
                  <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 24 }}>Controleer uw gegevens en verstuur de aanvraag.</p>

                  {/* Samenvatting */}
                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: '18px 20px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
                    {[
                      ['Naam',             `${firstName} ${lastName}`],
                      ['E-mail',           email],
                      ['Telefoon',         phone],
                      ['Postcode',         postcode],
                      ['Maandtermijn',     `€${monthlyBill}/mnd`],
                      ['Stroomverbruik',   `${kwhYear} kWh/jaar`],
                      ['Zonnepanelen',     hasSolar ? `Ja (${solarKwp || '?'} kWp)` : 'Nee'],
                      ['Warmtepomp',       hasHeatPump ? 'Ja' : 'Nee'],
                      ...(gasM3 ? [['Gasverbruik', `${gasM3} m³/jaar`] as [string,string]] : []),
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                        <span style={{ color: '#9ca3af', minWidth: 110, flexShrink: 0 }}>{k}</span>
                        <span style={{ color: '#111827', fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Installatie optie */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Installatie</p>
                    <button
                      type="button"
                      onClick={() => setIncludeInstallation(v => !v)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                        borderRadius: 10, border: `2px solid ${includeInstallation ? '#0a5c35' : '#e5e7eb'}`,
                        background: includeInstallation ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 5, border: `2px solid ${includeInstallation ? '#0a5c35' : '#d1d5db'}`,
                        background: includeInstallation ? '#0a5c35' : '#fff', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {includeInstallation && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: includeInstallation ? '#0a5c35' : '#111827', marginBottom: 2 }}>
                          Vakkundige installatie meenemen
                        </p>
                        <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5 }}>
                          Professionele montage en inbedrijfstelling door gecertificeerd installateur
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 16, fontWeight: 900, color: includeInstallation ? '#0a5c35' : '#374151' }}>+ €1.250</p>
                        <p style={{ fontSize: 11, color: '#9ca3af' }}>excl. BTW</p>
                      </div>
                    </button>
                    {!includeInstallation && (
                      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, paddingLeft: 4 }}>
                        Prijzen zijn exclusief installatie. U kunt installatie later alsnog toevoegen.
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={label}>Opmerkingen of vragen <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optioneel)</span></label>
                    <textarea
                      value={opmerkingen}
                      onChange={e => setOpmerkingen(e.target.value)}
                      rows={3}
                      placeholder="Bijv. ik wil ook graag weten wat de terugverdientijd is…"
                      style={{ ...inp, resize: 'vertical' }}
                    />
                  </div>

                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13.5, color: '#dc2626' }}>
                      {error}
                    </div>
                  )}
                </div>
              )}

              {/* Navigatieknoppen */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                {step > 0 ? (
                  <button type="button" onClick={() => setStep(s => s - 1)} style={{
                    padding: '10px 20px', borderRadius: 9, border: '1.5px solid #e5e7eb',
                    background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>← Vorige</button>
                ) : <div />}

                {step < 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canGoNext()}
                    style={{
                      padding: '11px 28px', borderRadius: 9, border: 'none',
                      background: canGoNext() ? '#0a5c35' : '#d1d5db',
                      color: '#fff', fontSize: 14, fontWeight: 700, cursor: canGoNext() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                    }}>
                    Volgende →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending}
                    style={{
                      padding: '12px 32px', borderRadius: 9, border: 'none',
                      background: isPending ? '#6b9e7e' : '#0a5c35',
                      color: '#fff', fontSize: 15, fontWeight: 800, cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 14px rgba(10,92,53,0.3)',
                    }}>
                    {isPending ? 'Aanvraag versturen…' : 'Offerte aanvragen →'}
                  </button>
                )}
              </div>
            </div>

            {/* Vertrouwen */}
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              {['100% vrijblijvend', 'Geen verkoopdruk', 'Gecertificeerde installateurs'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
                  <span style={{ color: '#0a5c35', fontWeight: 700 }}>✓</span> {t}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: '#03180d', marginTop: 64, padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', marginLeft: 7, textTransform: 'uppercase' }}>Friesland</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland · Onafhankelijk energieadvies</p>
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Medewerker login</Link>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  )
}
