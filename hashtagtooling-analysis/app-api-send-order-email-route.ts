import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }
  const resend = new Resend(apiKey)
  try {
    const body = await req.json()
    const { customerName, customerEmail, orderNumber, items, totalAmount, shippingAddress } = body

    const itemsList = items
      .map((item: { name: string; price: number; quantity: number }) =>
        `${item.name} x${item.quantity} — £${(item.price * item.quantity).toFixed(2)}`
      )
      .join('\n')

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
      to: [customerEmail],
      bcc: ['hashtagwoodworking@gmail.com'],
      subject: `Order Confirmation — #${String(orderNumber).slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
            <p style="color: #999; margin-top: 8px;">Order Confirmation</p>
          </div>

          <p style="color: #ccc;">Hi ${customerName},</p>
          <p style="color: #ccc;">Thank you for your order! Here's a summary:</p>

          <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #E8A000; font-weight: bold; margin-top: 0;">Order #${String(orderNumber).slice(0, 8).toUpperCase()}</p>
            <pre style="color: #ccc; white-space: pre-wrap; font-family: inherit; margin: 0;">${itemsList}</pre>
            <hr style="border: none; border-top: 1px solid #333; margin: 16px 0;" />
            <p style="color: #E8A000; font-weight: bold; font-size: 18px; margin-bottom: 0;">Total: £${Number(totalAmount).toFixed(2)}</p>
          </div>

          <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #E8A000; font-weight: bold; margin-top: 0;">Shipping to:</p>
            <p style="color: #ccc; margin-bottom: 0;">${shippingAddress || '—'}</p>
          </div>

          <p style="color: #ccc;">I'll be in touch when your order ships. If you have any questions, reply to this email or contact me at hashtagwoodworking@gmail.com.</p>

          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            #TOOLING — Handcrafted tools from exotic timbers<br/>
            <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a> |
            <a href="https://www.instagram.com/hashtagtooling/" style="color: #E8A000;">Instagram</a>
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
