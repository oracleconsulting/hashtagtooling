import { isInviteToken, parseBuildIntent } from '@/lib/interest-invite'
import { signupBespokeQuote } from '@/lib/interest-quote'
import { isPricedInterestSlug } from '@/lib/interest-pricing'
import type { InterestSignup } from '@/lib/interest'

type OrderItemLike = {
  category?: string
  customConfig?: { inviteToken?: string }
}

export type InterestSignupOrder = {
  id: string
  status: string
  payment_plan?: string | null
  balance_status?: string | null
  deposit_amount?: number | null
  balance_amount?: number | null
  created_at: string
  customer_email?: string | null
  order_details?: { items?: OrderItemLike[] }
}

export type InterestPipelineStep = {
  key: 'invited' | 'viewed' | 'spec' | 'quote' | 'quoted' | 'decided' | 'basket' | 'ordered' | 'paid'
  label: string
  done: boolean
  current: boolean
  at: string | null
}

type QueryClient = {
  from: (table: string) => any
}

function extraFromIntent(raw: unknown): { cartAt?: string; orderId?: string; orderPlacedAt?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const obj = raw as Record<string, unknown>
  return {
    cartAt: typeof obj.cartAt === 'string' ? obj.cartAt : undefined,
    orderId: typeof obj.orderId === 'string' ? obj.orderId : undefined,
    orderPlacedAt: typeof obj.orderPlacedAt === 'string' ? obj.orderPlacedAt : undefined,
  }
}

export function signupCartAt(signup: Pick<InterestSignup, 'cart_at' | 'build_intent'>): string | null {
  return signup.cart_at || extraFromIntent(signup.build_intent).cartAt || null
}

export function signupOrderId(signup: Pick<InterestSignup, 'order_id' | 'build_intent'>): string | null {
  return signup.order_id || extraFromIntent(signup.build_intent).orderId || null
}

export function signupOrderPlacedAt(
  signup: Pick<InterestSignup, 'order_placed_at' | 'build_intent'>,
  order?: InterestSignupOrder | null
): string | null {
  return signup.order_placed_at || extraFromIntent(signup.build_intent).orderPlacedAt || order?.created_at || null
}

function itemInviteToken(item: unknown): string | undefined {
  if (!item || typeof item !== 'object') return undefined
  const config = (item as OrderItemLike).customConfig
  const token = config && typeof config === 'object' ? (config as { inviteToken?: unknown }).inviteToken : undefined
  return typeof token === 'string' ? token : undefined
}

export function extractInterestTokens(items: unknown, extra = ''): string[] {
  const fromItems = (Array.isArray(items) ? items : [])
    .map(itemInviteToken)
    .filter((token): token is string => typeof token === 'string' && isInviteToken(token))
  const fromExtra = extra.split(',').map((token) => token.trim()).filter(isInviteToken)
  return [...new Set([...fromItems, ...fromExtra])]
}

export function interestPipelineSteps(
  signup: InterestSignup,
  order?: InterestSignupOrder | null
): InterestPipelineStep[] {
  const intent = parseBuildIntent(signup.build_intent)
  const cartAt = signupCartAt(signup)
  const placedAt = signupOrderPlacedAt(signup, order)
  const cancelled = Boolean(order && /cancel/i.test(order.status || ''))
  const fullyPaid = Boolean(
    order && (
      order.balance_status === 'paid' ||
      (order.payment_plan !== 'deposit' && /paid|shipped|complete/i.test(order.status || ''))
    )
  )
  const depositTaken = Boolean(order || placedAt)

  let paidLabel = 'Paid'
  if (cancelled) paidLabel = 'Cancelled'
  else if (fullyPaid) paidLabel = order?.payment_plan === 'deposit' ? 'Balance paid' : 'Paid'
  else if (depositTaken && order?.payment_plan === 'deposit') {
    paidLabel = order.balance_status === 'awaiting_payment' ? 'Balance due' : 'Deposit paid'
  }

  const quote = signupBespokeQuote(signup)
  const decidedLabel = quote?.status === 'refused' ? 'Quote refused' : 'Quote accepted'
  const quoteSteps: Omit<InterestPipelineStep, 'current'>[] = quote
    ? [
        { key: 'quote', label: 'Quote requested', done: true, at: quote.requestedAt || null },
        { key: 'quoted', label: 'Quoted', done: quote.status !== 'requested', at: quote.quotedAt },
        {
          key: 'decided',
          label: quote.status === 'requested' || quote.status === 'quoted' ? 'Awaiting reply' : decidedLabel,
          done: quote.status === 'accepted' || quote.status === 'refused',
          at: quote.respondedAt,
        },
      ]
    : []

  const steps: Omit<InterestPipelineStep, 'current'>[] = [
    { key: 'invited', label: 'Invite sent', done: Boolean(signup.invite_sent_at), at: signup.invite_sent_at || null },
    { key: 'viewed', label: 'Viewed', done: Boolean(signup.invite_viewed_at), at: signup.invite_viewed_at || null },
    { key: 'spec', label: 'Spec saved', done: Boolean(intent), at: signup.build_intent_at || null },
    ...quoteSteps,
    { key: 'basket', label: 'In basket', done: Boolean(cartAt || depositTaken), at: cartAt },
    { key: 'ordered', label: 'Order placed', done: depositTaken, at: placedAt },
    { key: 'paid', label: paidLabel, done: fullyPaid || cancelled, at: order?.created_at || null },
  ]

  const currentIndex = steps.reduce((last, step, index) => (step.done ? index : last), -1)
  return steps.map((step, index) => ({
    ...step,
    current: index === currentIndex,
  }))
}

