'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Loader2, Copy, Check, RefreshCw, Instagram, ChevronDown } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock_status: string
}

interface GeneratedContent {
  caption: string
  hashtags: string
  tip: string
}

type Platform = 'instagram' | 'pinterest' | 'facebook'
type Tone = 'craft' | 'product' | 'story'

const PLATFORMS: { id: Platform; label: string; icon: string; color: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'border-pink-500/50 bg-pink-500/5' },
  { id: 'pinterest', label: 'Pinterest', icon: '📌', color: 'border-red-500/50 bg-red-500/5' },
  { id: 'facebook', label: 'Facebook', icon: '👥', color: 'border-blue-500/50 bg-blue-500/5' },
]

const TONES: { id: Tone; label: string; desc: string }[] = [
  { id: 'craft', label: 'The Making', desc: 'Process, material choice, technique' },
  { id: 'product', label: 'The Piece', desc: 'Beauty, rarity, what it feels like to use' },
  { id: 'story', label: 'The Story', desc: 'Where it came from, why this wood' },
]

// ---------------------------------------------------------------------------
// Copy button with tick feedback
// ---------------------------------------------------------------------------
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
        copied
          ? 'bg-green-900/40 text-green-400 border border-green-800'
          : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminSocialPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [tone, setTone] = useState<Tone>('craft')
  const [extraNotes, setExtraNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedContent | null>(null)
  const [error, setError] = useState('')
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadProducts()
  }, [router])

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, description, price, category, image_url, stock_status')
      .neq('stock_status', 'out_of_stock')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoadingProducts(false)
  }

  const generate = async () => {
    if (!selectedProduct) return
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/generate-social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: selectedProduct,
          platform,
          tone,
          extraNotes: extraNotes.trim(),
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch {
      setError('Failed to generate. Check OPENROUTER_API_KEY is set in Railway.')
    } finally {
      setGenerating(false)
    }
  }

  const fullPost = result
    ? platform === 'instagram'
      ? `${result.caption}\n\n${result.hashtags}`
      : `${result.caption}\n\n${result.hashtags}`
    : ''

  if (loadingProducts) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-brand-orange">Social Content</h1>
          <p className="text-zinc-500 text-sm mt-1">Generate captions and hashtags for any product</p>
        </div>
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">← Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ---------------------------------------------------------------- */}
        {/* Left panel — controls                                             */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-5">

          {/* Product picker */}
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 text-sm">Product</h3>

            {/* Selected product preview */}
            {selectedProduct ? (
              <div
                className="flex items-center gap-3 mb-3 cursor-pointer p-2 rounded hover:bg-zinc-800 transition-colors"
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
              >
                <div className="w-12 h-12 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                  <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{selectedProduct.name}</p>
                  <p className="text-zinc-500 text-xs">£{selectedProduct.price} · {selectedProduct.category}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-zinc-500 flex-shrink-0 transition-transform ${productDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            ) : (
              <button
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                className="w-full py-3 border border-dashed border-zinc-700 rounded text-zinc-500 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
              >
                Select a product <ChevronDown className="h-4 w-4" />
              </button>
            )}

            {/* Dropdown list */}
            {productDropdownOpen && (
              <div className="border border-brand-dark-border rounded-lg overflow-hidden mt-1 max-h-72 overflow-y-auto">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p)
                      setProductDropdownOpen(false)
                      setResult(null)
                    }}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-800 transition-colors border-b border-brand-dark-border last:border-0 ${
                      selectedProduct?.id === p.id ? 'bg-zinc-800' : 'bg-brand-dark'
                    }`}
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{p.name}</p>
                      <p className="text-zinc-500 text-xs">£{p.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Platform */}
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 text-sm">Platform</h3>
            <div className="space-y-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPlatform(p.id); setResult(null) }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                    platform === p.id
                      ? `${p.color} border-opacity-100`
                      : 'border-brand-dark-border hover:border-zinc-600'
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className={`font-medium text-sm ${platform === p.id ? 'text-white' : 'text-zinc-400'}`}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 text-sm">Angle</h3>
            <div className="space-y-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTone(t.id); setResult(null) }}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                    tone === t.id
                      ? 'border-brand-orange bg-brand-orange/5'
                      : 'border-brand-dark-border hover:border-zinc-600'
                  }`}
                >
                  <p className={`font-medium text-sm ${tone === t.id ? 'text-brand-orange' : 'text-zinc-300'}`}>{t.label}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Extra notes */}
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
            <h3 className="text-white font-medium mb-1 text-sm">Extra context <span className="text-zinc-600 font-normal">(optional)</span></h3>
            <p className="text-zinc-600 text-xs mb-3">Anything Claude should know — wood species, a detail about this specific piece, what inspired it</p>
            <Textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="e.g. The handle is English Boxwood — incredibly rare, this was a 400-year-old fallen tree. The ferrule is copper."
              rows={3}
              className="bg-brand-dark border border-brand-dark-border text-white text-sm resize-none placeholder:text-zinc-600"
            />
          </div>

          {/* Generate button */}
          <Button
            onClick={generate}
            disabled={!selectedProduct || generating}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              '✦ Generate Content'
            )}
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right panel — output                                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-3">

          {/* Empty state */}
          {!result && !generating && !error && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg text-center p-8">
              <span className="text-5xl mb-4">✦</span>
              <p className="text-zinc-400 font-medium mb-1">Ready to generate</p>
              <p className="text-zinc-600 text-sm max-w-xs">Select a product, pick your platform and angle, then hit Generate.</p>
            </div>
          )}

          {/* Loading */}
          {generating && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-brand-dark-border rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-brand-orange mb-4" />
              <p className="text-zinc-400 text-sm">Writing your caption…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm font-medium mb-1">Generation failed</p>
              <p className="text-red-500/70 text-sm">{error}</p>
              {error.includes('OPENROUTER_API_KEY') && (
                <p className="text-zinc-500 text-xs mt-3">Add <code className="bg-zinc-800 px-1 rounded">OPENROUTER_API_KEY</code> to your Railway environment variables and redeploy.</p>
              )}
            </div>
          )}

          {/* Result */}
          {result && !generating && (
            <div className="space-y-4">

              {/* Platform badge + regenerate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PLATFORMS.find(p => p.id === platform)?.icon}</span>
                  <span className="text-zinc-400 text-sm font-medium">{PLATFORMS.find(p => p.id === platform)?.label} · {TONES.find(t => t.id === tone)?.label}</span>
                </div>
                <button
                  onClick={generate}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>

              {/* Caption */}
              <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand-dark-border bg-zinc-900/50">
                  <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Caption</span>
                  <CopyButton text={result.caption} label="Copy caption" />
                </div>
                <div className="p-4">
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{result.caption}</p>
                </div>
              </div>

              {/* Hashtags */}
              {result.hashtags && (
                <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand-dark-border bg-zinc-900/50">
                    <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Hashtags</span>
                    <CopyButton text={result.hashtags} label="Copy hashtags" />
                  </div>
                  <div className="p-4">
                    <p className="text-zinc-400 text-sm leading-relaxed font-mono">{result.hashtags}</p>
                  </div>
                </div>
              )}

              {/* Copy full post */}
              <div className="flex gap-2">
                <CopyButton text={fullPost} label="Copy full post (caption + hashtags)" />
                {platform === 'instagram' && (
                  <a
                    href="https://www.instagram.com/hashtagtooling/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all"
                  >
                    <Instagram className="h-3.5 w-3.5" /> Open Instagram
                  </a>
                )}
              </div>

              {/* Posting tip */}
              {result.tip && (
                <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-lg px-4 py-3">
                  <p className="text-brand-orange text-xs font-medium mb-0.5">Posting tip</p>
                  <p className="text-zinc-400 text-sm">{result.tip}</p>
                </div>
              )}

              {/* Product image reference */}
              {selectedProduct && (
                <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
                  <p className="text-zinc-500 text-xs font-medium mb-2 uppercase tracking-wider">Reference image</p>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{selectedProduct.name}</p>
                      <a
                        href={`/product/${selectedProduct.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-orange text-xs hover:underline"
                      >
                        View product page →
                      </a>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Usage note */}
      <p className="text-zinc-700 text-xs mt-10 text-center">
        Requires <code className="bg-zinc-900 px-1 rounded">OPENROUTER_API_KEY</code> in Railway environment variables.
        Content is generated fresh each time — regenerate until you&apos;re happy with it.
      </p>
    </div>
  )
}
