import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'node:crypto'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hashtag.guru'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    if (fetchErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.balance_status !== 'awaiting_build') {
      return NextResponse.json({ error: `Order is not awaiting build — current status: ${order.balance_status}` }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const now = new Date()
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const { error: updateErr } = await supabase.from('orders').update({
      build_completed_at: now.toISOString(),
      balance_due_date: dueDate.toISOString(),
      balance_status: 'awaiting_payment',
      balance_payment_token: token,
    }).eq('id', orderId)

    if (updateErr) throw updateErr

    const balanceLink = `${SITE_URL}/pay-balance/${token}`
    const dueDateFormatted = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    await resend.emails.send({
      from: '#TOOLING <hashtagwoodworking@gmail.com>',
      to: order.customer_email,
      subject: 'Your build is complete — please pay balance',
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff;">
          <h1 style="color:#E8A000;font-size:24px;margin:0 0 16px;">Your build is complete</h1>
          <p>Hi ${order.customer_name},</p>
          <p>Great news — your custom order is finished and ready to ship. We just need the balance before we send it out.</p>
          <p style="background:#f5f5f5;padding:16px;border-radius:6px;margin:20px 0;">
            <strong>Balance due:</strong> £${Number(order.balance_amount).toFixed(2)}<br/>
            <strong>Pay by:</strong> ${dueDateFormatted}
          </p>
          <p style="margin:24px 0;">
            <a href="${balanceLink}" style="background:#E8A000;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;">Pay balance now</a>
          </p>
          <p style="font-size:13px;color:#666;">Or copy the link: ${balanceLink}</p>
          <p style="font-size:13px;color:#666;margin-top:24px;">You have 14 days to pay. We'll send a reminder at 7 days and again at 2 days. If the balance isn't paid by ${dueDateFormatted}, the order will be cancelled and the deposit forfeit.</p>
          <p style="font-size:13px;color:#666;">Any questions, just reply to this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true, dueDate: dueDate.toISOString() })
  } catch (error) {
    console.error('mark-build-complete error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
