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

function generateLaunchCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = (len: number) =>
    Array.from(crypto.randomBytes(len))
      .map((b) => chars[b % chars.length])
      .join('')
  return `LAUNCH-${segment(4)}-${segment(4)}`
}

const LAUNCH_CUTOFF = new Date('2026-04-30T23:59:59Z')
const VOUCHER_EXPIRY = '2026-12-31T23:59:59Z'

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json()
    const trimmed = (email || '').trim().toLowerCase()

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, launch_voucher_code')
      .eq('email', trimmed)
      .single()

    if (existing) {
      return NextResponse.json({
        status: 'already',
        voucher_code: existing.launch_voucher_code || null,
      })
    }

    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: trimmed, source: source || 'footer' })

    if (insertError) {
      console.error('Newsletter insert error:', insertError)
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    let voucherCode: string | null = null
    const now = new Date()

    if (now < LAUNCH_CUTOFF) {
      voucherCode = generateLaunchCode()

      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: clash } = await supabase
          .from('launch_vouchers')
          .select('id')
          .eq('code', voucherCode)
          .single()
        if (!clash) break
        voucherCode = generateLaunchCode()
      }

      await supabase.from('launch_vouchers').insert({
        code: voucherCode,
        email: trimmed,
        discount_percent: 10,
        expires_at: VOUCHER_EXPIRY,
      })

      await supabase
        .from('newsletter_subscribers')
        .update({ launch_voucher_code: voucherCode })
        .eq('email', trimmed)

      const apiKey = process.env.RESEND_API_KEY
      if (apiKey) {
        const resend = new Resend(apiKey)
        const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

        await resend.emails.send({
          from: from.includes('@') && !from.includes('resend.dev')
            ? `#TOOLING <${from}>`
            : 'onboarding@resend.dev',
          to: [trimmed],
          subject: 'Welcome to #TOOLING — Your 10% Launch Voucher',
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
                <p style="color: #999; margin-top: 8px;">Welcome to the Workshop</p>
              </div>

              <p style="color: #ccc;">You're in.</p>

              <p style="color: #ccc;">As one of the first to join, here's your exclusive launch voucher — <strong style="color: #E8A000;">10% off</strong> any single tool purchase.</p>

              <div style="background: #222; border: 2px solid #E8A000; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="color: #999; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Your Launch Code</p>
                <p style="color: #E8A000; font-size: 28px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 3px;">${voucherCode}</p>
                <p style="color: #999; font-size: 13px; margin: 8px 0 0 0;">Valid until 31 December 2026</p>
              </div>

              <div style="color: #999; font-size: 14px; margin-top: 20px;">
                <p><strong style="color: #ccc;">How it works:</strong></p>
                <p>• Applies to in-stock items only — mallets, awls, engineering squares, and EDC coins</p>
                <p>• Not valid on custom builds, commissions, timber blanks, or digital products</p>
                <p>• Single use — one tool, one time</p>
                <p>• Tied to this email address</p>
                <p>• Cannot be combined with other discounts</p>
              </div>

              <p style="color: #ccc; margin-top: 24px;">Expect new tools, wood discoveries, and behind-the-scenes builds from the workshop. No noise, no spam.</p>

              <div style="text-align: center; margin: 28px 0;">
                <a href="https://hashtag.guru/shop" style="display: inline-block; background: #E8A000; color: #1A1A1A; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px;">
                  Browse the Workshop →
                </a>
              </div>

              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
                #TOOLING — Handcrafted tools from exotic timbers<br/>
                <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a>
              </p>
            </div>
          `,
        }).catch((err) => console.error('Welcome email failed:', err))
      }
    }

    return NextResponse.json({
      status: 'success',
      voucher_code: voucherCode,
    })
  } catch (err) {
    console.error('Newsletter signup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
