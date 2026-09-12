import {
  INTEREST_SPECS,
  isPricedInterestSlug,
  parseInterestPricing,
} from '@/lib/interest-pricing'

type QueryClient = {
  from: (table: string) => any
}

export async function convertInterestListToProduct(
  supabase: QueryClient,
  slug: string
): Promise<{ error?: string; basePriceId?: string }> {
  if (!isPricedInterestSlug(slug)) {
    return { error: 'This list is not a priced interest product' }
  }
  const spec = INTEREST_SPECS[slug]

  const { data: list, error: listError } = await supabase
    .from('interest_lists')
    .select('id, name, pricing')
    .eq('slug', slug)
    .maybeSingle()
  if (listError || !list) return { error: 'Interest list not found' }

  const pricing = parseInterestPricing(list.pricing, slug)

  const { data: existing } = await supabase
    .from('base_prices')
    .select('id')
    .eq('product_type', spec.productType)
    .maybeSingle()

  let basePriceId = existing?.id as string | undefined
  if (basePriceId) {
    const { error } = await supabase
      .from('base_prices')
      .update({
        base_price: pricing.base,
        style_name: spec.label,
        description: 'Promoted from interest list',
        available: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', basePriceId)
    if (error) return { error: error.message }
  } else {
    const { data: inserted, error } = await supabase
      .from('base_prices')
      .insert({
        product_type: spec.productType,
        style_name: spec.label,
        base_price: pricing.base,
        description: 'Promoted from interest list',
        available: true,
      })
      .select('id')
      .single()
    if (error || !inserted) return { error: error?.message || 'Failed to create base price' }
    basePriceId = inserted.id
  }

  const { data: woods } = await supabase.from('materials').select('id').eq('category', 'wood').limit(2000)
  const hiddenWoods = new Set(pricing.hiddenWoodIds)
  const woodRows = (woods || [])
    .filter((wood: { id: string }) => !hiddenWoods.has(wood.id))
    .map((wood: { id: string }) => ({
      material_id: wood.id,
      base_price_id: basePriceId,
      position: spec.handlePosition,
      premium: pricing.woodPremiums[wood.id] ?? 0,
    }))

  if (woodRows.length) {
    const { error } = await supabase
      .from('material_style_pricing')
      .upsert(woodRows, { onConflict: 'material_id,base_price_id,position', ignoreDuplicates: false })
    if (error) return { error: `${error.message}. Run the convert pricing SQL first.` }
  }

  const { data: metals } = await supabase
    .from('materials')
    .select('id')
    .eq('category', 'transition')
    .eq('available', true)
  const hiddenMetals = new Set(pricing.hiddenMetalIds)
  for (const metal of metals || []) {
    if (hiddenMetals.has(metal.id)) continue
    const { error } = await supabase
      .from('materials')
      .update({ [spec.metalPremiumField]: pricing.metalPremiums[metal.id] ?? 0 })
      .eq('id', metal.id)
    if (error) return { error: `${error.message}. Run the convert pricing SQL first.` }
  }

  const { error: listUpdateError } = await supabase
    .from('interest_lists')
    .update({
      pricing: { ...pricing, promoted: true },
      updated_at: new Date().toISOString(),
    })
    .eq('id', list.id)
  if (listUpdateError) return { error: listUpdateError.message }

  return { basePriceId }
}
