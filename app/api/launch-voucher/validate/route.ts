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
    const { code, email } = await req.json()
    const normalizedCode = (code || '').trim().toUpperCase()
    const normalizedEmail = (email || '').trim().toLowerCase()

    if (!normalizedCode || !normalizedEmail) {
      return NextResponse.json({ valid: false, error: 'Code and email required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: voucher, error } = await supabase
      .from('launch_vouchers')
      .select('id, code, email, discount_percent, used, expires_at')
      .eq('code', normalizedCode)
      .single()

    if (error || !voucher) {
      return NextResponse.json({ valid: false, error: 'Invalid voucher code' })
    }

    if (voucher.used) {
      return NextResponse.json({ valid: false, error: 'This voucher has already been used' })
    }

    if (new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This voucher has expired' })
    }

    if (voucher.email !== normalizedEmail) {
      return NextResponse.json({ valid: false, error: 'This voucher is registered to a different email address' })
    }

    return NextResponse.json({
      valid: true,
      discount_percent: voucher.discount_percent,
      code: voucher.code,
    })
  } catch (err) {
    console.error('Launch voucher validate error:', err)
    return NextResponse.json({ valid: false, error: 'Failed to validate' }, { status: 500 })
  }
}
