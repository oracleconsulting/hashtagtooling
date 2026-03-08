import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const { code, amount_to_redeem, order_id } = await req.json()

    if (!code || !amount_to_redeem || !order_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const redeemAmount = Number(amount_to_redeem)
    if (isNaN(redeemAmount) || redeemAmount <= 0) {
      return NextResponse.json({ error: 'Invalid redemption amount' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    const { data: voucher, error: fetchError } = await supabase
      .from('gift_vouchers')
      .select('id, remaining_balance, expires_at, redemptions')
      .eq('code', code.toUpperCase())
      .single()

    if (fetchError || !voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    }

    if (new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Voucher expired' }, { status: 400 })
    }

    const currentBalance = Number(voucher.remaining_balance)
    if (currentBalance <= 0) {
      return NextResponse.json({ error: 'No remaining balance' }, { status: 400 })
    }

    const actualRedeem = Math.min(redeemAmount, currentBalance)
    const newBalance = Math.max(0, currentBalance - actualRedeem)

    const updatedRedemptions = [
      ...(voucher.redemptions || []),
      { order_id, amount: actualRedeem, redeemed_at: new Date().toISOString() },
    ]

    const { error: updateError } = await supabase
      .from('gift_vouchers')
      .update({
        remaining_balance: newBalance,
        redemptions: updatedRedemptions,
      })
      .eq('id', voucher.id)

    if (updateError) {
      console.error('Voucher redeem update error:', updateError)
      return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      redeemed: actualRedeem,
      new_balance: newBalance,
    })
  } catch (err) {
    console.error('Voucher redeem error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
