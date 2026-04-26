'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw, ExternalLink, AlertCircle } from 'lucide-react'

interface GA4Stats {
  totals: { activeUsers: number; sessions: number; conversions: number; revenue: number }
  topPages: Array<{ path: string; pageViews: number }>
  trafficSources: Array<{ source: string; sessions: number }>
  deviceBreakdown: Array<{ device: string; users: number; pct: number }>
  conversionsByDay: Array<{ date: string; conversions: number }>
  cached?: boolean
  error?: string
}

export function GA4Panel() {
  const [stats, setStats] = useState<GA4Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (force = false) => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/admin/ga4-stats${force ? '?force=true' : ''}`)
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setStats(json)
        setError(null)
      }
    } catch {
      setError('Failed to load GA4 stats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-white">
          Site traffic <span className="text-xs text-zinc-500 font-normal">(last 7 days, GA4)</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-brand-orange flex items-center gap-1"
          >
            Open GA4 <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {error ? (
        <Card className="bg-brand-dark-card border-amber-900/50">
          <CardContent className="py-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-300">GA4 not connected</p>
              <p className="text-sm text-zinc-400 mt-1">{error}</p>
              <p className="text-xs text-zinc-500 mt-2">Set GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, and GA4_PRIVATE_KEY env vars — see setup walkthrough.</p>
            </div>
          </CardContent>
        </Card>
      ) : loading || !stats ? (
        <p className="text-zinc-400 text-sm">Loading site traffic…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <GA4StatCard label="Active users" value={stats.totals.activeUsers.toLocaleString('en-GB')} />
            <GA4StatCard label="Sessions" value={stats.totals.sessions.toLocaleString('en-GB')} />
            <GA4StatCard label="Conversions" value={stats.totals.conversions.toLocaleString('en-GB')} />
            <GA4StatCard label="Revenue" value={`£${stats.totals.revenue.toFixed(0)}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="bg-brand-dark-card border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-300">Top pages</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {stats.topPages.slice(0, 5).map((p) => (
                    <li key={p.path} className="flex justify-between text-sm">
                      <span className="text-zinc-300 truncate pr-2 font-mono text-xs">{p.path}</span>
                      <span className="text-brand-orange font-medium text-sm">{p.pageViews}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-brand-dark-card border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-300">Traffic sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {stats.trafficSources.slice(0, 5).map((s) => (
                    <li key={s.source} className="flex justify-between text-sm">
                      <span className="text-zinc-300 truncate pr-2">{s.source}</span>
                      <span className="text-brand-orange font-medium">{s.sessions}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-brand-dark-card border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-300">Devices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.deviceBreakdown.map((d) => (
                  <div key={d.device}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400 capitalize">{d.device}</span>
                      <span className="text-zinc-300">{d.pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-orange" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  )
}

function GA4StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
