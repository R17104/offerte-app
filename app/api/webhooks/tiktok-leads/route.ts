import { NextRequest, NextResponse } from 'next/server'
import { createLeadFromWebhook } from '@/lib/actions/lead.actions'

export const dynamic = 'force-dynamic'

// Webhook voor TikTok Lead Ads. Koppel via een connector (Zapier/Make/Pabbly)
// die 'TikTok Lead Ads' verbindt met 'Webhook → POST' naar deze URL.
//
// Beveiliging: stel TIKTOK_WEBHOOK_SECRET in als omgevingsvariabele en geef
// dezelfde waarde mee als ?token=... in de URL of als header x-webhook-token.

function tokenValid(req: NextRequest): boolean {
  const secret = process.env.TIKTOK_WEBHOOK_SECRET
  if (!secret) return false // zonder ingesteld secret weigeren we alles
  const provided =
    req.nextUrl.searchParams.get('token') ||
    req.headers.get('x-webhook-token') ||
    ''
  return provided === secret
}

// Haalt een waarde op uit het binnenkomende object, ongeacht hoofdletters of
// alternatieve veldnamen (TikTok/Zapier mappen velden verschillend).
function pick(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    for (const k of Object.keys(obj)) {
      if (k.toLowerCase().replace(/[\s_-]/g, '') === key.toLowerCase().replace(/[\s_-]/g, '')) {
        const v = obj[k]
        if (v != null && String(v).trim()) return String(v).trim()
      }
    }
  }
  return ''
}

// Browsercheck / verbindingstest
export async function GET() {
  return NextResponse.json({ ok: true, message: 'TikTok-leads webhook actief. Stuur leads via POST.' })
}

export async function POST(req: NextRequest) {
  if (!tokenValid(req)) {
    return NextResponse.json({ error: 'Ongeldige of ontbrekende token' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  // Sommige connectors nesten de leadvelden onder 'data' of 'fields'.
  const data = (typeof body.data === 'object' && body.data ? body.data : body) as Record<string, unknown>
  const fields = (typeof data.fields === 'object' && data.fields ? data.fields : data) as Record<string, unknown>

  const fullName = pick(fields, ['name', 'full_name', 'naam'])
  let firstName = pick(fields, ['first_name', 'firstname', 'voornaam'])
  let lastName = pick(fields, ['last_name', 'lastname', 'achternaam'])
  if (!firstName && fullName) {
    const parts = fullName.split(' ')
    firstName = parts[0]
    lastName = lastName || parts.slice(1).join(' ')
  }

  const result = await createLeadFromWebhook({
    firstName: firstName || fullName,
    lastName,
    email:       pick(fields, ['email', 'e-mail', 'emailadres']),
    phone:       pick(fields, ['phone', 'phone_number', 'telefoon', 'telefoonnummer', 'tel', 'mobile']),
    postalCode:  pick(fields, ['postcode', 'postal_code', 'zip', 'zipcode']),
    street:      pick(fields, ['street', 'straat', 'address', 'adres']),
    houseNumber: pick(fields, ['house_number', 'huisnummer']),
    city:        pick(fields, ['city', 'plaats', 'woonplaats']),
    message:     pick(fields, ['message', 'bericht', 'note', 'opmerking']),
    source:      'TikTok',
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ ok: true, leadId: result.leadId })
}
