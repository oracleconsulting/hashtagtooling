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

function generateReviewToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from(crypto.randomBytes(24))
    .map((b) => chars[b % chars.length])
    .join('')
}

export async function POST(req: NextRequest) {
  try {
    const {
      customer_name,
      customer_email,
      product_id,
      order_id,
      source,
      product_description,
      send_email,
    } = await req.json()

    if (!customer_name || !customer_email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const token = generateReviewToken()

    const { data: review, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: product_id || null,
        order_id: order_id || null,
        customer_name,
        customer_email: customer_email.toLowerCase(),
        rating: 0,
        review_token: token,
        token_used: false,
        source: source || 'historical',
        product_description: product_description || null,
        verified_purchase: true,
        published: false,
      })
      .select('id, review_token')
      .single()

    if (error) {
      console.error('Review invitation create error:', error)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    if (order_id) {
      await supabase
        .from('orders')
        .update({ review_token: token, review_requested_at: new Date().toISOString() })
        .eq('id', order_id)
    }

    if (send_email !== false) {
      const apiKey = process.env.RESEND_API_KEY
      if (apiKey) {
        const resend = new Resend(apiKey)
        const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'
        const reviewUrl = `${siteUrl}/review/${token}`

        await resend.emails.send({
          from: from.includes('@') && !from.includes('resend.dev')
            ? `#TOOLING <${from}>`
            : 'onboarding@resend.dev',
          to: [customer_email.toLowerCase()],
          subject: 'How are you getting on with your #TOOLING piece?',
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
              </div>
              <p style="color: #ccc;">Hi ${customer_name},</p>
              <p style="color: #ccc;">Hope the tool is getting some use. If you've got 30 seconds, I'd really appreciate a quick review — it helps more than you'd think when you're a one-man operation.</p>
              <p style="color: #ccc;">No account needed. Just click, rate, and write a line or two if you fancy it.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${reviewUrl}" style="display: inline-block; background: #E8A000; color: #1A1A1A; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px;">
                  Leave a Review &rarr;
                </a>
              </div>
              <p style="color: #666; font-size: 13px; text-align: center;">This link is unique to you and can only be used once.</p>
              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
                #TOOLING — Handcrafted tools from exotic timbers<br/>
                <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a>
              </p>
            </div>
          `,
        }).catch((err: unknown) => console.error('Review invitation email failed:', err))
      }
    }

    return NextResponse.json({
      success: true,
      token,
      review_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'}/review/${token}`,
    })
  } catch (err) {
    console.error('Review invitation error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
