import { unstable_noStore as noStore } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { InterestSignup } from '@/lib/interest'
import { attachOrdersToSignups } from '@/lib/interest-progress'
import { loadInterestPricingCatalog } from '@/lib/interest-pricing'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

function asSignups(rows: unknown): InterestSignup[] {
  return (Array.isArray(rows) ? rows : []) as InterestSignup[]
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  noStore()
  try {
    const { slug } = await params
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }
    const requestedId = req.nextUrl.searchParams.get('id')?.trim() || ''

    const supabase = getSupabase()
    let listQuery = supabase
      .from('interest_lists')
      .select('id, slug, name, questions')
      .eq('slug', slug)
      .order('created_at', { ascending: true })
    if (requestedId) listQuery = listQuery.eq('id', requestedId)

    const { data: lists, error: listError } = await listQuery

    if (listError) {
      console.error('Interest signups list lookup error:', listError)
      return NextResponse.json({ error: 'Failed to load list' }, { status: 500 })
    }

    const list = lists?.[0]
    if (!list) {
      return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })
    }
    const listIds = lists.map((row) => row.id)

    const progressFields =
      'id, list_id, email, name, answers, notes, source, marketing_consent, notified, notified_at, invite_token, invite_sent_at, invite_viewed_at, build_intent, build_intent_at, cart_at, order_id, order_placed_at, created_at'
    const inviteFields =
      'id, list_id, email, name, answers, notes, source, marketing_consent, notified, notified_at, invite_token, invite_sent_at, invite_viewed_at, build_intent, build_intent_at, created_at'
    const baseFields =
      'id, list_id, email, name, answers, notes, source, marketing_consent, notified, notified_at, created_at'

    let signups: InterestSignup[] = []
    let signupsError = null
    for (const fields of [progressFields, inviteFields, baseFields]) {
      const result = await supabase
        .from('interest_signups')
        .select(fields)
        .in('list_id', listIds)
        .order('created_at', { ascending: false })
      signups = asSignups(result.data)
      signupsError = result.error
      if (!signupsError) break
    }

    if (signupsError) {
      console.error('Interest signups fetch error:', signupsError)
      return NextResponse.json({ error: 'Failed to load signups' }, { status: 500 })
    }

    let catalog = null
    try {
      catalog = await loadInterestPricingCatalog(supabase, slug)
    } catch (err) {
      console.error('Interest signups catalog error:', err)
    }

    const withOrders = await attachOrdersToSignups(supabase, signups, slug)

    return NextResponse.json({
      list,
      signups: withOrders,
      catalog,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err) {
    console.error('Interest signups GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
