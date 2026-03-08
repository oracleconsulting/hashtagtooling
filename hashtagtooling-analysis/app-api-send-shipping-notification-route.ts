import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerName, customerEmail, orderNumber, trackingNumber, trackingUrl, items } = body

    if (!customerEmail) {
      return NextResponse.json({ error: 'Missing customerEmail' }, { status: 400 })
    }

    const resend = getResend()
    const itemsList = (items || [])
      .map((item: { name: string; price?: number; quantity?: number }) =>
        `${item.name} x${item.quantity ?? 1} — £${((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}`
      )
      .join('\n')

    const trackingBlock = trackingUrl
      ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${trackingUrl}" style="display: inline-block; background: #E8A000; color: #1A1A1A; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px;">
            Track Your Package →
          </a>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center;">Tracking: ${trackingNumber || '—'}</p>
      `
      : trackingNumber
        ? `<p style="color: #ccc; text-align: center; margin: 20px 0;">Tracking number: <strong style="color: #E8A000;">${trackingNumber}</strong></p>`
        : ''

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
      to: [customerEmail],
      bcc: ['hashtagwoodworking@gmail.com'],
      subject: 'Your #TOOLING order has shipped! 🚀',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
            <p style="color: #999; margin-top: 8px;">Your order has shipped</p>
          </div>

          <p style="color: #ccc;">Hi ${customerName || 'there'},</p>
          <p style="color: #ccc;">Your handcrafted tools are on their way! Each piece has been carefully wrapped to arrive safely.</p>

          <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #E8A000; font-weight: bold; margin-top: 0;">Order #${String(orderNumber || '').slice(0, 8).toUpperCase()}</p>
            <pre style="color: #ccc; white-space: pre-wrap; font-family: inherit; margin: 0;">${itemsList || '—'}</pre>
          </div>
          ${trackingBlock}

          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            #TOOLING — Handcrafted tools from exotic timbers<br/>
            <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a> |
            <a href="https://www.instagram.com/hashtagtooling/" style="color: #E8A000;">Instagram</a>
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend shipping notification error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Shipping notification error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
