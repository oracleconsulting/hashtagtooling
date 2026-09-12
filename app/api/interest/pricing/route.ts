import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { INTEREST_PUBLIC_FIELDS } from '@/lib/interest'
import { parseInterestPricing } from '@/lib/interest-pricing'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    if (!id && !slug) {
      return NextResponse.json({ error: 'id or slug is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const pricing = parseInterestPricing(body.pricing, slug || undefined)

    let query = supabase
      .from('interest_lists')
      .update({
        pricing,
        updated_at: new Date().toISOString(),
      })
    query = id ? query.eq('id', id) : query.eq('slug', slug)

    const { data, error } = await query.select(INTEREST_PUBLIC_FIELDS).maybeSingle()

    if (error) {
      console.error('Interest pricing save error:', error)
      return NextResponse.json({
        error: String(error.message || '').includes('pricing')
          ? 'Failed to save pricing. Run the interest pricing SQL first.'
          : error.message || 'Failed to save pricing',
      }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })

    return NextResponse.json({ list: data })
  } catch (err) {
    console.error('Interest pricing POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
