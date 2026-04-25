'use client'

import Link from 'next/link'
import { useState } from 'react'
import { linkSessionToEmail } from '@/lib/tracking'

export function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')
  const [voucherCode, setVoucherCode] = useState<string | null>(null)

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
        body: JSON.stringify({ email: trimmed, source: 'footer' }),
      })
      const data = await res.json()
      if (data.status === 'already') {
        setStatus('already')
        if (data.voucher_code) setVoucherCode(data.voucher_code)
      } else if (data.status === 'success') {
        setStatus('success')
        setEmail('')
        if (data.voucher_code) setVoucherCode(data.voucher_code)
        linkSessionToEmail(trimmed)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer className="bg-brand-dark border-t border-brand-dark-border mt-0">
      <div className="container mx-auto px-4 py-12">

        {/* Newsletter strip */}
        <div className="mb-10 pb-10 border-b border-brand-dark-border">
          <div className="max-w-xl">
            <h3 className="font-heading text-2xl font-bold text-white mb-1">
              Join the Workshop
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              New tools, wood discoveries, and behind-the-scenes builds — direct to your inbox. No noise.
            </p>

            {status === 'success' ? (
              <div>
                <p className="text-green-400 text-sm font-medium">
                  ✓ You&apos;re in. Welcome to the workshop.
                </p>
                {voucherCode && (
                  <div className="mt-3 p-3 bg-brand-dark-card border border-brand-orange/30 rounded">
                    <p className="text-xs text-zinc-400 mb-1">Your launch voucher — 10% off any tool:</p>
                    <p className="text-brand-orange font-mono text-lg font-bold tracking-wider">{voucherCode}</p>
                    <p className="text-xs text-zinc-500 mt-1">Check your email for details</p>
                  </div>
                )}
              </div>
            ) : status === 'already' ? (
              <div>
                <p className="text-zinc-400 text-sm">
                  You&apos;re already subscribed — good taste.
                </p>
                {voucherCode && (
                  <div className="mt-3 p-3 bg-brand-dark-card border border-brand-orange/30 rounded">
                    <p className="text-xs text-zinc-400 mb-1">Your launch voucher:</p>
                    <p className="text-brand-orange font-mono text-lg font-bold tracking-wider">{voucherCode}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 bg-brand-dark border border-brand-dark-border rounded text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand-orange transition-colors"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={status === 'loading'}
                  className="px-4 py-2 bg-brand-orange text-brand-dark text-sm font-semibold rounded hover:bg-brand-orange/90 transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {status === 'loading' ? '…' : 'Sign Up'}
                </button>
              </div>
            )}
            {status === 'error' && (
              <p className="text-red-400 text-xs mt-1.5">Please enter a valid email address.</p>
            )}
            <p className="text-zinc-500 text-xs mt-3">
              Want to know more?{' '}
              <Link href="/mailing-list" className="text-brand-orange hover:underline">
                See what you&apos;ll get →
              </Link>
            </p>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4 text-brand-orange">#TOOLING</h3>
            <p className="text-zinc-400 text-sm">
              Handcrafted woodworking tools built from the world&apos;s finest exotic timbers. Every piece made with passion and precision.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Shop</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/shop?category=mallets" className="hover:text-brand-orange transition-colors">Mallets</Link></li>
              <li><Link href="/shop?category=awls" className="hover:text-brand-orange transition-colors">Awls</Link></li>
              <li><Link href="/shop?category=wood" className="hover:text-brand-orange transition-colors">Wood for Sale</Link></li>
              <li><Link href="/adopt" className="hover:text-brand-orange transition-colors">Adopt a Blank</Link></li>
              <li><Link href="/engineering-squares" className="hover:text-brand-orange transition-colors">Engineering Squares</Link></li>
              <li><Link href="/shop?category=coins" className="hover:text-brand-orange transition-colors">EDC Coins</Link></li>
              <li><Link href="/gift-vouchers" className="hover:text-brand-orange transition-colors">Gift Vouchers</Link></li>
              <li><Link href="/mystery-box" className="hover:text-brand-orange transition-colors">Mystery Box</Link></li>
              <li><Link href="/referrals" className="hover:text-brand-orange transition-colors">Refer a Friend</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Custom</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/custom-mallet" className="hover:text-brand-orange transition-colors">Build Your Mallet</Link></li>
              <li><Link href="/custom-awl" className="hover:text-brand-orange transition-colors">Build Your Awl</Link></li>
              <li><Link href="/custom-square" className="hover:text-brand-orange transition-colors">Build Your Square</Link></li>
              <li><Link href="/wood-library" className="hover:text-brand-orange transition-colors">Wood Library</Link></li>
              <li><Link href="/commissions" className="hover:text-brand-orange transition-colors">Commission Work</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Info</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/about" className="hover:text-brand-orange transition-colors">My Story</Link></li>
              <li><Link href="/blog" className="hover:text-brand-orange transition-colors">Journal</Link></li>
              <li><Link href="/gift-guide" className="hover:text-brand-orange transition-colors">Gift Guide</Link></li>
              <li><Link href="/gallery" className="hover:text-brand-orange transition-colors">Gallery</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange transition-colors">Contact</Link></li>
              <li><Link href="/shipping" className="hover:text-brand-orange transition-colors">Shipping</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-orange transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-orange transition-colors">Terms & Conditions</Link></li>
              <li><a href="https://www.instagram.com/hashtagtooling/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-dark-border mt-8 pt-8 text-center text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} #TOOLING. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
