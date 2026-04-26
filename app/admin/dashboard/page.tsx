'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, RefreshCcw, AlertTriangle, Mail, Hammer, Star, Package, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GA4Panel } from '@/components/admin/GA4Panel'

interface DashboardData {
  generatedAt: string
  actionQueue: {
    ordersAwaitingBalance: Array<{
      id: string
      customer_name: string
      customer_email: string
      balance_amount: number
      balance_due_date: string
      build_completed_at: string
    }>
    ordersBalanceOverdue: number
    ordersBalanceDueSoon: number
    unreadMessages: Array<{ id: string; name: string; email: string; message: string; created_at: string }>
    pendingCommissions: Array<{ id: string; name: string; email: string; budget: string; created_at: string }>
    pendingReviews: Array<{ id: string; product_id: string; rating: number; body: string; created_at: string }>
    pendingReviewsCount: number
    lowStockMaterials: Array<{ material_id: string; count: number }>
    buildsAwaitingCompletion: number
  }
  commerce: {
    ordersLast30: number
    ordersToday: number
    revenueLast30: number
    activeBaskets: Array<{
      session_id: string
      items: Array<{ id: string; name: string; quantity?: number; price?: number }>
      total_value: number
      item_count: number
      last_updated_at: string
    }>
    totalBasketValue: number
  }
  audience: {
    subscribersTotal: number
    subscribersThisMonth: number
    topWishlisted: Array<{ product_id: string; product_name: string; count: number }>
    topCarted: Array<{ product_id: string; product_name: string; count: number }>
    funnel: { views: number; carts: number; checkouts: number; purchases: number }
  }
  operations: {
    productsTotal: number
    productsInStock: number
    workshopStockAvailable: number
    workshopStockReserved: number
    launchVouchersTotal: number
    launchVouchersRedeemed: number
    giftVouchersIssued: number
    giftVouchersRedeemed: number
    referralUses: number
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/dashboard-summary', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load')
      const json = (await res.json()) as DashboardData
      setData(json)
      setLastRefresh(new Date())
    } catch (e) {
      console.error('dashboard load failed', e)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!sessionStorage.getItem('admin_auth')) {
      router.push('/admin')
      return
    }
    void load()
    const interval = setInterval(() => void load(), 60000)
    return () => clearInterval(interval)
  }, [router, load])

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  if (!data) return <p className="text-center py-12 text-zinc-400">Failed to load dashboard.</p>

  const { actionQueue, commerce, audience, operations } = data

  const totalActions =
    actionQueue.ordersAwaitingBalance.length +
    actionQueue.unreadMessages.length +
    actionQueue.pendingCommissions.length +
    actionQueue.pendingReviewsCount +
    actionQueue.lowStockMaterials.length +
    actionQueue.buildsAwaitingCompletion

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header + nav */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {lastRefresh ? `Last refreshed ${lastRefresh.toLocaleTimeString('en-GB')}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {[
          { label: 'Products', href: '/admin/products' },
          { label: 'Inventory', href: '/admin/inventory' },
          { label: 'Adoptions', href: '/admin/adoptions' },
          { label: 'Orders', href: '/admin/orders' },
          { label: 'Commissions', href: '/admin/commissions' },
          { label: 'Materials', href: '/admin/materials' },
          { label: 'Workshop Stock', href: '/admin/workshop-stock' },
          { label: 'Site Images', href: '/admin/site-images' },
          { label: 'Blog', href: '/admin/blog' },
          { label: 'Gift Vouchers', href: '/admin/gift-vouchers' },
          { label: 'Social', href: '/admin/social' },
          { label: 'Reviews', href: '/admin/reviews' },
          { label: 'Insights', href: '/admin/insights' },
          { label: 'Messages', href: '/admin/messages' },
        ].map((nav) => (
          <Link key={nav.href} href={nav.href}>
            <Button variant="outline" size="sm">{nav.label}</Button>
          </Link>
        ))}
      </div>

      {/* ─── ACTION QUEUE ──────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand-orange" />
            Action queue
          </h2>
          {totalActions > 0 && (
            <span className="text-sm text-brand-orange font-medium">
              {totalActions} item{totalActions === 1 ? '' : 's'} need{totalActions === 1 ? 's' : ''} attention
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actionQueue.buildsAwaitingCompletion > 0 && (
            <ActionCard
              icon={<Hammer className="h-4 w-4" />}
              title="Builds in progress"
              count={actionQueue.buildsAwaitingCompletion}
              detail="Deposit paid, awaiting build completion"
              href="/admin/orders"
            />
          )}
          {actionQueue.ordersAwaitingBalance.length > 0 && (
            <ActionCard
              icon={<ShoppingCart className="h-4 w-4" />}
              title="Balance payments due"
              count={actionQueue.ordersAwaitingBalance.length}
              detail={
                actionQueue.ordersBalanceOverdue > 0
                  ? `${actionQueue.ordersBalanceOverdue} overdue`
                  : actionQueue.ordersBalanceDueSoon > 0
                  ? `${actionQueue.ordersBalanceDueSoon} due within 3 days`
                  : 'Awaiting customer payment'
              }
              detailUrgent={actionQueue.ordersBalanceOverdue > 0}
              href="/admin/orders"
            />
          )}
          {actionQueue.unreadMessages.length > 0 && (
            <ActionCard
              icon={<Mail className="h-4 w-4" />}
              title="Unread messages"
              count={actionQueue.unreadMessages.length}
              detail={
                actionQueue.unreadMessages[0]?.message
                  ? actionQueue.unreadMessages[0].message.slice(0, 80) + (actionQueue.unreadMessages[0].message.length > 80 ? '…' : '')
                  : ''
              }
              href="/admin/messages"
            />
          )}
          {actionQueue.pendingCommissions.length > 0 && (
            <ActionCard
              icon={<Hammer className="h-4 w-4" />}
              title="New commission enquiries"
              count={actionQueue.pendingCommissions.length}
              detail={actionQueue.pendingCommissions[0]?.budget ? `Latest: budget ${actionQueue.pendingCommissions[0].budget}` : 'Pending response'}
              href="/admin/commissions"
            />
          )}
          {actionQueue.pendingReviewsCount > 0 && (
            <ActionCard
              icon={<Star className="h-4 w-4" />}
              title="Reviews to moderate"
              count={actionQueue.pendingReviewsCount}
              detail="Submitted, awaiting publication"
              href="/admin/reviews"
            />
          )}
          {actionQueue.lowStockMaterials.length > 0 && (
            <ActionCard
              icon={<Package className="h-4 w-4" />}
              title="Low workshop stock"
              count={actionQueue.lowStockMaterials.length}
              detail="Materials with fewer than 2 available pieces"
              href="/admin/workshop-stock"
              detailUrgent
            />
          )}
        </div>

        {totalActions === 0 && (
          <div className="bg-zinc-900/40 rounded-lg border border-brand-dark-border p-6 text-center">
            <p className="text-zinc-400">All clear — nothing needs your attention right now.</p>
          </div>
        )}
      </section>

      {/* ─── COMMERCE ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Commerce</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <StatCard label="Orders today" value={commerce.ordersToday} />
          <StatCard label="Orders (30d)" value={commerce.ordersLast30} />
          <StatCard label="Revenue (30d)" value={`£${commerce.revenueLast30.toFixed(0)}`} />
          <StatCard
            label="Active baskets"
            value={commerce.activeBaskets.length}
            sublabel={`£${commerce.totalBasketValue.toFixed(0)} total`}
          />
        </div>

        {commerce.activeBaskets.length > 0 && (
          <Card className="bg-brand-dark-card border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">Active baskets — last 7 days</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2 pr-3">Session</th>
                    <th className="text-left py-2 pr-3">Items</th>
                    <th className="text-right py-2 pr-3">Value</th>
                    <th className="text-right py-2">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {commerce.activeBaskets.slice(0, 10).map((b) => (
                    <tr key={b.session_id} className="border-t border-brand-dark-border/40">
                      <td className="py-2 pr-3 font-mono text-xs text-zinc-500">{b.session_id.slice(0, 8)}…</td>
                      <td className="py-2 pr-3 text-zinc-300 max-w-md truncate">
                        {b.items.map((i) => {
                          const qty = i.quantity && i.quantity > 1 ? ` ×${i.quantity}` : ''
                          return `${i.name}${qty}`
                        }).join(', ')}
                      </td>
                      <td className="py-2 pr-3 text-right text-brand-orange font-medium">£{Number(b.total_value).toFixed(2)}</td>
                      <td className="py-2 text-right text-zinc-500 text-xs whitespace-nowrap">{new Date(b.last_updated_at).toLocaleString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {commerce.activeBaskets.length > 10 && (
                <p className="text-xs text-zinc-500 mt-3">Showing 10 of {commerce.activeBaskets.length}</p>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* ─── AUDIENCE ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Audience</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <StatCard label="Subscribers" value={audience.subscribersTotal} />
          <StatCard label="New (30d)" value={audience.subscribersThisMonth} />
          <StatCard label="Wishlist adds (30d)" value={audience.topWishlisted.reduce((s, p) => s + p.count, 0)} />
          <StatCard label="Cart adds (30d)" value={audience.topCarted.reduce((s, p) => s + p.count, 0)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="bg-brand-dark-card border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">Conversion funnel (30d)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <FunnelRow label="Product views" value={audience.funnel.views} max={audience.funnel.views} />
              <FunnelRow label="Cart adds" value={audience.funnel.carts} max={audience.funnel.views} />
              <FunnelRow label="Checkouts started" value={audience.funnel.checkouts} max={audience.funnel.views} />
              <FunnelRow label="Purchases" value={audience.funnel.purchases} max={audience.funnel.views} />
            </CardContent>
          </Card>

          <Card className="bg-brand-dark-card border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">Most wishlisted (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              {audience.topWishlisted.length === 0 ? (
                <p className="text-xs text-zinc-500">No data yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {audience.topWishlisted.map((p) => (
                    <li key={p.product_id} className="flex justify-between text-sm">
                      <span className="text-zinc-300 truncate pr-2">{p.product_name}</span>
                      <span className="text-brand-orange font-medium">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-brand-dark-card border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-300">Most carted (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              {audience.topCarted.length === 0 ? (
                <p className="text-xs text-zinc-500">No data yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {audience.topCarted.map((p) => (
                    <li key={p.product_id} className="flex justify-between text-sm">
                      <span className="text-zinc-300 truncate pr-2">{p.product_name}</span>
                      <span className="text-brand-orange font-medium">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── OPERATIONS ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Operations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Products"
            value={operations.productsTotal}
            sublabel={`${operations.productsInStock} in stock`}
            href="/admin/products"
          />
          <StatCard
            label="Workshop stock"
            value={operations.workshopStockAvailable}
            sublabel={`${operations.workshopStockReserved} reserved`}
            href="/admin/workshop-stock"
          />
          <StatCard
            label="Launch vouchers"
            value={`${operations.launchVouchersRedeemed} / ${operations.launchVouchersTotal}`}
            sublabel="redeemed"
          />
          <StatCard
            label="Gift vouchers"
            value={`£${operations.giftVouchersRedeemed.toFixed(0)}`}
            sublabel={`of £${operations.giftVouchersIssued.toFixed(0)} issued`}
            href="/admin/gift-vouchers"
          />
        </div>
      </section>

      {/* ─── GA4 (Part 5b) ──────────────────────────────────────────── */}
      <GA4Panel />
    </div>
  )
}

// ─── small components ────────────────────────────────────────────────

function ActionCard({
  icon, title, count, detail, href, detailUrgent = false,
}: {
  icon: React.ReactNode
  title: string
  count: number | string
  detail: string
  href: string
  detailUrgent?: boolean
}) {
  return (
    <Link href={href}>
      <div className="bg-brand-dark-card border border-brand-dark-border hover:border-brand-orange/50 rounded-lg p-4 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 text-zinc-400">
            {icon}
            <span className="text-xs uppercase tracking-wider">{title}</span>
          </div>
          <span className="text-2xl font-bold text-brand-orange leading-none">{count}</span>
        </div>
        <p className={`text-xs ${detailUrgent ? 'text-amber-400' : 'text-zinc-500'} truncate`}>{detail}</p>
      </div>
    </Link>
  )
}

function StatCard({
  label, value, sublabel, href,
}: {
  label: string
  value: string | number
  sublabel?: string
  href?: string
}) {
  const inner = (
    <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4 hover:border-zinc-600 transition-colors">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sublabel && <p className="text-xs text-zinc-500 mt-0.5">{sublabel}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-brand-orange transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
