import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { INTEREST_PUBLIC_FIELDS, ensureDefaultInterestLists } from '@/lib/interest'
import { loadInterestPricingCatalog } from '@/lib/interest-pricing'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    const supabase = getSupabase()
    await ensureDefaultInterestLists(supabase)
    let { data: list, error: listError } = await supabase
      .from('interest_lists')
      .select(INTEREST_PUBLIC_FIELDS)
      .eq('slug', slug)
      .maybeSingle()

    if (listError && String(listError.message || '').includes('pricing')) {
      const fallback = await supabase
        .from('interest_lists')
        .select('id, slug, name, tagline, description, hero_image_url, gallery_images, price_from, price_to, expected_launch, status, show_count, questions, launched_product_id, created_at, updated_at')
        .eq('slug', slug)
        .maybeSingle()
      list = fallback.data ? { ...fallback.data, pricing: {} } : fallback.data
      listError = fallback.error
    }

    if (listError) {
      console.error('Interest list fetch error:', listError)
      return NextResponse.json({ error: 'Failed to load list' }, { status: 500 })
    }

    if (!list || list.status === 'draft') {
      return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })
    }

    const { data: count, error: countError } = await supabase.rpc('interest_list_count', {
      list_slug: slug,
    })

    if (countError) {
      console.error('Interest list count error:', countError)
    }

    const catalog = await loadInterestPricingCatalog(supabase, slug)

    return NextResponse.json({
      ...list,
      count: typeof count === 'number' ? count : Number(count) || 0,
      catalog,
    })
  } catch (err) {
    console.error('Interest list GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
