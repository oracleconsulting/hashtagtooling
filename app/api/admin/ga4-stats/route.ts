import { NextResponse } from 'next/server'
import { getGA4Stats, type GA4Stats } from '@/lib/ga4-client'

let cache: { data: GA4Stats; expires: number } | null = null
const CACHE_MS = 10 * 60 * 1000

export async function GET(req: Request) {
  const url = new URL(req.url)
  const force = url.searchParams.get('force') === 'true'

  if (!force && cache && Date.now() < cache.expires) {
    return NextResponse.json({ ...cache.data, cached: true, cachedUntil: new Date(cache.expires).toISOString() })
  }

  try {
    const data = await getGA4Stats(7)
    cache = { data, expires: Date.now() + CACHE_MS }
    return NextResponse.json({ ...data, cached: false })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'GA4 fetch failed'
    console.error('GA4 stats error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
