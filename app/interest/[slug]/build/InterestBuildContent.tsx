'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageLightbox } from '@/components/ImageLightbox'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import {
  INTEREST_SPECS,
  PREORDER_DELIVERY,
  quoteInterestBuild,
  type InterestPricingCatalog,
} from '@/lib/interest-pricing'
import { parseGalleryImages, type InterestList } from '@/lib/interest'

export default function InterestBuildContent({
  list,
  catalog,
}: {
  list: InterestList
  catalog: InterestPricingCatalog
}) {
  const spec = INTEREST_SPECS[catalog.slug]
  const gallery = parseGalleryImages(list.gallery_images)
  const lightboxImages = [list.hero_image_url, ...gallery].filter((u): u is string => !!u)
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()

  const [liveCatalog, setLiveCatalog] = useState(catalog)
  const [metalId, setMetalId] = useState<string | null>(null)
  const [handleId, setHandleId] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/interest/${list.slug}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.catalog) setLiveCatalog(data.catalog)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [list.slug])

  const metal = liveCatalog.metals.find((item) => item.id === metalId) || null
  const handle = liveCatalog.woods.find((item) => item.id === handleId) || null
  const quote = quoteInterestBuild(
    list.slug,
    {
      [spec.metalKey]: metal?.name,
      [spec.handleKey]: handle?.name,
    },
    liveCatalog
  )
  const canOrder = Boolean(quote && metal && handle)

  const handleAddToCart = () => {
    if (!quote || !canOrder || !metal || !handle) return
    const name =
      list.slug === 'muddler'
        ? `Hashtag Muddler — Lignum Vitae / ${handle.name} / ${metal.name}`
        : `Bottle Opener — ${handle.name} / ${metal.name}`
    addItem({
      id: `interest-${list.slug}-${Date.now()}`,
      name,
      price: quote.total,
      quantity: 1,
      image_url: list.hero_image_url || '',
      category: list.slug,
      stock_status: 'made_to_order',
      customConfig: {
        custom_build: true,
        styleName: list.name,
        headWoodName: list.slug === 'muddler' ? 'Lignum Vitae' : undefined,
        handleWoodName: handle.name,
        transitionName: metal.name,
      },
      shipping: { uk: 5.99, europe: 15.99, world: 25.99 },
    })
    setAddedToCart(true)
    router.push('/cart')
  }

  return (
    <div className="min-h-screen bg-brand-dark pb-28 md:pb-12">
      <div className="container mx-auto px-4 py-12">
        <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-3">
          Build yours
        </p>
        <h1 className="font-heading text-4xl font-bold mb-4 text-brand-orange">{list.name}</h1>
        <p className="text-zinc-400 mb-12 max-w-2xl">
          Pick your spec and the price updates as you go. 50% deposit now, 50% when it&apos;s done. Aimed at {PREORDER_DELIVERY}.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="order-1 lg:sticky lg:top-24 h-fit">
            {list.hero_image_url ? (
              <button onClick={() => setLightboxIndex(0)} className="block w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={list.hero_image_url}
                  alt={list.name}
                  className="w-full rounded-lg object-cover"
                />
              </button>
            ) : (
              <div className="rounded-lg border border-brand-dark-border bg-brand-dark-card aspect-square" />
            )}
            {gallery.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setLightboxIndex(i + 1)}
                    className="w-16 h-16 rounded overflow-hidden border border-brand-dark-border hover:border-brand-orange transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {list.slug === 'muddler' && (
              <p className="text-zinc-500 text-sm mt-4">
                Head is <span className="text-white font-medium">Lignum Vitae</span> — that&apos;s fixed.
              </p>
            )}
          </div>

          <div className="space-y-6 order-2">
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-white">1. {spec.metalLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {liveCatalog.metals.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMetalId(item.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      metalId === item.id
                        ? 'border-brand-orange bg-brand-orange/10'
                        : 'border-brand-dark-border hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border border-zinc-600"
                          style={{ backgroundColor: item.color_hex || '#555' }}
                        />
                        <span className="font-medium text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        {item.premium > 0 && (
                          <p className="font-bold text-brand-orange">+{formatPrice(item.premium)}</p>
                        )}
                        {metalId === item.id && <Check className="h-5 w-5 text-brand-orange mt-1 ml-auto" />}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-white">2. {spec.handleLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {liveCatalog.woods.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setHandleId(item.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        handleId === item.id
                          ? 'border-brand-orange bg-brand-orange/10'
                          : 'border-brand-dark-border hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left">
                        {item.grain_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.grain_image_url} alt={item.name} className="w-6 h-6 rounded-full border border-zinc-600 flex-shrink-0 object-cover" />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full border border-zinc-600 flex-shrink-0"
                            style={{ backgroundColor: item.color_hex || '#555' }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          {item.premium > 0 && (
                            <p className="text-xs text-zinc-400">+{formatPrice(item.premium)}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Your build</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {list.slug === 'muddler' && (
                    <div className="flex justify-between gap-3">
                      <span className="text-zinc-400">Head</span>
                      <span className="text-white font-medium">Lignum Vitae</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-400">{spec.metalLabel}</span>
                    <span className="text-white font-medium">{metal?.name || 'Select metal'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-400">{spec.handleLabel}</span>
                    <span className="text-white font-medium">{handle?.name || 'Select wood'}</span>
                  </div>
                </div>

                <div className="border-t border-brand-dark-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Base</span>
                    <span className="text-white">{formatPrice(liveCatalog.base)}</span>
                  </div>
                  {metal && metal.premium > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{metal.name}</span>
                      <span className="text-white">+{formatPrice(metal.premium)}</span>
                    </div>
                  )}
                  {handle && handle.premium > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{handle.name}</span>
                      <span className="text-white">+{formatPrice(handle.premium)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-brand-dark-border pt-2">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <span className="text-2xl font-bold text-brand-orange">
                      {canOrder && quote ? formatPrice(quote.total) : `From ${formatPrice(liveCatalog.base)}`}
                    </span>
                  </div>
                  {canOrder && quote && (
                    <p className="text-zinc-400 text-sm">
                      50% deposit now ({formatPrice(quote.deposit)}) · balance {formatPrice(quote.balance)} when it&apos;s done
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                  disabled={!canOrder || addedToCart}
                >
                  {addedToCart ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Added to cart
                    </>
                  ) : canOrder ? (
                    'Pre-order — 50% deposit'
                  ) : (
                    'Pick your spec to pre-order'
                  )}
                </Button>
                <p className="text-xs text-zinc-500 text-center">Aimed at {PREORDER_DELIVERY}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-brand-dark-card border-t border-brand-dark-border p-4 md:hidden z-40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm">Total</span>
          <span className="text-xl font-bold text-brand-orange">
            {canOrder && quote ? formatPrice(quote.total) : `From ${formatPrice(liveCatalog.base)}`}
          </span>
        </div>
        <Button onClick={handleAddToCart} size="lg" className="w-full" disabled={!canOrder || addedToCart}>
          {canOrder ? 'Pre-order — 50% deposit' : 'Pick your spec'}
        </Button>
      </div>

      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
