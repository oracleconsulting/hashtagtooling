'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Check, Loader2, AlertTriangle, Clock } from 'lucide-react'

const MalletPreview3D = dynamic(() => import('@/components/MalletPreview3D').then((m) => m.MalletPreview3D), { ssr: false })

interface Material {
  id: string
  name: string
  category: string
  color_hex: string
  mallet_head_premium: number
  mallet_handle_premium: number
  available: boolean
  available_mallet_head?: boolean
  available_mallet_handle?: boolean
  grain_image_url?: string | null
}

interface BasePrice {
  id: string
  product_type: string
  style_name: string
  base_price: number
  description: string
}

interface TransitionMaterial {
  id: string
  name: string
  color_hex: string
  mallet_head_premium: number
  mallet_handle_premium: number
}

interface MaterialStylePricingRow {
  material_id: string
  base_price_id: string
  position: 'head' | 'handle'
  premium: number
  stock?: number
}

export default function CustomMalletPage() {
  const addItem = useCart(state => state.addItem)
  
  const [loading, setLoading] = useState(true)
  const [malletStyles, setMalletStyles] = useState<BasePrice[]>([])
  const [woods, setWoods] = useState<Material[]>([])
  const [transitions, setTransitions] = useState<TransitionMaterial[]>([])
  const [stylePricing, setStylePricing] = useState<MaterialStylePricingRow[]>([])

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedHeadWood, setSelectedHeadWood] = useState<string | null>(null)
  const [selectedHandleWood, setSelectedHandleWood] = useState<string | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null)

  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      setLoading(true)
      
      // Load mallet base prices
      const { data: styles, error: stylesError } = await supabase
        .from('base_prices')
        .select('*')
        .eq('product_type', 'mallet')
        .eq('available', true)
        .order('base_price')
      
      if (stylesError) throw stylesError
      
      // Load all wood materials (including unavailable so we can show sourcing warnings)
      const { data: woodData, error: woodError } = await supabase
        .from('materials')
        .select('*')
        .eq('category', 'wood')
        .order('name')
      
      if (woodError) throw woodError
      
      // Load transition materials
      const { data: transData, error: transError } = await supabase
        .from('materials')
        .select('*')
        .eq('category', 'transition')
        .eq('available', true)
        .order('mallet_head_premium')
      
      if (transError) throw transError

      const { data: mspData, error: mspError } = await supabase
        .from('material_style_pricing')
        .select('material_id, base_price_id, position, premium, stock')

      if (mspError) throw mspError

      setMalletStyles(styles || [])
      setWoods(woodData || [])
      setTransitions(transData || [])
      setStylePricing((mspData || []) as MaterialStylePricingRow[])
      
      // Set default selections
      if (styles && styles.length > 0) setSelectedStyle(styles[0].id)
      if (woodData && woodData.length > 0) {
        const headList = woodData.filter((w) => w.available_mallet_head !== false)
        const handleList = woodData.filter((w) => w.available_mallet_handle !== false)
        if (headList[0]) setSelectedHeadWood(headList[0].id)
        if (handleList[0]) setSelectedHandleWood(handleList[0].id)
      }
      if (transData && transData.length > 0) setSelectedTransition(transData[0].id)
      
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const premiumForWood = (
    woodId: string | null,
    basePriceId: string | null,
    position: 'head' | 'handle'
  ) => {
    if (!woodId || !basePriceId) return 0
    const row = stylePricing.find(
      (sp) =>
        sp.material_id === woodId &&
        sp.base_price_id === basePriceId &&
        sp.position === position
    )
    if (row) return Number(row.premium) || 0
    const wood = woods.find((w) => w.id === woodId)
    if (!wood) return 0
    return position === 'head' ? wood.mallet_head_premium : wood.mallet_handle_premium
  }

  const calculatePrice = () => {
    const style = malletStyles.find(s => s.id === selectedStyle)
    const headWood = woods.find(w => w.id === selectedHeadWood)
    const handleWood = woods.find(w => w.id === selectedHandleWood)
    const transition = transitions.find(t => t.id === selectedTransition)
    
    if (!style) return 0
    
    let total = style.base_price
    total += premiumForWood(selectedHeadWood, selectedStyle, 'head')
    total += premiumForWood(selectedHandleWood, selectedStyle, 'handle')
    if (transition) total += transition.mallet_head_premium
    
    return total
  }

  const handleAddToCart = () => {
    const style = malletStyles.find(s => s.id === selectedStyle)
    const headWood = woods.find(w => w.id === selectedHeadWood)
    const handleWood = woods.find(w => w.id === selectedHandleWood)
    const transition = transitions.find(t => t.id === selectedTransition)

    if (!style || !headWood || !handleWood || !transition || !selectedStyle || !selectedHeadWood || !selectedHandleWood || !selectedTransition) return

    const name = `Custom ${style.style_name} - ${headWood.name} / ${handleWood.name}`
    const price = calculatePrice()
    
    addItem({
      id: `custom-${Date.now()}`,
      name,
      price,
      quantity: 1,
      image_url: 'https://placehold.co/600x400/666/white?text=Custom+Mallet',
      category: 'mallet',
      stock_status: 'made_to_order',
      customConfig: {
        styleId: selectedStyle,
        styleName: style.style_name,
        headWoodId: selectedHeadWood,
        headWoodName: headWood.name,
        handleWoodId: selectedHandleWood,
        handleWoodName: handleWood.name,
        transitionId: selectedTransition,
        transitionName: transition.name,
        extendedLeadTime: extendedLeadTime || undefined,
      },
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  const stockForWood = (woodId: string, position: 'head' | 'handle'): number => {
    if (!selectedStyle) return 0
    const row = stylePricing.find(
      (sp) => sp.material_id === woodId && sp.base_price_id === selectedStyle && sp.position === position
    )
    return row?.stock != null ? Number(row.stock) : 0
  }

  const woodsForHead = useMemo(() => {
    const available = woods.filter((w) => w.available_mallet_head !== false)
    const unavailable = woods.filter((w) => w.available_mallet_head === false)
    return [...available, ...unavailable]
  }, [woods])

  const woodsForHandle = useMemo(() => {
    const available = woods.filter((w) => w.available_mallet_handle !== false)
    const unavailable = woods.filter((w) => w.available_mallet_handle === false)
    return [...available, ...unavailable]
  }, [woods])

  const headPremiumDisplay = premiumForWood(selectedHeadWood, selectedStyle, 'head')
  const handlePremiumDisplay = premiumForWood(selectedHandleWood, selectedStyle, 'handle')

  const headWoodObj = woods.find(w => w.id === selectedHeadWood)
  const handleWoodObj = woods.find(w => w.id === selectedHandleWood)
  const headNeedsSourcing = selectedHeadWood
    ? headWoodObj?.available_mallet_head === false || stockForWood(selectedHeadWood, 'head') === 0
    : false
  const handleNeedsSourcing = selectedHandleWood
    ? handleWoodObj?.available_mallet_handle === false || stockForWood(selectedHandleWood, 'handle') === 0
    : false
  const extendedLeadTime = headNeedsSourcing || handleNeedsSourcing

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-4xl font-bold mb-4 text-brand-orange">Build Your Custom Mallet</h1>
        <p className="text-zinc-400 mb-12">
          Design your perfect mallet by selecting the style, woods, and transition material. 
          Each mallet is handcrafted to order.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D Preview - left on desktop, top on mobile */}
          <div className="order-1 lg:sticky lg:top-24 h-fit">
            <div className="sticky top-20 z-10 bg-brand-dark py-2 md:py-0 md:static lg:bg-transparent">
              <MalletPreview3D
                headColor={woods.find((w) => w.id === selectedHeadWood)?.color_hex || '#555'}
                handleColor={woods.find((w) => w.id === selectedHandleWood)?.color_hex || '#555'}
                transitionColor={transitions.find((t) => t.id === selectedTransition)?.color_hex || '#555'}
                style={
                  malletStyles.find((s) => s.id === selectedStyle)?.style_name?.toLowerCase().startsWith('turn')
                    ? 'turned'
                    : 'square'
                }
              />
              <p className="text-zinc-500 text-xs mt-2 text-center">Drag to rotate • Colours are approximate</p>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="space-y-8 md:space-y-6 order-2">
            {/* Mallet Type */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">1. Select Mallet Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {malletStyles.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedStyle === style.id 
                        ? 'border-brand-orange bg-brand-orange/10' 
                        : 'border-brand-dark-border hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{style.style_name}</p>
                        <p className="text-sm text-zinc-400">{style.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-orange">{formatPrice(style.base_price)}</p>
                        {selectedStyle === style.id && (
                          <Check className="h-5 w-5 text-brand-orange mt-1 ml-auto" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Head Wood */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">2. Select Head Wood</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {woodsForHead.map(wood => {
                    const isAvailable = wood.available_mallet_head !== false
                    const stk = stockForWood(wood.id, 'head')
                    const inStock = isAvailable && stk > 0
                    const lowStock = isAvailable && stk === 1
                    const outOfStock = isAvailable && stk === 0
                    const discontinued = !isAvailable
                    return (
                      <button
                        key={wood.id}
                        onClick={() => setSelectedHeadWood(wood.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedHeadWood === wood.id 
                            ? 'border-brand-orange bg-brand-orange/10' 
                            : discontinued
                              ? 'border-zinc-800 opacity-60 hover:opacity-80 hover:border-zinc-600'
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
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-white">{wood.name}</span>
                              {inStock && !lowStock && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title={`${stk} in stock`} />}
                              {lowStock && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Low stock" />}
                              {outOfStock && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Out of stock" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2">
                              {premiumForWood(wood.id, selectedStyle, 'head') > 0 && (
                                <span className="text-xs text-zinc-400">{formatPrice(premiumForWood(wood.id, selectedStyle, 'head'))}</span>
                              )}
                              {outOfStock && <span className="text-[10px] text-amber-400">+3-4 weeks</span>}
                              {discontinued && <span className="text-[10px] text-zinc-500">May need sourcing</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Handle Wood */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">3. Select Handle Wood</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {woodsForHandle.map(wood => {
                    const isAvailable = wood.available_mallet_handle !== false
                    const stk = stockForWood(wood.id, 'handle')
                    const inStock = isAvailable && stk > 0
                    const lowStock = isAvailable && stk === 1
                    const outOfStock = isAvailable && stk === 0
                    const discontinued = !isAvailable
                    return (
                      <button
                        key={wood.id}
                        onClick={() => setSelectedHandleWood(wood.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedHandleWood === wood.id 
                            ? 'border-brand-orange bg-brand-orange/10' 
                            : discontinued
                              ? 'border-zinc-800 opacity-60 hover:opacity-80 hover:border-zinc-600'
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
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-white">{wood.name}</span>
                              {inStock && !lowStock && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title={`${stk} in stock`} />}
                              {lowStock && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Low stock" />}
                              {outOfStock && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Out of stock" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2">
                              {premiumForWood(wood.id, selectedStyle, 'handle') > 0 && (
                                <span className="text-xs text-zinc-400">{formatPrice(premiumForWood(wood.id, selectedStyle, 'handle'))}</span>
                              )}
                              {outOfStock && <span className="text-[10px] text-amber-400">+3-4 weeks</span>}
                              {discontinued && <span className="text-[10px] text-zinc-500">May need sourcing</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Transition Material */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader className="sticky top-16 z-10 bg-brand-dark-card border-b border-brand-dark-border/50 md:static md:border-0">
                <CardTitle className="text-white">4. Select Transition Material</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {transitions.map(material => (
                  <button
                    key={material.id}
                    onClick={() => setSelectedTransition(material.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTransition === material.id 
                        ? 'border-brand-orange bg-brand-orange/10' 
                        : 'border-brand-dark-border hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full border border-zinc-600"
                          style={{ backgroundColor: material.color_hex }}
                        />
                        <div>
                          <span className="font-medium block text-white">{material.name}</span>
                          {material.mallet_head_premium > 0 && (
                            <span className="text-xs text-zinc-400">+£{material.mallet_head_premium}</span>
                          )}
                        </div>
                      </div>
                      {selectedTransition === material.id && (
                        <Check className="h-5 w-5 text-brand-orange" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Your Custom Mallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Configuration Summary */}
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-400">Style:</span>
                    <p className="font-medium text-white">
                      {malletStyles.find(s => s.id === selectedStyle)?.style_name || 'Select a style'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Head Wood:</span>
                    {woods.find(w => w.id === selectedHeadWood)?.grain_image_url ? (
                      <img src={woods.find(w => w.id === selectedHeadWood)!.grain_image_url!} alt="" className="w-12 h-12 rounded-full border border-zinc-600 object-cover flex-shrink-0" />
                    ) : null}
                    <p className="font-medium text-white">
                      {woods.find(w => w.id === selectedHeadWood)?.name || 'Select wood'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Handle Wood:</span>
                    {woods.find(w => w.id === selectedHandleWood)?.grain_image_url ? (
                      <img src={woods.find(w => w.id === selectedHandleWood)!.grain_image_url!} alt="" className="w-12 h-12 rounded-full border border-zinc-600 object-cover flex-shrink-0" />
                    ) : null}
                    <p className="font-medium text-white">
                      {woods.find(w => w.id === selectedHandleWood)?.name || 'Select wood'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Transition:</span>
                    <p className="font-medium text-white">
                      {transitions.find(t => t.id === selectedTransition)?.name || 'Select material'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-brand-dark-border pt-4">
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Base price:</span>
                      <span className="text-white">{formatPrice(malletStyles.find(s => s.id === selectedStyle)?.base_price || 0)}</span>
                    </div>
                    {headPremiumDisplay > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Head wood premium:</span>
                        <span className="text-white">+{formatPrice(headPremiumDisplay)}</span>
                      </div>
                    ) : null}
                    {handlePremiumDisplay > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Handle wood premium:</span>
                        <span className="text-white">+{formatPrice(handlePremiumDisplay)}</span>
                      </div>
                    ) : null}
                    {transitions.find(t => t.id === selectedTransition)?.mallet_head_premium ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Transition premium:</span>
                        <span className="text-white">+{formatPrice(transitions.find(t => t.id === selectedTransition)!.mallet_head_premium)}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex justify-between items-center mb-4 border-t border-brand-dark-border pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-brand-orange">{formatPrice(calculatePrice())}</span>
                  </div>
                  {extendedLeadTime && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mb-4">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-200">
                          <p className="font-semibold mb-1">Extended lead time</p>
                          {headNeedsSourcing && headWoodObj && (
                            <p>{headWoodObj.name} (head) {headWoodObj.available_mallet_head === false ? 'may no longer be available to source' : 'is currently out of stock and will need to be sourced'}</p>
                          )}
                          {handleNeedsSourcing && handleWoodObj && (
                            <p>{handleWoodObj.name} (handle) {handleWoodObj.available_mallet_handle === false ? 'may no longer be available to source' : 'is currently out of stock and will need to be sourced'}</p>
                          )}
                          <p className="mt-1 text-amber-300/80">This will add approximately 3-4 weeks to the build time.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button 
                    onClick={handleAddToCart} 
                    className="w-full"
                    size="lg"
                  >
                    {addedToCart ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Added to Cart!
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </Button>
                  <p className="text-xs text-zinc-500 text-center mt-3 flex items-center justify-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {extendedLeadTime ? 'Lead time: 6-8 weeks (includes sourcing)' : 'Lead time: 3-4 weeks for custom orders'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fixed mobile CTA — only shows when all selections are made */}
        <div className="fixed bottom-0 left-0 right-0 bg-brand-dark-card border-t border-brand-dark-border p-4 md:hidden z-40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Total</span>
            <span className="text-xl font-bold text-brand-orange">{formatPrice(calculatePrice())}</span>
          </div>
          <Button
            onClick={handleAddToCart}
            size="lg"
            className="w-full"
            disabled={!selectedStyle || !selectedHeadWood || !selectedHandleWood || !selectedTransition}
          >
            Add Custom Mallet to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}



