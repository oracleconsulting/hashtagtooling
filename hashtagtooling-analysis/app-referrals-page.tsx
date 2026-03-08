'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, Mail, MessageCircle, Share2 } from 'lucide-react'
import Link from 'next/link'

export default function ReferralsPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGetCode = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, name: name.trim() || undefined }),
      })
      const data = await res.json()
      if (data.code) {
        setCode(data.code)
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/cart` : 'https://hashtag.guru/cart'
  const shareText = `Get £10 off your first #TOOLING order with my referral code: ${code}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const mailtoUrl = `mailto:?subject=${encodeURIComponent('£10 off #TOOLING')}&body=${encodeURIComponent(shareText)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-orange mb-4">
          Share your love of #TOOLING
        </h1>
        <p className="text-zinc-400 text-lg mb-10">
          Give your friends £10 off their order — and earn £10 credit when they use your code.
        </p>

        <div className="bg-brand-dark-card border border-brand-dark-border rounded-xl p-8 mb-10">
          <h2 className="text-xl font-semibold text-white mb-2">How it works</h2>
          <ol className="space-y-3 text-zinc-300 mb-8">
            <li>1. Get your unique referral code below</li>
            <li>2. Share it with friends (WhatsApp, email, social)</li>
            <li>3. They get £10 off orders over £50</li>
            <li>4. You get £10 credit when they checkout</li>
          </ol>

          {status !== 'success' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Your email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                  placeholder="you@example.com"
                  className="bg-brand-dark border-brand-dark-border text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Your name (optional)</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-brand-dark border-brand-dark-border text-white"
                />
              </div>
              <Button onClick={handleGetCode} disabled={status === 'loading'} size="lg" className="w-full sm:w-auto">
                {status === 'loading' ? 'Generating...' : 'Get My Code'}
              </Button>
              {status === 'error' && (
                <p className="text-red-400 text-sm">Please enter a valid email address.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Your referral code</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={code}
                    className="bg-brand-dark border-brand-dark-border text-white font-mono text-lg"
                  />
                  <Button variant="outline" onClick={copyCode} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-2">Share your code</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-900/30 border border-green-800 text-green-400 hover:bg-green-900/50 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                  <a
                    href={mailtoUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-dark border border-brand-dark-border text-zinc-300 hover:border-brand-orange hover:text-brand-orange transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-dark border border-brand-dark-border text-zinc-300 hover:border-brand-orange hover:text-brand-orange transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Twitter
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-sm text-zinc-500 space-y-2">
          <p><strong className="text-zinc-400">Terms:</strong> £10 off orders over £50. One use per customer. You can&apos;t refer yourself.</p>
          <Link href="/shop" className="inline-block text-brand-orange hover:underline mt-4">
            Browse the shop →
          </Link>
        </div>
      </div>
    </div>
  )
}
