'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Volume2, ExternalLink, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

interface WoodData {
  id: string
  name: string
  category: string
  color_hex: string
  available: boolean
  grain_image_url?: string | null
  tap_audio_url?: string | null
  tap_audio_description?: string | null
  janka_hardness?: number | null
  specific_gravity?: number | null
  origin?: string | null
  grain_description?: string | null
  grain_type?: string | null
  texture?: string | null
  durability?: string | null
  color_description?: string | null
  description?: string | null
  uses_description?: string | null
  gallery_images?: string[] | null
  videos?: { url: string; title?: string }[] | null
}

interface RelatedProduct {
  id: string
  name: string
  price: number
  image_url: string
  category: string
  stock_status: string
  sku?: string | null
  dimensions?: string | null
  metadata?: Record<string, unknown> | null
}

interface WoodDetailContentProps {
  wood: WoodData
  tools: RelatedProduct[]
  stock: RelatedProduct[]
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function WoodDetailContent({ wood, tools, stock }: WoodDetailContentProps) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  const handlePlay = useCallback(() => {
    if (!wood.tap_audio_url) return
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(wood.tap_audio_url)
    audioRef.current = audio
    audio.onended = () => setPlaying(false)
    audio.onpause = () => setPlaying(false)
    audio.play()
    setPlaying(true)
  }, [playing, wood.tap_audio_url])

  const allImages = [
    ...(wood.grain_image_url ? [wood.grain_image_url] : []),
    ...(wood.gallery_images || []),
  ]

  const hardnessPercent = wood.janka_hardness ? Math.min(100, (wood.janka_hardness / 3800) * 100) : 0

