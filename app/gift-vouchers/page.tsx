'use client'

import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, Gift, CheckCircle, Loader2 } from 'lucide-react'

const DENOMINATIONS = [25, 50, 100, 150]

type Step = 'configure' | 'payment' | 'success'

export default function GiftVouchersPage() {
  const [step, setStep] = useState<Step>('configure')
  const [amount, setAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'stripe'>('stripe')
  const [stripeLoading, setStripeLoading] = useState(false)
  const [successCode, setSuccessCode] = useState('')

  const [form, setForm] = useState({
    purchasedByName: '',
    purchasedByEmail: '',
    recipientName: '',
    recipientEmail: '',
    message: '',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const finalAmount = isCustom ? Number(customAmount) : amount

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.purchasedByName.trim()) e.purchasedByName = 'Required'
    if (!form.purchasedByEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.purchasedByEmail))
      e.purchasedByEmail = 'Valid email required'
    if (!form.recipientName.trim()) e.recipientName = 'Required'
    if (!form.recipientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail))
      e.recipientEmail = 'Valid email required'
    if (isNaN(finalAmount) || finalAmount < 10 || finalAmount > 500)
      e.purchasedByName = `Amount must be between £10 and £500`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleContinueToPayment = () => {
    if (validate()) setStep('payment')
  }

  const handleStripe = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch('/api/gift-vouchers/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_gbp: finalAmount,
          purchased_by_name: form.purchasedByName,
          purchased_by_email: form.purchasedByEmail,
          recipient_name: form.recipientName,
          recipient_email: form.recipientEmail,
          message: form.message,
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Failed to start checkout')
    } catch {
      alert('Failed to start checkout')
    } finally {
      setStripeLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="font-heading text-4xl font-bold text-white mb-3">Voucher Sent!</h1>
        <p className="text-zinc-400 mb-6">
          Your gift voucher has been sent to <strong className="text-white">{form.recipientEmail}</strong>.
          They&apos;ll receive a branded email with the voucher code ready to use.
        </p>
        {successCode && (
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6 mb-8">
            <p className="text-zinc-500 text-sm mb-2">Voucher code</p>
            <p className="text-white font-mono text-2xl font-bold tracking-widest">{successCode}</p>
            <p className="text-zinc-600 text-sm mt-2">Valid for 12 months · £{finalAmount.toFixed(0)}</p>
          </div>
        )}
        <a href="/shop">
          <Button size="lg">Browse the Shop</Button>
        </a>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="mb-10">
        <h1 className="font-heading text-5xl font-bold text-brand-orange mb-3">Gift Vouchers</h1>
        <p className="text-zinc-400 text-lg">
          Give the gift of choice. Valid for 12 months on anything at hashtag.guru — mallets, awls, custom builds, or wood.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-8">
        {(['configure', 'payment'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s ? 'bg-brand-orange text-brand-dark' :
              (step === 'payment' && s === 'configure') ? 'bg-green-700 text-white' :
              'bg-zinc-800 text-zinc-500'
            }`}>
              {step === 'payment' && s === 'configure' ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${step === s ? 'text-white' : 'text-zinc-500'}`}>
              {s === 'configure' ? 'Details' : 'Payment'}
            </span>
            {i < 1 && <div className="w-8 h-px bg-zinc-700" />}
          </div>
        ))}
      </div>

      {step === 'configure' && (
        <div className="space-y-6">
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardContent className="p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Gift className="h-4 w-4 text-brand-orange" /> Voucher Amount
              </h2>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {DENOMINATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setAmount(d); setIsCustom(false) }}
                    className={`py-3 rounded-lg border-2 font-semibold text-lg transition-colors ${
                      !isCustom && amount === d
                        ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                        : 'border-brand-dark-border text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    £{d}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustom(true)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    isCustom
                      ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                      : 'border-brand-dark-border text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  Custom
                </button>
                {isCustom && (
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-zinc-400 text-lg">£</span>
                    <Input
                      type="number"
                      min={10}
                      max={500}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount (£10–£500)"
                      className="bg-brand-dark border border-brand-dark-border text-white"
                      autoFocus
                    />
                  </div>
                )}
              </div>
              {errors.purchasedByName?.includes('Amount') && (
                <p className="text-red-400 text-sm mt-2">{errors.purchasedByName}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardContent className="p-6">
              <h2 className="text-white font-semibold mb-4">From</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Your name *</label>
                  <Input
                    value={form.purchasedByName}
                    onChange={(e) => setForm({ ...form, purchasedByName: e.target.value })}
                    className="bg-brand-dark border border-brand-dark-border text-white"
                    placeholder="James Smith"
                  />
                  {errors.purchasedByName && !errors.purchasedByName.includes('Amount') && (
                    <p className="text-red-400 text-xs mt-1">{errors.purchasedByName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Your email *</label>
                  <Input
                    type="email"
                    value={form.purchasedByEmail}
                    onChange={(e) => setForm({ ...form, purchasedByEmail: e.target.value })}
                    className="bg-brand-dark border border-brand-dark-border text-white"
                    placeholder="you@email.com"
                  />
                  {errors.purchasedByEmail && (
                    <p className="text-red-400 text-xs mt-1">{errors.purchasedByEmail}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardContent className="p-6">
              <h2 className="text-white font-semibold mb-4">To</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Recipient name *</label>
                  <Input
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    className="bg-brand-dark border border-brand-dark-border text-white"
                    placeholder="Their name"
                  />
                  {errors.recipientName && (
                    <p className="text-red-400 text-xs mt-1">{errors.recipientName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Recipient email *</label>
                  <Input
                    type="email"
                    value={form.recipientEmail}
                    onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                    className="bg-brand-dark border border-brand-dark-border text-white"
                    placeholder="their@email.com"
                  />
                  {errors.recipientEmail && (
                    <p className="text-red-400 text-xs mt-1">{errors.recipientEmail}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Personal message <span className="text-zinc-600">(optional)</span></label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="bg-brand-dark border border-brand-dark-border text-white resize-none"
                  placeholder="Happy birthday! Enjoy picking out something special..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-zinc-400">
              Total: <span className="text-white font-bold text-lg">£{!isNaN(finalAmount) && finalAmount > 0 ? finalAmount.toFixed(2) : '—'}</span>
            </p>
            <Button onClick={handleContinueToPayment} size="lg">
              Continue to Payment →
            </Button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-6">
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardContent className="p-6">
              <h2 className="text-white font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Voucher value</span>
                  <span className="text-white font-bold">£{finalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">For</span>
                  <span className="text-white">{form.recipientName} ({form.recipientEmail})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">From</span>
                  <span className="text-white">{form.purchasedByName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                paymentMethod === 'stripe'
                  ? 'border-brand-orange bg-brand-orange/10'
                  : 'border-brand-dark-border hover:border-zinc-500'
              }`}
            >
              <CreditCard className="h-5 w-5 text-brand-orange mb-1" />
              <p className="font-medium text-white text-sm">Pay with Card</p>
              <p className="text-xs text-zinc-400 mt-0.5">Credit or debit card</p>
            </button>
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                paymentMethod === 'paypal'
                  ? 'border-brand-orange bg-brand-orange/10'
                  : 'border-brand-dark-border hover:border-zinc-500'
              }`}
            >
              <span className="text-brand-orange font-bold text-lg block mb-1">PP</span>
              <p className="font-medium text-white text-sm">PayPal</p>
              <p className="text-xs text-zinc-400 mt-0.5">Pay with PayPal balance</p>
            </button>
          </div>

          {paymentMethod === 'stripe' && (
            <Button onClick={handleStripe} disabled={stripeLoading} size="lg" className="w-full">
              {stripeLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…</> : `Pay £${finalAmount.toFixed(2)} with Card`}
            </Button>
          )}

          {paymentMethod === 'paypal' && (
            <PayPalScriptProvider
              options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
                currency: 'GBP',
              }}
            >
              <PayPalButtons
                createOrder={(_data, actions) =>
                  actions.order.create({
                    intent: 'CAPTURE',
                    purchase_units: [{
                      amount: { currency_code: 'GBP', value: finalAmount.toFixed(2) },
                      description: `#TOOLING Gift Voucher £${finalAmount.toFixed(0)} for ${form.recipientName}`,
                    }],
                  })
                }
                onApprove={async (_data, actions) => {
                  if (!actions.order) return
                  const details = await actions.order.capture()
                  const res = await fetch('/api/gift-vouchers/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount_gbp: finalAmount,
                      purchased_by_name: form.purchasedByName,
                      purchased_by_email: form.purchasedByEmail,
                      recipient_name: form.recipientName,
                      recipient_email: form.recipientEmail,
                      message: form.message,
                      payment_reference: details.id,
                      payment_method: 'paypal',
                    }),
                  })
                  const result = await res.json()
                  if (result.success) {
                    setSuccessCode(result.code)
                    setStep('success')
                  } else {
                    alert('Payment received but failed to create voucher. Please contact hashtagwoodworking@gmail.com with your PayPal reference: ' + details.id)
                  }
                }}
                onError={() => alert('Payment failed. Please try again.')}
              />
            </PayPalScriptProvider>
          )}

          <button
            onClick={() => setStep('configure')}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back to details
          </button>
        </div>
      )}
    </div>
  )
}
