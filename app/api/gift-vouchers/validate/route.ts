import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// In-memory rate limiter — max 10 attempts per IP per 15 minutes
// Fine for single-instance Railway deployment
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const window = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 10

  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window })
    return false
  }
  if (entry.count >= maxAttempts) return true
  entry.count++
  return false
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  // Get IP for rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { valid: false, error: 'Too many attempts. Please wait before trying again.' },
      { status: 429 }
    )
  }

  let code: string
  try {
    const body = await req.json()
    code = (body.code || '').toString().trim().toUpperCase()
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 })
  }

  try {
    const supabase = getServiceSupabase()

    const { data: voucher, error } = await supabase
      .from('gift_vouchers')
      .select('id, code, amount_gbp, remaining_balance, expires_at')
      .eq('code', code)
      .single()

    if (error || !voucher) {
      return NextResponse.json({ valid: false, error: 'Invalid voucher code' })
    }

    if (new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This voucher has expired' })
    }

    if (Number(voucher.remaining_balance) <= 0) {
      return NextResponse.json({ valid: false, error: 'This voucher has no remaining balance' })
    }

    return NextResponse.json({
      valid: true,
      code: voucher.code,
      remaining_balance: Number(voucher.remaining_balance),
      original_amount: Number(voucher.amount_gbp),
    })
  } catch (err) {
    console.error('Voucher validate error:', err)
    return NextResponse.json({ valid: false, error: 'Failed to validate code' }, { status: 500 })
  }
}
