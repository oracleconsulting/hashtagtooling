import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { convertInterestListToProduct } from '@/lib/interest-convert'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })

    const result = await convertInterestListToProduct(getSupabase(), slug)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ ok: true, basePriceId: result.basePriceId })
  } catch (err) {
    console.error('Interest convert error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
