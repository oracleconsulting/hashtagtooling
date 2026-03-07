'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export function AnalyticsLoader() {
  const [consent, setConsent] = useState(false)
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setConsent(localStorage.getItem('cookie_consent') === 'true')
    check()
    const handleStorage = () => check()
    const handleConsent = () => setConsent(true)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('cookie_consent_accepted', handleConsent)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('cookie_consent_accepted', handleConsent)
    }
  }, [])

  if (!consent || !gaId) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
      </Script>
    </>
  )
}
