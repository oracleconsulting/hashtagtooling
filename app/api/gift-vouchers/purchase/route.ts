import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

// Cryptographically random code: TOOL-XXXX-XXXX (Node.js crypto — safe in API route)
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No confusable chars (0/O, 1/I)
  const segment = (len: number) =>
    Array.from(crypto.randomBytes(len))
      .map((b) => chars[b % chars.length])
      .join('')
  return `TOOL-${segment(4)}-${segment(4)}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      amount_gbp,
      purchased_by_email,
      purchased_by_name,
      recipient_email,
      recipient_name,
      message,
      payment_reference,
      payment_method,
    } = body

    if (!amount_gbp || !purchased_by_email || !recipient_email || !payment_reference) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount = Number(amount_gbp)
    if (isNaN(amount) || amount < 5 || amount > 500) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Check for duplicate payment reference (idempotency)
    const { data: existing } = await supabase
      .from('gift_vouchers')
      .select('id, code')
      .eq('payment_reference', payment_reference)
      .single()

    if (existing) {
      // Already created — return existing code (idempotent)
      return NextResponse.json({ success: true, code: existing.code })
    }

    // Generate unique code (retry on collision, should never happen in practice)
    let code = generateVoucherCode()
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: clash } = await supabase
        .from('gift_vouchers')
        .select('id')
        .eq('code', code)
        .single()
      if (!clash) break
      code = generateVoucherCode()
    }

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 12 months from purchase

    const { data: voucher, error } = await supabase
      .from('gift_vouchers')
      .insert({
        code,
        amount_gbp: amount,
        remaining_balance: amount,
        purchased_by_email: purchased_by_email.toLowerCase(),
        purchased_by_name: purchased_by_name || null,
        recipient_email: recipient_email.toLowerCase(),
        recipient_name: recipient_name || null,
        message: message || null,
        payment_reference,
        payment_method: payment_method || 'stripe',
        expires_at: expiresAt.toISOString(),
      })
      .select('id, code')
      .single()

    if (error || !voucher) {
      console.error('Voucher insert error:', error)
      return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 })
    }

    // Send voucher email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'
    await fetch(`${siteUrl}/api/send-gift-voucher-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: voucher.code,
        amount_gbp: amount,
        recipient_email,
        recipient_name,
        purchased_by_name,
        message,
        expires_at: expiresAt.toISOString(),
      }),
    }).catch((err) => console.error('Voucher email send failed:', err))

    return NextResponse.json({ success: true, code: voucher.code })
  } catch (err) {
    console.error('Voucher purchase error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
