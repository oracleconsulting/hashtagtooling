'use client'

import { useState, useEffect } from 'react'
import { useWishlist } from '@/lib/wishlist-store'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Heart } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock_status: 'in_stock' | 'made_to_order' | 'sold' | 'out_of_stock'
  metadata?: { shipping?: { uk: number; europe: number; world: number } }
}

export default function WishlistContent() {
  const { items } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (items.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', items.map((i) => i.id))
      setProducts((data as Product[]) || [])
      setLoading(false)
    }
    load()
  }, [items])

  if (items.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-white mb-2">Your Wishlist is empty</h2>
        <p className="text-zinc-400 mb-6">Save items you love and find them here.</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-md font-medium bg-brand-orange text-brand-dark hover:bg-brand-orange-hover font-bold h-10 px-4 py-2"
        >
          Browse Shop
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-lg border border-brand-dark-border bg-brand-dark-card h-96 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const productMap = new Map(products.map((p) => [p.id, p]))
  const toShow = items
    .map((item) => productMap.get(item.id))
    .filter((p): p is Product => p != null)

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-white mb-8">Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {toShow.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description}
            price={product.price}
            image_url={product.image_url}
            category={product.category}
            stock_status={product.stock_status}
            metadata={product.metadata}
          />
        ))}
      </div>
    </div>
  )
}
