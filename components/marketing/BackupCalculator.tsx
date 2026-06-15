'use client'

import { useState } from 'react'
import Link from 'next/link'
import { APPLIANCES, calcBackup, SINGLE_PHASE_MAX_W } from '@/lib/backup-calc'

const BATTERY_SIZES = [9.3, 18.6, 27.9, 37.2]

const gold = '#f5c442'
const green = '#0a5c35'

export default function BackupCalculator() {
  const [capacity, setCapacity] = useState(18.6)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(APPLIANCES.filter(a => a.essential).map(a => a.id)),
  )

  const totalWatts = APPLIANCES.filter(a => selected.has(a.id)).reduce((s, a) => s + a.watts, 0)
  const result = calcBackup(capacity, totalWatts)

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
      return n
    })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>

      {/* Inputs */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          1 · Kies uw batterij
        </p>

        {/* Eigen capaciteit: groot getal + invulveld */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <input
            type="number" min={1} max={65} step={0.1} value={capacity}
            onChange={e => {
              const v = parseFloat(e.target.value)
              setCapacity(isNaN(v) ? 0 : Math.min(65, Math.max(0, v)))
            }}
            style={{
              width: 96, padding: '6px 10px', borderRadius: 8, fontFamily: 'inherit',
              fontSize: 24, fontWeight: 900, color: gold, textAlign: 'right',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)', outline: 'none',
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>kWh</span>
        </div>
        <input
          type="range" min={3} max={65} step={0.1} value={capacity}
          onChange={e => setCapacity(+e.target.value)}
          style={{ width: '100%', accentColor: gold, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: 14 }}>
          <span>3 kWh</span><span>65 kWh</span>
        </div>

        {/* Snelkeuze veelgekozen maten */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {BATTERY_SIZES.map(s => (
            <button
              key={s}
              onClick={() => setCapacity(s)}
              style={{
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 700,
                border: `1.5px solid ${capacity === s ? gold : 'rgba(255,255,255,0.18)'}`,
                background: capacity === s ? 'rgba(245,196,66,0.14)' : 'rgba(255,255,255,0.04)',
                color: capacity === s ? gold : 'rgba(255,255,255,0.8)',
              }}
            >
              {s.toString().replace('.', ',')} kWh
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          2 · Wat wilt u blijven gebruiken?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {APPLIANCES.map(a => {
            const on = selected.has(a.id)
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  border: `1px solid ${on ? 'rgba(245,196,66,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  background: on ? 'rgba(245,196,66,0.10)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `1.5px solid ${on ? gold : 'rgba(255,255,255,0.3)'}`,
                    background: on ? gold : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 5-5" stroke="#052e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  <span style={{ fontSize: 13.5, color: on ? '#fff' : 'rgba(255,255,255,0.78)', fontWeight: on ? 600 : 400 }}>{a.label}</span>
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{a.watts} W</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Result */}
      <div>
        <div style={{
          background: 'linear-gradient(160deg, rgba(245,196,66,0.12), rgba(245,196,66,0.04))',
          border: '1px solid rgba(245,196,66,0.3)', borderRadius: 16, padding: '28px 26px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Uw woning blijft draaien
          </p>
          <div style={{ fontSize: 'clamp(34px, 6vw, 52px)', fontWeight: 900, color: gold, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {result.runtimeLabel}
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginTop: 10, lineHeight: 1.6 }}>
            bij stroomuitval, met een {capacity.toString().replace('.', ',')} kWh batterij en {selected.size} geselecteerde apparaten ({(result.totalWatts / 1000).toFixed(1).replace('.', ',')} kW).
          </p>

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row label="Bruikbare capaciteit" value={`${result.usableKwh.toString().replace('.', ',')} kWh`} />
            <Row label="Totaal vermogen" value={`${result.totalWatts} W`} />
          </div>

          {result.exceedsSinglePhase && (
            <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 12.5, color: '#fca5a5', lineHeight: 1.55 }}>
                ⚠ Boven {(SINGLE_PHASE_MAX_W / 1000)} kW is doorgaans een <strong>3-fase backup-set</strong> nodig. Niet alle zware apparaten draaien meestal tegelijk — wij kijken in het advies wat bij u past.
              </p>
            </div>
          )}

          <Link href="/gratis-advies?product=Backup-stroom" style={{
            display: 'block', textAlign: 'center', marginTop: 18, padding: '13px', borderRadius: 10,
            background: gold, color: '#052e1a', fontSize: 14.5, fontWeight: 800, textDecoration: 'none',
          }}>
            Vraag backup-advies aan →
          </Link>
        </div>

        {/* NL-regel uitleg */}
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>Let op — zo werkt backup in Nederland</p>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Een gewone thuisbatterij schakelt bij netuitval uit (veiligheidseis). Backup-stroom werkt alleen met een <strong style={{ color: 'rgba(255,255,255,0.8)' }}>backup-box met automatische omschakeling</strong>. Die leveren én installeren wij — vraag ernaar in het advies.
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}
