'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock_status: 'in_stock' | 'made_to_order' | 'sold' | 'out_of_stock'
}

export function ProductCard({ id, name, description, price, image_url, category, stock_status }: ProductCardProps) {
  const addItem = useCart(state => state.addItem)

  const handleAddToCart = () => {
    if (stock_status === 'sold') return
    addItem({
      id,
      name,
      price,
      quantity: 1,
      image_url,
    })
  }

  const stockBadge = () => {
    switch (stock_status) {
      case 'in_stock':
        return <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded">In Stock</span>
      case 'made_to_order':
        return <span className="px-2 py-1 bg-brand-orange/20 text-brand-orange text-xs font-medium rounded">Made to Order</span>
      case 'sold':
        return <span className="px-2 py-1 bg-red-900/50 text-red-400 text-xs font-medium rounded">Sold</span>
      default:
        return null
    }
  }

  return (
    <Card className="overflow-hidden hover:border-brand-orange transition-all group">
      <Link href={`/product/${id}`}>
        <div className="relative h-64 bg-brand-dark-card">
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {stock_status === 'sold' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-2xl font-heading font-bold text-white tracking-wider">SOLD</span>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-white">{name}</h3>
          {stockBadge()}
        </div>
        <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{description}</p>
        <p className="text-xl font-bold text-brand-orange">{formatPrice(price)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {stock_status === 'sold' ? (
          <Button variant="outline" className="w-full opacity-50 cursor-not-allowed" disabled>
            Sold
          </Button>
        ) : stock_status === 'made_to_order' ? (
          <Button onClick={handleAddToCart} className="w-full">
            Order Now (3-4 week lead time)
          </Button>
        ) : (
          <Button onClick={handleAddToCart} className="w-full">
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
