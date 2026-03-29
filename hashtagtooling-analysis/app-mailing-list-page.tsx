'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

export default function MailingListPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')
  const [voucherCode, setVoucherCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  const handleSubscribe = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'mailing-list' }),
      })
      const data = await res.json()
      if (data.status === 'already') {
        setStatus('already')
        if (data.voucher_code) setVoucherCode(data.voucher_code)
      } else if (data.status === 'success') {
        setStatus('success')
        setEmail('')
        if (data.voucher_code) setVoucherCode(data.voucher_code)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const copyCode = () => {
    if (voucherCode) {
      navigator.clipboard.writeText(voucherCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const deadline = new Date('2026-04-30T23:59:59Z')
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const offerActive = now < deadline

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-brand-dark py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-4">Mailing List</p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Join the Workshop
          </h1>
          <p className="text-zinc-400 text-xl leading-relaxed max-w-2xl mx-auto">
            Be the first to know when new tools drop, what wood I&apos;m working with, and what&apos;s happening at the bench.
            No corporate bollocks, no spam — just the good stuff, direct from the workshop.
          </p>
        </div>
      </section>

      {/* Launch offer + signup */}
      <section className="bg-brand-dark-card py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {offerActive && (
            <div className="bg-gradient-to-r from-brand-orange/10 to-transparent border border-brand-orange/30 rounded-xl p-8 mb-10 text-center">
              <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-2">Launch Offer</p>
              <h2 className="font-heading text-3xl font-bold text-white mb-3">10% Off Your First Tool</h2>
              <p className="text-zinc-400 mb-4">
                Sign up before 30 April 2026 and get an exclusive 10% off any single tool purchase.
                Your voucher is unique to you, single-use, and applies to the most expensive item in your order.
              </p>
              <p className="text-brand-orange font-semibold text-lg">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
              </p>
            </div>
          )}

          {status === 'success' || status === 'already' ? (
            <div className="text-center">
              <p className="text-green-400 text-xl font-semibold mb-2">
                {status === 'success' ? "✓ You're in. Welcome to the workshop." : "You're already subscribed — good taste."}
              </p>
              {voucherCode && (
                <div className="mt-6 p-6 bg-brand-dark border-2 border-brand-orange/40 rounded-xl inline-block">
                  <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider">Your Launch Voucher — 10% Off</p>
                  <div className="flex items-center gap-3 justify-center">
                    <p className="text-brand-orange font-mono text-3xl font-bold tracking-wider">{voucherCode}</p>
                    <button
                      onClick={copyCode}
                      className="p-2 rounded-md bg-brand-dark-card border border-brand-dark-border hover:border-brand-orange transition-colors"
                      title="Copy code"
                    >
                      {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5 text-zinc-400" />}
                    </button>
                  </div>
                  <p className="text-zinc-500 text-sm mt-3">Valid until 31 July 2026 · Check your email for details</p>
                </div>
              )}
              <div className="mt-8">
                <Link
                  href="/shop"
                  className="inline-block px-8 py-3 bg-brand-orange text-brand-dark font-bold rounded-lg hover:bg-brand-orange/90 transition-colors text-lg"
                >
                  Browse the Shop →
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 bg-brand-dark border border-brand-dark-border rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-orange transition-colors text-base"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={status === 'loading'}
                  className="px-6 py-3 bg-brand-orange text-brand-dark font-bold rounded-lg hover:bg-brand-orange/90 transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {status === 'loading' ? '…' : 'Sign Up'}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-sm mt-2">Please enter a valid email address.</p>
              )}
              <p className="text-zinc-600 text-xs mt-3 text-center">No spam. Unsubscribe anytime.</p>
            </div>
          )}
        </div>
      </section>

      {/* What you'll get */}
      <section className="bg-brand-dark py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-heading text-3xl font-bold text-white mb-8 text-center">What You&apos;ll Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'First access to new drops', desc: 'New tools hit your inbox before they hit the shop.' },
              { title: 'Behind-the-scenes builds', desc: 'Workshop process, tool builds, and the decisions behind each piece.' },
              { title: 'Wood discovery updates', desc: 'New species, rare finds, and limited stock alerts.' },
              { title: 'Exclusive offers', desc: 'Early access to collaborations and subscriber-only deals.' },
            ].map((item) => (
              <div key={item.title} className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6">
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-sm text-center mt-6">
            No more than 2–3 emails per month — quality over quantity.
          </p>
        </div>
      </section>

      {/* Voucher terms */}
      {offerActive && (
        <section className="bg-brand-dark-card py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <button
              onClick={() => setTermsOpen(!termsOpen)}
              className="flex items-center gap-2 text-zinc-500 text-sm hover:text-zinc-400 transition-colors mx-auto"
            >
              Voucher terms & conditions
              {termsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {termsOpen && (
              <div className="mt-4 text-zinc-500 text-xs space-y-1.5 max-w-lg mx-auto">
                <p>• 10% discount applies to one item only (the most expensive in your order)</p>
                <p>• Single use — once redeemed, it&apos;s done</p>
                <p>• Tied to the email address you signed up with — non-transferable</p>
                <p>• Valid until 31 July 2026</p>
                <p>• Cannot be combined with gift vouchers or referral discounts</p>
                <p>• Applies to mallets, awls, and EDC coins — not timber blanks or digital products</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
