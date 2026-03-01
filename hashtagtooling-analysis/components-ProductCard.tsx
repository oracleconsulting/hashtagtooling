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
}

export function ProductCard({ id, name, description, price, image_url, category }: ProductCardProps) {
  const addItem = useCart(state => state.addItem)

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      quantity: 1,
      image_url,
    })
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/product/${id}`}>
        <div className="relative h-64 bg-zinc-100">
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{name}</h3>
        <p className="text-sm text-zinc-600 mb-2 line-clamp-2">{description}</p>
        <p className="text-xl font-bold">{formatPrice(price)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}



