'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Check, Loader2, Info } from 'lucide-react'
import { SquareProfileSVG } from '@/components/SquareProfileSVG'
import dynamic from 'next/dynamic'
import {
  SQUARE_SPECS,
  BODY_MATERIALS,
  SCALE_TYPES,
  type SquareSize,
  type ScaleType,
  type ScaleVariant,
} from '@/lib/square-geometry'

const SquarePreview3D = dynamic(() => import('@/components/SquarePreview3D'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] rounded-lg bg-zinc-900 animate-pulse" />,
})

interface BasePrice {
  id: string
  product_type: string
  style_name: string
  base_price: number
  description: string
}

interface Material {
  id: string
  name: string
  category: string
  color_hex: string
  available: boolean
  grain_image_url?: string | null
  square_scale_premium?: number
  square_liner_premium?: number
  available_square_scale?: boolean
}

interface MaterialStylePricingRow {
  material_id: string
  base_price_id: string
  position: string
  premium: number
}

const SIZE_KEYS: SquareSize[] = ['chode', '95mm', '125mm', '175mm', '250mm']

export default function CustomSquarePage() {
  const addItem = useCart((state) => state.addItem)

  const [loading, setLoading] = useState(true)
  const [basePrices, setBasePrices] = useState<BasePrice[]>([])
  const [woodScales, setWoodScales] = useState<Material[]>([])
  const [cfScales, setCfScales] = useState<Material[]>([])
  const [liners, setLiners] = useState<Material[]>([])
  const [stylePricing, setStylePricing] = useState<MaterialStylePricingRow[]>([])

  const [selectedSize, setSelectedSize] = useState<SquareSize>('95mm')
  const [selectedBody, setSelectedBody] = useState<string>('tool_steel')
  const [selectedScaleType, setSelectedScaleType] = useState<string>('full_scale')
  const [selectedLiner, setSelectedLiner] = useState<string | null>(null)
  const [selectedScaleMaterial, setSelectedScaleMaterial] = useState<string | null>(null)
  const [scaleMaterialType, setScaleMaterialType] = useState<'wood' | 'cf'>('wood')
  const [addedToCart, setAddedToCart] = useState(false)
  const [show3D, setShow3D] = useState(false)

  const scaleVariant: ScaleVariant = scaleMaterialType === 'cf' ? 'wide_cf' : 'narrow'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const { data: pricesData, error: pricesError } = await supabase
        .from('base_prices')
        .select('*')
        .eq('product_type', 'square')
        .eq('available', true)

      if (pricesError) throw pricesError
      const prices = pricesData || []
      const priceIds = prices.map((p) => p.id)

      const [woodRes, cfRes, linerRes, mspRes] = await Promise.all([
        supabase.from('materials').select('*').eq('category', 'wood').eq('available', true).order('name').limit(2000),
        supabase.from('materials').select('*').eq('category', 'square_scale').eq('available', true).order('sort_order'),
        supabase.from('materials').select('*').eq('category', 'liner').eq('available', true).order('sort_order'),
        priceIds.length
          ? supabase
              .from('material_style_pricing')
              .select('material_id, base_price_id, position, premium')
              .in('base_price_id', priceIds)
              .eq('position', 'square_scale')
              .limit(5000)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (woodRes.error) throw woodRes.error
      if (cfRes.error) throw cfRes.error
      if (linerRes.error) throw linerRes.error
      if (mspRes.error) throw mspRes.error

      setBasePrices(prices)
      setStylePricing((mspRes.data || []) as MaterialStylePricingRow[])

      const woodsFiltered = (woodRes.data || []).filter((w) => (w as Material).available_square_scale !== false)
      setWoodScales(woodsFiltered)
      setCfScales(cfRes.data || [])
      setLiners(linerRes.data || [])

      const standardLiners = (linerRes.data || []).filter((l) => l.name.includes('1mm') && !l.name.includes('2.5mm'))
      if (standardLiners.length) setSelectedLiner(standardLiners[0].id)
      if (woodsFiltered.length) setSelectedScaleMaterial(woodsFiltered[0].id)
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedLinerObj = liners.find((l) => l.id === selectedLiner)
  const isThickLiner = selectedLinerObj?.name.includes('2.5mm') || false

  const availableScaleOptions = (): { woods: Material[]; cfs: Material[] } => {
    if (isThickLiner) {
      const thinCf = cfScales.filter((c) => c.name.includes('1mm'))
      return { woods: [], cfs: thinCf }
    }
    return { woods: woodScales, cfs: cfScales }
  }

  const handleLinerChange = (linerId: string) => {
    setSelectedLiner(linerId)
    const liner = liners.find((l) => l.id === linerId)
    const nowThick = liner?.name.includes('2.5mm') || false

    if (nowThick) {
      const thinCf = cfScales.find((c) => c.name.includes('1mm'))
      if (thinCf) {
        setSelectedScaleMaterial(thinCf.id)
        setScaleMaterialType('cf')
      }
    } else if (isThickLiner && !nowThick) {
      if (woodScales.length) {
        setSelectedScaleMaterial(woodScales[0].id)
        setScaleMaterialType('wood')
      }
    }
  }

  const getBasePrice = (): number => {
    const styleName = `${selectedSize}_${selectedBody}`
    const bp = basePrices.find((p) => p.style_name === styleName)
    return bp?.base_price || 0
  }

  const getSquareStylePremiumForWood = (woodId: string | null): number => {
    if (!woodId) return 0
    const wood = woodScales.find((w) => w.id === woodId)
    if (!wood) return 0
    const styleName = `${selectedSize}_${selectedBody}`
    const bp = basePrices.find((p) => p.style_name === styleName)
    if (!bp) return wood.square_scale_premium || 0
    const row = stylePricing.find(
      (sp) => sp.material_id === woodId && sp.base_price_id === bp.id && sp.position === 'square_scale'
    )
    if (row) return Number(row.premium) || 0
    return wood.square_scale_premium || 0
  }

  const getScalePremium = (): number => {
    if (scaleMaterialType === 'cf') {
      const cf = cfScales.find((c) => c.id === selectedScaleMaterial)
      return cf?.square_scale_premium || 0
    }
    return getSquareStylePremiumForWood(selectedScaleMaterial)
  }

  const getLinerPremium = (): number => {
    return selectedLinerObj?.square_liner_premium || 0
  }

  const calculatePrice = () => getBasePrice() + getScalePremium() + getLinerPremium()

  const getScaleColor = (): string => {
    if (scaleMaterialType === 'cf') return '#2A2A2A'
    const wood = woodScales.find((w) => w.id === selectedScaleMaterial)
    return wood?.color_hex || '#8B6914'
  }

  const getLinerColor = (): string => selectedLinerObj?.color_hex || '#C8963E'
  const getBodyColor = (): string => BODY_MATERIALS.find((b) => b.id === selectedBody)?.color || '#555555'

  const getScaleName = (): string => {
    if (scaleMaterialType === 'cf') {
      return cfScales.find((c) => c.id === selectedScaleMaterial)?.name || 'Carbon Fibre'
    }
    return woodScales.find((w) => w.id === selectedScaleMaterial)?.name || '—'
  }

  const getLinerThickness = (): string => {
    return selectedLinerObj?.name.includes('2.5mm') ? '2.5mm' : '1mm'
  }

  const getScaleThickness = (): string => {
    if (scaleMaterialType === 'cf') {
      const cf = cfScales.find((c) => c.id === selectedScaleMaterial)
      if (cf?.name.includes('2.5mm')) return '2.5mm'
      return '1mm'
    }
    return '2-3mm'
  }

  const handleAddToCart = () => {
    if (!selectedScaleMaterial || !selectedLiner) return

    const specs = SQUARE_SPECS[selectedSize]
    const bodyLabel = BODY_MATERIALS.find((b) => b.id === selectedBody)?.label || selectedBody
    const scaleTypeLabel = SCALE_TYPES.find((s) => s.id === selectedScaleType)?.label || selectedScaleType
    const linerMetal = selectedLinerObj?.name.split(' (')[0] || 'Brass'

    addItem({
      id: `custom-square-${Date.now()}`,
      name: `Custom ${specs.label} ${scaleTypeLabel} Square — ${bodyLabel} / ${getScaleName()} / ${linerMetal}`,
      price: calculatePrice(),
      quantity: 1,
      image_url: 'https://placehold.co/600x400/666/white?text=Custom+Square',
      category: 'square',
      stock_status: 'made_to_order',
      customConfig: {
        custom_build: true,
        square_size: selectedSize,
        scale_type: selectedScaleType,
        body_material: selectedBody,
        scale_material: getScaleName(),
        liner_material: linerMetal,
        liner_thickness: getLinerThickness(),
        scale_thickness: getScaleThickness(),
      },
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
        </div>
      </div>
    )
  }

  const { woods: filteredWoods, cfs: filteredCfs } = availableScaleOptions()

  return (
    <div className="container mx-auto px-4 py-12 pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-4xl font-bold mb-4 text-brand-orange">Build Your Engineering Square</h1>
        <p className="text-zinc-400 mb-12">
          Precision laser-cut body. Exotic timber or carbon fibre scales. Brass, bronze, or copper liner.
          Choose your size, materials, and scale type — each square is made to order.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Preview */}
          <div className="order-1 lg:sticky lg:top-24 h-fit">
            <div className="sticky top-20 z-10 bg-brand-dark py-2 md:py-0 md:static lg:bg-transparent">
              <div className="bg-zinc-950/60 rounded-2xl border border-brand-dark-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Preview</p>
                  <div className="flex bg-zinc-900 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setShow3D(false)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        !show3D ? 'bg-brand-orange text-black font-medium' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      2D
                    </button>
                    <button
                      onClick={() => setShow3D(true)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        show3D ? 'bg-brand-orange text-black font-medium' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      3D
                    </button>
                  </div>
                </div>

                {show3D ? (
                  <SquarePreview3D
                    size={selectedSize}
                    scaleType={selectedScaleType as ScaleType}
                    scaleVariant={scaleVariant}
                    bodyColor={getBodyColor()}
                    scaleColor={getScaleColor()}
                    linerColor={getLinerColor()}
                    scaleTextureUrl={
                      scaleMaterialType === 'wood'
                        ? woodScales.find((w) => w.id === selectedScaleMaterial)?.grain_image_url ?? null
                        : null
                    }
                    linerThicknessMm={isThickLiner ? 2.5 : 1}
                    scaleThicknessMm={
                      scaleMaterialType === 'cf'
                        ? selectedScaleMaterial && cfScales.find((c) => c.id === selectedScaleMaterial)?.name.includes('2.5mm')
                          ? 2.5
                          : 1
                        : 3
                    }
                  />
                ) : (
                  <SquareProfileSVG
                    size={selectedSize}
                    scaleType={selectedScaleType as ScaleType}
                    scaleVariant={scaleVariant}
                    bodyColor={getBodyColor()}
                    scaleColor={getScaleColor()}
                    linerColor={getLinerColor()}
                    linerThicknessMm={isThickLiner ? 2.5 : 1}
                    showDimensions
                    showHoles
                  />
                )}
              </div>
              <p className="text-zinc-500 text-xs mt-2 text-center">
                {SQUARE_SPECS[selectedSize].label} — {SQUARE_SPECS[selectedSize].width}mm × {SQUARE_SPECS[selectedSize].height}mm — Chamfer {SQUARE_SPECS[selectedSize].chamfer}mm
              </p>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="space-y-8 md:space-y-6 order-2">
            {/* Step 1: Size */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">1. Choose Size</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {SIZE_KEYS.map((sizeKey) => {
                  const spec = SQUARE_SPECS[sizeKey]
                  return (
                    <button
                      key={sizeKey}
                      onClick={() => setSelectedSize(sizeKey)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedSize === sizeKey
                          ? 'border-brand-orange bg-brand-orange/10'
                          : 'border-brand-dark-border hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 flex-shrink-0">
                            <SquareProfileSVG size={sizeKey} bodyColor="#999" opacity={0.6} showHoles={false} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{spec.label}</p>
                            <p className="text-xs text-zinc-400">
                              {spec.width}mm × {spec.height}mm — {spec.chamfer}mm chamfer — {spec.holes} pins
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">{spec.description}</p>
                          </div>
                        </div>
                        {selectedSize === sizeKey && <Check className="h-5 w-5 text-brand-orange flex-shrink-0" />}
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Step 2: Body Material */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">2. Body Material</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {BODY_MATERIALS.map((mat) => {
                  const styleName = `${selectedSize}_${mat.id}`
                  const bp = basePrices.find((p) => p.style_name === styleName)
                  return (
                    <button
                      key={mat.id}
                      onClick={() => setSelectedBody(mat.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedBody === mat.id
                          ? 'border-brand-orange bg-brand-orange/10'
                          : 'border-brand-dark-border hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-zinc-600" style={{ backgroundColor: mat.color }} />
                          <div>
                            <p className="font-medium text-white">{mat.label}</p>
                            <p className="text-xs text-zinc-400">{mat.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-brand-orange">{bp ? formatPrice(bp.base_price) : '—'}</p>
                          {selectedBody === mat.id && <Check className="h-5 w-5 text-brand-orange mt-1 ml-auto" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Step 3: Scale Type */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">3. Scale Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {SCALE_TYPES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedScaleType(st.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedScaleType === st.id
                        ? 'border-brand-orange bg-brand-orange/10'
                        : 'border-brand-dark-border hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{st.label}</p>
                        <p className="text-xs text-zinc-400">{st.description}</p>
                      </div>
                      {selectedScaleType === st.id && <Check className="h-5 w-5 text-brand-orange flex-shrink-0" />}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Step 4: Liner Material + Thickness (BEFORE scale) */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">4. Liner Material &amp; Thickness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {liners.map((liner) => {
                  const metal = liner.name.split(' (')[0]
                  const thickness = liner.name.includes('2.5mm') ? '2.5mm' : '1mm'
                  return (
                    <button
                      key={liner.id}
                      onClick={() => handleLinerChange(liner.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedLiner === liner.id
                          ? 'border-brand-orange bg-brand-orange/10'
                          : 'border-brand-dark-border hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-zinc-600" style={{ backgroundColor: liner.color_hex }} />
                          <div>
                            <span className="font-medium text-white">{metal}</span>
                            <span className="text-xs text-zinc-400 ml-2">({thickness})</span>
                            {thickness === '2.5mm' && (
                              <span className="text-xs text-zinc-500 ml-1">— thick liner</span>
                            )}
                            {(liner.square_liner_premium || 0) > 0 && (
                              <span className="text-xs text-zinc-400 ml-2">+{formatPrice(liner.square_liner_premium || 0)}</span>
                            )}
                          </div>
                        </div>
                        {selectedLiner === liner.id && <Check className="h-5 w-5 text-brand-orange flex-shrink-0" />}
                      </div>
                    </button>
                  )
                })}
                {isThickLiner && (
                  <div className="flex items-start gap-2 mt-2 p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400">
                    <Info className="h-4 w-4 text-brand-orange flex-shrink-0 mt-0.5" />
                    <span>2.5mm liners only pair with 1mm carbon fibre scales. Wood and 2.5mm carbon fibre scales need a 1mm liner — switching liner thickness will reset your scale choice.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 5: Scale Material (filtered by liner choice) */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">5. Scale Material</CardTitle>
              </CardHeader>
              <CardContent>
                {isThickLiner && (
                  <div className="flex items-start gap-2 mb-4 p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400">
                    <Info className="h-4 w-4 text-brand-orange flex-shrink-0 mt-0.5" />
                    <span>2.5mm liner selected — only 1mm carbon fibre scales are compatible. Choose a 1mm liner to unlock wood species and 2.5mm carbon fibre.</span>
                  </div>
                )}

                {filteredCfs.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-zinc-500 mb-2">Carbon Fibre:</p>
                    {filteredCfs.map((cf) => (
                      <button
                        key={cf.id}
                        onClick={() => { setSelectedScaleMaterial(cf.id); setScaleMaterialType('cf') }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          scaleMaterialType === 'cf' && selectedScaleMaterial === cf.id
                            ? 'border-brand-orange bg-brand-orange/10'
                            : 'border-brand-dark-border hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full border border-zinc-600" style={{ backgroundColor: '#2A2A2A' }} />
                            <div>
                              <span className="text-sm font-medium text-white">{cf.name}</span>
                              {(cf.square_scale_premium || 0) > 0 && (
                                <span className="text-xs text-zinc-400 ml-2">+{formatPrice(cf.square_scale_premium || 0)}</span>
                              )}
                            </div>
                          </div>
                          {scaleMaterialType === 'cf' && selectedScaleMaterial === cf.id && (
                            <Check className="h-5 w-5 text-brand-orange" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredWoods.length > 0 && (
                  <>
                    <p className="text-xs text-zinc-500 mb-3">{filteredCfs.length > 0 ? 'Or choose a wood species:' : 'Choose a wood species:'}</p>
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {filteredWoods.map((wood) => (
                        <button
                          key={wood.id}
                          onClick={() => { setSelectedScaleMaterial(wood.id); setScaleMaterialType('wood') }}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            scaleMaterialType === 'wood' && selectedScaleMaterial === wood.id
                              ? 'border-brand-orange bg-brand-orange/10'
                              : 'border-brand-dark-border hover:border-zinc-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-left">
                            {wood.grain_image_url ? (
                              <img src={wood.grain_image_url} alt={wood.name} className="w-6 h-6 rounded-full border border-zinc-600 flex-shrink-0 object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full border border-zinc-600 flex-shrink-0" style={{ backgroundColor: wood.color_hex }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium block text-white">{wood.name}</span>
                              {getSquareStylePremiumForWood(wood.id) > 0 && (
                                <span className="text-xs text-zinc-400">+{formatPrice(getSquareStylePremiumForWood(wood.id))}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Your Custom Engineering Square</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Size:</span>
                    <span className="text-white font-medium">{SQUARE_SPECS[selectedSize].label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Body:</span>
                    <span className="text-white font-medium">{BODY_MATERIALS.find((b) => b.id === selectedBody)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Scale type:</span>
                    <span className="text-white font-medium">{SCALE_TYPES.find((s) => s.id === selectedScaleType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Liner:</span>
                    <span className="text-white font-medium">
                      {selectedLinerObj?.name.split(' (')[0] || '—'} ({getLinerThickness()})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Scale material:</span>
                    <span className="text-white font-medium">{getScaleName()}</span>
                  </div>
                </div>

                <div className="border-t border-brand-dark-border pt-4">
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Base price:</span>
                      <span className="text-white">{formatPrice(getBasePrice())}</span>
                    </div>
                    {getScalePremium() > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Scale premium:</span>
                        <span className="text-white">+{formatPrice(getScalePremium())}</span>
                      </div>
                    )}
                    {getLinerPremium() > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Liner premium:</span>
                        <span className="text-white">+{formatPrice(getLinerPremium())}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-4 border-t border-brand-dark-border pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-brand-orange">{formatPrice(calculatePrice())}</span>
                  </div>
                  <Button onClick={handleAddToCart} className="w-full" size="lg">
                    {addedToCart ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Added to Cart!
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </Button>
                  <p className="text-xs text-zinc-500 text-center mt-3">
                    Lead time: 3-4 weeks for custom orders
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fixed mobile CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-brand-dark-card border-t border-brand-dark-border p-4 md:hidden z-40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Total</span>
            <span className="text-xl font-bold text-brand-orange">{formatPrice(calculatePrice())}</span>
          </div>
          <Button onClick={handleAddToCart} size="lg" className="w-full">
            Add Custom Square to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
