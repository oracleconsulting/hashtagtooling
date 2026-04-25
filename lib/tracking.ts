'use client'

const SESSION_KEY = 'tracking_session_id'

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  const consent = localStorage.getItem('cookie_consent_v2')
  if (!consent) return false
  try {
    const parsed = JSON.parse(consent) as { analytics?: boolean }
    return Boolean(parsed.analytics)
  } catch {
    return false
  }
}

interface TrackEventInput {
  eventType: 'view_item' | 'add_to_cart' | 'remove_from_cart' | 'add_to_wishlist' | 'remove_from_wishlist' | 'begin_checkout' | 'purchase'
  productId?: string
  productName?: string
  productCategory?: string
  price?: number
  quantity?: number
  metadata?: Record<string, unknown>
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  if (!hasAnalyticsConsent()) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  if (typeof window !== 'undefined' && w.gtag) {
    const gtagPayload: Record<string, unknown> = {
      currency: 'GBP',
      value: (input.price ?? 0) * (input.quantity ?? 1),
    }
    if (input.productId) {
      gtagPayload.items = [{
        item_id: input.productId,
        item_name: input.productName,
        item_category: input.productCategory,
        price: input.price,
        quantity: input.quantity ?? 1,
      }]
    }
    w.gtag('event', input.eventType, gtagPayload)
  }

  try {
    const sessionId = getSessionId()
    fetch('/api/tracking/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, sessionId }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* silent */ }
}

interface SnapshotInput {
  type: 'cart' | 'wishlist'
  items: Array<{ id: string; name: string; price?: number; quantity?: number; customConfig?: unknown }>
}

export async function snapshotState(input: SnapshotInput): Promise<void> {
  if (!hasAnalyticsConsent()) return
  try {
    const sessionId = getSessionId()
    fetch('/api/tracking/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, sessionId }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* silent */ }
}

export async function linkSessionToEmail(email: string): Promise<void> {
  if (!hasAnalyticsConsent()) return
  try {
    const sessionId = getSessionId()
    await fetch('/api/tracking/link-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, email }),
    })
  } catch { /* silent */ }
}
