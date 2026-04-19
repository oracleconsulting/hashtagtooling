'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const RATING_LABELS: Record<number, string> = {
  5: 'Absolutely love it',
  4: 'Really good',
  3: "It's alright",
  2: 'Not great',
  1: 'Disappointed',
}

export default function ReviewForm({ token }: { token: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'submitted' | 'used' | 'invalid'>('loading')
  const [customerName, setCustomerName] = useState('')
  const [productName, setProductName] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await fetch(`/api/reviews/validate-token?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (data.valid) {
          setCustomerName(data.name || '')
          setProductName(data.product_name || null)
          setStatus('ready')
        } else if (data.reason === 'already_used') {
          setCustomerName(data.name || '')
          setStatus('used')
        } else {
          setStatus('invalid')
        }
      } catch {
        setStatus('invalid')
      }
    }
    validate()
  }, [token])

  const handleSubmit = async () => {
    if (rating === 0) {
      setErrorMsg('Please select a star rating')
      return
    }
    setErrorMsg('')
    setStatus('submitting')

    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, title, body }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCustomerName(data.name || customerName)
        setStatus('submitted')
      } else {
        setErrorMsg(data.error || 'Something went wrong')
        setStatus('ready')
      }
    } catch {
      setErrorMsg('Connection error — please try again')
      setStatus('ready')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-3xl font-bold text-white mb-4">Invalid Link</h1>
          <p className="text-zinc-400 mb-6">This review link isn&apos;t valid. It may have expired or already been used.</p>
          <Link href="/"><Button>Back to Shop</Button></Link>
        </div>
      </div>
    )
  }

  if (status === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-3xl font-bold text-brand-orange mb-4">Already Reviewed</h1>
          <p className="text-zinc-400 mb-6">Thanks, {customerName}. You&apos;ve already submitted your review using this link.</p>
          <Link href="/shop"><Button>Browse the Shop</Button></Link>
        </div>
      </div>
    )
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">{'★'.repeat(rating)}</div>
          <h1 className="font-heading text-3xl font-bold text-brand-orange mb-4">Thank You!</h1>
          <p className="text-zinc-300 mb-6">
            Thanks, {customerName}. Your review will be live shortly — it genuinely makes a difference.
          </p>
          <Link href="/shop"><Button size="lg">Browse the Shop</Button></Link>
        </div>
      </div>
    )
  }

  const activeRating = hovered || rating

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-brand-orange mb-2">#TOOLING</h1>
          <p className="text-zinc-400">
            Hi {customerName} — how are you getting on with your{' '}
            {productName ? <span className="text-white font-medium">{productName}</span> : 'piece'}?
          </p>
        </div>

        <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6 space-y-6">
          {/* Star rating */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Rating</label>
            <div className="flex items-center gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <span className={`text-4xl ${star <= activeRating ? 'text-brand-orange' : 'text-zinc-700'} transition-colors`}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            {activeRating > 0 && (
              <p className="text-center text-sm text-zinc-400 mt-2">
                {activeRating} — {RATING_LABELS[activeRating]}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="review-title" className="block text-sm font-medium text-zinc-300 mb-2">
              Title <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum it up in a few words"
              maxLength={120}
              className="w-full px-4 py-3 rounded-lg border border-brand-dark-border bg-brand-dark text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="review-body" className="block text-sm font-medium text-zinc-300 mb-2">
              Your review <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="What do you like about it? How are you using it?"
              className="w-full px-4 py-3 rounded-lg border border-brand-dark-border bg-brand-dark text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
            />
          </div>

          {errorMsg && (
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
          )}

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Your name and review will be published on the product page. Your email is never shared.
        </p>
      </div>
    </div>
  )
}
