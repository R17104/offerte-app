'use client'

import { useEffect, useState } from 'react'

// ── AVG cookie-consent + TikTok Pixel-loader ──────────────────────────────────
// Tracking mag in Nederland pas ná toestemming. Deze banner laadt de TikTok
// Pixel alleen als de bezoeker accepteert, en zet een cookie 'marketing_consent'
// zodat de server (Events API) weet of het event verstuurd mag worden.

const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'D8P6D83C77U3H44JLPQ0'
const STORAGE_KEY = 'cookie_consent_v1'

declare global {
  interface Window { ttq?: { page: () => void; track: (e: string, p?: object, o?: object) => void; load: (id: string) => void } }
}

function loadTikTokPixel() {
  if (typeof window === 'undefined' || window.ttq) return
  /* eslint-disable */
  ;(function (w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t
    const ttq = (w[t] = w[t] || [])
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent']
    ttq.setAndDefer = function (a: any, b: any) { a[b] = function () { a.push([b].concat(Array.prototype.slice.call(arguments, 0))) } }
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i])
    ttq.instance = function (a: any) { const e = ttq._i[a] || []; for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e }
    ttq.load = function (e: any, n: any) {
      const r = 'https://analytics.tiktok.com/i18n/pixel/events.js'
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {}
      const o = d.createElement('script'); o.type = 'text/javascript'; o.async = true; o.src = r + '?sdkid=' + e + '&lib=' + t
      const a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a)
    }
    ttq.load(PIXEL_ID)
    ttq.page()
  })(window, document, 'ttq')
  /* eslint-enable */
}

export default function ConsentBanner() {
  const [decided, setDecided] = useState(true) // verberg tot we localStorage hebben gelezen

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'accepted') loadTikTokPixel()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDecided(saved === 'accepted' || saved === 'declined')
  }, [])

  function choose(accepted: boolean) {
    localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'declined')
    // cookie zodat de server (Events API) de keuze kent — 6 maanden
    document.cookie = `marketing_consent=${accepted ? '1' : '0'}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`
    if (accepted) loadTikTokPixel()
    setDecided(true)
  }

  if (decided) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#0a1410', borderTop: '1px solid rgba(255,255,255,0.12)',
      padding: 'clamp(16px,3vw,22px) clamp(16px,4vw,40px)',
      boxShadow: '0 -6px 30px rgba(0,0,0,0.4)',
    }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, flex: '1 1 320px', margin: 0 }}>
          Wij gebruiken cookies om onze advertenties te meten en te verbeteren. Functionele cookies zijn altijd actief; marketingcookies alleen met uw toestemming.{' '}
          <a href="/privacy" style={{ color: '#f5c442', textDecoration: 'underline' }}>Privacyverklaring</a>
        </p>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={() => choose(false)} style={{
            padding: '10px 18px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
            background: 'transparent', border: '1.5px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)',
          }}>
            Alleen noodzakelijk
          </button>
          <button onClick={() => choose(true)} style={{
            padding: '10px 18px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800,
            background: '#f5c442', border: 'none', color: '#052e1a',
          }}>
            Accepteren
          </button>
        </div>
      </div>
    </div>
  )
}
