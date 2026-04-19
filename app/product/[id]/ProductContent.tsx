'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  material_id?: string | null
  parent_product_id?: string | null
  sku?: string | null
  dimensions?: string | null
  material_species?: string | null
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
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [childPieces, setChildPieces] = useState<Product[]>([])
  const [materialGrainUrl, setMaterialGrainUrl] = useState<string | null>(null)
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null)
  const [pieceLightboxOpen, setPieceLightboxOpen] = useState(false)
  const [pieceLightboxImages, setPieceLightboxImages] = useState<string[]>([])
  const [pieceLightboxIndex, setPieceLightboxIndex] = useState(0)
  const [reviews, setReviews] = useState<{ id: string; customer_name: string; rating: number; title: string | null; body: string | null; verified_purchase: boolean; created_at: string }[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    if (id) loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      setMaterialGrainUrl(null)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data?.parent_product_id) {
        router.replace(`/product/${data.parent_product_id}?child=${id}`)
        return
      }

      setProduct(data)

      if (data?.material_id) {
        const { data: mat } = await supabase
          .from('materials')
          .select('grain_image_url')
          .eq('id', data.material_id)
          .maybeSingle()
        setMaterialGrainUrl(mat?.grain_image_url ?? null)
      }

      if (data?.category === 'wood' && !data.parent_product_id) {
        const { data: kids } = await supabase
          .from('products')
          .select('*')
          .eq('parent_product_id', data.id)
          .order('sku')
        setChildPieces((kids || []) as Product[])
      } else {
        setChildPieces([])
      }

      if (data?.category) {
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category', data.category)
          .neq('id', id)
          .is('parent_product_id', null)
          .in('stock_status', ['in_stock', 'made_to_order', 'sold'])
          .limit(3)
        setRelated(relatedData || [])
      }

      try {
        const reviewsRes = await fetch(`/api/reviews/${id}`)
        const reviewsData = await reviewsRes.json()
        setReviews(reviewsData.reviews || [])
        setAvgRating(reviewsData.averageRating || 0)
        setReviewCount(reviewsData.count || 0)
      } catch {
        /* reviews non-critical */
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

  const handleAddChildToCart = (piece: Product) => {
    if (piece.stock_status !== 'in_stock') return
    addItem({
      id: piece.id,
      name: piece.name,
      price: piece.price,
      quantity: 1,
      image_url: piece.image_url,
      category: piece.category,
      stock_status: piece.stock_status,
      shipping: piece.metadata?.shipping,
      is_digital: piece.is_digital,
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

  const highlightChildId = searchParams.get('child')
  const isWoodParentWithPieces =
    product.category === 'wood' && !product.parent_product_id && childPieces.length > 0
  const inStockPieces = childPieces.filter((c) => c.stock_status === 'in_stock')

  const FALLBACK_IMAGE = '/placeholder-product.svg'
  const isReal = (url: string | null | undefined) => url && !url.includes('placehold.co')

  const realProductImage = isReal(product.image_url) ? product.image_url : null
  const displayImageUrl = realProductImage || materialGrainUrl || ''
  const imageUrls = (product.metadata?.images?.length
    ? (product.metadata.images as string[]).filter(isReal)
    : [displayImageUrl].filter(Boolean)
  ) as string[]
  if (materialGrainUrl && !imageUrls.includes(materialGrainUrl) && imageUrls.length === 0) {
    imageUrls.push(materialGrainUrl)
  }
  if (imageUrls.length === 0) imageUrls.push(FALLBACK_IMAGE)
  const heroImage = imageUrls[0] || FALLBACK_IMAGE

  const pieceCardImage = (piece: Product) => {
    const meta = piece.metadata as { images?: string[] } | undefined
    const realPieceImages = (meta?.images || []).filter(isReal) as string[]
    if (isReal(piece.image_url)) return piece.image_url!
    if (realPieceImages[0]) return realPieceImages[0]
    if (materialGrainUrl) return materialGrainUrl
    return FALLBACK_IMAGE
  }
  const pieceGalleryImages = (piece: Product): string[] => {
    const meta = piece.metadata as { images?: string[] } | undefined
    const realPieceImages = (meta?.images || []).filter(isReal) as string[]
    if (realPieceImages.length > 0) return realPieceImages
    if (isReal(piece.image_url)) return [piece.image_url!]
    if (materialGrainUrl) return [materialGrainUrl]
    return []
  }

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
      {pieceLightboxOpen && (
        <ImageLightbox
          images={pieceLightboxImages}
          initialIndex={pieceLightboxIndex}
          onClose={() => setPieceLightboxOpen(false)}
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={allMedia[selectedImage].url}
                  alt={`${product.name} — handcrafted by #TOOLING`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    const fallback = materialGrainUrl && el.src !== materialGrainUrl ? materialGrainUrl : FALLBACK_IMAGE
                    if (el.src !== fallback) el.src = fallback
                  }}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImage}
                        alt={`${product.name} — video`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-2xl text-white drop-shadow">▶</span>
                      </div>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={`${product.name} — image ${index}`} className="absolute inset-0 w-full h-full object-cover" />
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
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-lg ${star <= Math.round(avgRating) ? 'text-brand-orange' : 'text-zinc-600'}`}>★</span>
                ))}
              </div>
              <span className="text-zinc-400 text-sm">{avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
          {!isWoodParentWithPieces ? (
            <p className="text-3xl font-bold mb-6 text-brand-orange">{formatPrice(product.price)}</p>
          ) : (
            <p className="text-lg font-medium mb-6 text-zinc-400">
              {inStockPieces.length > 0
                ? `${inStockPieces.length} piece(s) available — choose below`
                : 'Out of stock — check back soon'}
            </p>
          )}

          <div className="mb-6">
            {!isWoodParentWithPieces && product.stock_status === 'in_stock' && (
              <span className="px-3 py-1 bg-green-900/50 text-green-400 text-sm font-medium rounded">In Stock</span>
            )}
            {!isWoodParentWithPieces && product.stock_status === 'made_to_order' && (
              <span className="px-3 py-1 bg-brand-orange/20 text-brand-orange text-sm font-medium rounded">Made to Order</span>
            )}
            {!isWoodParentWithPieces && product.stock_status === 'sold' && (
              <span className="px-3 py-1 bg-red-900/50 text-red-400 text-sm font-medium rounded">Sold</span>
            )}
            {isWoodParentWithPieces && inStockPieces.length > 0 && (
              <span className="px-3 py-1 bg-green-900/50 text-green-400 text-sm font-medium rounded">In Stock</span>
            )}
          </div>

          <p className="text-zinc-300 mb-8 leading-relaxed">{product.description}</p>

          {isWoodParentWithPieces && (
            <div className="mb-10 space-y-4">
              <h2 className="font-heading text-xl font-semibold text-white">Available pieces</h2>
              <div className="grid gap-4">
                {childPieces.map((piece) => {
                  const sold = piece.stock_status === 'sold'
                  const canBuy = piece.stock_status === 'in_stock'
                  const hi = highlightChildId === piece.id
                  const isExpanded = expandedPieceId === piece.id
                  const gallery = pieceGalleryImages(piece)
                  return (
                    <div
                      key={piece.id}
                      className={`rounded-lg border ${
                        sold ? 'opacity-60 border-brand-dark-border' : 'border-brand-dark-border bg-brand-dark-card'
                      } ${hi ? 'ring-2 ring-brand-orange' : ''}`}
                    >
                      <div className="p-4 flex gap-4">
                        <button
                          type="button"
                          className="relative w-24 h-24 shrink-0 rounded overflow-hidden bg-brand-dark cursor-pointer"
                          onClick={() => {
                            if (gallery.length > 0) {
                              setPieceLightboxImages(gallery)
                              setPieceLightboxIndex(0)
                              setPieceLightboxOpen(true)
                            }
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pieceCardImage(piece)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              const el = e.target as HTMLImageElement
                              const fb = materialGrainUrl && el.src !== materialGrainUrl ? materialGrainUrl : FALLBACK_IMAGE
                              if (el.src !== fb) el.src = fb
                            }}
                          />
                          {sold && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">SOLD</span>
                            </div>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm text-brand-orange">{piece.sku || '—'}</p>
                            <button
                              type="button"
                              className="text-xs text-zinc-500 hover:text-brand-orange transition-colors"
                              onClick={() => setExpandedPieceId(isExpanded ? null : piece.id)}
                            >
                              {isExpanded ? 'Hide details' : 'View details'}
                            </button>
                          </div>
                          {piece.dimensions && <p className="text-xs text-zinc-500">{piece.dimensions}</p>}
                          <p className="text-lg font-bold text-brand-orange mt-1">{formatPrice(piece.price)}</p>
                          <Button
                            className="mt-2 w-full sm:w-auto"
                            size="sm"
                            disabled={!canBuy}
                            onClick={() => handleAddChildToCart(piece)}
                          >
                            {sold ? 'Sold' : 'Add to cart'}
                          </Button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-brand-dark-border/60 p-4">
                          {gallery.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-3">
                              {gallery.map((url, i) => (
                                <button
                                  key={`${piece.id}-${i}`}
                                  type="button"
                                  className="relative w-28 h-28 flex-shrink-0 rounded overflow-hidden bg-brand-dark border border-brand-dark-border cursor-zoom-in"
                                  onClick={() => {
                                    setPieceLightboxImages(gallery)
                                    setPieceLightboxIndex(i)
                                    setPieceLightboxOpen(true)
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => {
                                      const el = e.target as HTMLImageElement
                                      const fb = materialGrainUrl && el.src !== materialGrainUrl ? materialGrainUrl : FALLBACK_IMAGE
                                      if (el.src !== fb) el.src = fb
                                    }}
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                          {piece.description && piece.description !== product.description && (
                            <p className="text-sm text-zinc-400 mt-2">{piece.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {isWoodParentWithPieces && (
            <div className="mb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={toggleWishlist}
                className={inWishlist ? 'border-brand-orange text-brand-orange' : ''}
              >
                {inWishlist ? 'Saved listing to Wishlist' : 'Save listing to Wishlist'}
              </Button>
            </div>
          )}

          {!isWoodParentWithPieces && product.stock_status !== 'sold' && (
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
          )}

          {!isWoodParentWithPieces && product.stock_status === 'sold' && (
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

      {reviews.length > 0 && (
        <section className="mt-12 pt-8 border-t border-brand-dark-border">
          <h2 className="font-heading text-2xl font-bold text-white mb-6">Reviews</h2>
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={s <= review.rating ? 'text-brand-orange' : 'text-zinc-600'}>★</span>
                        ))}
                      </div>
                      {review.verified_purchase && (
                        <span className="text-xs text-green-500 bg-green-900/30 px-2 py-0.5 rounded">Verified Purchase</span>
                      )}
                    </div>
                    {review.title && <p className="font-semibold text-white mt-1">{review.title}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">{review.customer_name}</p>
                    <p className="text-xs text-zinc-600">{new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                {review.body && <p className="text-zinc-300 leading-relaxed">{review.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

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
