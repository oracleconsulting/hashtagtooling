import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { linkInterestSignupsToOrder } from '@/lib/interest-progress'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
    if (!orderId) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
    }

    await linkInterestSignupsToOrder(getSupabase(), {
      orderId,
      email: typeof body.email === 'string' ? body.email : '',
      items: Array.isArray(body.items) ? body.items : [],
      tokens: Array.isArray(body.tokens) ? body.tokens.map(String) : [],
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Interest link-order error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
