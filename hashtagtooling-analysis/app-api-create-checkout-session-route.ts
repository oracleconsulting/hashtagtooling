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
    const { items, customerEmail, shippingAddress, shippingCost, voucherCode, voucherDiscount, referralCode, referralDiscount, launchVoucherCode, launchVoucherDiscount } = await req.json()

    const lineItems = items.map((item: { name: string; price: number; quantity: number; image_url?: string; id?: string; is_digital?: boolean }) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }))

    if (Number(shippingCost) > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Shipping', images: [] },
          unit_amount: Math.round(Number(shippingCost) * 100),
        },
        quantity: 1,
      })
    }

    // Apply gift voucher discount as a negative line item
    if (voucherCode && Number(voucherDiscount) > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: `Gift Voucher (${voucherCode})`, images: [] },
          unit_amount: -Math.round(Number(voucherDiscount) * 100),
        },
        quantity: 1,
      })
    }

    if (launchVoucherCode && Number(launchVoucherDiscount) > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: `Launch Voucher (${launchVoucherCode})`, images: [] },
          unit_amount: -Math.round(Number(launchVoucherDiscount) * 100),
        },
        quantity: 1,
      })
    }

    // Apply referral discount as a negative line item
    if (referralCode && Number(referralDiscount) > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: `Referral (${referralCode})`, images: [] },
          unit_amount: -Math.round(Number(referralDiscount) * 100),
        },
        quantity: 1,
      })
    }

    const productIds = (items as { id?: string }[]).map((i) => i.id || '').filter(Boolean).join(',')
    const digitalIds = (items as { id?: string; is_digital?: boolean }[])
      .filter((i) => i.is_digital && i.id)
      .map((i) => i.id)
      .join(',')

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'}/cart?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'}/cart?canceled=true`,
      metadata: {
        shippingAddress: shippingAddress || '',
        customerEmail: customerEmail || '',
        voucher_code: voucherCode || '',
        voucher_discount: voucherDiscount ? String(voucherDiscount) : '',
        referral_code: referralCode || '',
        referral_discount: referralDiscount ? String(referralDiscount) : '',
        launch_voucher_code: launchVoucherCode || '',
        launch_voucher_discount: launchVoucherDiscount ? String(launchVoucherDiscount) : '',
        product_ids: productIds,
        digital_ids: digitalIds,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
