'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MALLET_TYPES, WOOD_TYPES, TRANSITION_MATERIALS, CustomMalletConfig } from '@/lib/constants'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { Check } from 'lucide-react'

const BASE_PRICE = 120.00

export default function CustomMalletPage() {
  const addItem = useCart(state => state.addItem)
  const [config, setConfig] = useState<CustomMalletConfig>({
    malletType: 'turned-carving',
    headWood: 'walnut',
    handleWood: 'walnut',
    transitionMaterial: 'brass',
  })

  const [addedToCart, setAddedToCart] = useState(false)

  const handleAddToCart = () => {
    const malletType = MALLET_TYPES.find(m => m.id === config.malletType)
    const headWood = WOOD_TYPES.find(w => w.id === config.headWood)
    const handleWood = WOOD_TYPES.find(w => w.id === config.handleWood)
    const transition = TRANSITION_MATERIALS.find(t => t.id === config.transitionMaterial)

    const name = `Custom ${malletType?.name} - ${headWood?.name} / ${handleWood?.name}`
    
    addItem({
      id: `custom-${Date.now()}`,
      name,
      price: BASE_PRICE,
      quantity: 1,
      image_url: 'https://placehold.co/600x400/666/white?text=Custom+Mallet',
      customConfig: config,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
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
                <CardTitle>1. Select Mallet Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {MALLET_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setConfig({ ...config, malletType: type.id })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      config.malletType === type.id 
                        ? 'border-zinc-900 bg-zinc-50' 
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-sm text-zinc-500 capitalize">{type.shape}</p>
                      </div>
                      {config.malletType === type.id && (
                        <Check className="h-5 w-5 text-zinc-900" />
                      )}
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
                <div className="grid grid-cols-2 gap-2">
                  {WOOD_TYPES.map(wood => (
                    <button
                      key={wood.id}
                      onClick={() => setConfig({ ...config, headWood: wood.id })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        config.headWood === wood.id 
                          ? 'border-zinc-900' 
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border border-zinc-300"
                          style={{ backgroundColor: wood.color }}
                        />
                        <span className="text-sm font-medium">{wood.name}</span>
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
                <div className="grid grid-cols-2 gap-2">
                  {WOOD_TYPES.map(wood => (
                    <button
                      key={wood.id}
                      onClick={() => setConfig({ ...config, handleWood: wood.id })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        config.handleWood === wood.id 
                          ? 'border-zinc-900' 
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border border-zinc-300"
                          style={{ backgroundColor: wood.color }}
                        />
                        <span className="text-sm font-medium">{wood.name}</span>
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
                {TRANSITION_MATERIALS.map(material => (
                  <button
                    key={material.id}
                    onClick={() => setConfig({ ...config, transitionMaterial: material.id })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      config.transitionMaterial === material.id 
                        ? 'border-zinc-900 bg-zinc-50' 
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full border border-zinc-300"
                          style={{ backgroundColor: material.hex }}
                        />
                        <span className="font-medium">{material.name}</span>
                      </div>
                      {config.transitionMaterial === material.id && (
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
                    <span className="text-zinc-600">Type:</span>
                    <p className="font-medium">
                      {MALLET_TYPES.find(m => m.id === config.malletType)?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-600">Head Wood:</span>
                    <p className="font-medium">
                      {WOOD_TYPES.find(w => w.id === config.headWood)?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-600">Handle Wood:</span>
                    <p className="font-medium">
                      {WOOD_TYPES.find(w => w.id === config.handleWood)?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-600">Transition:</span>
                    <p className="font-medium">
                      {TRANSITION_MATERIALS.find(t => t.id === config.transitionMaterial)?.name}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold">{formatPrice(BASE_PRICE)}</span>
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



