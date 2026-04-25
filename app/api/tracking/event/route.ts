import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await req.json()
    const { sessionId, eventType, productId, productName, productCategory, price, quantity, metadata } = body
    if (!sessionId || !eventType) return NextResponse.json({ ok: false }, { status: 400 })

    await supabase
      .from('tracking_sessions')
      .upsert(
        {
          session_id: sessionId,
          last_seen_at: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') ?? null,
          referrer: req.headers.get('referer') ?? null,
        },
        { onConflict: 'session_id', ignoreDuplicates: false }
      )

    await supabase.from('tracking_events').insert({
      session_id: sessionId,
      event_type: eventType,
      product_id: productId ?? null,
      product_name: productName ?? null,
      product_category: productCategory ?? null,
      price: price ?? null,
      quantity: quantity ?? 1,
      metadata: metadata ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('tracking event error', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
