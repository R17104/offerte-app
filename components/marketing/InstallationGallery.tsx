'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const SLIDES = [
  {
    image: 'https://zinvolt.com/cdn/shop/files/ZinVolt_Base.jpg?v=1769761959&width=1200',
    name: 'Familie Hoekstra',
    city: 'Leeuwarden',
    stars: 5,
    quote: 'Al na 4 maanden merk ik het enorm in mijn stroomrekening. De installatie was binnen een dag klaar, super netjes gedaan!',
    product: 'ZinVolt 6 kWh thuisbatterij',
  },
  {
    image: 'https://zinvolt.com/cdn/shop/files/ZinVolt_Stack.jpg?v=1766484402&width=1920',
    name: 'Dhr. de Vries',
    city: 'Drachten',
    stars: 5,
    quote: 'Eindelijk onafhankelijk van de energiemaatschappij. Zelfs bij stroomuitval draait alles gewoon door. Zou het iedereen aanraden.',
    product: 'AlphaESS 9,3 kWh + noodstroom',
  },
  {
    image: 'https://images.unsplash.com/photo-1619641805634-b867f535071c?fm=jpg&q=70&w=1200&auto=format&fit=crop',
    name: 'Mevr. Bakker',
    city: 'Sneek',
    stars: 5,
    quote: 'Bespaarhulp Friesland dacht goed mee, geen opdringerige verkoop. Ze rekenden eerlijk uit wat het zou opleveren en dat klopte ook.',
    product: 'AlphaESS 3,8 kWh thuisbatterij',
  },
  {
    image: 'https://images.unsplash.com/photo-1676337167616-78853693ba3a?fm=jpg&q=70&w=1200&auto=format&fit=crop',
    name: 'Familie Visser',
    city: 'Heerenveen',
    stars: 5,
    quote: 'We combineerden de batterij met onze bestaande zonnepanelen. Nu gebruiken we overdag én \'s avonds onze eigen stroom. Geweldig!',
    product: 'ZinVolt Power + zonnepanelen combo',
  },
  {
    image: 'https://zinvolt.com/cdn/shop/files/ZinVolt_Base-01.jpg?v=1766482027&width=1200',
    name: 'Dhr. Dijkstra',
    city: 'Franeker',
    stars: 5,
    quote: 'Binnen één dag geïnstalleerd en alles uitgelegd. Nu bespaar ik zo\'n €80 per maand. De terugverdientijd is slechts 6 jaar.',
    product: 'AlphaESS SMILE-G3 systeem',
  },
  {
    image: 'https://images.unsplash.com/photo-1605191737662-98ba90cb953e?fm=jpg&q=70&w=1200&auto=format&fit=crop',
    name: 'Familie Meijer',
    city: 'Bolsward',
    stars: 5,
    quote: 'Gewoon top advies gekregen. Ze zijn eerlijk over wat het kost én wat het oplevert. Geen verrassingen achteraf.',
    product: 'ZinVolt Mate starter pakket',
  },
  {
    image: 'https://images.unsplash.com/photo-1742899273038-67ff67477663?fm=jpg&q=70&w=1200&auto=format&fit=crop',
    name: 'Mevr. Smit',
    city: 'Dokkum',
    stars: 5,
    quote: 'Na de stroomstoring vorig jaar wilde ik een noodstroomoplossing. Nu staat er een complete AlphaESS backup in de garage. Nooit meer zorgen.',
    product: 'AlphaESS BackupBox noodstroom',
  },
  {
    image: 'https://zinvolt.com/cdn/shop/files/Productfoto_s-1.jpg?v=1770039870&width=1200',
    name: 'Dhr. van der Berg',
    city: 'Harlingen',
    stars: 5,
    quote: 'Professioneel bedrijf, snelle installatie en goede nazorg. Mijn energierekening is met 60% gedaald vergeleken met vorig jaar.',
    product: 'ZinVolt Power 6 kWh compleet pakket',
  },
]

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{ color: '#f5c442', fontSize: 16 }}>★</span>
      ))}
    </div>
  )
}

export default function InstallationGallery() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setIdx(i => (i + 1) % SLIDES.length), [])
  const prev = useCallback(() => setIdx(i => (i - 1 + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [paused, next])

  const slide = SLIDES[idx]

  return (
    <section style={{ padding: 'clamp(56px,7vw,88px) clamp(16px,4vw,48px)', background: '#f9fafb' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0a5c35', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Klantenervaringen</span>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, color: '#111827', marginTop: 8, letterSpacing: '-0.02em' }}>
            Wat onze klanten zeggen
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', marginTop: 8 }}>Echte installaties bij mensen thuis in Friesland</p>
        </div>

        {/* Slider */}
        <div
          style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/7', background: '#1f2937', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Image */}
          <img
            key={idx}
            src={slide.image}
            alt={slide.product}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />

          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />

          {/* Quote card */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(20px,3vw,40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ maxWidth: 600 }}>
              <Stars n={slide.stars} />
              <p style={{ fontSize: 'clamp(13px,1.5vw,16px)', color: 'rgba(255,255,255,0.92)', lineHeight: 1.6, marginTop: 8, fontStyle: 'italic' }}>
                "{slide.quote}"
              </p>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0a5c35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {slide.name[0]}
                </div>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{slide.name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{slide.city} · {slide.product}</p>
                </div>
              </div>
            </div>

            {/* Arrows */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={prev} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>‹</button>
              <button onClick={next} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>›</button>
            </div>
          </div>

          {/* Dot indicators */}
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? '#f5c442' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link href="/gratis-advies" style={{ fontSize: 14, fontWeight: 700, color: '#0a5c35', textDecoration: 'none' }}>
            Word ook een tevreden klant → Vraag gratis advies aan
          </Link>
        </div>
      </div>
    </section>
  )
}
