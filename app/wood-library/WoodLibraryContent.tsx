'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Volume2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export interface WoodItem {
  id: string
  name: string
  category: string
  color_hex: string
  mallet_head_premium: number
  mallet_handle_premium: number
  awl_handle_premium: number
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
}

interface WoodLibraryContentProps {
  woods: WoodItem[]
  stockCounts?: Record<string, number>
}

export default function WoodLibraryContent({ woods, stockCounts = {} }: WoodLibraryContentProps) {
  const [search, setSearch] = useState('')
  const [audioOnly, setAudioOnly] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const filteredWoods = useMemo(() => {
    let list = woods
    if (audioOnly) list = list.filter((w) => w.tap_audio_url)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((w) => w.name.toLowerCase().includes(q))
    }
    return list
  }, [woods, search, audioOnly])

  const speciesWithAudio = useMemo(() => woods.filter((w) => w.tap_audio_url).length, [woods])

  const handlePlay = useCallback(
    (wood: WoodItem) => {
      if (!wood.tap_audio_url) return
      if (playingId === wood.id) {
        audioRef.current?.pause()
        setPlayingId(null)
        return
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(wood.tap_audio_url)
      audioRef.current = audio
      audio.onended = () => setPlayingId(null)
      audio.onpause = () => setPlayingId(null)
      audio.play()
      setPlayingId(wood.id)
    },
    [playingId]
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-orange mb-2">WOOD SPECIES LIBRARY</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Over 75 exotic timbers to choose from. Each species chosen for its density, hardness, and unique character.
        </p>
      </div>

      <div className="mb-8 p-6 rounded-lg bg-brand-dark-card border border-brand-dark-border">
        <p className="text-zinc-300 mb-2">
          🔊 Listen to the tap test — hear how each species rings when struck. Every timber has its own voice.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-zinc-400 text-sm">{speciesWithAudio} species with audio</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => setAudioOnly(e.target.checked)}
              className="rounded border-brand-dark-border"
            />
            <span className="text-sm text-zinc-400">Show species with audio only</span>
          </label>
        </div>
      </div>

      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredWoods.map((wood) => {
          const hasHead = (wood.mallet_head_premium ?? 0) >= 0
          const hasHandle = (wood.mallet_handle_premium ?? 0) >= 0
          const hasAwl = (wood.awl_handle_premium ?? 0) >= 0
          const badges = []
          if (hasHead) badges.push('Mallet head')
          if (hasHandle) badges.push('Mallet handle')
          if (hasAwl) badges.push('Awl')

          const stockCount = stockCounts[wood.id] ?? 0

          return (
            <Link
              key={wood.id}
              href={`/wood-library/${wood.id}`}
              className="bg-brand-dark-card border rounded-lg overflow-hidden transition-all text-left border-brand-dark-border hover:border-brand-orange group"
            >
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-brand-dark mb-4">
                {wood.grain_image_url ? (
                  <img
                    src={wood.grain_image_url}
                    alt={`${wood.name} wood grain`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: wood.color_hex || '#333' }}>
                    <span className="text-xs text-white/50 italic">Grain photo coming soon</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-white mb-2">{wood.name}</h3>
                {stockCount > 0 && (
                  <span className="inline-block mb-2 text-xs px-2.5 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                    {stockCount === 1 ? '1 piece available' : `${stockCount} in stock`}
                  </span>
                )}
                {wood.origin && <p className="text-xs text-zinc-500 mb-1">{wood.origin}</p>}
                {(wood.janka_hardness != null || wood.specific_gravity != null || wood.texture || wood.durability) && (
                  <p className="text-xs text-zinc-400 mb-2">
                    {wood.janka_hardness != null && `Janka ${wood.janka_hardness} lbf`}
                    {wood.janka_hardness != null && wood.specific_gravity != null && ' · '}
                    {wood.specific_gravity != null && `SG ${wood.specific_gravity}`}
                    {wood.texture && ` · ${wood.texture}`}
                    {wood.durability && ` · ${wood.durability.replace('_', ' ')}`}
                  </p>
                )}
                {wood.janka_hardness != null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Soft</span>
                      <span>Hard</span>
                    </div>
                    <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-orange/60 to-brand-orange rounded-full"
                        style={{ width: `${Math.min(100, (wood.janka_hardness / 3800) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {wood.grain_description && <p className="text-sm text-zinc-400 mt-3 leading-relaxed line-clamp-3">{wood.grain_description}</p>}
                {wood.tap_audio_url && (
                  <div className="mt-3" onClick={(e) => e.preventDefault()}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePlay(wood) }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-dark-border hover:border-brand-orange transition-colors text-sm"
                      aria-label={`Play tap test for ${wood.name}`}
                    >
                      <Volume2 className="h-4 w-4 text-brand-orange" />
                      <span className="text-zinc-300">Tap test</span>
                      {playingId === wood.id && (
                        <span className="flex gap-0.5 items-end h-4">
                          <span className="waveform-bar w-1 bg-brand-orange rounded-full origin-bottom" style={{ height: 8, animationDelay: '0ms' }} />
                          <span className="waveform-bar w-1 bg-brand-orange rounded-full origin-bottom" style={{ height: 12, animationDelay: '100ms' }} />
                          <span className="waveform-bar w-1 bg-brand-orange rounded-full origin-bottom" style={{ height: 6, animationDelay: '200ms' }} />
                          <span className="waveform-bar w-1 bg-brand-orange rounded-full origin-bottom" style={{ height: 10, animationDelay: '300ms' }} />
                        </span>
                      )}
                    </button>
                    {wood.tap_audio_description && (
                      <p className="text-xs text-zinc-500 mt-1.5 italic">{wood.tap_audio_description}</p>
                    )}
                  </div>
                )}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {badges.map((b) => (
                      <span key={b} className="px-2 py-0.5 rounded text-xs font-medium bg-brand-dark-border text-zinc-400">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-3">Click to explore this species →</p>
              </div>
            </Link>
          )
        })}
      </div>

      {filteredWoods.length === 0 && (
        <p className="text-center text-zinc-400 py-8">
          {search.trim() ? 'No species match your search.' : 'No wood species in the library yet.'}
        </p>
      )}

      <div className="text-center">
        <Link href="/custom-mallet">
          <Button size="lg">
            Ready to choose? <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <p className="text-zinc-400 text-sm mt-2">Build Your Custom Mallet</p>
      </div>
    </div>
  )
}
