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
import type { InterestBuildIntent } from '@/lib/interest-invite'
import {
  acceptedQuoteTotals,
  parseBespokeQuote,
  quoteBlocksCheckout,
  type BespokeQuote,
} from '@/lib/interest-quote'

export default function InterestBuildContent({
  list,
  catalog,
  token,
  initialIntent,
  initialQuote,
}: {
  list: InterestList
  catalog: InterestPricingCatalog
  token?: string
  initialIntent?: InterestBuildIntent | null
  initialQuote?: BespokeQuote | null
}) {
  const spec = INTEREST_SPECS[catalog.slug]
  const gallery = parseGalleryImages(list.gallery_images)
  const lightboxImages = [list.hero_image_url, ...gallery].filter((u): u is string => !!u)
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()

  const [liveCatalog, setLiveCatalog] = useState(catalog)
  const [metalId, setMetalId] = useState<string | null>(initialIntent?.metalId || null)
  const [handleId, setHandleId] = useState<string | null>(initialIntent?.handleId || null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [intentSaved, setIntentSaved] = useState(Boolean(initialIntent))
  const [hasRequest, setHasRequest] = useState(Boolean(initialQuote?.request))
  const [requestText, setRequestText] = useState(initialQuote?.request || '')
  const [bespoke, setBespoke] = useState<BespokeQuote | null>(initialQuote || null)
  const [quoteBusy, setQuoteBusy] = useState(false)
  const [quoteMessage, setQuoteMessage] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(`/api/interest/build/${token}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const next = parseBespokeQuote(data.quote)
        if (next) {
          setBespoke(next)
          setHasRequest(true)
          setRequestText(next.request)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (token) return
    let cancelled = false
    fetch(`/api/interest/${list.slug}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.catalog) setLiveCatalog(data.catalog)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [list.slug, token])

  const metal = liveCatalog.metals.find((item) => item.id === metalId) || null
  const handle = liveCatalog.woods.find((item) => item.id === handleId) || null
  const catalogQuote = quoteInterestBuild(
    list.slug,
    {
      [spec.metalKey]: metal?.name,
      [spec.handleKey]: handle?.name,
    },
    liveCatalog
  )
  const accepted = acceptedQuoteTotals(bespoke)
  const displayQuote = accepted || catalogQuote
  const waitingOnQuote = quoteBlocksCheckout(bespoke)
  const canOrder = Boolean(
    displayQuote &&
    metal &&
    handle &&
    !waitingOnQuote &&
    (!hasRequest || bespoke?.status === 'accepted' || bespoke?.status === 'refused')
  )

  useEffect(() => {
    if (!token || !metal || !handle || !catalogQuote) return
    if (bespoke && bespoke.status !== 'refused') return
    const intent: InterestBuildIntent = {
      metalId: metal.id,
      metalName: metal.name,
      handleId: handle.id,
      handleName: handle.name,
      total: catalogQuote.total,
      deposit: catalogQuote.deposit,
      balance: catalogQuote.balance,
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/interest/build/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
      })
        .then((res) => {
          if (res.ok) setIntentSaved(true)
        })
        .catch(() => {})
    }, 400)
    return () => window.clearTimeout(timer)
  }, [token, metal?.id, handle?.id, catalogQuote?.total, bespoke?.status])

  const submitRequest = async () => {
    if (!token || !metal || !handle || !catalogQuote) return
    const text = requestText.trim()
    if (text.length < 4) {
      setQuoteMessage('Tell me what you want — a sentence is enough.')
      return
    }
    setQuoteBusy(true)
    setQuoteMessage('')
    try {
      const res = await fetch('/api/interest/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          token,
          request: text,
          intent: {
            metalId: metal.id,
            metalName: metal.name,
            handleId: handle.id,
            handleName: handle.name,
            total: catalogQuote.total,
            deposit: catalogQuote.deposit,
            balance: catalogQuote.balance,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send request')
      const next = parseBespokeQuote(data.quote)
      if (next) {
        setBespoke(next)
        setHasRequest(true)
      }
      setQuoteMessage("I've got it. I'll email you a price — don't pay the standard deposit yet.")
    } catch (err) {
      setQuoteMessage(err instanceof Error ? err.message : 'Could not send request')
    } finally {
      setQuoteBusy(false)
    }
  }

  const replyToQuote = async (action: 'accept' | 'refuse') => {
    if (!token) return
    setQuoteBusy(true)
    setQuoteMessage('')
    try {
      const res = await fetch('/api/interest/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save that')
      const next = parseBespokeQuote(data.quote)
      if (next) {
        setBespoke(next)
        setHasRequest(true)
        setRequestText(next.request)
      }
      setQuoteMessage(action === 'accept'
        ? 'Quote accepted. Pay the 50% deposit when you are ready.'
        : 'No problem. You can take the standard spec or send another request.')
    } catch (err) {
      setQuoteMessage(err instanceof Error ? err.message : 'Could not save that')
    } finally {
      setQuoteBusy(false)
    }
  }

  const handleAddToCart = () => {
    if (!displayQuote || !canOrder || !metal || !handle) return
    const name =
      list.slug === 'muddler'
        ? `Hashtag Muddler — Lignum Vitae / ${handle.name} / ${metal.name}`
        : `Bottle Opener — ${handle.name} / ${metal.name}`
    addItem({
      id: `interest-${list.slug}-${Date.now()}`,
      name: bespoke?.status === 'accepted' ? `${name} — bespoke` : name,
      price: displayQuote.total,
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
        inviteToken: token,
        bespokeRequest: bespoke?.status === 'accepted' ? bespoke.request : undefined,
      },
      shipping: { uk: 5.99, europe: 15.99, world: 25.99 },
    })
    if (token) {
      fetch(`/api/interest/build/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'added_to_cart' }),
      }).catch(() => {})
    }
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

            {token && (
              <Card id="quote" className="bg-brand-dark-card border border-brand-dark-border scroll-mt-24">
                <CardHeader>
                  <CardTitle className="text-white">3. Specific request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={hasRequest || Boolean(bespoke)}
                      disabled={bespoke?.status === 'requested' || bespoke?.status === 'quoted' || bespoke?.status === 'accepted'}
                      onChange={(e) => {
                        setHasRequest(e.target.checked)
                        if (!e.target.checked) setQuoteMessage('')
                      }}
                    />
                    <span>
                      I have a specific request that may need its own quote — live edge, a one-off timber, something that isn&apos;t on the list.
                    </span>
                  </label>
                  {(hasRequest || bespoke) && (
                    <>
                      <textarea
                        rows={4}
                        value={requestText}
                        onChange={(e) => setRequestText(e.target.value)}
                        disabled={bespoke?.status === 'quoted' || bespoke?.status === 'accepted'}
                        placeholder="e.g. live edge handle on the African Blackwood, keep the bark if it holds"
                        className="w-full rounded-md border border-brand-dark-border bg-brand-dark text-white px-3 py-2 text-sm placeholder:text-zinc-500"
                      />
                      {bespoke?.status === 'requested' && (
                        <p className="text-amber-300 text-sm">I&apos;ve got this. I&apos;ll email a price — don&apos;t pay the standard deposit yet.</p>
                      )}
                      {(bespoke?.status === 'quoted' || bespoke?.status === 'accepted') && (
                        <div className="rounded-md border border-brand-orange/40 p-3 space-y-2">
                          <p className="text-white text-sm font-medium">
                            {bespoke.status === 'accepted' ? 'Quote accepted' : 'Quote ready'}
                            {bespoke.quotedTotal != null ? ` — ${formatPrice(bespoke.quotedTotal)}` : ''}
                          </p>
                          {bespoke.quotedNote && <p className="text-zinc-300 text-sm">{bespoke.quotedNote}</p>}
                          <p className="text-zinc-400 text-xs">
                            50% deposit {bespoke.quotedDeposit != null ? formatPrice(bespoke.quotedDeposit) : ''} now, balance when it&apos;s done.
                          </p>
                          {bespoke.status === 'quoted' && (
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" disabled={quoteBusy} onClick={() => replyToQuote('accept')}>
                                {quoteBusy ? 'Saving…' : 'Accept quote'}
                              </Button>
                              <Button size="sm" variant="outline" disabled={quoteBusy} onClick={() => replyToQuote('refuse')}>
                                Refuse
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      {bespoke?.status === 'refused' && (
                        <p className="text-zinc-400 text-sm">Quote refused. You can take the standard spec or send another request.</p>
                      )}
                      {(!bespoke || bespoke.status === 'refused') && (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={quoteBusy || !metal || !handle}
                          onClick={submitRequest}
                        >
                          {quoteBusy ? 'Sending…' : 'Send request for a quote'}
                        </Button>
                      )}
                      {bespoke?.status === 'requested' && (
                        <Button variant="outline" className="w-full" disabled={quoteBusy || !metal || !handle} onClick={submitRequest}>
                          {quoteBusy ? 'Sending…' : 'Update request'}
                        </Button>
                      )}
                    </>
                  )}
                  {quoteMessage && <p className="text-sm text-brand-orange">{quoteMessage}</p>}
                </CardContent>
              </Card>
            )}

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
                  {accepted && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Agreed quote</span>
                      <span className="text-white">{formatPrice(accepted.total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-brand-dark-border pt-2">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <span className="text-2xl font-bold text-brand-orange">
                      {displayQuote ? formatPrice(displayQuote.total) : `From ${formatPrice(liveCatalog.base)}`}
                    </span>
                  </div>
                  {displayQuote && (
                    <p className="text-zinc-400 text-sm">
                      50% deposit now ({formatPrice(displayQuote.deposit)}) · balance {formatPrice(displayQuote.balance)} when it&apos;s done
                    </p>
                  )}
                  {waitingOnQuote && (
                    <p className="text-amber-300 text-sm">
                      {bespoke?.status === 'quoted'
                        ? 'Accept or refuse the quote above before you pay a deposit.'
                        : 'This request is with me for a quote. I will email you when the price is ready.'}
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
                  ) : waitingOnQuote ? (
                    'Waiting on quote'
                  ) : canOrder ? (
                    'Pre-order — 50% deposit'
                  ) : hasRequest && !bespoke ? (
                    'Send the request first'
                  ) : (
                    'Pick your spec to pre-order'
                  )}
                </Button>
                {token && intentSaved && (
                  <p className="text-xs text-green-400 text-center">Spec saved — I can see this on my side even if you don&apos;t check out yet.</p>
                )}
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
            {displayQuote ? formatPrice(displayQuote.total) : `From ${formatPrice(liveCatalog.base)}`}
          </span>
        </div>
        <Button onClick={handleAddToCart} size="lg" className="w-full" disabled={!canOrder || addedToCart}>
          {waitingOnQuote ? 'Waiting on quote' : canOrder ? 'Pre-order — 50% deposit' : 'Pick your spec'}
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
