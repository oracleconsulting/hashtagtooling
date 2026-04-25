'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface TopProduct {
  product_id: string
  product_name: string
  count: number
}

interface ActiveBasket {
  session_id: string
  email: string | null
  items: Array<{ id: string; name: string; price?: number; quantity?: number }>
  total_value: number
  item_count: number
  last_updated_at: string
}

function countByProduct(events: Array<{ product_id: string; product_name: string }>) {
  const map = new Map<string, { product_id: string; product_name: string; count: number }>()
  for (const e of events) {
    const existing = map.get(e.product_id)
    if (existing) existing.count++
    else map.set(e.product_id, { product_id: e.product_id, product_name: e.product_name, count: 1 })
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export default function InsightsPage() {
  const router = useRouter()
  const [topWishlisted, setTopWishlisted] = useState<TopProduct[]>([])
  const [topCartAdds, setTopCartAdds] = useState<TopProduct[]>([])
  const [activeBaskets, setActiveBaskets] = useState<ActiveBasket[]>([])
  const [funnel, setFunnel] = useState({ views: 0, carts: 0, checkouts: 0, purchases: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    void loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: wishEvents } = await supabase
      .from('tracking_events')
      .select('product_id, product_name')
      .eq('event_type', 'add_to_wishlist')
      .gte('occurred_at', thirtyDaysAgo)
      .not('product_id', 'is', null)

    setTopWishlisted(countByProduct((wishEvents ?? []) as Array<{ product_id: string; product_name: string }>).slice(0, 10))

    const { data: cartEvents } = await supabase
      .from('tracking_events')
      .select('product_id, product_name')
      .eq('event_type', 'add_to_cart')
      .gte('occurred_at', thirtyDaysAgo)
      .not('product_id', 'is', null)

    setTopCartAdds(countByProduct((cartEvents ?? []) as Array<{ product_id: string; product_name: string }>).slice(0, 10))

    const { data: snaps } = await supabase
      .from('cart_snapshots')
      .select('session_id, items, total_value, item_count, last_updated_at')
      .gte('last_updated_at', sevenDaysAgo)
      .order('last_updated_at', { ascending: false })
      .limit(50)

    if (snaps && snaps.length > 0) {
      const sessionIds = snaps.map((s) => s.session_id)
      const { data: sessions } = await supabase
        .from('tracking_sessions')
        .select('session_id, email')
        .in('session_id', sessionIds)
      const emailBySession = new Map((sessions ?? []).map((s: { session_id: string; email: string | null }) => [s.session_id, s.email]))
      setActiveBaskets(
        snaps.map((s) => ({
          ...s,
          items: (s.items ?? []) as ActiveBasket['items'],
          email: emailBySession.get(s.session_id) ?? null,
        }))
      )
    }

    const stageMap = { views: 'view_item', carts: 'add_to_cart', checkouts: 'begin_checkout', purchases: 'purchase' } as const
    const counts: Record<string, number> = {}
    for (const [key, eventType] of Object.entries(stageMap)) {
      const { count } = await supabase
        .from('tracking_events')
        .select('session_id', { count: 'exact', head: true })
        .eq('event_type', eventType)
        .gte('occurred_at', thirtyDaysAgo)
      counts[key] = count ?? 0
    }
    setFunnel(counts as typeof funnel)

    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-3xl font-bold text-brand-orange">Insights</h1>
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">← Dashboard</Button>
        </Link>
      </div>

      {loading && <p className="text-zinc-400">Loading…</p>}

      {!loading && (
        <>
          <section className="mb-10">
            <h2 className="text-xl font-medium text-white mb-4">Last 30 days</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Product views', value: funnel.views },
                { label: 'Cart adds', value: funnel.carts },
                { label: 'Checkouts started', value: funnel.checkouts },
                { label: 'Purchases', value: funnel.purchases },
              ].map((item) => (
                <div key={item.label} className="bg-brand-dark-card rounded-lg p-4 border border-brand-dark-border">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-2xl font-bold text-brand-orange mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-medium text-white mb-4">Most-wishlisted (last 30 days)</h2>
            {topWishlisted.length === 0 ? (
              <p className="text-zinc-500 text-sm">No wishlist data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-zinc-500 text-xs uppercase tracking-wider">
                  <tr><th className="text-left py-2">Product</th><th className="text-right py-2">Adds</th></tr>
                </thead>
                <tbody>
                  {topWishlisted.map((p) => (
                    <tr key={p.product_id} className="border-t border-brand-dark-border">
                      <td className="py-2 text-zinc-200">{p.product_name ?? p.product_id}</td>
                      <td className="py-2 text-right text-brand-orange font-medium">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-medium text-white mb-4">Most-carted (last 30 days)</h2>
            {topCartAdds.length === 0 ? (
              <p className="text-zinc-500 text-sm">No cart data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-zinc-500 text-xs uppercase tracking-wider">
                  <tr><th className="text-left py-2">Product</th><th className="text-right py-2">Adds</th></tr>
                </thead>
                <tbody>
                  {topCartAdds.map((p) => (
                    <tr key={p.product_id} className="border-t border-brand-dark-border">
                      <td className="py-2 text-zinc-200">{p.product_name ?? p.product_id}</td>
                      <td className="py-2 text-right text-brand-orange font-medium">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">Active baskets (last 7 days)</h2>
            {activeBaskets.length === 0 ? (
              <p className="text-zinc-500 text-sm">No active baskets.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left py-2">Session</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Items</th>
                      <th className="text-right py-2">Value</th>
                      <th className="text-right py-2">Last activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBaskets.map((b) => (
                      <tr key={b.session_id} className="border-t border-brand-dark-border">
                        <td className="py-2 text-zinc-500 font-mono text-xs">{b.session_id.slice(0, 8)}…</td>
                        <td className="py-2 text-zinc-300">{b.email ?? <span className="text-zinc-600">anonymous</span>}</td>
                        <td className="py-2 text-zinc-200">
                          {b.items.map((i) => {
                            const qty = i.quantity && i.quantity > 1 ? ` ×${i.quantity}` : ''
                            return `${i.name}${qty}`
                          }).join(', ')}
                        </td>
                        <td className="py-2 text-right text-brand-orange font-medium">£{b.total_value?.toFixed(2) ?? '0.00'}</td>
                        <td className="py-2 text-right text-zinc-500 text-xs">
                          {new Date(b.last_updated_at).toLocaleString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
