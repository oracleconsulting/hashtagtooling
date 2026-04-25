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
    const { sessionId, type, items } = body
    if (!sessionId || !type || !Array.isArray(items)) return NextResponse.json({ ok: false }, { status: 400 })

    const table = type === 'cart' ? 'cart_snapshots' : 'wishlist_snapshots'
    const totalValue = items.reduce((s: number, i: { price?: number; quantity?: number }) =>
      s + (i.price ?? 0) * (i.quantity ?? 1), 0)
    const itemCount = items.reduce((s: number, i: { quantity?: number }) => s + (i.quantity ?? 1), 0)

    if (items.length === 0) {
      await supabase.from(table).delete().eq('session_id', sessionId)
    } else {
      const payload: Record<string, unknown> = {
        session_id: sessionId,
        items,
        item_count: itemCount,
        last_updated_at: new Date().toISOString(),
      }
      if (type === 'cart') payload.total_value = totalValue

      await supabase.from(table).upsert(payload, { onConflict: 'session_id', ignoreDuplicates: false })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('snapshot error', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
