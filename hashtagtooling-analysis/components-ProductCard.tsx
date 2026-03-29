'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store'
import { useWishlist } from '@/lib/wishlist-store'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock_status: 'in_stock' | 'made_to_order' | 'sold' | 'out_of_stock'
  subcategory?: string
  is_digital?: boolean
  metadata?: {
    shipping?: { uk: number; europe: number; world: number }
    species?: string
  }
}

const WOOD_SUBCATEGORY_LABELS: Record<string, string> = {
  offcut: 'OFFCUT',
  sample_pack: 'SAMPLE PACK',
  slab: 'SLAB',
  pen_blank: 'PEN BLANK',
}

export function ProductCard({ id, name, description, price, image_url, category, stock_status, subcategory, is_digital, metadata }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
  const inWishlist = isInWishlist(id)

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inWishlist) removeFromWishlist(id)
    else addToWishlist({ id, name, price, image_url })
  }

  const handleAddToCart = () => {
    if (stock_status === 'sold') return
    addItem({
      id,
      name,
      price,
      quantity: 1,
      image_url,
      category,
      stock_status,
      shipping: metadata?.shipping,
      is_digital: is_digital,
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
            alt={`${name} — exotic wood tool by #TOOLING`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <button
            type="button"
            onClick={toggleWishlist}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`h-5 w-5 ${inWishlist ? 'fill-brand-orange text-brand-orange' : ''}`}
            />
          </button>
          {stock_status === 'sold' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-2xl font-heading font-bold text-white tracking-wider">SOLD</span>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {is_digital && (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-brand-orange/20 text-brand-orange">
              DIGITAL DOWNLOAD
            </span>
          )}
          {category === 'wood' && subcategory && (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-brand-orange/20 text-brand-orange">
              {WOOD_SUBCATEGORY_LABELS[subcategory] ?? subcategory}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-white">{name}</h3>
          {stockBadge()}
        </div>
        {category === 'wood' && metadata?.species && (
          <p className="text-sm text-zinc-400 mb-1">{metadata.species}</p>
        )}
        <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{description}</p>
        <p className="text-xl font-bold text-brand-orange">{formatPrice(price)}</p>
        {is_digital && <p className="text-xs text-zinc-500 mt-1">Instant delivery</p>}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {stock_status === 'sold' ? (
          <Link
            href={`/product/${id}`}
            className="inline-flex items-center justify-center rounded-md font-medium border border-brand-orange text-brand-orange bg-transparent hover:bg-brand-orange hover:text-brand-dark w-full h-10 px-4 py-2"
          >
            Sold — View Details
          </Link>
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
