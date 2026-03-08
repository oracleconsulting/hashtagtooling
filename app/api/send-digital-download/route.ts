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
    const body = await req.json()
    const { customerName, customerEmail, orderNumber = '', items } = body

    if (!customerEmail || !items?.length) {
      return NextResponse.json({ error: 'Missing customerEmail or items' }, { status: 400 })
    }

    const supabase = getSupabase()
    const digitalItems: { name: string; url: string; fileName?: string }[] = []

    for (const item of items) {
      if (!item.is_digital || !item.product_id) continue

      const { data: product } = await supabase
        .from('products')
        .select('id, name, digital_file_url, digital_file_name')
        .eq('id', item.product_id)
        .single()

      if (!product?.digital_file_url) continue

      // digital_file_url is the storage path (e.g. "filename.pdf" in bucket)
      const path = product.digital_file_url
      const { data: signed } = await supabase.storage
        .from('digital-downloads')
        .createSignedUrl(path, 7 * 24 * 60 * 60) // 7 days

      if (signed?.signedUrl) {
        digitalItems.push({
          name: product.name,
          url: signed.signedUrl,
          fileName: product.digital_file_name || undefined,
        })
      }
    }

    if (digitalItems.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    const downloadBlocks = digitalItems
      .map(
        (d) => `
        <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 12px 0;">
          <p style="color: #E8A000; font-weight: bold; margin: 0 0 8px 0;">${d.name}</p>
          <a href="${d.url}" style="display: inline-block; background: #E8A000; color: #1A1A1A; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-size: 14px;">
            Download
          </a>
        </div>
      `
      )
      .join('')

    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
      to: [customerEmail],
      bcc: ['hashtagwoodworking@gmail.com'],
      subject: 'Your #TOOLING digital download is ready!',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
            <p style="color: #999; margin-top: 8px;">Your digital download is ready</p>
          </div>

          <p style="color: #ccc;">Hi ${customerName || 'there'},</p>
          <p style="color: #ccc;">Thank you for your purchase${orderNumber ? ` (Order #${String(orderNumber).slice(0, 8).toUpperCase()})` : ''}! Click below to download your files:</p>

          ${downloadBlocks}

          <p style="color: #999; font-size: 14px; margin-top: 24px;">Links expire in 7 days. If you need a new link, just reply to this email.</p>

          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            #TOOLING — Handcrafted tools from exotic timbers<br/>
            <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a> |
            <a href="https://www.instagram.com/hashtagtooling/" style="color: #E8A000;">Instagram</a>
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend digital download error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: digitalItems.length, id: data?.id })
  } catch (err) {
    console.error('Digital download email error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
