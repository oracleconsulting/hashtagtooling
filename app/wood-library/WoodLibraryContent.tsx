'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Volume2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

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

interface StockPiece {
  id: string
  name: string
  sku: string | null
  dimensions: string | null
  price: number
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

  const [selectedWoodId, setSelectedWoodId] = useState<string | null>(null)
  const [detailPieces, setDetailPieces] = useState<StockPiece[]>([])
  const [loadingPieces, setLoadingPieces] = useState(false)

  useEffect(() => {
    if (!selectedWoodId) {
      setDetailPieces([])
      return
    }
    let cancelled = false
    setLoadingPieces(true)
    supabase
      .from('products')
      .select('id,name,sku,dimensions,price,stock_status,material_id,material_ids')
      .eq('stock_status', 'in_stock')
      .not('parent_product_id', 'is', null)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error(error)
          setDetailPieces([])
          setLoadingPieces(false)
          return
        }
        const list = (data || []).filter(
          (row: { material_id?: string | null; material_ids?: string[] | null }) =>
            row.material_id === selectedWoodId || (row.material_ids && row.material_ids.includes(selectedWoodId))
        ) as StockPiece[]
        setDetailPieces(list)
        setLoadingPieces(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedWoodId])

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

  const selectedWood = useMemo(() => woods.find((w) => w.id === selectedWoodId), [woods, selectedWoodId])

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
          const selected = selectedWoodId === wood.id

          return (
            <div
              key={wood.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedWoodId((id) => (id === wood.id ? null : wood.id))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedWoodId((id) => (id === wood.id ? null : wood.id))
                }
              }}
              className={`bg-brand-dark-card border rounded-lg overflow-hidden transition-all text-left cursor-pointer ${
                selected ? 'border-brand-orange ring-2 ring-brand-orange/40' : 'border-brand-dark-border hover:border-brand-orange'
              }`}
            >
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-brand-dark mb-4 pointer-events-none">
                {wood.grain_image_url ? (
                  <img src={wood.grain_image_url} alt={`${wood.name} wood grain`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: wood.color_hex || '#333' }}>
                    <span className="text-xs text-white/50 italic">Grain photo coming soon</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-white mb-2">{wood.name}</h3>
                {stockCount > 0 && (
                  <Link
                    href={`/shop?category=wood&species=${encodeURIComponent(wood.name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mb-2 text-xs px-2.5 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 hover:bg-brand-orange/30 transition-colors"
                  >
                    {stockCount === 1 ? '1 piece available' : `${stockCount} in stock`}
                  </Link>
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
                  <div className="mt-3 pointer-events-none">
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
                {wood.grain_description && <p className="text-sm text-zinc-400 mt-3 leading-relaxed pointer-events-none">{wood.grain_description}</p>}
                {wood.tap_audio_url && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handlePlay(wood)}
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
                  <div className="flex flex-wrap gap-1 mt-3 pointer-events-none">
                    {badges.map((b) => (
                      <span key={b} className="px-2 py-0.5 rounded text-xs font-medium bg-brand-dark-border text-zinc-400">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-3">Click card for stock details</p>
              </div>
            </div>
          )
        })}
      </div>

      {selectedWood && (
        <div className="mb-16 p-6 rounded-lg border border-brand-dark-border bg-brand-dark-card">
          <h2 className="font-heading text-xl text-white mb-2">Available stock — {selectedWood.name}</h2>
          {loadingPieces ? (
            <div className="flex items-center gap-2 text-zinc-400 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-brand-orange" />
              Loading pieces…
            </div>
          ) : detailPieces.length > 0 ? (
            <ul className="space-y-3 mt-4">
              {detailPieces.map((piece) => (
                <li
                  key={piece.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-brand-dark-border/60 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{piece.name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{piece.sku || '—'}</p>
                    {piece.dimensions && <p className="text-sm text-zinc-400">{piece.dimensions}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-brand-orange font-semibold">{formatPrice(piece.price)}</span>
                    <Link
                      href={`/product/${piece.id}`}
                      className="inline-flex items-center justify-center rounded-md font-medium transition-colors h-8 px-3 text-sm bg-brand-orange text-brand-dark hover:bg-brand-orange-hover font-bold"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-400 mt-4">
              No pieces currently in stock. Check back soon or{' '}
              <Link href="/commissions" className="text-brand-orange hover:underline">
                commission a custom piece
              </Link>
              .
            </p>
          )}
        </div>
      )}

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
