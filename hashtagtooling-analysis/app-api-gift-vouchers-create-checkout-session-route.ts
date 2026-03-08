import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key)
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const body = await req.json()
    const amount = Number(body.amount_gbp)
    if (isNaN(amount) || amount < 10 || amount > 500) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `#TOOLING Gift Voucher — £${amount.toFixed(0)}`,
            description: `For ${body.recipient_name || body.recipient_email}. Valid for 12 months at hashtag.guru`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: body.purchased_by_email,
      success_url: `${siteUrl}/gift-vouchers/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/gift-vouchers?canceled=true`,
      metadata: {
        voucher_purchase: 'true',
        amount_gbp: amount.toFixed(2),
        purchased_by_name: body.purchased_by_name || '',
        purchased_by_email: body.purchased_by_email || '',
        recipient_name: body.recipient_name || '',
        recipient_email: body.recipient_email || '',
        message: (body.message || '').slice(0, 500),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Gift voucher Stripe error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
