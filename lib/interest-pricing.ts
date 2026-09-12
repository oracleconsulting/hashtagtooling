export const PREORDER_DELIVERY = 'End of November 2026'

export const INTEREST_SPECS = {
  'bottle-opener': {
    metalKey: 'head_metal',
    handleKey: 'handle_material',
    metalLabel: 'Head metal',
    handleLabel: 'Handle material',
    label: 'The Bottle Opener',
    defaultBase: 85,
    productType: 'bottle_opener',
    handlePosition: 'bottle_opener_handle',
    metalPremiumField: 'bottle_opener_metal_premium',
  },
  muddler: {
    metalKey: 'transition_metal',
    handleKey: 'handle_material',
    metalLabel: 'Transition metal',
    handleLabel: 'Handle material',
    label: 'The Hashtag Muddler',
    defaultBase: 165,
    productType: 'muddler',
    handlePosition: 'muddler_handle',
    metalPremiumField: 'muddler_transition_premium',
  },
} as const

export type InterestPricedSlug = keyof typeof INTEREST_SPECS

export type InterestListPricing = {
  base: number
  metalPremiums: Record<string, number>
  woodPremiums: Record<string, number>
  hiddenMetalIds: string[]
  hiddenWoodIds: string[]
  promoted?: boolean
}

export type InterestMaterialOption = {
  id: string
  name: string
  premium: number
  color_hex?: string | null
  grain_image_url?: string | null
}

export type InterestPricingCatalog = {
  slug: InterestPricedSlug
  base: number
  woods: InterestMaterialOption[]
  metals: InterestMaterialOption[]
}

type QueryClient = {
  from: (table: string) => any
}

function recordOfNumbers(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(value)
    if (key && Number.isFinite(n)) out[key] = n
  }
  return out
}

function arrayOfStrings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map(String).filter(Boolean)
}

export function isPricedInterestSlug(slug: string): slug is InterestPricedSlug {
  return slug in INTEREST_SPECS
}

export function isInterestPreorderItem(item: {
  category?: string
  customConfig?: { custom_build?: boolean }
}): boolean {
  return Boolean(item.customConfig?.custom_build && item.category && isPricedInterestSlug(item.category))
}

export function parseInterestPricing(raw: unknown, slug?: string): InterestListPricing {
  const spec = slug && isPricedInterestSlug(slug) ? INTEREST_SPECS[slug] : null
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const base = Number(obj.base)
  return {
    base: Number.isFinite(base) ? base : spec?.defaultBase ?? 0,
    metalPremiums: recordOfNumbers(obj.metalPremiums),
    woodPremiums: recordOfNumbers(obj.woodPremiums),
    hiddenMetalIds: arrayOfStrings(obj.hiddenMetalIds),
    hiddenWoodIds: arrayOfStrings(obj.hiddenWoodIds),
    promoted: obj.promoted === true,
  }
}

export function isInterestPricingPromoted(raw: unknown): boolean {
  return Boolean(raw && typeof raw === 'object' && !Array.isArray(raw) && (raw as { promoted?: unknown }).promoted === true)
}

export function waitlistQuestions<T extends { key: string }>(slug: string, questions: T[]): T[] {
  if (!isPricedInterestSlug(slug)) return questions
  const spec = INTEREST_SPECS[slug]
  return questions.filter((question) => question.key !== spec.metalKey && question.key !== spec.handleKey)
}

export function withInterestChoiceQuestions<T extends { key: string; label: string; type: string; required?: boolean; options?: string[] }>(
  slug: string,
  questions: T[]
): T[] {
  if (!isPricedInterestSlug(slug)) return questions
  const spec = INTEREST_SPECS[slug]
  const next = [...questions]
  const extra = next.filter((question) => question.key === 'extra')
  const rest = next.filter((question) => question.key !== 'extra' && question.key !== spec.metalKey && question.key !== spec.handleKey)
  const metal = next.find((question) => question.key === spec.metalKey) || {
    key: spec.metalKey,
    label: spec.metalLabel,
    type: 'single',
    required: true,
    options: [],
  }
  const handle = next.find((question) => question.key === spec.handleKey) || {
    key: spec.handleKey,
    label: spec.handleLabel,
    type: 'single',
    required: true,
    options: [],
  }
  return [metal, handle, ...rest, ...extra] as T[]
}

export function applyCatalogToQuestions<T extends { key: string; options?: string[] }>(
  questions: T[],
  catalog: InterestPricingCatalog | null | undefined
): T[] {
  if (!catalog) return questions
  const spec = INTEREST_SPECS[catalog.slug]
  return questions.map((question) => {
    if (question.key === spec.metalKey) {
      return { ...question, options: catalog.metals.map((metal) => metal.name) }
    }
    if (question.key === spec.handleKey) {
      return { ...question, options: catalog.woods.map((wood) => wood.name) }
    }
    return question
  })
}

