'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CONSENT_KEY_V2 = 'cookie_consent_v2'
const CONSENT_KEY_LEGACY = 'cookie_consent'

interface ConsentState {
  essential: true
  analytics: boolean
  marketing: boolean
}

const DEFAULT: ConsentState = { essential: true, analytics: false, marketing: false }

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const v2 = localStorage.getItem(CONSENT_KEY_V2)
    if (v2) return

    const legacy = localStorage.getItem(CONSENT_KEY_LEGACY)
    if (legacy === 'true') {
      const migrated: ConsentState = { essential: true, analytics: true, marketing: false }
      localStorage.setItem(CONSENT_KEY_V2, JSON.stringify(migrated))
      window.dispatchEvent(new CustomEvent('cookie_consent_changed'))
      return
    }
    setVisible(true)
  }, [])

  const persist = (state: ConsentState) => {
    localStorage.setItem(CONSENT_KEY_V2, JSON.stringify(state))
    setVisible(false)
    window.dispatchEvent(new CustomEvent('cookie_consent_changed'))
  }

  const acceptAll = () => persist({ essential: true, analytics: true, marketing: true })
  const acceptSelection = () => persist({ essential: true, analytics, marketing })
  const rejectNonEssential = () => persist({ ...DEFAULT })

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-brand-dark-card border-t border-brand-dark-border px-4 py-4 shadow-lg"
      role="banner"
      aria-label="Cookie consent"
    >
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-zinc-300 max-w-2xl">
            <p>
              We use essential cookies to make the shop work — your cart, wishlist, and checkout.
              We&rsquo;d also like to use analytics cookies to understand which products are popular,
              and (optionally) marketing cookies for emails about your interests.
            </p>
            <button onClick={() => setShowDetails(!showDetails)} className="text-brand-orange text-xs mt-2 underline">
              {showDetails ? 'Hide details' : 'Customise'}
            </button>{' '}
            <Link href="/privacy" className="text-zinc-500 text-xs underline">Privacy policy</Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={rejectNonEssential}>Reject non-essential</Button>
            <Button size="sm" onClick={acceptAll}>Accept all</Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-brand-dark-border space-y-3 text-sm">
            <label className="flex items-start gap-3 opacity-60 cursor-not-allowed">
              <input type="checkbox" checked disabled className="mt-1" />
              <div>
                <p className="font-medium text-zinc-200">Essential</p>
                <p className="text-xs text-zinc-400">Required for cart, wishlist, and checkout. Always on.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-zinc-200">Analytics</p>
                <p className="text-xs text-zinc-400">Helps us see which products are most popular. Aggregated, no personal data.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-zinc-200">Marketing</p>
                <p className="text-xs text-zinc-400">Allows us to email you about products you&rsquo;ve viewed (we&rsquo;ll add this in future).</p>
              </div>
            </label>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={acceptSelection}>Save my choices</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
