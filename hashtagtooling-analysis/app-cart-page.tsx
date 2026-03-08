'use client'

import { useCart } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { Trash2, Plus, Minus, CheckCircle, CreditCard, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'

function CartContent() {
  const searchParams = useSearchParams()
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'stripe'>('paypal')
  const [stripeLoading, setStripeLoading] = useState(false)
  const [shippingRegion, setShippingRegion] = useState<'uk' | 'europe' | 'world'>('uk')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    shippingAddress: '',
  })

  useEffect(() => {
    const success = searchParams.get('success')
    const sessionId = searchParams.get('session_id')
    if (success === 'true' && sessionId) {
      setStripeSuccess(true)
      setOrderComplete(true)
      clearCart()
    }
  }, [searchParams, clearCart])

  const getShippingTotal = () => {
    const defaults = { uk: 5.99, europe: 15.99, world: 25.99 }
    let maxShipping = 0
    items.forEach((item) => {
      const rate = item.shipping?.[shippingRegion] ?? defaults[shippingRegion]
      if (rate > maxShipping) maxShipping = rate
    })
    return maxShipping
  }

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-20 w-20 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-white">Order Complete!</h1>
          {stripeSuccess ? (
            <p className="text-zinc-400 mb-8">Thank you for your purchase. A confirmation email has been sent to the email you used at checkout.</p>
          ) : (
            <>
              <p className="text-zinc-400 mb-2">Thank you for your purchase, {customerInfo.name}!</p>
              <p className="text-sm text-zinc-500 mb-8">
                Order #{orderNumber.slice(0, 8).toUpperCase()}
                <br />
                A confirmation email has been sent to {customerInfo.email}
              </p>
            </>
          )}
          <div className="flex gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg">Continue Shopping</Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-heading text-4xl font-bold mb-4 text-brand-orange">Your Cart</h1>
          <p className="text-zinc-400 mb-8">Your cart is empty</p>
          <Link href="/shop">
            <Button size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = getTotalPrice()
  const shippingTotal = getShippingTotal()
  const totalWithShipping = totalPrice + (items.length > 0 ? shippingTotal : 0)

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl font-bold mb-8 text-brand-orange">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="bg-brand-dark-card border border-brand-dark-border">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 bg-brand-dark-card rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-white">{item.name}</h3>
                    <p className="text-sm text-zinc-400 mb-2">{formatPrice(item.price)}</p>
                    
                    {item.customConfig && (
                      <p className="text-xs text-zinc-500">Custom configuration</p>
                    )}

                    <div className="flex items-center gap-1 mt-3">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="min-w-[44px] min-h-[44px] p-3 flex items-center justify-center rounded-md border border-brand-dark-border text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[40px] text-center text-white font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="min-w-[44px] min-h-[44px] p-3 flex items-center justify-center rounded-md border border-brand-dark-border text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="min-w-[44px] min-h-[44px] p-3 flex items-center justify-center text-red-500 hover:text-red-400 rounded-md border border-brand-dark-border hover:border-red-500/50 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="bg-brand-dark-card border border-brand-dark-border sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-white">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Shipping Region
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3 text-base"
                    value={shippingRegion}
                    onChange={(e) => setShippingRegion(e.target.value as 'uk' | 'europe' | 'world')}
                  >
                    <option value="uk">United Kingdom</option>
                    <option value="europe">Europe</option>
                    <option value="world">Rest of World</option>
                  </select>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Shipping ({shippingRegion === 'uk' ? 'UK' : shippingRegion === 'europe' ? 'Europe' : 'Rest of World'}):</span>
                  <span className="text-white">
                    {items.length > 0 ? `£${shippingTotal.toFixed(2)}` : '£0.00'}
                  </span>
                </div>
                <div className="border-t border-brand-dark-border pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-brand-orange">{formatPrice(totalWithShipping)}</span>
                  </div>
                </div>
              </div>

              {!showCheckout ? (
                <Button 
                  onClick={() => setShowCheckout(true)} 
                  size="lg" 
                  className="w-full"
                >
                  Proceed to Checkout
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Name</label>
                    <Input
                      className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500 text-base"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Email</label>
                    <Input
                      type="email"
                      className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500 text-base"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Shipping Address</label>
                    <Input
                      className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500 text-base"
                      value={customerInfo.shippingAddress}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, shippingAddress: e.target.value })}
                      placeholder="Full address"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-300">Payment method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          paymentMethod === 'paypal'
                            ? 'border-brand-orange bg-brand-orange/10'
                            : 'border-brand-dark-border hover:border-zinc-500'
                        }`}
                      >
                        <span className="font-medium text-white">Pay with PayPal</span>
                        <p className="text-xs text-zinc-400 mt-1">PayPal account or card</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          paymentMethod === 'stripe'
                            ? 'border-brand-orange bg-brand-orange/10'
                            : 'border-brand-dark-border hover:border-zinc-500'
                        }`}
                      >
                        <CreditCard className="h-5 w-5 text-brand-orange mb-1" />
                        <span className="font-medium text-white">Pay with Card (Stripe)</span>
                        <p className="text-xs text-zinc-400 mt-1">Credit or debit card</p>
                      </button>
                    </div>
                  </div>

                  {customerInfo.name && customerInfo.email && customerInfo.shippingAddress && paymentMethod === 'stripe' && (
                    <Button
                      type="button"
                      size="lg"
                      className="w-full"
                      disabled={stripeLoading}
                      onClick={async () => {
                        setStripeLoading(true)
                        try {
                          const res = await fetch('/api/create-checkout-session', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, image_url: i.image_url })),
                              customerEmail: customerInfo.email,
                              shippingAddress: customerInfo.shippingAddress,
                              shippingCost: getShippingTotal(),
                            }),
                          })
                          const data = await res.json()
                          if (data.url) window.location.href = data.url
                          else alert(data.error || 'Failed to start checkout')
                        } catch (e) {
                          console.error(e)
                          alert('Failed to start checkout')
                        } finally {
                          setStripeLoading(false)
                        }
                      }}
                    >
                      {stripeLoading ? 'Redirecting...' : 'Pay with Card'}
                    </Button>
                  )}

                  {customerInfo.name && customerInfo.email && customerInfo.shippingAddress && paymentMethod === 'paypal' && (
                    <PayPalScriptProvider 
                      options={{ 
                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
                        currency: 'GBP'
                      }}
                    >
                      <PayPalButtons
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            intent: 'CAPTURE',
                            purchase_units: [{
                              amount: {
                                currency_code: 'GBP',
                                value: (totalPrice + getShippingTotal()).toFixed(2),
                              },
                              description: `Order from ${customerInfo.name}`,
                            }],
                          })
                        }}
                        onApprove={async (data, actions) => {
                          if (actions.order) {
                            return actions.order.capture().then(async (details) => {
                              // Save order to Supabase
                              const { data: order, error } = await supabase
                                .from('orders')
                                .insert({
                                  customer_name: customerInfo.name,
                                  customer_email: customerInfo.email,
                                  total_amount: totalPrice + getShippingTotal(),
                                  paypal_order_id: details.id,
                                  status: 'paid',
                                  order_details: {
                                    items: items.map(item => ({
                                      id: item.id,
                                      name: item.name,
                                      price: item.price,
                                      quantity: item.quantity,
                                      customConfig: item.customConfig,
                                    })),
                                    shipping_address: customerInfo.shippingAddress,
                                    payer: details.payer,
                                  },
                                })
                                .select()
                                .single()

                              if (error) {
                                console.error('Error saving order:', error)
                                alert('Payment successful but error saving order. Please contact support with order ID: ' + details.id)
                              } else {
                                setOrderNumber(order.id)
                                setOrderComplete(true)
                                clearCart()
                                const totalWithShipping = totalPrice + getShippingTotal()
                                fetch('/api/send-order-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    customerName: customerInfo.name,
                                    customerEmail: customerInfo.email,
                                    orderNumber: order.id,
                                    items: items.map((item) => ({
                                      name: item.name,
                                      price: item.price,
                                      quantity: item.quantity,
                                    })),
                                    totalAmount: totalWithShipping,
                                    shippingAddress: customerInfo.shippingAddress,
                                  }),
                                }).catch((err) => console.error('Email send failed:', err))
                                fetch('/api/send-admin-notification', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    type: 'new_order',
                                    data: {
                                      customerName: customerInfo.name,
                                      customerEmail: customerInfo.email,
                                      total: totalWithShipping,
                                      shippingAddress: customerInfo.shippingAddress,
                                      items: items.map((item) => ({ name: item.name, quantity: item.quantity })),
                                    },
                                  }),
                                }).catch(() => {})
                              }
                            })
                          }
                          return Promise.resolve()
                        }}
                        onError={(err) => {
                          console.error('PayPal Error:', err)
                          alert('Payment failed. Please try again.')
                        }}
                      />
                    </PayPalScriptProvider>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <CartContent />
    </Suspense>
  )
}


