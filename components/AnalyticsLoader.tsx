'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

export function AnalyticsLoader() {
  const [analyticsConsent, setAnalyticsConsent] = useState(false)
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  useEffect(() => {
    const check = () => {
      const v2 = localStorage.getItem('cookie_consent_v2')
      if (v2) {
        try {
          const parsed = JSON.parse(v2) as { analytics?: boolean }
          setAnalyticsConsent(Boolean(parsed.analytics))
          return
        } catch { /* fall through */ }
      }
      setAnalyticsConsent(localStorage.getItem('cookie_consent') === 'true')
    }
    check()
    const handler = () => check()
    window.addEventListener('cookie_consent_changed', handler)
    window.addEventListener('cookie_consent_accepted', handler)
    return () => {
      window.removeEventListener('cookie_consent_changed', handler)
      window.removeEventListener('cookie_consent_accepted', handler)
    }
  }, [])

  if (!analyticsConsent || !gaId) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
      </Script>
    </>
  )
}
