import { BetaAnalyticsDataClient } from '@google-analytics/data'

let client: BetaAnalyticsDataClient | null = null

function getClient(): BetaAnalyticsDataClient {
  if (client) return client
  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!clientEmail || !privateKey) {
    throw new Error('GA4 credentials missing — set GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY env vars')
  }
  client = new BetaAnalyticsDataClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
  })
  return client
}

const PROPERTY_ID = process.env.GA4_PROPERTY_ID
const PROPERTY = `properties/${PROPERTY_ID}`

export interface GA4Stats {
  totals: {
    activeUsers: number
    sessions: number
    conversions: number
    revenue: number
  }
  topPages: Array<{ path: string; pageViews: number }>
  trafficSources: Array<{ source: string; sessions: number }>
  deviceBreakdown: Array<{ device: string; users: number; pct: number }>
  conversionsByDay: Array<{ date: string; conversions: number }>
}

export async function getGA4Stats(daysBack = 7): Promise<GA4Stats> {
  if (!PROPERTY_ID) throw new Error('GA4_PROPERTY_ID env var missing')
  const c = getClient()
  const startDate = `${daysBack}daysAgo`
  const endDate = 'today'

  const [totalsRes, topPagesRes, sourcesRes, devicesRes, conversionsRes] = await Promise.all([
    c.runReport({
      property: PROPERTY,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
      ],
    }),
    c.runReport({
      property: PROPERTY,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    c.runReport({
      property: PROPERTY,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    }),
    c.runReport({
      property: PROPERTY,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    }),
    c.runReport({
      property: PROPERTY,
      dateRanges: [{ startDate: '30daysAgo', endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'conversions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  ])

  const totalsRow = totalsRes[0].rows?.[0]
  const totals = {
    activeUsers: Number(totalsRow?.metricValues?.[0]?.value ?? 0),
    sessions: Number(totalsRow?.metricValues?.[1]?.value ?? 0),
    conversions: Number(totalsRow?.metricValues?.[2]?.value ?? 0),
    revenue: Number(totalsRow?.metricValues?.[3]?.value ?? 0),
  }

  const topPages = (topPagesRes[0].rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? '',
    pageViews: Number(r.metricValues?.[0]?.value ?? 0),
  }))

  const trafficSources = (sourcesRes[0].rows ?? []).map((r) => ({
    source: r.dimensionValues?.[0]?.value ?? 'Unknown',
    sessions: Number(r.metricValues?.[0]?.value ?? 0),
  }))

  const deviceRows = devicesRes[0].rows ?? []
  const totalDeviceUsers = deviceRows.reduce((s, r) => s + Number(r.metricValues?.[0]?.value ?? 0), 0)
  const deviceBreakdown = deviceRows.map((r) => {
    const users = Number(r.metricValues?.[0]?.value ?? 0)
    return {
      device: r.dimensionValues?.[0]?.value ?? 'unknown',
      users,
      pct: totalDeviceUsers > 0 ? (users / totalDeviceUsers) * 100 : 0,
    }
  })

  const conversionsByDay = (conversionsRes[0].rows ?? []).map((r) => ({
    date: r.dimensionValues?.[0]?.value ?? '',
    conversions: Number(r.metricValues?.[0]?.value ?? 0),
  }))

  return { totals, topPages, trafficSources, deviceBreakdown, conversionsByDay }
}