  const specs = [
    wood.janka_hardness != null && { label: 'Janka Hardness', value: `${wood.janka_hardness} lbf` },
    wood.specific_gravity != null && { label: 'Specific Gravity', value: String(wood.specific_gravity) },
    wood.origin && { label: 'Origin', value: wood.origin },
    wood.grain_type && { label: 'Grain', value: wood.grain_type.charAt(0).toUpperCase() + wood.grain_type.slice(1) },
    wood.texture && { label: 'Texture', value: wood.texture.charAt(0).toUpperCase() + wood.texture.slice(1) },
    wood.durability && {
      label: 'Durability',
      value: wood.durability.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[40vh] md:h-[50vh] bg-brand-dark overflow-hidden">
        {wood.grain_image_url ? (
          <img
            src={wood.grain_image_url}
            alt={`${wood.name} wood grain`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: wood.color_hex || '#333' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto">
            <Link
              href="/wood-library"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Wood Library
            </Link>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-2">{wood.name}</h1>
            {wood.origin && <p className="text-lg text-zinc-300">{wood.origin}</p>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Specs + Hardness bar */}
        {specs.length > 0 && (
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {specs.map((s) => (
                <div key={s.label} className="p-4 rounded-lg bg-brand-dark-card border border-brand-dark-border">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-white font-medium">{s.value}</p>
                </div>
              ))}
            </div>
            {wood.janka_hardness != null && (
              <div className="mt-6 max-w-lg">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Soft</span>
                  <span>Hard</span>
                </div>
                <div className="h-3 bg-brand-dark-card rounded-full overflow-hidden border border-brand-dark-border">
                  <div
                    className="h-full bg-gradient-to-r from-brand-orange/60 to-brand-orange rounded-full transition-all duration-700"
                    style={{ width: `${hardnessPercent}%` }}
                  />
                </div>
              </div>
            )}
            {wood.color_description && (
              <div className="mt-6 p-5 rounded-lg bg-brand-dark-card border border-brand-dark-border">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Colour</h3>
                <p className="text-zinc-300 leading-relaxed">{wood.color_description}</p>
              </div>
            )}
          </section>
        )}

        {/* Tap test audio */}
        {wood.tap_audio_url && (
          <section className="p-6 rounded-lg bg-brand-dark-card border border-brand-dark-border">
            <h2 className="font-heading text-xl font-semibold text-white mb-3">Tap Test</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Hear how {wood.name} rings when struck. Every species has its own voice.
            </p>
            <button
              type="button"
              onClick={handlePlay}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-brand-orange/10 border border-brand-orange/30 hover:bg-brand-orange/20 transition-colors"
            >
              <Volume2 className="h-5 w-5 text-brand-orange" />
              <span className="text-white font-medium">{playing ? 'Stop' : 'Play tap test'}</span>
              {playing && (
                <span className="flex gap-0.5 items-end h-4">
                  {[8, 12, 6, 10].map((h, i) => (
                    <span
                      key={i}
                      className="waveform-bar w-1 bg-brand-orange rounded-full origin-bottom"
                      style={{ height: h, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </span>
              )}
            </button>
            {wood.tap_audio_description && (
              <p className="text-sm text-zinc-400 mt-3 italic">{wood.tap_audio_description}</p>
            )}
          </section>
        )}

        {/* Description / History */}
        {(wood.description || wood.grain_description) && (
          <section>
            <h2 className="font-heading text-2xl font-semibold text-white mb-4">
              About {wood.name}
            </h2>
            {wood.description && (
              <div className="prose prose-invert prose-zinc max-w-none mb-6">
                {wood.description.split('\n').map((p, i) => (
                  <p key={i} className="text-zinc-300 leading-relaxed">{p}</p>
                ))}
              </div>
            )}
            {wood.grain_description && (
              <div className="p-5 rounded-lg bg-brand-dark-card border border-brand-dark-border">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Grain Character</h3>
                <p className="text-zinc-300 leading-relaxed">{wood.grain_description}</p>
              </div>
            )}
          </section>
        )}

        {/* Uses */}
        {wood.uses_description && (
          <section>
            <h2 className="font-heading text-2xl font-semibold text-white mb-4">Common Uses</h2>
            <div className="prose prose-invert prose-zinc max-w-none">
              {wood.uses_description.split('\n').map((p, i) => (
                <p key={i} className="text-zinc-300 leading-relaxed">{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {allImages.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl font-semibold text-white mb-4">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxImg(url)}
                  className="aspect-square rounded-lg overflow-hidden bg-brand-dark-card border border-brand-dark-border hover:border-brand-orange transition-colors group"
                >
                  <img
                    src={url}
                    alt={`${wood.name} — image ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {wood.videos && wood.videos.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl font-semibold text-white mb-4">Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wood.videos.map((video, i) => {
                const ytId = extractYouTubeId(video.url)
                if (ytId) {
                  return (
                    <div key={i} className="space-y-2">
                      <div className="aspect-video rounded-lg overflow-hidden bg-brand-dark-card border border-brand-dark-border">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                          title={video.title || `${wood.name} video ${i + 1}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      {video.title && <p className="text-sm text-zinc-400">{video.title}</p>}
                    </div>
                  )
                }
                return (
                  <a
                    key={i}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg bg-brand-dark-card border border-brand-dark-border hover:border-brand-orange transition-colors"
                  >
                    <Play className="h-8 w-8 text-brand-orange shrink-0" />
                    <span className="text-white">{video.title || 'Watch video'}</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500 ml-auto" />
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* Related tools (parent products) */}
        {tools.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl font-semibold text-white mb-4">
              Tools Made with {wood.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="flex gap-4 p-4 rounded-lg bg-brand-dark-card border border-brand-dark-border hover:border-brand-orange transition-colors group"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-brand-dark shrink-0">
                    <img
                      src={product.image_url || wood.grain_image_url || '/placeholder-product.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement
                        if (el.src !== '/placeholder-product.svg') el.src = '/placeholder-product.svg'
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-white truncate">{product.name}</h3>
                    <p className="text-sm text-zinc-400 capitalize">{product.category}</p>
                    <p className="text-brand-orange font-semibold mt-1">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Available stock pieces */}
        {stock.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl font-semibold text-white mb-4">
              {wood.name} Wood for Sale
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stock.map((piece) => (
                <Link
                  key={piece.id}
                  href={`/product/${piece.id}`}
                  className="p-4 rounded-lg bg-brand-dark-card border border-brand-dark-border hover:border-brand-orange transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-medium text-white">{piece.name}</h3>
                      {piece.sku && <p className="text-xs text-zinc-500 font-mono">{piece.sku}</p>}
                    </div>
                    <span className="text-brand-orange font-semibold whitespace-nowrap">{formatPrice(piece.price)}</span>
                  </div>
                  {piece.dimensions && <p className="text-sm text-zinc-400">{piece.dimensions}</p>}
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-green-900/50 text-green-400">
                    In Stock
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* No products fallback */}
        {tools.length === 0 && stock.length === 0 && (
          <section className="text-center py-8">
            <p className="text-zinc-400 mb-4">
              No products currently available with {wood.name}. Check back soon or commission a custom piece.
            </p>
            <Link href="/commissions">
              <Button>Commission a Custom Piece</Button>
            </Link>
          </section>
        )}

        {/* CTA */}
        <section className="text-center pt-8 border-t border-brand-dark-border">
          <h2 className="font-heading text-2xl font-semibold text-white mb-3">
            Build with {wood.name}
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            Choose {wood.name} for your next custom mallet, awl, or engineering square.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/custom-mallet">
              <Button size="lg">Build a Mallet</Button>
            </Link>
            <Link href="/custom-awl">
              <Button size="lg" variant="outline">Build an Awl</Button>
            </Link>
            <Link href={`/shop?category=wood&species=${encodeURIComponent(wood.name)}`}>
              <Button size="lg" variant="outline">Browse Wood Stock</Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 text-white hover:text-brand-orange transition-colors"
            onClick={() => setLightboxImg(null)}
            aria-label="Close"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={lightboxImg}
            alt={wood.name}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
