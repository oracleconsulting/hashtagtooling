import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { orderId, additionalDays } = await req.json()
    if (!orderId || !additionalDays) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('balance_due_date, balance_status')
      .eq('id', orderId)
      .single()
    if (fetchErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.balance_status !== 'awaiting_payment') return NextResponse.json({ error: 'Order is not awaiting payment' }, { status: 400 })

    const newDueDate = new Date(order.balance_due_date)
    newDueDate.setDate(newDueDate.getDate() + Number(additionalDays))

    const { error: updateErr } = await supabase.from('orders').update({
      balance_due_date: newDueDate.toISOString(),
      reminder_7d_sent_at: null,
      reminder_2d_sent_at: null,
    }).eq('id', orderId)

    if (updateErr) throw updateErr

    return NextResponse.json({ ok: true, newDueDate: newDueDate.toISOString() })
  } catch (error) {
    console.error('extend due date error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
