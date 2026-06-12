import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const BUCKET = 'product-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars ontbreken')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Geen bestand' }, { status: 400 })

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Bestand is te groot (max 5 MB)' }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Alleen jpg/png/webp/avif toegestaan' }, { status: 400 })
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await file.arrayBuffer()

    const supabase = getAdminClient()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, bytes, { contentType: file.type, upsert: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return NextResponse.json({ url: data.publicUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload mislukt'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
