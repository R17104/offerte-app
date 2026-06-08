import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'

export async function GET(req: NextRequest) {
  try {
    await verifySession()
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const postcode     = searchParams.get('postcode')?.replace(/\s/g, '').toUpperCase()
  const huisnummer   = searchParams.get('huisnummer')
  const toevoeging   = searchParams.get('toevoeging') ?? ''

  if (!postcode || !huisnummer) {
    return NextResponse.json({ error: 'Postcode en huisnummer zijn verplicht' }, { status: 400 })
  }

  const token = process.env.EP_ONLINE_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'EP_ONLINE_TOKEN niet ingesteld in omgevingsvariabelen' }, { status: 500 })
  }

  const url = new URL('https://public.ep-online.nl/api/v4/PandEnergielabel/Adres')
  url.searchParams.set('postcode', postcode)
  url.searchParams.set('huisnummer', huisnummer)
  if (toevoeging) url.searchParams.set('huisnummertoevoeging', toevoeging)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  })

  if (res.status === 404) {
    return NextResponse.json({ error: 'Geen energielabel gevonden voor dit adres' }, { status: 404 })
  }
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `EP-Online fout: ${res.status}` }, { status: 502 })
  }

  const data = await res.json()
  // EP-Online returns an array; take the most recent
  const labels = Array.isArray(data) ? data : [data]
  const label = labels.sort((a: any, b: any) =>
    new Date(b.registratiedatum ?? 0).getTime() - new Date(a.registratiedatum ?? 0).getTime()
  )[0]

  return NextResponse.json({
    label:            label.energieklasse ?? label.energielabelklasse ?? '?',
    gebouwtype:       label.gebouwtype ?? null,
    registratiedatum: label.registratiedatum ?? null,
    geldigTot:        label.geldigTot ?? null,
    opnametype:       label.opnametype ?? null,
    berekeningstype:  label.berekeningstype ?? null,
  })
}
