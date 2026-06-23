import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const BUCKET = 'product-images'
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8 MB (telefoonfoto's)
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
}
const FIELD: Record<string, 'meterkastPhotoUrl' | 'batterijLocatiePhotoUrl'> = {
  meterkast: 'meterkastPhotoUrl',
  batterij: 'batterijLocatiePhotoUrl',
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars ontbreken')
  return createClient(url, key, { auth: { persistSession: false } })
}

// Publieke upload, beveiligd via het offerte-token (de klant is niet ingelogd).
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const quote = await prisma.quote.findUnique({ where: { publicToken: token }, select: { id: true, status: true } })
    if (!quote) return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })
    if (quote.status === 'REJECTED' || quote.status === 'EXPIRED') {
      return NextResponse.json({ error: 'Deze offerte is niet meer actief' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const kind = String(form.get('kind') ?? '')
    const field = FIELD[kind]
    if (!field) return NextResponse.json({ error: 'Ongeldig fototype' }, { status: 400 })
    if (!file) return NextResponse.json({ error: 'Geen bestand' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Bestand is te groot (max 8 MB)' }, { status: 400 })

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) return NextResponse.json({ error: 'Alleen foto-bestanden toegestaan (jpg/png/webp/heic)' }, { status: 400 })

    const fileName = `schouw/${quote.id}/${kind}-${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const supabase = getAdminClient()
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, bytes, { contentType: file.type, upsert: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    await prisma.quote.update({ where: { id: quote.id }, data: { [field]: data.publicUrl } })

    return NextResponse.json({ url: data.publicUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload mislukt'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
