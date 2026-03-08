import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const resend = new Resend(apiKey)
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  try {
    const { type, data } = await req.json()

    let subject = ''
    let html = ''

    if (type === 'new_order') {
      subject = `New Order — £${Number(data.total).toFixed(2)} from ${data.customerName}`
      const itemsList = (data.items || [])
        .map((i: { name: string; quantity: number }) => `<li>${i.name} x${i.quantity}</li>`)
        .join('')
      html = `
        <h2>New Order Received</h2>
        <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
        <p><strong>Total:</strong> £${Number(data.total).toFixed(2)}</p>
        <p><strong>Shipping to:</strong> ${data.shippingAddress || '—'}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemsList}</ul>
        <p><a href="https://hashtag.guru/admin/orders">View in Admin</a></p>
      `
    } else if (type === 'new_commission') {
      subject = `New Commission Request from ${data.name}`
      html = `
        <h2>New Commission Request</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Budget:</strong> ${data.budget || 'Not specified'}</p>
        <p><strong>Timeline:</strong> ${data.timeline || 'Not specified'}</p>
        <p><strong>Description:</strong></p>
        <p>${(data.project_description || '').replace(/\n/g, '<br>')}</p>
        <p><a href="https://hashtag.guru/admin/commissions">View in Admin</a></p>
      `
    } else if (type === 'new_contact') {
      subject = `New Contact Message: ${data.subject}`
      html = `
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${data.name} (${data.email})</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${(data.message || '').replace(/\n/g, '<br>')}</p>
      `
    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }

    await resend.emails.send({
      from: from.includes('@') && !from.includes('resend.dev') ? `#TOOLING Notifications <${from}>` : 'onboarding@resend.dev',
      to: ['hashtagwoodworking@gmail.com'],
      subject,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin notification error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
