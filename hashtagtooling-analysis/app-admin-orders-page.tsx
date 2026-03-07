'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
  order_details?: {
    items?: { name: string; price: number; quantity: number }[]
    shipping_address?: string
    payer?: unknown
  }
}

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'completed'] as const

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
                    {expandedId === order.id && order.order_details && (
                      <tr key={`${order.id}-details`}>
                        <td
                          colSpan={7}
                          className="bg-brand-dark/80 p-4 border-b border-brand-dark-border"
                        >
                          <p className="text-white font-semibold mb-2">
                            Order details
                          </p>
                          <pre className="text-zinc-400 text-sm overflow-x-auto rounded-lg p-4 bg-brand-dark-card border border-brand-dark-border whitespace-pre-wrap break-words">
                            {JSON.stringify(order.order_details, null, 2)}
                          </pre>
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
