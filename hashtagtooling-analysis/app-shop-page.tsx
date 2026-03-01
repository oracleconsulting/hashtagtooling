'use client'

import { useState, useEffect, Suspense } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock_status: 'in_stock' | 'made_to_order' | 'sold' | 'out_of_stock'
  subcategory?: string
  metadata?: any
}

const CATEGORIES = [
  { id: 'all', name: 'All Products' },
  { id: 'mallet', name: 'Mallets' },
  { id: 'awl', name: 'Awls' },
  { id: 'wood', name: 'Wood for Sale' },
  { id: 'coin', name: 'EDC Coins' },
]

function ShopContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') || 'all'
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedCategory(categoryParam)
  }, [categoryParam])

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: dbError } = await supabase
        .from('products')
        .select('*')
        .neq('stock_status', 'out_of_stock')
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      setProducts(data || [])
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Unable to load products. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Map URL params like "mallets" to DB category "mallet"
  const mapCategory = (cat: string) => {
    const mapping: Record<string, string> = {
      mallets: 'mallet',
      awls: 'awl',
      coins: 'coin',
      wood: 'wood',
      squares: 'square',
    }
    return mapping[cat] || cat
  }

  const effectiveCategory = mapCategory(selectedCategory)

  const filteredProducts = effectiveCategory === 'all'
    ? products
    : products.filter(p => p.category === effectiveCategory)

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl font-bold mb-2 text-brand-orange">Shop</h1>
      <p className="text-zinc-400 mb-8">Handcrafted tools and materials. Each piece is unique.</p>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 mb-12">
        {CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={effectiveCategory === cat.id || (effectiveCategory === 'all' && cat.id === 'all') ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.id)}
            size="sm"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-zinc-400 mb-4">{error}</p>
          <Button onClick={loadProducts}>Try Again</Button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-400 mb-4">No products found in this category yet.</p>
          <p className="text-zinc-500 text-sm">Check back soon — new pieces are added regularly.</p>
        </div>
      )}
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-heading text-4xl font-bold mb-8 text-brand-orange">Shop</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}
