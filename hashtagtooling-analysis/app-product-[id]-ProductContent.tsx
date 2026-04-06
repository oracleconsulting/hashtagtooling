'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/store'
import { useWishlist } from '@/lib/wishlist-store'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { ImageLightbox } from '@/components/ImageLightbox'
import { ProductDetailSkeleton } from '@/components/ProductDetailSkeleton'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock_status: string
  is_digital?: boolean
  metadata?: {
    images?: string[]
    video?: string
    weight_kg?: string
    dimensions?: string
    wood_types?: string[]
    head_wood?: string
    handle_wood?: string
    shipping?: { uk: number; europe: number; world: number }
  }
}

export default function ProductContent() {
  const params = useParams()
  const id = params.id as string
  const addItem = useCart((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifySubmitting, setNotifySubmitting] = useState(false)
  const [notifySuccess, setNotifySuccess] = useState(false)

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

      if (data?.category) {
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category', data.category)
          .neq('id', id)
          .in('stock_status', ['in_stock', 'made_to_order', 'sold'])
          .limit(3)
        setRelated(relatedData || [])
      }
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
      category: product.category,
      stock_status: product.stock_status,
      shipping: product.metadata?.shipping,
      is_digital: product.is_digital,
    })
  }

  const inWishlist = product ? isInWishlist(product.id) : false
  const toggleWishlist = () => {
    if (!product) return
    if (inWishlist) removeFromWishlist(product.id)
    else addToWishlist({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
  }

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !notifyEmail.trim()) return
    setNotifySubmitting(true)
    try {
      await supabase.from('stock_notifications').insert({
        product_id: product.id,
        email: notifyEmail.trim(),
      })
      setNotifySuccess(true)
      setNotifyEmail('')
    } catch {
      // silent; user can retry
    } finally {
      setNotifySubmitting(false)
    }
  }

  if (loading) {
    return <ProductDetailSkeleton />
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

  const FALLBACK_IMAGE = '/placeholder-product.svg'
  const imageUrls = (product.metadata?.images?.length
    ? product.metadata.images
    : [product.image_url]
  ).filter(Boolean) as string[]
  if (imageUrls.length === 0) imageUrls.push(FALLBACK_IMAGE)
  const heroImage = product.image_url || imageUrls[0] || FALLBACK_IMAGE
  const hasVideo = Boolean(product.metadata?.video)
  const allMedia = hasVideo
    ? [{ type: 'video' as const, url: product.metadata!.video! }, ...imageUrls.map((url) => ({ type: 'image' as const, url }))]
    : imageUrls.map((url) => ({ type: 'image' as const, url }))
  const selectedIsVideo = hasVideo && selectedImage === 0
  const lightboxImages = imageUrls
  const lightboxInitialIndex = hasVideo ? Math.max(0, selectedImage - 1) : selectedImage

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/shop" className="text-zinc-400 hover:text-brand-orange mb-6 inline-flex items-center gap-2 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>

      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
        <div>
          <div className="relative aspect-square bg-brand-dark-card rounded-lg overflow-hidden mb-4 w-full">
            {selectedIsVideo ? (
              <video
                src={product.metadata!.video}
                poster={heroImage}
                controls
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <button
                type="button"
                className="relative w-full h-full block cursor-zoom-in"
                onClick={() => { setLightboxIndex(lightboxInitialIndex); setLightboxOpen(true) }}
              >
                <Image
                  src={allMedia[selectedImage].url}
                  alt={`${product.name} — handcrafted by #TOOLING`}
                  fill
                  className="object-cover"
                  priority
                />
              </button>
            )}
            {product.stock_status === 'sold' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                <span className="text-3xl font-heading font-bold text-white tracking-wider">SOLD</span>
              </div>
            )}
          </div>
          {allMedia.length > 1 && (
            <div className="flex gap-3 mt-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {allMedia.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 snap-start transition-colors ${
                    selectedImage === index ? 'border-brand-orange' : 'border-brand-dark-border hover:border-zinc-500'
                  }`}
                >
                  {item.type === 'video' ? (
                    <>
                      <Image
                        src={heroImage}
                        alt={`${product.name} — video`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-2xl text-white drop-shadow">▶</span>
                      </div>
                    </>
                  ) : (
                    <Image src={item.url} alt={`${product.name} — image ${index}`} fill className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
          {hasVideo && (
            <p className="text-zinc-400 text-sm mt-2">📹 This piece includes a making-of video</p>
          )}
        </div>

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
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button onClick={handleAddToCart} size="lg" className="flex-1">
                {product.stock_status === 'made_to_order' ? 'Order Now (3-4 week lead time)' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={toggleWishlist}
                className={inWishlist ? 'border-brand-orange text-brand-orange' : ''}
              >
                {inWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </Button>
            </div>
          ) : (
            <div className="mb-8">
              {notifySuccess ? (
                <p className="text-green-400 text-sm mb-4">
                  We&apos;ll email you if a similar piece becomes available.
                </p>
              ) : (
                <form onSubmit={handleNotifyMe} className="space-y-3">
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-brand-dark-border bg-brand-dark-card text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                  <Button type="submit" size="lg" className="w-full" disabled={notifySubmitting}>
                    {notifySubmitting ? 'Submitting…' : 'Notify Me When Available'}
                  </Button>
                </form>
              )}
              <Button variant="outline" size="lg" className="w-full mt-3" onClick={toggleWishlist}>
                {inWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </Button>
            </div>
          )}

          {(product.metadata?.weight_kg || product.metadata?.dimensions || product.metadata?.head_wood || product.metadata?.handle_wood) && (
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
                  {product.metadata?.head_wood && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-zinc-400">Head Wood:</dt>
                      <dd className="font-medium text-white">{product.metadata.head_wood}</dd>
                    </div>
                  )}
                  {product.metadata?.handle_wood && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-zinc-400">Handle Wood:</dt>
                      <dd className="font-medium text-white">{product.metadata.handle_wood}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {product.is_digital && (
            <p className="text-zinc-400 text-sm mb-6">Instant delivery — download link sent by email after purchase.</p>
          )}

          {product.metadata?.shipping && !product.is_digital && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-white">Shipping</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <dt className="text-zinc-400">UK:</dt>
                    <dd className="font-medium text-white">
                      {product.metadata.shipping.uk === 0 ? 'Free' : `£${product.metadata.shipping.uk.toFixed(2)}`}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-zinc-400">Europe:</dt>
                    <dd className="font-medium text-white">£{product.metadata.shipping.europe.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-zinc-400">Rest of World:</dt>
                    <dd className="font-medium text-white">£{product.metadata.shipping.world.toFixed(2)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

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

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-brand-orange mb-6">YOU MIGHT ALSO LIKE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                description={p.description}
                price={p.price}
                image_url={p.image_url}
                category={p.category}
                stock_status={p.stock_status as 'in_stock' | 'made_to_order' | 'sold' | 'out_of_stock'}
                is_digital={p.is_digital}
                metadata={p.metadata}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
