'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface Order {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
}

interface Commission {
  id: string
  created_at: string
  name: string
  email: string
  budget: string
  status: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingCommissions: 0,
    productsInStock: 0,
    newsletterSubscribers: 0,
    referralCodesGenerated: 0,
    referralUses: 0,
    referralRewardsGiven: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([])

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadDashboard()
  }, [router])

  const loadDashboard = async () => {
    try {
      const [productsRes, ordersCountRes, ordersRes, commissionsRes, inStockRes, ordersListRes, commissionsListRes, newsletterRes, referralCodesRes, referralUsesRes, referralRewardsRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount, status'),
        supabase.from('commissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock_status', 'in_stock'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('commissions').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('unsubscribed', false),
        supabase.from('referral_codes').select('id', { count: 'exact', head: true }),
        supabase.from('referral_uses').select('id', { count: 'exact', head: true }),
        supabase.from('referral_uses').select('id').eq('reward_generated', true),
      ])

      const totalProducts = productsRes.count ?? 0
      const totalOrders = ordersCountRes.count ?? 0
      const orders = ordersRes.data ?? []
      const totalRevenue = orders
        .filter((o) => ['paid', 'shipped', 'completed'].includes(o.status))
        .reduce((sum, o) => sum + (o.total_amount ?? 0), 0)
      const pendingCommissions = commissionsRes.count ?? 0
      const productsInStock = inStockRes.count ?? 0

      const referralRewardsCount = referralRewardsRes.data?.length ?? 0
      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingCommissions,
        productsInStock,
        newsletterSubscribers: newsletterRes.count ?? 0,
        referralCodesGenerated: referralCodesRes.count ?? 0,
        referralUses: referralUsesRes.count ?? 0,
        referralRewardsGiven: referralRewardsCount,
      })
      setRecentOrders((ordersListRes.data ?? []) as Order[])
      setRecentCommissions((commissionsListRes.data ?? []) as Commission[])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-4xl font-bold text-brand-orange">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">Products</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">Orders</Button>
          </Link>
          <Link href="/admin/commissions">
            <Button variant="outline" size="sm">Commissions</Button>
          </Link>
          <Link href="/admin/materials">
            <Button variant="outline" size="sm">Materials</Button>
          </Link>
          <Link href="/admin/site-images">
            <Button variant="outline" size="sm">Site Images</Button>
          </Link>
          <Link href="/admin/blog">
            <Button variant="outline" size="sm">Blog</Button>
          </Link>
          <Link href="/admin/gift-vouchers">
            <Button variant="outline" size="sm">Gift Vouchers</Button>
          </Link>
          <Link href="/admin/social">
            <Button variant="outline" size="sm">Social</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-brand-orange">{stats.totalProducts}</p>
            <p className="text-zinc-400 text-sm mt-1">Total Products</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-brand-orange">{stats.totalOrders}</p>
            <p className="text-zinc-400 text-sm mt-1">Total Orders</p>
            <p className="text-zinc-400 text-sm">{formatPrice(stats.totalRevenue)} revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-brand-orange">{stats.pendingCommissions}</p>
            <p className="text-zinc-400 text-sm mt-1">Pending Commissions</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-brand-orange">{stats.productsInStock}</p>
            <p className="text-zinc-400 text-sm mt-1">Products In Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-brand-orange">{stats.newsletterSubscribers}</p>
            <p className="text-zinc-400 text-sm mt-1">Newsletter Subscribers</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-brand-orange">{stats.referralCodesGenerated}</p>
            <p className="text-zinc-400 text-sm mt-1">Referral Codes</p>
            <p className="text-zinc-500 text-xs">{stats.referralUses} uses, £{stats.referralRewardsGiven * 10} rewards given</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardHeader>
            <CardTitle className="text-white">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-zinc-400 text-sm">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-dark-border text-left text-zinc-400">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Customer</th>
                      <th className="pb-2 pr-4">Total</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-brand-dark-border">
                        <td className="py-2 pr-4 text-zinc-300">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4 text-white">{order.customer_name}</td>
                        <td className="py-2 pr-4 text-brand-orange">{formatPrice(order.total_amount)}</td>
                        <td className="py-2 text-zinc-400">{order.status}</td>
                        <td className="py-2">
                          <Link href="/admin/orders" className="text-brand-orange hover:underline text-xs">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link href="/admin/orders" className="inline-block mt-4">
              <Button variant="outline" size="sm">View all orders</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardHeader>
            <CardTitle className="text-white">Recent Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCommissions.length === 0 ? (
              <p className="text-zinc-400 text-sm">No commissions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-dark-border text-left text-zinc-400">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Budget</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCommissions.map((c) => (
                      <tr key={c.id} className="border-b border-brand-dark-border">
                        <td className="py-2 pr-4 text-zinc-300">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4 text-white">{c.name}</td>
                        <td className="py-2 pr-4 text-brand-orange">{c.budget || '—'}</td>
                        <td className="py-2 text-zinc-400">{c.status}</td>
                        <td className="py-2">
                          <Link href="/admin/commissions" className="text-brand-orange hover:underline text-xs">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link href="/admin/commissions" className="inline-block mt-4">
              <Button variant="outline" size="sm">View all commissions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
