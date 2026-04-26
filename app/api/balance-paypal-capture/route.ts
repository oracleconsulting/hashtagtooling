import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const { paypalOrderId, token } = await req.json()
    if (!paypalOrderId || !token) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('balance_payment_token', token)
      .single()
    if (error || !order) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    if (order.balance_status !== 'awaiting_payment') {
      return NextResponse.json({ error: 'Balance not awaiting' }, { status: 400 })
    }

    const accessToken = await getPayPalAccessToken()
    const captureRes = await fetch(
      `${process.env.PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      }
    )
    const captureData = await captureRes.json()
    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'PayPal capture failed' }, { status: 500 })
    }

    await supabase.from('orders').update({
      balance_status: 'paid',
      balance_paid_at: new Date().toISOString(),
      status: 'paid',
      balance_payment_token: null,
      balance_paypal_order_id: paypalOrderId,
    }).eq('id', order.id)

    const { data: updatedOrder } = await supabase.from('orders').select('*').eq('id', order.id).single()
    if (updatedOrder) {
      await resend.emails.send({
        from: '#TOOLING <hashtagwoodworking@gmail.com>',
        to: updatedOrder.customer_email,
        subject: 'Balance received — your order is shipping soon',
        html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;"><h1 style="color:#E8A000;font-size:22px;">Balance received</h1><p>Hi ${updatedOrder.customer_name},</p><p>Thanks — we've received the £${Number(updatedOrder.balance_amount).toFixed(2)} balance and your order is now in the shipping queue.</p><p>You'll get tracking information by email when it ships.</p></div>`,
      })
      await resend.emails.send({
        from: '#TOOLING <hashtagwoodworking@gmail.com>',
        to: 'hashtagwoodworking@gmail.com',
        subject: `Balance paid: ${updatedOrder.customer_name}`,
        html: `<p>Order ${order.id} balance of £${Number(updatedOrder.balance_amount).toFixed(2)} paid via PayPal. Ready to ship.</p>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('paypal capture error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch(`${process.env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}
