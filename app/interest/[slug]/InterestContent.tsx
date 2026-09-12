'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { ImageLightbox } from '@/components/ImageLightbox'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import {
  INTEREST_SPECS,
  PREORDER_DELIVERY,
  applyCatalogToQuestions,
  isPricedInterestSlug,
  quoteInterestBuild,
  withInterestChoiceQuestions,
  type InterestPricingCatalog,
} from '@/lib/interest-pricing'
import {
  EMAIL_REGEX,
  formatLikelyPrice,
  parseGalleryImages,
  parseQuestions,
  type InterestList,
  type InterestQuestion,
} from '@/lib/interest'

type FormStatus = 'idle' | 'loading' | 'success' | 'already' | 'error'

export default function InterestContent({
  list,
  count,
  catalog,
}: {
  list: InterestList
  count: number
  catalog: InterestPricingCatalog | null
}) {
  const [liveCatalog, setLiveCatalog] = useState<InterestPricingCatalog | null>(catalog)
  const questions = applyCatalogToQuestions(
    withInterestChoiceQuestions(list.slug, parseQuestions(list.questions)),
    liveCatalog
  )
  const gallery = parseGalleryImages(list.gallery_images)
  const lightboxImages = [list.hero_image_url, ...gallery].filter((u): u is string => !!u)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [preorderAdded, setPreorderAdded] = useState(false)
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()

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

  const priceLine = formatLikelyPrice(list.price_from, list.price_to)
  const metaLine = [priceLine, list.expected_launch || PREORDER_DELIVERY].filter(Boolean).join(' · ')
  const showCount = list.show_count && count >= 10
  const quote = liveCatalog ? quoteInterestBuild(list.slug, answers, liveCatalog) : null
  const canPreorder = Boolean(quote && quote.metal && quote.handle)

  const optionPremium = (key: string, option: string) => {
    if (!liveCatalog || !isPricedInterestSlug(list.slug)) return 0
    const spec = INTEREST_SPECS[list.slug]
    if (key === spec.metalKey) return liveCatalog.metals.find((m) => m.name === option)?.premium ?? 0
    if (key === spec.handleKey) return liveCatalog.woods.find((w) => w.name === option)?.premium ?? 0
    return 0
  }

  const setSingle = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (status === 'error') setStatus('idle')
  }

  const toggleMulti = (key: string, value: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : []
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [key]: next }
    })
    if (status === 'error') setStatus('idle')
  }

  const setText = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (status === 'error') setStatus('idle')
  }

  const isSelected = (q: InterestQuestion, option: string) => {
    const val = answers[q.key]
    if (q.type === 'multi') return Array.isArray(val) && val.includes(option)
    return val === option
  }

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }

    for (const q of questions) {
      if (!q.required) continue
      const val = answers[q.key]
      const empty = q.type === 'multi'
        ? !Array.isArray(val) || val.length === 0
        : !String(val || '').trim()
      if (empty) {
        setStatus('error')
        setErrorMessage(`Please answer: ${q.label}`)
        return
      }
    }

    setStatus('loading')
    setErrorMessage('')
    try {
      const res = await fetch('/api/interest/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: list.slug,
          email: trimmed,
          name: name.trim() || undefined,
          answers,
          source: 'interest-page',
          marketing_consent: marketingConsent,
        }),
      })
      const data = await res.json()
      if (data.status === 'already') {
        setStatus('already')
      } else if (data.status === 'success') {
        setStatus('success')
        setEmail('')
        setName('')
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Try again.')
    }
  }

  const handlePreorder = () => {
    if (!quote || !canPreorder) return
    const metal = quote.metal || ''
    const handle = quote.handle || ''
    const name =
      list.slug === 'muddler'
        ? `Hashtag Muddler — Lignum Vitae / ${handle} / ${metal}`
        : `Bottle Opener — ${handle} / ${metal}`
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
        handleWoodName: handle || undefined,
        transitionName: metal || undefined,
      },
      shipping: { uk: 5.99, europe: 15.99, world: 25.99 },
    })
    setPreorderAdded(true)
    router.push('/cart')
  }

  const pillClass = (selected: boolean) =>
    `px-4 py-2 rounded-full text-sm transition-colors ${
      selected
        ? 'bg-brand-orange text-brand-dark font-semibold'
        : 'bg-brand-dark border border-brand-dark-border text-zinc-300 hover:border-zinc-500'
    }`

  return (
    <div className="min-h-screen">
      <section className="bg-brand-dark py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-4">
            Register Interest
          </p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            {list.name}
          </h1>
          {list.tagline && (
            <p className="text-zinc-400 text-xl leading-relaxed max-w-2xl mx-auto">
              {list.tagline}
            </p>
          )}
        </div>
      </section>

      <section className="bg-brand-dark-card py-16">
        <div className="container mx-auto px-4">
          {list.hero_image_url && (
            <div className="max-w-2xl mx-auto mb-10">
              <button
                onClick={() => setLightboxIndex(0)}
                className="block w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={list.hero_image_url}
                  alt={list.name}
                  className="w-full rounded-lg object-cover"
                />
              </button>
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
            </div>
          )}

          {list.description && (
            <div className="max-w-2xl mx-auto mb-12 text-left">
              {list.description.split('\n\n').map((block, i) => (
                <p key={i} className="text-zinc-300 leading-relaxed mb-4 last:mb-0">
                  {block}
                </p>
              ))}
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            {list.status === 'closed' && (
              <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6 md:p-8 text-center">
                <p className="text-white text-lg font-semibold">List&apos;s closed for now.</p>
              </div>
            )}

            {list.status === 'launched' && (
              <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6 md:p-8 text-center">
                <p className="text-white text-lg font-semibold mb-4">This one&apos;s live.</p>
                {list.launched_product_id && (
                  <Link
                    href={`/product/${list.launched_product_id}`}
                    className="inline-block px-8 py-3 bg-brand-orange text-brand-dark font-bold rounded-lg hover:bg-brand-orange/90 transition-colors"
                  >
                    View product →
                  </Link>
                )}
              </div>
            )}

            {list.status === 'open' && (
              <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6 md:p-8">
                {(status === 'success' || status === 'already') && (
                  <div className="text-center pb-6 mb-6 border-b border-brand-dark-border">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center">
                      <Check className="h-7 w-7 text-green-400" />
                    </div>
                    {status === 'success' ? (
                      <>
                        <p className="text-green-400 text-xl font-semibold mb-2">You&apos;re on the list.</p>
                        <p className="text-zinc-400">Want to lock a November build? Pre-order with a 50% deposit.</p>
                      </>
                    ) : (
                      <p className="text-green-400 text-xl font-semibold">You&apos;re already on this one. Good taste.</p>
                    )}
                  </div>
                )}

                {metaLine && (
                  <p className="text-zinc-500 text-sm mb-6">{metaLine}</p>
                )}

                {list.slug === 'muddler' && (
                  <p className="text-zinc-400 text-sm mb-6">
                    Head is <span className="text-white font-medium">Lignum Vitae</span> — that&apos;s fixed. You choose the transition and the handle wood.
                  </p>
                )}
                {list.slug === 'bottle-opener' && (
                  <p className="text-zinc-400 text-sm mb-6">
                    Pick the head metal and the handle wood. Price updates as you choose.
                  </p>
                )}

                <div className="space-y-5">
                  {status !== 'success' && status !== 'already' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                          Email <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 bg-brand-dark border border-brand-dark-border rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-orange transition-colors text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                          placeholder="Optional"
                          className="w-full px-4 py-3 bg-brand-dark border border-brand-dark-border rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-orange transition-colors text-base"
                        />
                      </div>
                    </>
                  )}

                  {questions.map((q) => (
                    <div key={q.key}>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        {q.label}
                        {q.required && <span className="text-brand-orange"> *</span>}
                      </label>
                      {q.type === 'text' ? (
                        <textarea
                          rows={3}
                          value={typeof answers[q.key] === 'string' ? (answers[q.key] as string) : ''}
                          onChange={(e) => setText(q.key, e.target.value)}
                          className="w-full px-4 py-3 bg-brand-dark border border-brand-dark-border rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-orange transition-colors text-base resize-y"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(q.options || []).map((option) => (
                            <button
                              key={option}
                              onClick={() =>
                                q.type === 'multi' ? toggleMulti(q.key, option) : setSingle(q.key, option)
                              }
                              className={pillClass(isSelected(q, option))}
                            >
                              {option}
                              {optionPremium(q.key, option) > 0 ? ` +£${optionPremium(q.key, option)}` : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {status !== 'success' && status !== 'already' && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-1 accent-brand-orange"
                      />
                      <span>
                        <span className="text-zinc-200 text-sm">Also add me to the #TOOLING mailing list</span>
                        <span className="block text-zinc-500 text-xs mt-0.5">
                          New tools, wood finds, workshop stuff. Unsubscribe whenever.
                        </span>
                      </span>
                    </label>
                  )}

                  {liveCatalog && (
                    <div className="border border-brand-dark-border rounded-lg p-4 space-y-1">
                      <p className="text-white font-semibold">
                        {canPreorder && quote ? formatPrice(quote.total) : `From ${formatPrice(liveCatalog.base)}`}
                      </p>
                      {canPreorder && quote ? (
                        <p className="text-zinc-400 text-sm">
                          50% deposit now ({formatPrice(quote.deposit)}) · balance {formatPrice(quote.balance)} when it&apos;s done
                        </p>
                      ) : (
                        <p className="text-zinc-400 text-sm">Pick metal and handle wood to see the quote for your spec.</p>
                      )}
                      <p className="text-zinc-500 text-xs">Aimed at {PREORDER_DELIVERY}</p>
                    </div>
                  )}

                  {status !== 'success' && status !== 'already' && (
                    <button
                      onClick={handleSubmit}
                      disabled={status === 'loading'}
                      className="w-full px-6 py-3 bg-brand-dark border border-brand-dark-border text-white font-bold rounded-lg hover:border-brand-orange transition-colors disabled:opacity-60"
                    >
                      {status === 'loading' ? '…' : 'Put Me On The List'}
                    </button>
                  )}

                  <button
                    onClick={handlePreorder}
                    disabled={!canPreorder || preorderAdded}
                    className="w-full px-6 py-3 bg-brand-orange text-brand-dark font-bold rounded-lg hover:bg-brand-orange/90 transition-colors disabled:opacity-60"
                  >
                    {preorderAdded ? 'Added to cart' : canPreorder ? 'Pre-order — 50% deposit' : 'Pick your spec to pre-order'}
                  </button>

                  {status === 'error' && errorMessage && (
                    <p className="text-red-400 text-sm">{errorMessage}</p>
                  )}

                  <p className="text-zinc-600 text-xs text-center">
                    List is just an email. Pre-order is 50% now, 50% on completion, aimed at the end of November.
                  </p>

                  {showCount && (
                    <p className="text-zinc-500 text-sm text-center">
                      {count} people on the list so far
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

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
