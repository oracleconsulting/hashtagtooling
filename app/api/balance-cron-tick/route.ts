import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hashtag.guru'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.BALANCE_CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const orderId = url.searchParams.get('order')
  if (!action || !orderId) {
    return NextResponse.json({ error: 'Missing action or order' }, { status: 400 })
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()
  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.balance_status !== 'awaiting_payment') {
    return NextResponse.json({ skipped: true, reason: 'balance no longer awaiting' })
  }

  const balanceLink = `${SITE_URL}/pay-balance/${order.balance_payment_token}`
  const dueDate = new Date(order.balance_due_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  if (action === 'remind_7d') {
    await resend.emails.send({
      from: '#TOOLING <hashtagwoodworking@gmail.com>',
      to: order.customer_email,
      subject: `Your build is complete — balance due ${dueDate}`,
      html: reminderEmailHtml({ name: order.customer_name, balanceAmount: Number(order.balance_amount), dueDate, balanceLink, daysRemaining: 7 }),
    })
    await supabase.from('orders').update({ reminder_7d_sent_at: new Date().toISOString() }).eq('id', orderId)
    return NextResponse.json({ ok: true, action })
  }

  if (action === 'remind_2d') {
    await resend.emails.send({
      from: '#TOOLING <hashtagwoodworking@gmail.com>',
      to: order.customer_email,
      subject: `Final reminder — balance due ${dueDate}`,
      html: reminderEmailHtml({ name: order.customer_name, balanceAmount: Number(order.balance_amount), dueDate, balanceLink, daysRemaining: 2, urgent: true }),
    })
    await supabase.from('orders').update({ reminder_2d_sent_at: new Date().toISOString() }).eq('id', orderId)
    return NextResponse.json({ ok: true, action })
  }

  if (action === 'auto_cancel') {
    await supabase.from('orders').update({
      status: 'cancelled',
      balance_status: 'cancelled',
      auto_cancelled_at: new Date().toISOString(),
    }).eq('id', orderId)

    await resend.emails.send({
      from: '#TOOLING <hashtagwoodworking@gmail.com>',
      to: order.customer_email,
      subject: 'Your order has been cancelled',
      html: cancelEmailHtml({ name: order.customer_name, depositAmount: Number(order.deposit_amount ?? 0) }),
    })
    await resend.emails.send({
      from: '#TOOLING <hashtagwoodworking@gmail.com>',
      to: 'hashtagwoodworking@gmail.com',
      subject: `Order auto-cancelled: ${order.customer_name}`,
      html: `<p>Order ${orderId} for ${order.customer_name} (${order.customer_email}) was auto-cancelled. Balance of £${Number(order.balance_amount).toFixed(2)} not paid by ${dueDate}. Deposit of £${Number(order.deposit_amount).toFixed(2)} forfeit.</p>`,
    })
    return NextResponse.json({ ok: true, action })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

function reminderEmailHtml(p: { name: string; balanceAmount: number; dueDate: string; balanceLink: string; daysRemaining: number; urgent?: boolean }): string {
  return `
    <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff;">
      <h1 style="color:#E8A000;font-size:22px;margin:0 0 16px;">${p.urgent ? 'Final reminder' : 'Friendly reminder'}</h1>
      <p>Hi ${p.name},</p>
      <p>Your build is complete and ready to ship — we just need the balance of <strong>£${p.balanceAmount.toFixed(2)}</strong> before we send it out.</p>
      <p>${p.urgent
        ? `Payment is due in <strong>${p.daysRemaining} days</strong> (${p.dueDate}). If we don't receive payment by then, the order will be cancelled and the deposit forfeit.`
        : `You have <strong>${p.daysRemaining} days</strong> to pay (until ${p.dueDate}).`}</p>
      <p style="margin:24px 0;">
        <a href="${p.balanceLink}" style="background:#E8A000;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;">Pay balance</a>
      </p>
      <p style="font-size:13px;color:#666;">Or copy the link: ${p.balanceLink}</p>
      <p style="font-size:13px;color:#666;margin-top:32px;">Reply to this email if you have any questions.</p>
    </div>
  `
}

function cancelEmailHtml(p: { name: string; depositAmount: number }): string {
  return `
    <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff;">
      <h1 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">Your order has been cancelled</h1>
      <p>Hi ${p.name},</p>
      <p>Unfortunately, the balance for your custom order wasn't paid within the 14-day window after your build was completed, so the order has been cancelled.</p>
      <p>As outlined when you placed the order, the 50% deposit (£${p.depositAmount.toFixed(2)}) is non-refundable.</p>
      <p>If you'd still like the piece and this was an oversight, please reply to this email — we may be able to reinstate the order or arrange a fresh build.</p>
    </div>
  `
}
