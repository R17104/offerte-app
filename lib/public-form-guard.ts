import { headers } from 'next/headers'

// Eenvoudige in-memory rate limiter per IP. Op Vercel leeft dit per serverless
// instance — geen waterdichte garantie, maar het stopt simpele spam-bots.
const WINDOW_MS = 60 * 60 * 1000 // 1 uur
const MAX_PER_WINDOW = 5

const hits = new Map<string, number[]>()

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export type PublicFormCheck =
  | { allowed: true }
  // silent: honeypot-hit — doe alsof het gelukt is zodat bots niets leren
  | { allowed: false; silent: true }
  | { allowed: false; silent: false; error: string }

export async function checkPublicForm(honeypot: string | undefined): Promise<PublicFormCheck> {
  if (honeypot?.trim()) return { allowed: false, silent: true }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'

  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)

  if (recent.length >= MAX_PER_WINDOW) {
    return { allowed: false, silent: false, error: 'Te veel aanvragen vanaf dit adres. Probeer het over een uur opnieuw, of bel ons direct.' }
  }

  recent.push(now)
  hits.set(ip, recent)

  // Voorkom dat de map onbeperkt groeit.
  if (hits.size > 10_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
    }
  }

  return { allowed: true }
}
