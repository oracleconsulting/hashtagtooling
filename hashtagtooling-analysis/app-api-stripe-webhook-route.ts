import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key)
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ error: 'Webhook secret not set' }, { status: 500 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const supabase = getSupabase()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'
    const meta = session.metadata || {}

    // -----------------------------------------------------------------------
    // GIFT VOUCHER PURCHASE — create voucher and email recipient
    // -----------------------------------------------------------------------
    if (meta.voucher_purchase === 'true') {
      await fetch(`${siteUrl}/api/gift-vouchers/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_gbp: Number(meta.amount_gbp),
          purchased_by_name: meta.purchased_by_name,
          purchased_by_email: meta.purchased_by_email,
          recipient_name: meta.recipient_name,
          recipient_email: meta.recipient_email,
          message: meta.message,
          payment_reference: session.id,
          payment_method: 'stripe',
        }),
      }).catch((err) => console.error('Voucher purchase webhook error:', err))

      return NextResponse.json({ received: true })
    }

    // -----------------------------------------------------------------------
    // REGULAR ORDER — save to orders table
    // -----------------------------------------------------------------------
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: session.customer_details?.name || 'Unknown',
        customer_email: session.customer_details?.email || meta.customerEmail || '',
        total_amount: (session.amount_total || 0) / 100,
        paypal_order_id: session.id,
        status: 'paid',
        order_details: {
          payment_method: 'stripe',
          shipping_address: meta.shippingAddress,
          stripe_session_id: session.id,
          voucher_code: meta.voucher_code || null,
          voucher_discount: meta.voucher_discount ? Number(meta.voucher_discount) : null,
        },
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('Stripe webhook order insert error:', orderError)
    }

    // Redeem voucher if one was applied
    if (meta.voucher_code && meta.voucher_discount && order?.id) {
      await fetch(`${siteUrl}/api/gift-vouchers/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: meta.voucher_code,
          amount_to_redeem: Number(meta.voucher_discount),
          order_id: order.id,
        }),
      }).catch((err) => console.error('Voucher redeem webhook error:', err))
    }
  }

  return NextResponse.json({ received: true })
}
