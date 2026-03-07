'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const accepted = localStorage.getItem(CONSENT_KEY)
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem(CONSENT_KEY, 'true')
    setVisible(false)
    window.dispatchEvent(new CustomEvent('cookie_consent_accepted'))
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-brand-dark-card border-t border-brand-dark-border px-4 py-4 shadow-lg"
      style={{ animation: 'slideUp 0.35s ease-out' }}
      role="banner"
      aria-label="Cookie consent"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-300 text-center sm:text-left">
          This site uses cookies to remember your cart and to help us understand how visitors use the site.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/privacy">
            <Button variant="outline" size="sm" onClick={() => {}}>
              Learn More
            </Button>
          </Link>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
