export type InterestQuestion = {
  key: string
  label: string
  type: 'single' | 'multi' | 'text'
  required?: boolean
  options?: string[]
}

export type InterestListStatus = 'draft' | 'open' | 'closed' | 'launched'

export type InterestList = {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  hero_image_url: string | null
  gallery_images: string[] | null
  price_from: number | string | null
  price_to: number | string | null
  expected_launch: string | null
  status: InterestListStatus
  show_count: boolean
  questions: InterestQuestion[] | null
  launched_product_id: string | null
  pricing?: unknown
  created_at: string
  updated_at: string
}

export type InterestSignup = {
  id: string
  list_id: string
  email: string
  name: string | null
  answers: Record<string, string | string[]>
  notes: string | null
  source: string
  marketing_consent: boolean
  notified: boolean
  notified_at: string | null
  invite_token?: string | null
  invite_sent_at?: string | null
  invite_viewed_at?: string | null
  build_intent?: {
    metalId: string
    metalName: string
    handleId: string
    handleName: string
    total: number
    deposit: number
    balance: number
  } | null
  build_intent_at?: string | null
  created_at: string
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const INTEREST_PUBLIC_FIELDS =
  'id, slug, name, tagline, description, hero_image_url, gallery_images, price_from, price_to, expected_launch, status, show_count, questions, launched_product_id, pricing, created_at, updated_at'

const extraQuestion: InterestQuestion = {
  key: 'extra',
  label: 'Anything else I should know?',
  type: 'text',
  required: false,
}

export const BOTTLE_OPENER_QUESTIONS: InterestQuestion[] = [extraQuestion]

export const MUDDLER_QUESTIONS: InterestQuestion[] = [extraQuestion]

type InterestSeed = {
  slug: string
  name: string
  tagline: string
  description: string
  hero_image_url: string | null
  gallery_images: string[]
  price_from: number | null
  price_to: number | null
  expected_launch: string
  status: InterestListStatus
  show_count: boolean
  questions: InterestQuestion[]
  launched_product_id: string | null
}

export const BOTTLE_OPENER_SEED: InterestSeed = {
  slug: 'bottle-opener',
  name: 'The Bottle Opener',
  tagline: "Not in production. Might be. That bit's on you.",
  description:
    "Pick the head metal and the handle wood. Construction is the same as everything else on here — a dowel through the middle, no shortcuts.\n\nI made one to find out whether the idea held up. It does. Heavy in the hand, and it opens a bottle without any drama.\n\nWhat I'm not doing is tooling up a batch on a hunch — there's stock to buy and a milling setup to sort for that hook, and that's a fair bit of work before a single one gets sold.\n\nIf enough of you put your hand up — and a few of you put a deposit down — I'll build them for the end of November.\n\n50% now, 50% when it's done. Or just join the list if you're not ready to commit.",
  hero_image_url: null,
  gallery_images: [],
  price_from: null,
  price_to: null,
  expected_launch: 'Pre-orders aimed at the end of November 2026',
  status: 'open',
  show_count: false,
  questions: BOTTLE_OPENER_QUESTIONS,
  launched_product_id: null,
}

export const MUDDLER_SEED: InterestSeed = {
  slug: 'muddler',
  name: 'The Hashtag Muddler',
  tagline: "Not in production. Might be. That bit's on you.",
  description:
    "The head is always Lignum Vitae. That's not a choice — it's the bit that does the work, and nothing else belongs there.\n\nWhat I need from you is the rest: transition metal, and the handle material. The prototype was African Blackwood with a brass transition, one-piece transition and a dual-ended dowel — same construction as everything else on here.\n\nI made one to find out whether a muddler belonged in the lineup. It does. Heavy enough to smash sugar and bitters for an Old Fashioned, crush mint for a Mojito, then wipe it off and put it back.\n\nWhat I'm not doing is tooling up a batch on a hunch. If enough of you put your hand up — and a few of you put a deposit down — I'll build them for the end of November.\n\n50% now, 50% when it's done. Or just join the list if you're not ready to commit.",
  hero_image_url: null,
  gallery_images: [],
  price_from: null,
  price_to: null,
  expected_launch: 'Pre-orders aimed at the end of November 2026',
  status: 'open',
  show_count: false,
  questions: MUDDLER_QUESTIONS,
  launched_product_id: null,
}

const DEFAULT_INTEREST_LISTS: InterestSeed[] = [BOTTLE_OPENER_SEED, MUDDLER_SEED]

function questionsNeedRefresh(raw: unknown): boolean {
  const keys = parseQuestions(raw).map((q) => q.key)
  return keys.includes('handle_timber') || keys.includes('price_band')
}

export async function ensureDefaultInterestLists(supabase: {
  from: (table: string) => any
}): Promise<void> {
  for (const seed of DEFAULT_INTEREST_LISTS) {
    const { data, error } = await supabase
      .from('interest_lists')
      .select('id, questions, description')
      .eq('slug', seed.slug)
      .maybeSingle()

    if (error) {
      console.error('Interest seed lookup error:', error)
      continue
    }

    if (!data) {
      const { error: insertError } = await supabase.from('interest_lists').insert(seed)
      if (insertError && insertError.code !== '23505') {
        console.error('Interest seed insert error:', insertError)
      }
      continue
    }

    const keys = parseQuestions(data.questions).map((q) => q.key)
    const description = typeof data.description === 'string' ? data.description : ''
    const waitlistOnlyNeeded = keys.includes('head_metal') || keys.includes('transition_metal')
    const muddlerNeedsCopy =
      seed.slug === 'muddler' &&
      (!keys.includes('handle_material') ||
        description.includes('African Blackwood handle, brass transition') ||
        !description.includes('The head is always Lignum Vitae'))
    const bottleNeedsCopy =
      seed.slug === 'bottle-opener' &&
      (questionsNeedRefresh(data.questions) ||
        !keys.includes('handle_material') ||
        description.includes("You're not buying anything") ||
        description.includes('The head metal is yours to pick'))

    if (waitlistOnlyNeeded) {
      const { error: updateError } = await supabase
        .from('interest_lists')
        .update({
          questions: seed.questions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
      if (updateError) console.error('Interest seed update error:', updateError)
      continue
    }

    if (muddlerNeedsCopy || bottleNeedsCopy) {
      const { error: updateError } = await supabase
        .from('interest_lists')
        .update({
          questions: seed.questions,
          description: seed.description,
          tagline: seed.tagline,
          expected_launch: seed.expected_launch,
          price_from: null,
          price_to: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
      if (updateError) {
        console.error('Interest seed update error:', updateError)
      }
    }
  }
}

export function isSlugSafeKey(key: string): boolean {
  return /^[a-z0-9_-]+$/.test(key)
}

export function parseQuestions(raw: unknown): InterestQuestion[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((q): q is InterestQuestion => {
    if (!q || typeof q !== 'object') return false
    const item = q as InterestQuestion
    return typeof item.key === 'string' && typeof item.label === 'string' && ['single', 'multi', 'text'].includes(item.type)
  })
}

export function parseGalleryImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
}

export function sanitizeAnswers(
  questions: InterestQuestion[],
  raw: unknown
): { answers: Record<string, string | string[]>; error?: string } {
  const incoming =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const answers: Record<string, string | string[]> = {}

  for (const q of questions) {
    const val = incoming[q.key]
    if (q.type === 'multi') {
      const arr = Array.isArray(val)
        ? val.map(String).map((s) => s.trim()).filter(Boolean)
        : typeof val === 'string' && val.trim()
          ? [val.trim()]
          : []
      if (q.required && arr.length === 0) {
        return { answers, error: `Please answer: ${q.label}` }
      }
      if (arr.length) answers[q.key] = arr
    } else {
      const s = Array.isArray(val) ? String(val[0] ?? '') : String(val ?? '')
      const trimmed = s.trim()
      if (q.required && !trimmed) {
        return { answers, error: `Please answer: ${q.label}` }
      }
      if (trimmed) answers[q.key] = trimmed
    }
  }

  return { answers }
}

export const CATALOG_QUESTION_KEYS = ['head_metal', 'handle_material', 'transition_metal']

export function isCatalogQuestionKey(key: string): boolean {
  return CATALOG_QUESTION_KEYS.includes(key.trim())
}

export function validateQuestionBuilder(questions: InterestQuestion[]): string | null {
  const keys = questions.map((q) => q.key.trim())
  if (keys.some((k) => !k)) return 'Every question needs a key'
  if (keys.some((k) => !isSlugSafeKey(k))) {
    return 'Question keys must be slug-safe (lowercase letters, numbers, hyphens, underscores)'
  }
  if (new Set(keys).size !== keys.length) return 'Question keys must be unique'
  if (questions.some((q) => !q.label.trim())) return 'Every question needs a label'
  if (questions.some((q) =>
    (q.type === 'single' || q.type === 'multi') &&
    !isCatalogQuestionKey(q.key) &&
    !(q.options || []).some((o) => o.trim())
  )) {
    return 'Single and multi questions need at least one option'
  }
  return null
}

export function formatLikelyPrice(from: number | string | null, to: number | string | null): string | null {
  if (from === null || from === undefined || from === '') return null
  const a = Number(from)
  if (!Number.isFinite(a)) return null
  const fmt = (n: number) => (Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`)
  if (to !== null && to !== undefined && to !== '') {
    const b = Number(to)
    if (Number.isFinite(b)) return `Likely around ${fmt(a)}–${fmt(b)}`
  }
  return `Likely around ${fmt(a)}`
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function interestEmailShell(opts: {
  eyebrow: string
  heading?: string
  paragraphs: string[]
  cardTitle?: string
  cardBody?: string
  link?: { href: string; label: string }
}): string {
  const paras = opts.paragraphs
    .map((p) => `<p style="color: #ccc;">${p}</p>`)
    .join('\n            ')
  const card = opts.cardTitle || opts.cardBody
    ? `
            <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 24px; margin: 24px 0;">
              ${opts.cardTitle ? `<p style="color: #E8A000; font-weight: bold; margin-top: 0; font-size: 18px;">${opts.cardTitle}</p>` : ''}
              ${opts.cardBody ? `<p style="color: #999; font-size: 14px; margin: 12px 0 0 0;">${opts.cardBody}</p>` : ''}
            </div>`
    : ''
  const cta = opts.link
    ? `
            <div style="text-align: center; margin: 28px 0;">
              <a href="${opts.link.href}" style="display: inline-block; background: #E8A000; color: #1A1A1A; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px;">
                ${opts.link.label}
              </a>
            </div>`
    : ''

  return `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #ffffff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #E8A000; font-size: 28px; margin: 0;">#TOOLING</h1>
              <p style="color: #999; margin-top: 8px;">${opts.eyebrow}</p>
            </div>
            ${opts.heading ? `<p style="color: #E8A000; font-weight: bold; font-size: 18px;">${opts.heading}</p>` : ''}
            ${paras}
            ${card}
            ${cta}
            <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
              #TOOLING — Handcrafted tools from exotic timbers<br/>
              <a href="https://hashtag.guru" style="color: #E8A000;">hashtag.guru</a> |
              <a href="https://www.instagram.com/hashtagtooling/" style="color: #E8A000;">Instagram</a>
            </p>
          </div>
        `
}
