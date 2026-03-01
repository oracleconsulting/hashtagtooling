'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Loader2 } from 'lucide-react'

interface AwlStyle {
  id: string
  style_name: string
  base_price: number
  description: string | null
}

interface Material {
  id: string
  name: string
  category: string
  color_hex: string | null
  awl_handle_premium: number
  awl_ferrule_premium: number
}

export default function CustomAwlPage() {
  const { addItem } = useCart()
  const [loading, setLoading] = useState(true)
  const [awlStyles, setAwlStyles] = useState<AwlStyle[]>([])
  const [handleWoods, setHandleWoods] = useState<Material[]>([])
  const [ferruleMaterials, setFerruleMaterials] = useState<Material[]>([])
  
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedHandleWood, setSelectedHandleWood] = useState<string | null>(null)
  const [selectedFerrule, setSelectedFerrule] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    setLoading(true)
    try {
      // Load awl styles
      const { data: styles, error: stylesError } = await supabase
        .from('base_prices')
        .select('*')
        .eq('product_type', 'awl')
        .eq('available', true)
        .order('base_price', { ascending: true })

      if (stylesError) throw stylesError
      setAwlStyles(styles || [])

      // Load wood materials
      const { data: woods, error: woodsError } = await supabase
        .from('materials')
        .select('*')
        .eq('category', 'wood')
        .eq('available', true)
        .order('name', { ascending: true })

      if (woodsError) throw woodsError
      setHandleWoods(woods || [])

      // Load ferrule materials
      const { data: ferrules, error: ferrulesError } = await supabase
        .from('materials')
        .select('*')
        .eq('category', 'transition')
        .eq('available', true)
        .order('awl_ferrule_premium', { ascending: true })

      if (ferrulesError) throw ferrulesError
      setFerruleMaterials(ferrules || [])

    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePrice = () => {
    const style = awlStyles.find(s => s.id === selectedStyle)
    const handleWood = handleWoods.find(w => w.id === selectedHandleWood)
    const ferrule = ferruleMaterials.find(f => f.id === selectedFerrule)

    if (!style || !handleWood || !ferrule) return 0

    return style.base_price + handleWood.awl_handle_premium + ferrule.awl_ferrule_premium
  }

  const handleAddToCart = () => {
    const style = awlStyles.find(s => s.id === selectedStyle)
    const handleWood = handleWoods.find(w => w.id === selectedHandleWood)
    const ferrule = ferruleMaterials.find(f => f.id === selectedFerrule)

    if (!style || !handleWood || !ferrule || !selectedStyle || !selectedHandleWood || !selectedFerrule) return

    const name = `Custom ${style.style_name} - ${handleWood.name} / ${ferrule.name} Ferrule`
    const price = calculatePrice()
    
    addItem({
      id: `custom-awl-${Date.now()}`,
      name,
      price,
      quantity: 1,
      image_url: 'https://placehold.co/600x400/666/white?text=Custom+Awl',
      customConfig: {
        styleId: selectedStyle,
        styleName: style.style_name,
        handleWoodId: selectedHandleWood,
        handleWoodName: handleWood.name,
        transitionId: selectedFerrule,
        transitionName: ferrule.name,
      },
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          <span className="ml-3 text-zinc-400">Loading awl builder...</span>
        </div>
      </div>
    )
  }

  const isConfigComplete = selectedStyle && selectedHandleWood && selectedFerrule
  const currentPrice = calculatePrice()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-4xl font-bold mb-4 text-brand-orange">Custom Awl Builder</h1>
        <p className="text-zinc-400 mb-8">
          Design your perfect custom awl by selecting a style, handle wood, and ferrule material.
          All prices include premium material costs.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Awl Style Selection */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4 text-white">1. Choose Awl Style</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {awlStyles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedStyle === style.id 
                          ? 'border-brand-orange bg-brand-orange/10' 
                          : 'border-brand-dark-border hover:border-zinc-500'
                      }`}
                    >
                      <h3 className="font-semibold mb-1 text-white">{style.style_name}</h3>
                      <p className="text-sm text-zinc-400 mb-2">{style.description}</p>
                      <p className="text-sm font-medium text-brand-orange">Base: {formatPrice(style.base_price)}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Handle Wood Selection */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4 text-white">2. Choose Handle Wood</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {handleWoods.map(wood => (
                    <button
                      key={wood.id}
                      onClick={() => setSelectedHandleWood(wood.id)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        selectedHandleWood === wood.id 
                          ? 'border-brand-orange bg-brand-orange/10' 
                          : 'border-brand-dark-border hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {wood.color_hex && (
                          <div 
                            className="w-4 h-4 rounded-full border border-zinc-600"
                            style={{ backgroundColor: wood.color_hex }}
                          />
                        )}
                        <span className="text-xs font-medium truncate text-white">{wood.name}</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {wood.awl_handle_premium > 0 ? `+${formatPrice(wood.awl_handle_premium)}` : 'Base price'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ferrule Material Selection */}
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4 text-white">3. Choose Ferrule Material</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ferruleMaterials.map(ferrule => (
                    <button
                      key={ferrule.id}
                      onClick={() => setSelectedFerrule(ferrule.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedFerrule === ferrule.id 
                          ? 'border-brand-orange bg-brand-orange/10' 
                          : 'border-brand-dark-border hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {ferrule.color_hex && (
                          <div 
                            className="w-6 h-6 rounded border border-zinc-600"
                            style={{ backgroundColor: ferrule.color_hex }}
                          />
                        )}
                        <span className="font-medium text-white">{ferrule.name}</span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {ferrule.awl_ferrule_premium > 0 ? `+${formatPrice(ferrule.awl_ferrule_premium)}` : 'Base price'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Summary & Add to Cart */}
          <div>
            <Card className="bg-brand-dark-card border border-brand-dark-border sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-white">Your Custom Awl</h2>
                
                <div className="space-y-3 mb-6 text-sm">
                  <div>
                    <p className="text-zinc-400">Style</p>
                    <p className="font-medium text-white">
                      {selectedStyle 
                        ? awlStyles.find(s => s.id === selectedStyle)?.style_name 
                        : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Handle Wood</p>
                    <p className="font-medium text-white">
                      {selectedHandleWood 
                        ? handleWoods.find(w => w.id === selectedHandleWood)?.name 
                        : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Ferrule</p>
                    <p className="font-medium text-white">
                      {selectedFerrule 
                        ? ferruleMaterials.find(f => f.id === selectedFerrule)?.name 
                        : 'Not selected'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-brand-dark-border pt-4 mb-6">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total Price</span>
                    <span className="text-brand-orange">{isConfigComplete ? formatPrice(currentPrice) : '—'}</span>
                  </div>
                  {isConfigComplete && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Price includes all premium materials
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={!isConfigComplete || addedToCart}
                  size="lg"
                  className="w-full"
                >
                  {addedToCart ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Added to Cart!
                    </>
                  ) : (
                    'Add to Cart'
                  )}
                </Button>

                {!isConfigComplete && (
                  <p className="text-xs text-zinc-500 text-center mt-3">
                    Complete all selections to add to cart
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

