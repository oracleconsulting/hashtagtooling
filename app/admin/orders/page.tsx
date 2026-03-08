'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Order {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  tracking_number?: string | null
  tracking_url?: string | null
  shipped_at?: string | null
  order_details?: {
    items?: { id?: string; name: string; price: number; quantity: number }[]
    shipping_address?: string
    payer?: unknown
  }
}

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'completed', 'refunded'] as const

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-zinc-700 text-zinc-300',
  paid: 'bg-blue-900/50 text-blue-400',
  shipped: 'bg-brand-orange/20 text-brand-orange',
  completed: 'bg-green-900/50 text-green-400',
  refunded: 'bg-red-900/50 text-red-400',
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [shippingId, setShippingId] = useState<string | null>(null)
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { trackingNumber: string; trackingUrl: string }>>({})

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadOrders()
  }, [router])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      if (error) throw error
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      )
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const markAsShipped = async (order: Order) => {
    const { trackingNumber, trackingUrl } = trackingInputs[order.id] ?? { trackingNumber: '', trackingUrl: '' }
    setShippingId(order.id)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: trackingNumber || null,
          tracking_url: trackingUrl || null,
          shipped_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (error) throw error

      await fetch('/api/send-shipping-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          orderNumber: order.id,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          items: order.order_details?.items ?? [],
        }),
      }).catch((err) => console.error('Shipping email failed:', err))

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: 'shipped',
                tracking_number: trackingNumber || null,
                tracking_url: trackingUrl || null,
                shipped_at: new Date().toISOString(),
              }
            : o
        )
      )
      setTrackingInputs((prev) => {
        const next = { ...prev }
        delete next[order.id]
        return next
      })
      alert('✓ Shipped — customer notified')
    } catch (error) {
      console.error('Error marking as shipped:', error)
      alert('Failed to mark as shipped')
    } finally {
      setShippingId(null)
    }
  }

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    router.push('/admin')
  }

  const itemsCount = (order: Order) =>
    order.order_details?.items?.length ?? 0

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-4xl font-bold text-brand-orange">
          Orders
        </h1>
        <div className="flex gap-4">
          <Link href="/admin/dashboard">
            <Button size="lg" variant="outline">
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button size="lg" variant="outline">
              Products
            </Button>
          </Link>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-dark-border">
                <th className="text-left py-3 px-4 text-white font-semibold w-8" />
                <th className="text-left py-3 px-4 text-white font-semibold">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-white font-semibold">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-white font-semibold">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-white font-semibold">
                  Total
                </th>
                <th className="text-left py-3 px-4 text-white font-semibold">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-white font-semibold">
                  Items
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-zinc-400"
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <Fragment key={order.id}>
                    <tr
                      key={order.id}
                      className="border-b border-brand-dark-border hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() =>
                        setExpandedId((id) =>
                          id === order.id ? null : order.id
                        )
                      }
                    >
                      <td className="py-3 px-4 text-zinc-400">
                        {expandedId === order.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-sm">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {order.customer_name}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-sm">
                        {order.customer_email}
                      </td>
                      <td className="py-3 px-4 text-brand-orange font-semibold">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${STATUS_BADGE[order.status] ?? 'bg-zinc-700 text-zinc-300'}`}>
                          {order.status}
                        </span>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateStatus(order.id, e.target.value)
                          }
                          disabled={updatingId === order.id}
                          className="bg-brand-dark border border-brand-dark-border text-white rounded px-2 py-1 text-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {itemsCount(order)}
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr key={`${order.id}-details`}>
                        <td
                          colSpan={7}
                          className="bg-brand-dark/80 p-6 border-b border-brand-dark-border"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                            <div>
                              <p className="text-white font-semibold mb-2">Items</p>
                              <ul className="space-y-1 text-sm text-zinc-300">
                                {(order.order_details?.items ?? []).map((item, i) => (
                                  <li key={i}>
                                    {item.name} × {item.quantity} — {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
                                  </li>
                                ))}
                                {(!order.order_details?.items || order.order_details.items.length === 0) && (
                                  <li className="text-zinc-500">No items</li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <p className="text-white font-semibold mb-2">Shipping address</p>
                              <p className="text-zinc-400 text-sm whitespace-pre-wrap">
                                {order.order_details?.shipping_address || '—'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 pt-6 border-t border-brand-dark-border">
                            <p className="text-white font-semibold mb-3">Tracking</p>
                            {order.status === 'shipped' && (order.tracking_number || order.shipped_at) ? (
                              <div className="space-y-1 text-sm">
                                {order.tracking_number && (
                                  <p className="text-zinc-300">Tracking: <span className="font-mono">{order.tracking_number}</span></p>
                                )}
                                {order.tracking_url && (
                                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
                                    Track package →
                                  </a>
                                )}
                                {order.shipped_at && (
                                  <p className="text-zinc-500">Shipped {formatDate(order.shipped_at)}</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3 max-w-md">
                                <Input
                                  placeholder="Tracking number"
                                  value={trackingInputs[order.id]?.trackingNumber ?? ''}
                                  onChange={(e) =>
                                    setTrackingInputs((prev) => ({
                                      ...prev,
                                      [order.id]: {
                                        ...(prev[order.id] ?? { trackingNumber: '', trackingUrl: '' }),
                                        trackingNumber: e.target.value,
                                      },
                                    }))
                                  }
                                  className="bg-brand-dark border border-brand-dark-border text-white"
                                />
                                <Input
                                  placeholder="Tracking URL (optional)"
                                  value={trackingInputs[order.id]?.trackingUrl ?? ''}
                                  onChange={(e) =>
                                    setTrackingInputs((prev) => ({
                                      ...prev,
                                      [order.id]: {
                                        ...(prev[order.id] ?? { trackingNumber: '', trackingUrl: '' }),
                                        trackingUrl: e.target.value,
                                      },
                                    }))
                                  }
                                  className="bg-brand-dark border border-brand-dark-border text-white"
                                />
                                <Button
                                  onClick={() => markAsShipped(order)}
                                  disabled={shippingId === order.id}
                                >
                                  {shippingId === order.id ? 'Saving...' : 'Mark as Shipped & Notify Customer'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
