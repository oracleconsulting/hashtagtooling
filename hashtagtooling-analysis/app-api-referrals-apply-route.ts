import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import { Resend } from 'resend'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = (len: number) =>
    Array.from(crypto.randomBytes(len))
      .map((b) => chars[b % chars.length])
      .join('')
  return `TOOL-${segment(4)}-${segment(4)}`
}

export async function POST(req: NextRequest) {
  try {
    const { code, usedByEmail, orderId } = await req.json()
    if (!code?.trim() || !usedByEmail?.trim() || !orderId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = getSupabase()
    const normalizedCode = code.trim().toUpperCase()

    const { data: ref, error: refError } = await supabase
      .from('referral_codes')
      .select('id, owner_email, owner_name, reward_amount, times_used')
      .eq('code', normalizedCode)
      .eq('active', true)
      .single()

    if (refError || !ref) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    const rewardAmount = Number(ref.reward_amount ?? 10)
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    let voucherCode = generateVoucherCode()
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: clash } = await supabase.from('gift_vouchers').select('id').eq('code', voucherCode).single()
      if (!clash) break
      voucherCode = generateVoucherCode()
    }

    const { error: voucherError } = await supabase.from('gift_vouchers').insert({
      code: voucherCode,
      amount_gbp: rewardAmount,
      remaining_balance: rewardAmount,
      purchased_by_email: 'referral@hashtag.guru',
      purchased_by_name: 'Referral Programme',
      recipient_email: ref.owner_email,
      recipient_name: ref.owner_name,
      message: `Referral reward from ${usedByEmail}`,
      payment_reference: `referral-${orderId}`,
      payment_method: 'referral',
      expires_at: expiresAt.toISOString(),
    })

    if (voucherError) {
      console.error('Referral voucher insert error:', voucherError)
      return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 })
    }

    await supabase.from('referral_uses').insert({
      referral_code_id: ref.id,
      used_by_email: usedByEmail.trim().toLowerCase(),
      order_id: orderId,
      discount_applied: 10,
      reward_generated: true,
    })

    await supabase
      .from('referral_codes')
      .update({ times_used: (ref.times_used ?? 0) + 1 })
      .eq('id', ref.id)

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
        to: [ref.owner_email],
        subject: "Someone used your referral code! You've earned £10 credit.",
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
              <p style="color: #999; margin-top: 8px;">Referral Reward</p>
            </div>
            <p style="color: #ccc;">Hi ${ref.owner_name},</p>
            <p style="color: #ccc;">Someone used your referral code! You've earned £${rewardAmount.toFixed(0)} credit to use on your next order.</p>
            <p style="color: #E8A000; font-weight: bold; font-size: 18px;">Your voucher code: ${voucherCode}</p>
            <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
              <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a>
            </p>
          </div>
        `,
      }).catch((err) => console.error('Referral reward email failed:', err))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Referral apply error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