export function interestPipelineLabel(signup: InterestSignup, order?: InterestSignupOrder | null): string {
  const steps = interestPipelineSteps(signup, order)
  const current = [...steps].reverse().find((step) => step.done)
  return current?.label || 'On the list'
}

function mergeIntent(existing: unknown, patch: Record<string, unknown>) {
  const base = existing && typeof existing === 'object' && !Array.isArray(existing)
    ? { ...(existing as Record<string, unknown>) }
    : {}
  return { ...base, ...patch }
}

export async function markInterestCart(
  supabase: QueryClient,
  token: string,
  inCart: boolean
): Promise<{ error?: string }> {
  const now = new Date().toISOString()
  const { data: row, error: loadError } = await supabase
    .from('interest_signups')
    .select('id, build_intent, order_id')
    .eq('invite_token', token)
    .maybeSingle()

  if (loadError) return { error: loadError.message }
  if (!row) return { error: 'Invite not found' }
  if (row.order_id && !inCart) return {}

  const cartAt = inCart ? now : null
  const { error } = await supabase
    .from('interest_signups')
    .update({ cart_at: cartAt })
    .eq('id', row.id)

  if (!error) return {}
  if (!String(error.message || '').includes('cart_at')) return { error: error.message }

  const { error: fallbackError } = await supabase
    .from('interest_signups')
    .update({ build_intent: mergeIntent(row.build_intent, { cartAt }) })
    .eq('id', row.id)

  return fallbackError ? { error: fallbackError.message } : {}
}

export async function linkInterestSignupsToOrder(
  supabase: QueryClient,
  opts: {
    orderId: string
    email?: string | null
    items?: OrderItemLike[] | null
    tokens?: string[]
    placedAt?: string
  }
): Promise<void> {
  const placedAt = opts.placedAt || new Date().toISOString()
  const tokens = extractInterestTokens(opts.items, (opts.tokens || []).join(','))
  const slugs = [...new Set(
    (Array.isArray(opts.items) ? opts.items : [])
      .map((item) => item.category)
      .filter((slug): slug is string => typeof slug === 'string' && isPricedInterestSlug(slug))
  )]
  const ids = new Set<string>()

  if (tokens.length) {
    const { data } = await supabase.from('interest_signups').select('id').in('invite_token', tokens)
    for (const row of data || []) ids.add(row.id)
  }

  const email = typeof opts.email === 'string' ? opts.email.trim().toLowerCase() : ''
  if (email && slugs.length) {
    const { data: lists } = await supabase.from('interest_lists').select('id').in('slug', slugs)
    const listIds = (lists || []).map((list: { id: string }) => list.id)
    if (listIds.length) {
      const { data } = await supabase
        .from('interest_signups')
        .select('id')
        .eq('email', email)
        .in('list_id', listIds)
      for (const row of data || []) ids.add(row.id)
    }
  }

  if (!ids.size) return

  const { data: rows } = await supabase
    .from('interest_signups')
    .select('id, build_intent')
    .in('id', [...ids])

  for (const row of rows || []) {
    const { error } = await supabase
      .from('interest_signups')
      .update({
        order_id: opts.orderId,
        order_placed_at: placedAt,
        cart_at: placedAt,
      })
      .eq('id', row.id)

    if (error && String(error.message || '').includes('order_id')) {
      await supabase
        .from('interest_signups')
        .update({
          build_intent: mergeIntent(row.build_intent, {
            orderId: opts.orderId,
            orderPlacedAt: placedAt,
            cartAt: extraFromIntent(row.build_intent).cartAt || placedAt,
          }),
        })
        .eq('id', row.id)
    }
  }
}

export async function attachOrdersToSignups(
  supabase: QueryClient,
  signups: InterestSignup[],
  listSlug?: string
): Promise<InterestSignup[]> {
  if (!signups.length) return signups

  const emails = [...new Set(signups.map((signup) => signup.email).filter(Boolean))]
  const knownIds = [...new Set(signups.map(signupOrderId).filter((id): id is string => Boolean(id)))]

  let orders: InterestSignupOrder[] = []
  if (emails.length) {
    const { data } = await supabase
      .from('orders')
      .select('id, customer_email, status, payment_plan, balance_status, deposit_amount, balance_amount, created_at, order_details')
      .in('customer_email', emails)
      .order('created_at', { ascending: false })
      .limit(200)
    orders = (data || []) as InterestSignupOrder[]
  }

  const byId = new Map(orders.map((order) => [order.id, order]))
  const missing = knownIds.filter((id) => !byId.has(id))
  if (missing.length) {
    const { data } = await supabase
      .from('orders')
      .select('id, customer_email, status, payment_plan, balance_status, deposit_amount, balance_amount, created_at, order_details')
      .in('id', missing)
    for (const order of (data || []) as InterestSignupOrder[]) byId.set(order.id, order)
  }

  return signups.map((signup) => {
    const linkedId = signupOrderId(signup)
    if (linkedId && byId.has(linkedId)) {
      return { ...signup, order: byId.get(linkedId) }
    }

    const matches = orders.filter((order) => {
      if ((order.customer_email || '').toLowerCase() !== signup.email.toLowerCase()) return false
      const items = order.order_details?.items || []
      if (signup.invite_token && items.some((item) => item.customConfig?.inviteToken === signup.invite_token)) {
        return true
      }
      if (listSlug && items.some((item) => item.category === listSlug)) return true
      return items.some((item) => isPricedInterestSlug(item.category || ''))
    })
    return { ...signup, order: matches[0] || null }
  })
}
