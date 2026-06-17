import 'server-only'
import crypto from 'crypto'

// ── TikTok Events API (server-side / CAPI) ────────────────────────────────────
// Stuurt conversie-events rechtstreeks vanaf de server naar TikTok. iOS-proof
// (niet afhankelijk van browser/cookies). Vereist TIKTOK_ACCESS_TOKEN in de
// omgevingsvariabelen; zonder token doet deze functie niets.

export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'D8P6D83C77U3H44JLPQ0'
const API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

// Telefoon naar E.164 (NL): 0612345678 -> +31612345678
function normalizePhone(phone: string): string | null {
  const p = phone.replace(/[^\d+]/g, '')
  if (!p) return null
  if (p.startsWith('+')) return p
  if (p.startsWith('00')) return '+' + p.slice(2)
  if (p.startsWith('0')) return '+31' + p.slice(1)
  return '+31' + p
}

export type TikTokLeadEvent = {
  event?: string          // standaard 'SubmitForm'
  eventId: string         // uniek, voor deduplicatie
  email?: string | null
  phone?: string | null
  ip?: string | null
  userAgent?: string | null
  url?: string | null
}

export async function sendTikTokEvent(e: TikTokLeadEvent): Promise<void> {
  const token = process.env.TIKTOK_ACCESS_TOKEN
  if (!token) return // geen token ingesteld → stil overslaan

  const user: Record<string, string> = {}
  if (e.email) user.email = sha256(e.email.trim().toLowerCase())
  const phone = e.phone ? normalizePhone(e.phone) : null
  if (phone) user.phone = sha256(phone)
  if (e.ip) user.ip = e.ip
  if (e.userAgent) user.user_agent = e.userAgent

  const body = {
    event_source: 'web',
    event_source_id: TIKTOK_PIXEL_ID,
    data: [
      {
        event: e.event ?? 'SubmitForm',
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        user,
        ...(e.url ? { page: { url: e.url } } : {}),
      },
    ],
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Access-Token': token },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    console.error('TikTok CAPI fout:', res.status, await res.text().catch(() => ''))
  }
}
