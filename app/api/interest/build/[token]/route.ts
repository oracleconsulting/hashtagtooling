import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { INTEREST_PUBLIC_FIELDS } from '@/lib/interest'
import { isInviteToken, parseBuildIntent } from '@/lib/interest-invite'
import { markInterestCart } from '@/lib/interest-progress'
import { signupBespokeQuote } from '@/lib/interest-quote'
import { loadInterestPricingCatalog } from '@/lib/interest-pricing'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isInviteToken(token)) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    const supabase = getSupabase()
    let signup: {
      id: string
      list_id: string
      name: string | null
      invite_viewed_at: string | null
      build_intent: unknown
      bespoke_quote?: unknown
    } | null = null
    let { data, error: signupError } = await supabase
      .from('interest_signups')
      .select('id, list_id, name, invite_viewed_at, build_intent, bespoke_quote')
      .eq('invite_token', token)
      .maybeSingle()
    signup = data
    if (signupError) {
      const fallback = await supabase
        .from('interest_signups')
        .select('id, list_id, name, invite_viewed_at, build_intent')
        .eq('invite_token', token)
        .maybeSingle()
      signup = fallback.data
      signupError = fallback.error
    }

    if (signupError) {
      console.error('Interest invite lookup error:', signupError)
      return NextResponse.json({ error: 'Failed to load invite. Run the build invite SQL first.' }, { status: 500 })
    }
    if (!signup) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    if (!signup.invite_viewed_at) {
      await supabase
        .from('interest_signups')
        .update({ invite_viewed_at: new Date().toISOString() })
        .eq('id', signup.id)
    }

    const { data: list, error: listError } = await supabase
      .from('interest_lists')
      .select(INTEREST_PUBLIC_FIELDS)
      .eq('id', signup.list_id)
      .maybeSingle()

    if (listError || !list) {
      return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })
    }

    const catalog = await loadInterestPricingCatalog(supabase, list.slug)
    if (!catalog) {
      return NextResponse.json({ error: 'This list has no build form' }, { status: 404 })
    }

    return NextResponse.json({
      list,
      catalog,
      name: signup.name,
      intent: parseBuildIntent(signup.build_intent),
      quote: signupBespokeQuote(signup),
    })
  } catch (err) {
    console.error('Interest invite GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isInviteToken(token)) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    const body = await req.json()
    const event = body.event === 'added_to_cart' || body.event === 'removed_from_cart'
      ? body.event
      : null
    const intent = parseBuildIntent(body.intent)
    if (!intent && !event) {
      return NextResponse.json({ error: 'A complete spec is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    if (event) {
      const cart = await markInterestCart(supabase, token, event === 'added_to_cart')
      if (cart.error === 'Invite not found') {
        return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
      }
      if (cart.error) {
        return NextResponse.json({ error: cart.error }, { status: 500 })
      }
      if (!intent) return NextResponse.json({ ok: true })
    }

    if (!intent) {
      return NextResponse.json({ error: 'A complete spec is required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('interest_signups')
      .select('id, build_intent')
      .eq('invite_token', token)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    const previous = existing.build_intent && typeof existing.build_intent === 'object' && !Array.isArray(existing.build_intent)
      ? existing.build_intent as Record<string, unknown>
      : {}
    const { data, error } = await supabase
      .from('interest_signups')
      .update({
        build_intent: {
          ...previous,
          ...intent,
          ...(previous.bespokeQuote !== undefined ? { bespokeQuote: previous.bespokeQuote } : {}),
        },
        build_intent_at: new Date().toISOString(),
      })
      .eq('invite_token', token)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Interest intent save error:', error)
      return NextResponse.json({ error: 'Failed to save spec' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    return NextResponse.json({ ok: true, intent })
  } catch (err) {
    console.error('Interest invite PATCH error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
