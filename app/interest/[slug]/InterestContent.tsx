'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { ImageLightbox } from '@/components/ImageLightbox'
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
}: {
  list: InterestList
  count: number
}) {
  const questions = parseQuestions(list.questions)
  const gallery = parseGalleryImages(list.gallery_images)
  const lightboxImages = [list.hero_image_url, ...gallery].filter((u): u is string => !!u)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const priceLine = formatLikelyPrice(list.price_from, list.price_to)
  const metaLine = [priceLine, list.expected_launch].filter(Boolean).join(' · ')
  const showCount = list.show_count && count >= 10

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
                {status === 'success' || status === 'already' ? (
                  <div className="text-center py-4">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center">
                      <Check className="h-7 w-7 text-green-400" />
                    </div>
                    {status === 'success' ? (
                      <>
                        <p className="text-green-400 text-xl font-semibold mb-2">You&apos;re on the list.</p>
                        <p className="text-zinc-400">I&apos;ll shout when there&apos;s something to shout about.</p>
                      </>
                    ) : (
                      <p className="text-green-400 text-xl font-semibold">You&apos;re already on this one. Good taste.</p>
                    )}
                  </div>
                ) : (
                  <>
                    {metaLine && (
                      <p className="text-zinc-500 text-sm mb-6">{metaLine}</p>
                    )}

                    <div className="space-y-5">
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
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

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

                      <button
                        onClick={handleSubmit}
                        disabled={status === 'loading'}
                        className="w-full px-6 py-3 bg-brand-orange text-brand-dark font-bold rounded-lg hover:bg-brand-orange/90 transition-colors disabled:opacity-60"
                      >
                        {status === 'loading' ? '…' : 'Put Me On The List'}
                      </button>

                      {status === 'error' && errorMessage && (
                        <p className="text-red-400 text-sm">{errorMessage}</p>
                      )}

                      <p className="text-zinc-600 text-xs text-center">
                        No payment. No commitment. Just an email address.
                      </p>

                      {showCount && (
                        <p className="text-zinc-500 text-sm text-center">
                          {count} people on the list so far
                        </p>
                      )}
                    </div>
                  </>
                )}
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
