'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Check, Loader2 } from 'lucide-react'

interface Material {
  id: string
  name: string
  category: string
  color_hex: string
  mallet_head_premium: number
  mallet_handle_premium: number
  available: boolean
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

export default function CustomMalletPage() {
  const addItem = useCart(state => state.addItem)
  
  const [loading, setLoading] = useState(true)
  const [malletStyles, setMalletStyles] = useState<BasePrice[]>([])
  const [woods, setWoods] = useState<Material[]>([])
  const [transitions, setTransitions] = useState<TransitionMaterial[]>([])
  
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
      
      // Load wood materials
      const { data: woodData, error: woodError } = await supabase
        .from('materials')
        .select('*')
        .eq('category', 'wood')
        .eq('available', true)
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
      
      setMalletStyles(styles || [])
      setWoods(woodData || [])
      setTransitions(transData || [])
      
      // Set default selections
      if (styles && styles.length > 0) setSelectedStyle(styles[0].id)
      if (woodData && woodData.length > 0) {
        setSelectedHeadWood(woodData[0].id)
        setSelectedHandleWood(woodData[0].id)
      }
      if (transData && transData.length > 0) setSelectedTransition(transData[0].id)
      
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePrice = () => {
    const style = malletStyles.find(s => s.id === selectedStyle)
    const headWood = woods.find(w => w.id === selectedHeadWood)
    const handleWood = woods.find(w => w.id === selectedHandleWood)
    const transition = transitions.find(t => t.id === selectedTransition)
    
    if (!style) return 0
    
    let total = style.base_price
    if (headWood) total += headWood.mallet_head_premium
    if (handleWood) total += handleWood.mallet_handle_premium
    if (transition) total += transition.mallet_head_premium // Using head premium for transition
    
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
      customConfig: {
        styleId: selectedStyle,
        styleName: style.style_name,
        headWoodId: selectedHeadWood,
        headWoodName: headWood.name,
        handleWoodId: selectedHandleWood,
        handleWoodName: handleWood.name,
        transitionId: selectedTransition,
        transitionName: transition.name,
      },
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Build Your Custom Mallet</h1>
        <p className="text-zinc-600 mb-12">
          Design your perfect mallet by selecting the style, woods, and transition material. 
          Each mallet is handcrafted to order.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Mallet Type */}
            <Card>
              <CardHeader>
                <CardTitle>1. Select Mallet Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {malletStyles.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedStyle === style.id 
                        ? 'border-zinc-900 bg-zinc-50' 
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{style.style_name}</p>
                        <p className="text-sm text-zinc-500">{style.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(style.base_price)}</p>
                        {selectedStyle === style.id && (
                          <Check className="h-5 w-5 text-zinc-900 mt-1 ml-auto" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Head Wood */}
            <Card>
              <CardHeader>
                <CardTitle>2. Select Head Wood</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {woods.map(wood => (
                    <button
                      key={wood.id}
                      onClick={() => setSelectedHeadWood(wood.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedHeadWood === wood.id 
                          ? 'border-zinc-900 bg-zinc-50' 
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border border-zinc-300 flex-shrink-0"
                          style={{ backgroundColor: wood.color_hex }}
                        />
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium block">{wood.name}</span>
                          {wood.mallet_head_premium > 0 && (
                            <span className="text-xs text-zinc-500">+£{wood.mallet_head_premium}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Handle Wood */}
            <Card>
              <CardHeader>
                <CardTitle>3. Select Handle Wood</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {woods.map(wood => (
                    <button
                      key={wood.id}
                      onClick={() => setSelectedHandleWood(wood.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedHandleWood === wood.id 
                          ? 'border-zinc-900 bg-zinc-50' 
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border border-zinc-300 flex-shrink-0"
                          style={{ backgroundColor: wood.color_hex }}
                        />
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium block">{wood.name}</span>
                          {wood.mallet_handle_premium > 0 && (
                            <span className="text-xs text-zinc-500">+£{wood.mallet_handle_premium}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transition Material */}
            <Card>
              <CardHeader>
                <CardTitle>4. Select Transition Material</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {transitions.map(material => (
                  <button
                    key={material.id}
                    onClick={() => setSelectedTransition(material.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTransition === material.id 
                        ? 'border-zinc-900 bg-zinc-50' 
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full border border-zinc-300"
                          style={{ backgroundColor: material.color_hex }}
                        />
                        <div>
                          <span className="font-medium block">{material.name}</span>
                          {material.mallet_head_premium > 0 && (
                            <span className="text-xs text-zinc-500">+£{material.mallet_head_premium}</span>
                          )}
                        </div>
                      </div>
                      {selectedTransition === material.id && (
                        <Check className="h-5 w-5 text-zinc-900" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preview & Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Your Custom Mallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Placeholder Image */}
                <div className="aspect-square bg-zinc-100 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-400">Preview Image</p>
                </div>

                {/* Configuration Summary */}
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-600">Style:</span>
                    <p className="font-medium">
                      {malletStyles.find(s => s.id === selectedStyle)?.style_name || 'Select a style'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-600">Head Wood:</span>
                    <p className="font-medium">
                      {woods.find(w => w.id === selectedHeadWood)?.name || 'Select wood'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-600">Handle Wood:</span>
                    <p className="font-medium">
                      {woods.find(w => w.id === selectedHandleWood)?.name || 'Select wood'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-600">Transition:</span>
                    <p className="font-medium">
                      {transitions.find(t => t.id === selectedTransition)?.name || 'Select material'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Base price:</span>
                      <span>{formatPrice(malletStyles.find(s => s.id === selectedStyle)?.base_price || 0)}</span>
                    </div>
                    {woods.find(w => w.id === selectedHeadWood)?.mallet_head_premium ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Head wood premium:</span>
                        <span>+{formatPrice(woods.find(w => w.id === selectedHeadWood)!.mallet_head_premium)}</span>
                      </div>
                    ) : null}
                    {woods.find(w => w.id === selectedHandleWood)?.mallet_handle_premium ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Handle wood premium:</span>
                        <span>+{formatPrice(woods.find(w => w.id === selectedHandleWood)!.mallet_handle_premium)}</span>
                      </div>
                    ) : null}
                    {transitions.find(t => t.id === selectedTransition)?.mallet_head_premium ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Transition premium:</span>
                        <span>+{formatPrice(transitions.find(t => t.id === selectedTransition)!.mallet_head_premium)}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex justify-between items-center mb-4 border-t pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold">{formatPrice(calculatePrice())}</span>
                  </div>
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
                  <p className="text-xs text-zinc-500 text-center mt-3">
                    Lead time: 3-4 weeks for custom orders
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}



