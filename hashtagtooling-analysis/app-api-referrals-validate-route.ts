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
    const { code, customerEmail } = await req.json()
    if (!code?.trim() || !customerEmail?.trim()) {
      return NextResponse.json({ valid: false, reason: 'Code and email required' })
    }

    const supabase = getSupabase()
    const normalizedCode = code.trim().toUpperCase()
    const normalizedEmail = customerEmail.trim().toLowerCase()

    const { data: ref, error } = await supabase
      .from('referral_codes')
      .select('id, code, owner_email, discount_amount, times_used, max_uses, active')
      .eq('code', normalizedCode)
      .single()

    if (error || !ref) {
      return NextResponse.json({ valid: false, reason: 'Invalid referral code' })
    }

    if (!ref.active) {
      return NextResponse.json({ valid: false, reason: 'This code is no longer active' })
    }

    if ((ref.times_used ?? 0) >= (ref.max_uses ?? 50)) {
      return NextResponse.json({ valid: false, reason: 'This code has reached its maximum uses' })
    }

    if (ref.owner_email === normalizedEmail) {
      return NextResponse.json({ valid: false, reason: "You can't use your own referral code" })
    }

    const { data: priorUse } = await supabase
      .from('referral_uses')
      .select('id')
      .eq('used_by_email', normalizedEmail)
      .limit(1)
      .single()

    if (priorUse) {
      return NextResponse.json({ valid: false, reason: 'You have already used a referral code' })
    }

    return NextResponse.json({
      valid: true,
      discount: Number(ref.discount_amount ?? 10),
    })
  } catch (err) {
    console.error('Referral validate error:', err)
    return NextResponse.json({ valid: false, reason: 'Validation failed' })
  }
}
