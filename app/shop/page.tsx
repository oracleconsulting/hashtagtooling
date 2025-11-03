'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

// Placeholder products - these will come from Supabase later
const PLACEHOLDER_PRODUCTS = [
  {
    id: '1',
    name: 'Walnut Carving Mallet',
    description: 'Beautifully turned carving mallet in black walnut with brass transition',
    price: 89.99,
    category: 'mallets',
    image_url: 'https://placehold.co/600x400/3D2817/white?text=Walnut+Mallet',
    stock_status: 'in_stock' as const,
  },
  {
    id: '2',
    name: 'Maple Detailing Mallet',
    description: 'Precision turned detailing mallet in hard maple with copper accent',
    price: 79.99,
    category: 'mallets',
    image_url: 'https://placehold.co/600x400/E8D5B7/333?text=Maple+Mallet',
    stock_status: 'in_stock' as const,
  },
  {
    id: '3',
    name: 'Rosewood Square Mallet',
    description: 'Square framing mallet in exotic rosewood with aluminium transition',
    price: 129.99,
    category: 'mallets',
    image_url: 'https://placehold.co/600x400/65000B/white?text=Rosewood+Mallet',
    stock_status: 'made_to_order' as const,
  },
  {
    id: '4',
    name: 'Precision Marking Awl',
    description: 'Hand-turned marking awl with ebony handle',
    price: 45.00,
    category: 'awls',
    image_url: 'https://placehold.co/600x400/282828/white?text=Marking+Awl',
    stock_status: 'in_stock' as const,
  },
  {
    id: '5',
    name: 'Engineer\'s Square 6"',
    description: 'Precision machined 6" engineer\'s square',
    price: 65.00,
    category: 'squares',
    image_url: 'https://placehold.co/600x400/C0C0C0/333?text=Engineer+Square',
    stock_status: 'in_stock' as const,
  },
  {
    id: '6',
    name: 'Titanium EDC Coin',
    description: 'Laser-engraved EDC coin in aerospace titanium',
    price: 35.00,
    category: 'coins',
    image_url: 'https://placehold.co/600x400/8C92AC/white?text=Ti+Coin',
    stock_status: 'in_stock' as const,
  },
]

const CATEGORIES = [
  { id: 'all', name: 'All Products' },
  { id: 'mallets', name: 'Mallets' },
  { id: 'awls', name: 'Awls' },
  { id: 'squares', name: 'Engineering Squares' },
  { id: 'coins', name: 'EDC Coins' },
]

export default function ShopPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') || 'all'
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)

  useEffect(() => {
    setSelectedCategory(categoryParam)
  }, [categoryParam])

  const filteredProducts = selectedCategory === 'all' 
    ? PLACEHOLDER_PRODUCTS 
    : PLACEHOLDER_PRODUCTS.filter(p => p.category === selectedCategory)

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Shop</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 mb-12">
        {CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-600">No products found in this category.</p>
        </div>
      )}
    </div>
  )
}

