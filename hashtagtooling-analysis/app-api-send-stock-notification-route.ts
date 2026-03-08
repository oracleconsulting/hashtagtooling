import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const { productId, productName, productUrl } = await req.json()
    if (!productId || !productName || !productUrl) {
      return NextResponse.json({ error: 'Missing productId, productName, or productUrl' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: subscribers, error: fetchError } = await supabase
      .from('stock_notifications')
      .select('id, email')
      .eq('product_id', productId)
      .eq('notified', false)

    if (fetchError || !subscribers?.length) {
      return NextResponse.json({ count: 0 })
    }

    const resend = getResend()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'
    const fullUrl = productUrl.startsWith('http') ? productUrl : `${siteUrl}${productUrl.startsWith('/') ? '' : '/'}${productUrl}`

    for (const sub of subscribers) {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
        to: [sub.email],
        subject: `Good news — ${productName} is back in stock!`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
              <p style="color: #999; margin-top: 8px;">Back in stock</p>
            </div>

            <p style="color: #ccc;">Good news — the item you were waiting for is available again.</p>

            <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <p style="color: #E8A000; font-weight: bold; margin-top: 0; font-size: 18px;">${productName}</p>
              <p style="color: #999; font-size: 14px; margin: 12px 0 0 0;">Stock is limited — each piece is one-of-a-kind. Don&apos;t miss out.</p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${fullUrl}" style="display: inline-block; background: #E8A000; color: #1A1A1A; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px;">
                View product →
              </a>
            </div>

            <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
              #TOOLING — Handcrafted tools from exotic timbers<br/>
              <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a> |
              <a href="https://www.instagram.com/hashtagtooling/" style="color: #E8A000;">Instagram</a>
            </p>
          </div>
        `,
      }).catch((err) => console.error('Stock notification email failed:', err))
    }

    const ids = subscribers.map((s) => s.id)
    await supabase
      .from('stock_notifications')
      .update({ notified: true })
      .in('id', ids)

    return NextResponse.json({ count: subscribers.length })
  } catch (err) {
    console.error('Stock notification error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
