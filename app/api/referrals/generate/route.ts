import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = (len: number) =>
    Array.from(crypto.randomBytes(len))
      .map((b) => chars[b % chars.length])
      .join('')
  return `TOOLING-${segment(4)}`
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const normalizedEmail = email.trim().toLowerCase()

    const { data: existing } = await supabase
      .from('referral_codes')
      .select('id, code')
      .eq('owner_email', normalizedEmail)
      .eq('active', true)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ code: existing.code, existing: true })
    }

    let code = generateCode()
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: clash } = await supabase.from('referral_codes').select('id').eq('code', code).single()
      if (!clash) break
      code = generateCode()
    }

    const { data: inserted, error } = await supabase
      .from('referral_codes')
      .insert({
        code,
        owner_email: normalizedEmail,
        owner_name: (name || '').trim() || 'Customer',
      })
      .select('code')
      .single()

    if (error) {
      console.error('Referral generate error:', error)
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
    }

    return NextResponse.json({ code: inserted.code })
  } catch (err) {
    console.error('Referral generate error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
