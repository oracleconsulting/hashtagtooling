import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
    const { data: list, error: listError } = await supabase
      .from('interest_lists')
      .select('id, slug, name, questions')
      .eq('slug', slug)
      .maybeSingle()

    if (listError) {
      console.error('Interest signups list lookup error:', listError)
      return NextResponse.json({ error: 'Failed to load list' }, { status: 500 })
    }

    if (!list) {
      return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })
    }

    const inviteFields =
      'id, list_id, email, name, answers, notes, source, marketing_consent, notified, notified_at, invite_token, invite_sent_at, invite_viewed_at, build_intent, build_intent_at, created_at'
    const baseFields =
      'id, list_id, email, name, answers, notes, source, marketing_consent, notified, notified_at, created_at'

    let { data: signups, error: signupsError } = await supabase
      .from('interest_signups')
      .select(inviteFields)
      .eq('list_id', list.id)
      .order('created_at', { ascending: false })

    if (signupsError && String(signupsError.message || '').includes('invite_')) {
      const fallback = await supabase
        .from('interest_signups')
        .select(baseFields)
        .eq('list_id', list.id)
        .order('created_at', { ascending: false })
      signups = fallback.data
      signupsError = fallback.error
    }

    if (signupsError) {
      console.error('Interest signups fetch error:', signupsError)
      return NextResponse.json({ error: 'Failed to load signups' }, { status: 500 })
    }

    const catalog = await loadInterestPricingCatalog(supabase, slug)

    return NextResponse.json({
      list,
      signups: signups || [],
      catalog,
    })
  } catch (err) {
    console.error('Interest signups GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
