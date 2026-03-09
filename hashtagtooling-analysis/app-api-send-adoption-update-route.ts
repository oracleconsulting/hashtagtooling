import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { customerName, customerEmail, productName, updateText, imageUrl, adoptionPageUrl, subject } = body

    if (!customerEmail || !productName || !updateText || !adoptionPageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const resend = new Resend(apiKey)
    const emailSubject = subject || `Your ${productName} has a new update!`
    const imageHtml = imageUrl
      ? `<p style="margin: 16px 0;"><a href="${imageUrl}"><img src="${imageUrl}" alt="Update" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #333;" /></a></p>`
      : ''

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
      to: [customerEmail],
      subject: emailSubject,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
            <p style="color: #999; margin-top: 8px;">Adopt a Blank — New Update</p>
          </div>

          <p style="color: #ccc;">Hi ${customerName},</p>
          <p style="color: #ccc;">Your adopted blank <strong>${productName}</strong> has a new update:</p>

          <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #ccc; white-space: pre-wrap; margin: 0;">${updateText}</p>
            ${imageHtml}
          </div>

          <p style="text-align: center; margin: 24px 0;">
            <a href="${adoptionPageUrl}" style="display: inline-block; padding: 12px 24px; background: #E8A000; color: #1A1A1A; text-decoration: none; font-weight: bold; border-radius: 6px;">View full timeline</a>
          </p>

          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            #TOOLING — Handcrafted tools from exotic timbers<br/>
            <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a>
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend adoption update error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error('Adoption update email API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
