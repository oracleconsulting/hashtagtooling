import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getSupabase()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    // ─── Action queue ───────────────────────────────────────────────
    const [
      ordersAwaitingBalanceRes,
      ordersBalanceOverdueRes,
      ordersBalanceDueSoonRes,
      unreadMessagesRes,
      pendingCommissionsRes,
      pendingReviewsRes,
      buildsAwaitingCompletionRes,
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id, customer_name, customer_email, balance_amount, balance_due_date, build_completed_at')
        .eq('balance_status', 'awaiting_payment')
        .order('balance_due_date', { ascending: true }),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('balance_status', 'awaiting_payment')
        .lt('balance_due_date', now.toISOString()),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('balance_status', 'awaiting_payment')
        .gte('balance_due_date', now.toISOString())
        .lte('balance_due_date', new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('contact_messages')
        .select('id, name, email, message, created_at')
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('commissions')
        .select('id, name, email, budget, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('product_reviews')
        .select('id, product_id, rating, body, created_at', { count: 'exact' })
        .eq('token_used', true)
        .eq('published', false)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('balance_status', 'awaiting_build'),
    ])

    // Workshop stock: count available pieces per material, flag those with < 2
    const { data: wsData } = await supabase
      .from('workshop_stock')
      .select('id, material_id')
      .eq('status', 'available')

    const materialCounts = new Map<string, number>()
    for (const w of wsData ?? []) {
      materialCounts.set(w.material_id, (materialCounts.get(w.material_id) ?? 0) + 1)
    }
    const lowStockMaterials = Array.from(materialCounts.entries())
      .filter(([, count]) => count < 2)
      .map(([material_id, count]) => ({ material_id, count }))

    // ─── Commerce (last 30 days) ────────────────────────────────────
    const [
      ordersLast30Res,
      revenueLast30Res,
      ordersTodayRes,
      activeBasketsRes,
      basketValueRes,
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('orders')
        .select('total_amount, payment_plan, upfront_amount')
        .gte('created_at', thirtyDaysAgo)
        .in('status', ['paid', 'awaiting_balance', 'shipped', 'completed']),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today),
      supabase
        .from('cart_snapshots')
        .select('session_id, items, total_value, item_count, last_updated_at')
        .gte('last_updated_at', sevenDaysAgo)
        .order('last_updated_at', { ascending: false })
        .limit(20),
      supabase
        .from('cart_snapshots')
        .select('total_value')
        .gte('last_updated_at', sevenDaysAgo),
    ])

    // ─── Audience ────────────────────────────────────────────────────
    const [
      subscribersTotalRes,
      subscribersThisMonthRes,
      wishlistTopRes,
      cartTopRes,
      funnelViewsRes,
      funnelCartsRes,
      funnelCheckoutsRes,
      funnelPurchasesRes,
    ] = await Promise.all([
      supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true })
        .eq('unsubscribed', false),
      supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('tracking_events')
        .select('product_id, product_name')
        .eq('event_type', 'add_to_wishlist')
        .gte('occurred_at', thirtyDaysAgo)
        .not('product_id', 'is', null),
      supabase
        .from('tracking_events')
        .select('product_id, product_name')
        .eq('event_type', 'add_to_cart')
        .gte('occurred_at', thirtyDaysAgo)
        .not('product_id', 'is', null),
      supabase
        .from('tracking_events')
        .select('session_id', { count: 'exact', head: true })
        .eq('event_type', 'view_item')
        .gte('occurred_at', thirtyDaysAgo),
      supabase
        .from('tracking_events')
        .select('session_id', { count: 'exact', head: true })
        .eq('event_type', 'add_to_cart')
        .gte('occurred_at', thirtyDaysAgo),
      supabase
        .from('tracking_events')
        .select('session_id', { count: 'exact', head: true })
        .eq('event_type', 'begin_checkout')
        .gte('occurred_at', thirtyDaysAgo),
      supabase
        .from('tracking_events')
        .select('session_id', { count: 'exact', head: true })
        .eq('event_type', 'purchase')
        .gte('occurred_at', thirtyDaysAgo),
    ])

    // ─── Operations ──────────────────────────────────────────────────
    const [
      productsTotalRes,
      productsInStockRes,
      workshopStockTotalRes,
      launchVouchersRes,
      giftVouchersRes,
      referralsRes,
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock_status', 'in_stock'),
      supabase.from('workshop_stock').select('id, status'),
      supabase.from('launch_vouchers').select('id, used'),
      supabase.from('gift_vouchers').select('id, amount_gbp, remaining_balance'),
      supabase.from('referral_uses').select('id', { count: 'exact', head: true }),
    ])

    // ─── Compute aggregates ─────────────────────────────────────────
    const revenue = (revenueLast30Res.data ?? []).reduce(
      (s: number, o: { payment_plan?: string; upfront_amount?: number; total_amount?: number }) =>
        s + (o.payment_plan === 'deposit' ? Number(o.upfront_amount ?? 0) : Number(o.total_amount ?? 0)),
      0
    )
    const totalBasketValue = (basketValueRes.data ?? []).reduce(
      (s: number, b: { total_value?: number }) => s + Number(b.total_value ?? 0), 0
    )

    const countByProduct = (events: Array<{ product_id: string | null; product_name: string | null }> | null) => {
      const map = new Map<string, { product_id: string; product_name: string; count: number }>()
      for (const e of events ?? []) {
        if (!e.product_id) continue
        const existing = map.get(e.product_id)
        if (existing) existing.count++
        else map.set(e.product_id, { product_id: e.product_id, product_name: e.product_name ?? e.product_id, count: 1 })
      }
      return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5)
    }

    const workshopStock = workshopStockTotalRes.data ?? []
    const wsAvailable = workshopStock.filter((w: { status: string }) => w.status === 'available').length
    const wsReserved = workshopStock.filter((w: { status: string }) => w.status === 'reserved').length

    const launchVouchers = launchVouchersRes.data ?? []
    const launchTotal = launchVouchers.length
    const launchRedeemed = launchVouchers.filter((v: { used: boolean }) => v.used).length

    const giftVouchers = giftVouchersRes.data ?? []
    const giftIssued = giftVouchers.reduce((s: number, v: { amount_gbp?: number }) => s + Number(v.amount_gbp ?? 0), 0)
    const giftRedeemed = giftVouchers.reduce(
      (s: number, v: { amount_gbp?: number; remaining_balance?: number }) =>
        s + (Number(v.amount_gbp ?? 0) - Number(v.remaining_balance ?? 0)),
      0
    )

    return NextResponse.json({
      generatedAt: now.toISOString(),
      actionQueue: {
        ordersAwaitingBalance: ordersAwaitingBalanceRes.data ?? [],
        ordersBalanceOverdue: ordersBalanceOverdueRes.count ?? 0,
        ordersBalanceDueSoon: ordersBalanceDueSoonRes.count ?? 0,
        unreadMessages: unreadMessagesRes.data ?? [],
        pendingCommissions: pendingCommissionsRes.data ?? [],
        pendingReviews: pendingReviewsRes.data ?? [],
        pendingReviewsCount: pendingReviewsRes.count ?? 0,
        lowStockMaterials,
        buildsAwaitingCompletion: buildsAwaitingCompletionRes.count ?? 0,
      },
      commerce: {
        ordersLast30: ordersLast30Res.count ?? 0,
        ordersToday: ordersTodayRes.count ?? 0,
        revenueLast30: revenue,
        activeBaskets: activeBasketsRes.data ?? [],
        totalBasketValue,
      },
      audience: {
        subscribersTotal: subscribersTotalRes.count ?? 0,
        subscribersThisMonth: subscribersThisMonthRes.count ?? 0,
        topWishlisted: countByProduct(wishlistTopRes.data),
        topCarted: countByProduct(cartTopRes.data),
        funnel: {
          views: funnelViewsRes.count ?? 0,
          carts: funnelCartsRes.count ?? 0,
          checkouts: funnelCheckoutsRes.count ?? 0,
          purchases: funnelPurchasesRes.count ?? 0,
        },
      },
      operations: {
        productsTotal: productsTotalRes.count ?? 0,
        productsInStock: productsInStockRes.count ?? 0,
        workshopStockAvailable: wsAvailable,
        workshopStockReserved: wsReserved,
        launchVouchersTotal: launchTotal,
        launchVouchersRedeemed: launchRedeemed,
        giftVouchersIssued: giftIssued,
        giftVouchersRedeemed: giftRedeemed,
        referralUses: referralsRes.count ?? 0,
      },
    })
  } catch (error) {
    console.error('dashboard-summary error', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
