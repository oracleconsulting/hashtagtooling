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
    const stripe = getStripe()
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] })
    const lineItems = (fullSession.line_items?.data ?? []).filter(
      (li) => li.description && !li.description?.includes('Shipping') && !li.description?.includes('Gift Voucher')
    )
    const productIds = (meta.product_ids || '').split(',').filter(Boolean)
    const digitalIds = new Set((meta.digital_ids || '').split(',').filter(Boolean))

    const orderItems = lineItems.map((li, i) => {
      const productId = productIds[i] || null
      const name = (li as { description?: string }).description || (li as { price?: { product_data?: { name?: string } } }).price?.product_data?.name || 'Item'
      const qty = li.quantity || 1
      const price = (li.amount_total || 0) / 100 / qty
      return {
        id: productId,
        name,
        price,
        quantity: qty,
        is_digital: productId ? digitalIds.has(productId) : false,
      }
    })

    const orderDetails = {
      payment_method: 'stripe',
      shipping_address: meta.shippingAddress,
      stripe_session_id: session.id,
      voucher_code: meta.voucher_code || null,
      voucher_discount: meta.voucher_discount ? Number(meta.voucher_discount) : null,
      items: meta.items_json ? (() => { try { return JSON.parse(meta.items_json) } catch { return orderItems } })() : orderItems,
    }

    const paymentPlan = (meta.payment_plan || 'full') as 'full' | 'deposit'
    const depositAmount = Number.parseFloat(meta.deposit_amount || '0')
    const balanceAmount = Number.parseFloat(meta.balance_amount || '0')
    const upfrontAmount = Number.parseFloat(meta.upfront_amount || '0')

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: session.customer_details?.name || 'Unknown',
        customer_email: session.customer_details?.email || meta.customerEmail || '',
        total_amount: (session.amount_total || 0) / 100,
        paypal_order_id: session.id,
        status: paymentPlan === 'deposit' ? 'awaiting_balance' : 'paid',
        order_details: orderDetails,
        payment_plan: paymentPlan,
        upfront_amount: upfrontAmount || null,
        deposit_amount: paymentPlan === 'deposit' ? depositAmount : null,
        balance_amount: paymentPlan === 'deposit' ? balanceAmount : null,
        balance_status: paymentPlan === 'deposit' ? 'awaiting_build' : 'not_applicable',
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

    // Redeem launch voucher if one was applied
    if (meta.launch_voucher_code && order?.id) {
      await fetch(`${siteUrl}/api/launch-voucher/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: meta.launch_voucher_code,
          order_id: order.id,
          discount_amount: Number(meta.launch_voucher_discount),
        }),
      }).catch((err) => console.error('Launch voucher redeem error:', err))
    }

    // Apply referral if one was used
    if (meta.referral_code && meta.referral_discount && order?.id) {
      await fetch(`${siteUrl}/api/referrals/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: meta.referral_code,
          usedByEmail: session.customer_details?.email || meta.customerEmail || '',
          orderId: order.id,
        }),
      }).catch((err) => console.error('Referral apply webhook error:', err))
    }

    // Send order confirmation email
    if (order?.id) {
      await fetch(`${siteUrl}/api/send-order-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: session.customer_details?.name || 'Unknown',
          customerEmail: session.customer_details?.email || meta.customerEmail || '',
          orderNumber: order.id,
          items: meta.items_json ? (() => { try { return JSON.parse(meta.items_json) } catch { return orderItems.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })) } })() : orderItems.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
          totalAmount: (session.amount_total || 0) / 100,
          shippingAddress: meta.shippingAddress || '',
          paymentPlan,
          upfrontAmount: upfrontAmount || null,
          depositAmount: paymentPlan === 'deposit' ? depositAmount : null,
          balanceAmount: paymentPlan === 'deposit' ? balanceAmount : null,
          createdAt: new Date().toISOString(),
        }),
      }).catch((err) => console.error('Order email webhook error:', err))

      // Send digital download email if any digital items
      const digitalItems = orderItems.filter((i) => i.is_digital && i.id)
      if (digitalItems.length > 0) {
        await fetch(`${siteUrl}/api/send-digital-download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: session.customer_details?.name || 'Unknown',
            customerEmail: session.customer_details?.email || meta.customerEmail || '',
            orderNumber: order.id,
            items: digitalItems.map((i) => ({ product_id: i.id, name: i.name, is_digital: true })),
          }),
        }).catch((err) => console.error('Digital download email webhook error:', err))
      }

      // Adopt a Blank — create adoption records and send confirmation
      const adoptProductIds = [...new Set(orderItems.map((i) => i.id).filter(Boolean))] as string[]
      if (adoptProductIds.length > 0) {
        const { data: products } = await supabase.from('products').select('id, name, category, subcategory').in('id', adoptProductIds)
        const adoptProducts = (products || []).filter((p) => p.category === 'wood' && p.subcategory === 'adopt')
        const customerName = session.customer_details?.name || 'Unknown'
        const customerEmail = session.customer_details?.email || meta.customerEmail || ''

        for (const product of adoptProducts) {
          await supabase.from('blank_adoptions').insert({
            product_id: product.id,
            customer_name: customerName,
            customer_email: customerEmail,
            status: 'adopted',
            stripe_payment_id: session.id,
          })
          await supabase.from('products').update({ stock_status: 'made_to_order' }).eq('id', product.id)
          await fetch(`${siteUrl}/api/send-adoption-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName,
              customerEmail,
              productName: product.name,
              updateText: "You've adopted a blank! I'll start working on it soon. You'll receive email updates as it progresses from rough stock to finished tool.",
              imageUrl: null,
              adoptionPageUrl: `${siteUrl}/adopt/${product.id}`,
              subject: `You've adopted ${product.name}!`,
            }),
          }).catch((err) => console.error('Adoption confirmation email error:', err))
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
