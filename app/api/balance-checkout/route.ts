import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hashtag.guru'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { token, provider } = await req.json()
    if (!token || !provider) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('balance_payment_token', token)
      .single()
    if (error || !order) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

    if (order.balance_status !== 'awaiting_payment') {
      return NextResponse.json({ error: `Balance is ${order.balance_status}, cannot collect` }, { status: 400 })
    }

    const balanceAmount = Number(order.balance_amount)

    if (provider === 'stripe') {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: order.customer_email,
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `#TOOLING — Balance for order ${order.id.slice(0, 8)}`,
              description: 'Final 50% balance for completed custom build',
            },
            unit_amount: Math.round(balanceAmount * 100),
          },
          quantity: 1,
        }],
        metadata: {
          balance_payment: 'true',
          order_id: order.id,
          token,
        },
        success_url: `${SITE_URL}/pay-balance/${token}/success`,
        cancel_url: `${SITE_URL}/pay-balance/${token}`,
      })
      return NextResponse.json({ url: session.url })
    }

    if (provider === 'paypal') {
      const accessToken = await getPayPalAccessToken()
      const ppRes = await fetch(`${process.env.PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: { currency_code: 'GBP', value: balanceAmount.toFixed(2) },
            description: `Balance for order ${order.id.slice(0, 8)}`,
            custom_id: `balance_payment;order=${order.id};token=${token}`,
          }],
        }),
      })
      const ppOrder = await ppRes.json()
      if (!ppOrder.id) return NextResponse.json({ error: 'PayPal order create failed' }, { status: 500 })
      return NextResponse.json({ paypalOrderId: ppOrder.id })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  } catch (error) {
    console.error('balance-checkout error', error)
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
