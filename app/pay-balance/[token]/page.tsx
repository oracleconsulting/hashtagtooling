'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface OrderForBalance {
  id: string
  customer_name: string
  customer_email: string
  balance_amount: number
  balance_due_date: string
  balance_status: string
}

export default function PayBalancePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderForBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [ppReady, setPpReady] = useState(false)

  useEffect(() => {
    void loadOrder()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const loadOrder = async () => {
    if (!token) return
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, balance_amount, balance_due_date, balance_status')
      .eq('balance_payment_token', token)
      .single()
    if (fetchError || !data) {
      setError('This payment link is invalid or has expired.')
      setLoading(false)
      return
    }
    if (data.balance_status === 'paid') {
      setError('This balance has already been paid. Thank you!')
      setLoading(false)
      return
    }
    if (data.balance_status === 'cancelled') {
      setError('This order has been cancelled. Please contact us if you have any questions.')
      setLoading(false)
      return
    }
    setOrder(data)
    setLoading(false)
  }

  const payWithStripe = async () => {
    setPaying(true)
    try {
      const res = await fetch('/api/balance-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, provider: 'stripe' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error ?? 'Failed to create checkout')
    } catch {
      setError('Failed to start payment')
    } finally {
      setPaying(false)
    }
  }

  useEffect(() => {
    if (!order || error || !ppReady) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (!w.paypal) return

    const container = document.getElementById('paypal-button-container')
    if (!container) return
    container.innerHTML = ''

    w.paypal.Buttons({
      createOrder: async () => {
        const res = await fetch('/api/balance-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, provider: 'paypal' }),
        })
        const data = await res.json()
        return data.paypalOrderId
      },
      onApprove: async (data: { orderID: string }) => {
        const res = await fetch('/api/balance-paypal-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paypalOrderId: data.orderID, token }),
        })
        const result = await res.json()
        if (result.ok) router.push(`/pay-balance/${token}/success`)
        else setError(result.error ?? 'Payment failed')
      },
      onError: (err: unknown) => {
        console.error('paypal error', err)
        setError('PayPal error — please try again or use card.')
      },
    }).render('#paypal-button-container')
  }, [order, error, token, router, ppReady])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-dark"><Loader2 className="h-6 w-6 animate-spin text-brand-orange" /></div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
        <Card className="max-w-md w-full bg-brand-dark-card border-brand-dark-border">
          <CardContent className="py-8 text-center">
            <p className="text-zinc-300">{error}</p>
            <Button className="mt-4" onClick={() => router.push('/')}>Back to homepage</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) return null

  const dueDate = new Date(order.balance_due_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const daysLeft = Math.max(0, Math.ceil((new Date(order.balance_due_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=GBP`}
        onReady={() => setPpReady(true)}
      />
      <div className="min-h-screen bg-brand-dark py-12 px-4">
        <div className="max-w-md mx-auto">
          <Card className="bg-brand-dark-card border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Pay your balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-zinc-400">Hi {order.customer_name},</p>
                <p className="text-sm text-zinc-300 mt-1">Your custom build is complete and ready to ship.</p>
              </div>

              <div className="bg-zinc-900/40 rounded-lg p-4 border border-brand-dark-border">
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Balance due</span>
                  <span className="text-2xl font-bold text-brand-orange">£{Number(order.balance_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Pay by</span>
                  <span className={daysLeft <= 2 ? 'text-amber-400 font-medium' : 'text-zinc-300'}>
                    {dueDate} ({daysLeft} day{daysLeft === 1 ? '' : 's'} left)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={() => void payWithStripe()} disabled={paying} className="w-full">
                  {paying ? 'Redirecting…' : 'Pay with card'}
                </Button>

                <div className="text-center text-xs text-zinc-500">or</div>

                <div id="paypal-button-container" />
              </div>

              <p className="text-xs text-zinc-500 text-center">
                Questions? Reply to the email we sent you, or contact hashtagwoodworking@gmail.com.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