function answerValue(
  answers: Record<string, string | string[] | undefined> | null | undefined,
  key: string
): string | null {
  const raw = answers?.[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  return value?.trim() || null
}

function matchByName<T extends { name: string }>(items: T[], name: string | null): T | undefined {
  if (!name) return undefined
  const needle = name.trim().toLowerCase()
  return items.find((item) => item.name.trim().toLowerCase() === needle)
}

export function quoteInterestBuild(
  slug: string,
  answers: Record<string, string | string[] | undefined> | null | undefined,
  catalog: InterestPricingCatalog | null | undefined
): {
  total: number
  deposit: number
  balance: number
  metal: string | null
  handle: string | null
  breakdown: { label: string; amount: number }[]
} | null {
  if (!isPricedInterestSlug(slug) || !catalog) return null
  const spec = INTEREST_SPECS[slug]
  const metal = answerValue(answers, spec.metalKey)
  const handle = answerValue(answers, spec.handleKey)
  const metalRow = matchByName(catalog.metals, metal)
  const handleRow = matchByName(catalog.woods, handle)
  const metalExtra = metalRow?.premium ?? 0
  const handleExtra = handleRow?.premium ?? 0
  const total = catalog.base + metalExtra + handleExtra

  const breakdown: { label: string; amount: number }[] = [{ label: 'Base', amount: catalog.base }]
  if (metal) breakdown.push({ label: metal, amount: metalExtra })
  if (handle) breakdown.push({ label: handle, amount: handleExtra })

  return {
    total,
    deposit: Math.round(total * 50) / 100,
    balance: Math.round(total * 50) / 100,
    metal,
    handle,
    breakdown,
  }
}

function siteOrigin(siteUrl: string): string {
  try {
    return new URL(siteUrl).origin
  } catch {
    return 'https://hashtag.guru'
  }
}

export function publicInterestBuildUrl(slug: string, siteUrl = 'https://hashtag.guru'): string {
  const origin = siteOrigin(siteUrl)
  if (!isPricedInterestSlug(slug)) return `${origin}/interest/${slug}`
  return `${origin}/interest/${slug}/build`
}

export function buildInterestCatalog(
  slug: InterestPricedSlug,
  pricing: InterestListPricing,
  woods: { id: string; name: string; color_hex?: string | null; grain_image_url?: string | null }[],
  metals: { id: string; name: string; color_hex?: string | null; mallet_head_premium?: number | string | null }[]
): InterestPricingCatalog {
  const hiddenWoods = new Set(pricing.hiddenWoodIds)
  const hiddenMetals = new Set(pricing.hiddenMetalIds)

  return {
    slug,
    base: pricing.base,
    woods: woods
      .filter((wood) => !hiddenWoods.has(wood.id))
      .map((wood) => ({
        id: wood.id,
        name: wood.name,
        premium: pricing.woodPremiums[wood.id] ?? 0,
        color_hex: wood.color_hex,
        grain_image_url: wood.grain_image_url,
      })),
    metals: metals
      .filter((metal) => !hiddenMetals.has(metal.id))
      .map((metal) => ({
        id: metal.id,
        name: metal.name,
        premium: pricing.metalPremiums[metal.id] ?? (Number(metal.mallet_head_premium) || 0),
        color_hex: metal.color_hex,
      })),
  }
}

export async function loadInterestPricingCatalog(
  supabase: QueryClient,
  slug: string
): Promise<InterestPricingCatalog | null> {
  if (!isPricedInterestSlug(slug)) return null
  const spec = INTEREST_SPECS[slug]

  let listRes = await supabase.from('interest_lists').select('pricing').eq('slug', slug).maybeSingle()
  if (listRes.error) {
    listRes = { data: { pricing: {} }, error: null }
  }

  const listPricing = parseInterestPricing(listRes.data?.pricing, slug)

  const [woodsRes, metalsRes] = await Promise.all([
    supabase
      .from('materials')
      .select('id, name, color_hex, grain_image_url')
      .eq('category', 'wood')
      .eq('available', true)
      .order('name')
      .limit(2000),
    supabase
      .from('materials')
      .select(`id, name, color_hex, mallet_head_premium, ${spec.metalPremiumField}`)
      .eq('category', 'transition')
      .eq('available', true)
      .order('name'),
  ])

  const woods = woodsRes.data || []
  let metals = metalsRes.data as
    | { id: string; name: string; mallet_head_premium?: number | string | null; [key: string]: unknown }[]
    | null
  if (metalsRes.error) {
    const fallback = await supabase
      .from('materials')
      .select('id, name, color_hex, mallet_head_premium')
      .eq('category', 'transition')
      .eq('available', true)
      .order('name')
    metals = fallback.data || []
  }

  if (woodsRes.error) {
    console.error('Interest catalog woods error:', woodsRes.error)
    return null
  }
  if (!metals) {
    console.error('Interest catalog metals error:', metalsRes.error)
    return null
  }

  const pricing = { ...listPricing }

  if (listPricing.promoted) {
    const { data: baseRow } = await supabase
      .from('base_prices')
      .select('id, base_price')
      .eq('product_type', spec.productType)
      .maybeSingle()
    if (baseRow) {
      pricing.base = Number(baseRow.base_price) || pricing.base
      const { data: msp } = await supabase
        .from('material_style_pricing')
        .select('material_id, premium')
        .eq('base_price_id', baseRow.id)
        .eq('position', spec.handlePosition)
      const woodPremiums: Record<string, number> = {}
      for (const row of msp || []) {
        woodPremiums[row.material_id] = Number(row.premium) || 0
      }
      if (Object.keys(woodPremiums).length) pricing.woodPremiums = woodPremiums
    }

    const metalPremiums: Record<string, number> = {}
    for (const metal of metals) {
      const extra = Number(metal[spec.metalPremiumField])
      metalPremiums[metal.id] = Number.isFinite(extra) ? extra : Number(metal.mallet_head_premium) || 0
    }
    if (Object.keys(metalPremiums).length) pricing.metalPremiums = metalPremiums
  }

  return buildInterestCatalog(slug, pricing, woods, metals)
}
