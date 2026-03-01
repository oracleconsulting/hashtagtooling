'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock_status: string
  metadata?: {
    images?: string[]
    weight_kg?: string
    dimensions?: string
    wood_types?: string[]
  }
}

export default function ProductPage() {
  const params = useParams()
  const id = params.id as string
  const addItem = useCart(state => state.addItem)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (id) loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (err) {
      console.error('Error loading product:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product || product.stock_status === 'sold') return
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-bold text-white mb-4">Product Not Found</h1>
        <Link href="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    )
  }

  const allImages = product.metadata?.images?.length
    ? product.metadata.images
    : [product.image_url]

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/shop" className="text-zinc-400 hover:text-brand-orange mb-6 inline-flex items-center gap-2 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
        {/* Product Images */}
        <div>
          <div className="relative aspect-square bg-brand-dark-card rounded-lg overflow-hidden mb-4">
            <Image
              src={allImages[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {product.stock_status === 'sold' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-3xl font-heading font-bold text-white tracking-wider">SOLD</span>
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allImages.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-brand-orange' : 'border-brand-dark-border hover:border-zinc-500'
                  }`}
                >
                  <Image src={url} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">{product.name}</h1>
          <p className="text-3xl font-bold mb-6 text-brand-orange">{formatPrice(product.price)}</p>

          <div className="mb-6">
            {product.stock_status === 'in_stock' && (
              <span className="px-3 py-1 bg-green-900/50 text-green-400 text-sm font-medium rounded">In Stock</span>
            )}
            {product.stock_status === 'made_to_order' && (
              <span className="px-3 py-1 bg-brand-orange/20 text-brand-orange text-sm font-medium rounded">Made to Order</span>
            )}
            {product.stock_status === 'sold' && (
              <span className="px-3 py-1 bg-red-900/50 text-red-400 text-sm font-medium rounded">Sold</span>
            )}
          </div>

          <p className="text-zinc-300 mb-8 leading-relaxed">{product.description}</p>

          {product.stock_status !== 'sold' ? (
            <Button onClick={handleAddToCart} size="lg" className="w-full mb-8">
              {product.stock_status === 'made_to_order' ? 'Order Now (3-4 week lead time)' : 'Add to Cart'}
            </Button>
          ) : (
            <Button size="lg" className="w-full mb-8 opacity-50 cursor-not-allowed" disabled>
              Sold
            </Button>
          )}

          {/* Specifications */}
          {(product.metadata?.weight_kg || product.metadata?.dimensions) && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-white">Specifications</h3>
                <dl className="space-y-3">
                  {product.metadata?.weight_kg && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-zinc-400">Weight:</dt>
                      <dd className="font-medium text-white">{product.metadata.weight_kg} kg</dd>
                    </div>
                  )}
                  {product.metadata?.dimensions && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-zinc-400">Dimensions:</dt>
                      <dd className="font-medium text-white">{product.metadata.dimensions}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Custom Option */}
          {(product.category === 'mallet' || product.category === 'awl') && (
            <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6">
              <h3 className="font-semibold mb-2 text-white">Want this in different woods?</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Customise this design with your choice of wood species and transition material.
              </p>
              <Link href={product.category === 'mallet' ? '/custom-mallet' : '/custom-awl'}>
                <Button variant="outline" className="w-full">
                  Build Custom Version
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
