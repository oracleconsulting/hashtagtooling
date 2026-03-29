import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const { code, order_id, discount_amount } = await req.json()

    if (!code || !order_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from('launch_vouchers')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_on_order_id: order_id,
        discount_amount_applied: discount_amount || null,
      })
      .eq('code', code.toUpperCase())
      .eq('used', false)

    if (error) {
      console.error('Launch voucher redeem error:', error)
      return NextResponse.json({ error: 'Failed to redeem' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Launch voucher redeem error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
