'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

const CUTOFF = new Date('2026-04-30T23:59:59Z')

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('announcement_dismissed')
    setDismissed(stored === 'true' || new Date() >= CUTOFF)
  }, [])

  const dismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('announcement_dismissed', 'true')
  }

  if (dismissed) return null

  return (
    <div className="bg-brand-orange text-brand-dark text-center text-sm font-medium py-2 px-4 relative">
      <Link href="/mailing-list" className="hover:underline">
        🔨 Pre-launch offer: Sign up to the mailing list and get <strong>10% off</strong> your first tool →
      </Link>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-brand-dark/10 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
