import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Email not configured' }, { status: 503 })

  const resend = new Resend(apiKey)

  try {
    const { code, amount_gbp, recipient_email, recipient_name, purchased_by_name, message, expires_at } = await req.json()

    const recipientDisplay = recipient_name || recipient_email
    const senderDisplay = purchased_by_name || 'Someone special'
    const expiryDate = new Date(expires_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
      to: [recipient_email],
      bcc: ['hashtagwoodworking@gmail.com'],
      subject: `You've received a £${Number(amount_gbp).toFixed(0)} #TOOLING gift voucher`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">

          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #E8A000; font-size: 28px; margin: 0; letter-spacing: -0.5px;">#TOOLING</h1>
            <p style="color: #71717a; margin-top: 6px; font-size: 14px;">Handcrafted woodworking tools</p>
          </div>

          <p style="color: #d4d4d8; font-size: 17px; line-height: 1.6;">Hi ${recipientDisplay},</p>
          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7;">
            ${senderDisplay} has sent you a gift voucher for #TOOLING — handcrafted woodworking mallets and awls made from over 75 exotic timber species.
          </p>

          ${message ? `
          <div style="background: #222; border-left: 4px solid #E8A000; padding: 16px 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
            <p style="color: #71717a; font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.05em;">A message from ${senderDisplay}</p>
            <p style="color: #d4d4d8; font-style: italic; margin: 0; line-height: 1.6;">"${message}"</p>
          </div>
          ` : ''}

          <!-- Voucher card -->
          <div style="background: #222; border: 1px solid #333; border-radius: 12px; padding: 32px; margin: 28px 0; text-align: center;">
            <p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Your Gift Voucher</p>
            <p style="color: #E8A000; font-size: 42px; font-weight: 700; margin: 0 0 4px 0;">£${Number(amount_gbp).toFixed(0)}</p>
            <p style="color: #71717a; font-size: 13px; margin: 0 0 24px 0;">to spend on anything at hashtag.guru</p>
            <div style="background: #1A1A1A; border: 1px dashed #444; border-radius: 8px; padding: 14px 24px; display: inline-block;">
              <p style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px 0;">Voucher Code</p>
              <p style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.15em; font-family: 'Courier New', monospace; margin: 0;">${code}</p>
            </div>
            <p style="color: #52525b; font-size: 12px; margin: 16px 0 0 0;">Valid until ${expiryDate}</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${siteUrl}/shop" style="display: inline-block; background: #E8A000; color: #1A1A1A; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px;">
              Browse the Shop
            </a>
          </div>

          <div style="background: #1f1f1f; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <p style="color: #71717a; font-size: 13px; margin: 0 0 6px 0; font-weight: 600;">How to use your voucher</p>
            <p style="color: #71717a; font-size: 13px; margin: 0; line-height: 1.6;">Add items to your cart at <a href="${siteUrl}" style="color: #E8A000;">${siteUrl.replace('https://', '')}</a>, then enter your voucher code in the cart before checkout. The value will be deducted automatically.</p>
          </div>

          <p style="color: #52525b; font-size: 12px; margin-top: 32px; text-align: center; line-height: 1.6;">
            Partial use is supported — any remaining balance stays on your code.<br/>
            Questions? Reply to this email or contact <a href="mailto:hashtagwoodworking@gmail.com" style="color: #E8A000;">hashtagwoodworking@gmail.com</a>
          </p>

          <p style="color: #3f3f46; font-size: 11px; text-align: center; margin-top: 20px;">
            #TOOLING · <a href="${siteUrl}" style="color: #52525b;">hashtag.guru</a> · <a href="https://www.instagram.com/hashtagtooling/" style="color: #52525b;">@hashtagtooling</a>
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error sending voucher:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Gift voucher email error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
