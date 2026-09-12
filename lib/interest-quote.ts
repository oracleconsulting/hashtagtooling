import { formatBuildIntent, parseBuildIntent, type InterestBuildIntent } from '@/lib/interest-invite'

export type BespokeQuoteStatus = 'requested' | 'quoted' | 'accepted' | 'refused'

export type BespokeQuote = {
  request: string
  requestedAt: string
  status: BespokeQuoteStatus
  catalogTotal: number | null
  quotedTotal: number | null
  quotedDeposit: number | null
  quotedBalance: number | null
  quotedNote: string | null
  quotedAt: string | null
  respondedAt: string | null
}

type QueryClient = {
  from: (table: string) => any
}

function asNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function parseBespokeQuote(raw: unknown): BespokeQuote | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  const request = typeof obj.request === 'string' ? obj.request.trim() : ''
  const status = obj.status
  if (!request) return null
  if (status !== 'requested' && status !== 'quoted' && status !== 'accepted' && status !== 'refused') {
    return null
  }
  return {
    request,
    requestedAt: typeof obj.requestedAt === 'string' ? obj.requestedAt : '',
    status,
    catalogTotal: asNumber(obj.catalogTotal),
    quotedTotal: asNumber(obj.quotedTotal),
    quotedDeposit: asNumber(obj.quotedDeposit),
    quotedBalance: asNumber(obj.quotedBalance),
    quotedNote: typeof obj.quotedNote === 'string' ? obj.quotedNote.trim() || null : null,
    quotedAt: typeof obj.quotedAt === 'string' ? obj.quotedAt : null,
    respondedAt: typeof obj.respondedAt === 'string' ? obj.respondedAt : null,
  }
}

export function signupBespokeQuote(signup: {
  bespoke_quote?: unknown
  build_intent?: unknown
}): BespokeQuote | null {
  return parseBespokeQuote(signup.bespoke_quote) || parseBespokeQuote(
    signup.build_intent && typeof signup.build_intent === 'object'
      ? (signup.build_intent as Record<string, unknown>).bespokeQuote
      : null
  )
}

export function quoteBlocksCheckout(quote: BespokeQuote | null | undefined): boolean {
  return quote?.status === 'requested' || quote?.status === 'quoted'
}

export function acceptedQuoteTotals(quote: BespokeQuote | null | undefined): {
  total: number
  deposit: number
  balance: number
} | null {
  if (!quote || quote.status !== 'accepted') return null
  const total = quote.quotedTotal
  const deposit = quote.quotedDeposit
  const balance = quote.quotedBalance
  if (total == null || deposit == null || balance == null) return null
  return { total, deposit, balance }
}

export function splitQuoteTotal(total: number): { total: number; deposit: number; balance: number } {
  const safe = Math.round(total * 100) / 100
  const deposit = Math.round(safe * 50) / 100
  return { total: safe, deposit, balance: Math.round((safe - deposit) * 100) / 100 }
}

export function formatBespokeQuote(quote: BespokeQuote | null | undefined): string {
  if (!quote) return ''
  const price = quote.quotedTotal != null ? ` · £${quote.quotedTotal.toFixed(2)}` : ''
  return `${quote.status}${price}: ${quote.request}`
}

export function signupQuotedTotals(quote: BespokeQuote | null | undefined): {
  total: number
  deposit: number
  balance: number
} | null {
  if (!quote || (quote.status !== 'quoted' && quote.status !== 'accepted')) return null
  if (quote.quotedTotal == null) return null
  const split = splitQuoteTotal(quote.quotedTotal)
  return {
    total: quote.quotedTotal,
    deposit: quote.quotedDeposit ?? split.deposit,
    balance: quote.quotedBalance ?? split.balance,
  }
}

export async function saveBespokeQuote(
  supabase: QueryClient,
  signupId: string,
  quote: BespokeQuote | null
): Promise<{ error?: string }> {
  const { data: row, error: loadError } = await supabase
    .from('interest_signups')
    .select('id, build_intent')
    .eq('id', signupId)
    .maybeSingle()
  if (loadError) return { error: loadError.message }
  if (!row) return { error: 'Invite not found' }

  const previous = row.build_intent && typeof row.build_intent === 'object' && !Array.isArray(row.build_intent)
    ? { ...(row.build_intent as Record<string, unknown>) }
    : {}
  const nextIntent: Record<string, unknown> = { ...previous, bespokeQuote: quote }
  if (quote && (quote.status === 'quoted' || quote.status === 'accepted') && quote.quotedTotal != null) {
    nextIntent.total = quote.quotedTotal
    nextIntent.deposit = quote.quotedDeposit
    nextIntent.balance = quote.quotedBalance
  }

  const { error } = await supabase
    .from('interest_signups')
    .update({ bespoke_quote: quote, build_intent: nextIntent })
    .eq('id', signupId)

  if (!error) return {}
  if (!String(error.message || '').includes('bespoke_quote')) return { error: error.message }

  const { error: fallbackError } = await supabase
    .from('interest_signups')
    .update({ build_intent: nextIntent })
    .eq('id', signupId)

  return fallbackError ? { error: fallbackError.message } : {}
}

export function quoteRequestSummary(
  intent: InterestBuildIntent | null,
  quote: BespokeQuote
): string {
  const spec = formatBuildIntent(intent) || 'No spec yet'
  return `${spec}\n\nRequest: ${quote.request}`
}
