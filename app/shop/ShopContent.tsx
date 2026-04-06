'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock_status: 'in_stock' | 'made_to_order' | 'sold' | 'out_of_stock'
  subcategory?: string
  parent_product_id?: string | null
  material_species?: string | null
  material_id?: string | null
  metadata?: { species?: string; shipping?: { uk: number; europe: number; world: number } } | null
}

const CATEGORIES = [
  { id: 'all', name: 'All Products' },
  { id: 'mallet', name: 'Mallets' },
  { id: 'awl', name: 'Awls' },
  { id: 'square', name: 'Engineering Squares' },
  { id: 'wood', name: 'Wood for Sale' },
  { id: 'coin', name: 'EDC Coins' },
  { id: 'mystery', name: 'Mystery Box' },
]

const WOOD_SUBCATEGORIES = [
  { id: 'all', name: 'All Wood' },
  { id: 'blank', name: 'Timber blanks' },
  { id: 'offcut', name: 'Offcuts & Blanks' },
  { id: 'sample_pack', name: 'Sample Packs' },
  { id: 'slab', name: 'Slabs' },
  { id: 'pen_blank', name: 'Pen Blanks' },
]

function productMatchesSpecies(p: Product, species: string): boolean {
  const target = species.trim()
  if (!target) return true
  const ms = p.material_species?.trim()
  if (ms) {
    if (ms === target) return true
    const parts = ms.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.includes(target)) return true
  }
  const meta = p.metadata && typeof p.metadata === 'object' ? (p.metadata as { species?: string }).species : undefined
  if (meta) {
    if (meta === target) return true
    if (meta.split(',').map((s) => s.trim()).includes(target)) return true
  }
  return p.name.toLowerCase().includes(target.toLowerCase())
}

function ShopContentInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') || 'all'
  const speciesParam = searchParams.get('species')

  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [selectedWoodSub, setSelectedWoodSub] = useState<string>('all')
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [woodPieceCounts, setWoodPieceCounts] = useState<Record<string, number>>({})
  const [woodInventoryParentIds, setWoodInventoryParentIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedCategory(categoryParam)
  }, [categoryParam])

  useEffect(() => {
    setSelectedSpecies(speciesParam ? decodeURIComponent(speciesParam) : 'all')
  }, [speciesParam])

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: dbError } = await supabase
        .from('products')
        .select('*')
        .in('stock_status', ['in_stock', 'made_to_order'])
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      const list = (data || []) as Product[]
      const parentsOnly = list.filter((p) => !p.parent_product_id)
      const woodParentIds = parentsOnly.filter((p) => p.category === 'wood').map((p) => p.id)
      const counts: Record<string, number> = {}
      for (const wid of woodParentIds) counts[wid] = 0
      const invParents = new Set<string>()
      if (woodParentIds.length > 0) {
        const { data: anyKids } = await supabase
          .from('products')
          .select('parent_product_id')
          .in('parent_product_id', woodParentIds)
        for (const row of anyKids || []) {
          invParents.add((row as { parent_product_id: string }).parent_product_id)
        }
        const { data: kids } = await supabase
          .from('products')
          .select('parent_product_id')
          .in('parent_product_id', woodParentIds)
          .eq('stock_status', 'in_stock')
        for (const row of kids || []) {
          const pid = (row as { parent_product_id: string }).parent_product_id
          counts[pid] = (counts[pid] || 0) + 1
        }
      }
      const isReal = (url: string | null | undefined) => url && !url.includes('placehold.co')
      const needGrain = parentsOnly.filter((p) => p.material_id && !isReal(p.image_url))
      if (needGrain.length > 0) {
        const matIds = [...new Set(needGrain.map((p) => p.material_id!).filter(Boolean))]
        const { data: mats } = await supabase
          .from('materials')
          .select('id, grain_image_url')
          .in('id', matIds)
        const grainMap = new Map((mats || []).map((m: { id: string; grain_image_url: string | null }) => [m.id, m.grain_image_url]))
        for (const p of parentsOnly) {
          if (p.material_id && !isReal(p.image_url)) {
            const grain = grainMap.get(p.material_id)
            if (grain) p.image_url = grain
          }
        }
      }

      setWoodInventoryParentIds(invParents)
      setWoodPieceCounts(counts)
      setProducts(parentsOnly)
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Unable to load products. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const mapCategory = (cat: string) => {
    const mapping: Record<string, string> = {
      mallets: 'mallet',
      awls: 'awl',
      coins: 'coin',
      wood: 'wood',
      squares: 'square',
    }
    return mapping[cat] || cat
  }

  const effectiveCategory = mapCategory(selectedCategory)

  const woodSpeciesOptions = useMemo(() => {
    const s = new Set<string>()
    for (const p of products) {
      if (p.category !== 'wood') continue
      const ms = p.material_species?.trim()
      if (ms) {
        for (const part of ms.split(',')) {
          const t = part.trim()
          if (t) s.add(t)
        }
      }
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [products])

  let filteredProducts =
    effectiveCategory === 'all' ? products : products.filter((p) => p.category === effectiveCategory)

  if (effectiveCategory === 'wood' && selectedWoodSub !== 'all') {
    filteredProducts = filteredProducts.filter((p) => p.subcategory === selectedWoodSub)
  }

  if (effectiveCategory === 'wood' && selectedSpecies !== 'all') {
    filteredProducts = filteredProducts.filter((p) => productMatchesSpecies(p, selectedSpecies))
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl font-bold mb-2 text-brand-orange">Shop</h1>
      <p className="text-zinc-400 mb-8">Handcrafted tools and materials. Each piece is unique.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={
              effectiveCategory === cat.id || (effectiveCategory === 'all' && cat.id === 'all') ? 'default' : 'outline'
            }
            onClick={() => {
              setSelectedCategory(cat.id)
              setSelectedWoodSub('all')
              const params = new URLSearchParams(searchParams.toString())
              if (cat.id === 'all') {
                params.delete('category')
                params.delete('species')
                setSelectedSpecies('all')
              } else {
                params.set('category', cat.id)
                if (cat.id !== 'wood') {
                  params.delete('species')
                  setSelectedSpecies('all')
                }
              }
              const q = params.toString()
              router.push(q ? `${pathname}?${q}` : pathname)
            }}
            size="sm"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {effectiveCategory === 'wood' && (
        <>
          {woodSpeciesOptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-2">Species</label>
              <select
                className="w-full max-w-sm h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3 text-sm"
                value={selectedSpecies}
                onChange={(e) => {
                  const v = e.target.value
                  setSelectedSpecies(v)
                  const params = new URLSearchParams(searchParams.toString())
                  if (v === 'all') params.delete('species')
                  else params.set('species', v)
                  if (!params.get('category')) params.set('category', 'wood')
                  router.push(`${pathname}?${params.toString()}`)
                }}
              >
                <option value="all">All species</option>
                {woodSpeciesOptions.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-10">
            {WOOD_SUBCATEGORIES.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedWoodSub(sub.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedWoodSub === sub.id
                    ? 'bg-brand-orange text-brand-dark'
                    : 'border border-brand-dark-border text-zinc-300 hover:border-zinc-500 hover:text-white'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-zinc-400 mb-4">{error}</p>
          <Button onClick={loadProducts}>Try Again</Button>
        </div>
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              metadata={{
                ...product.metadata,
                species: product.material_species || product.metadata?.species,
              }}
              parentListingPieceCount={
                product.category === 'wood' && woodInventoryParentIds.has(product.id)
                  ? woodPieceCounts[product.id]
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-400 mb-4">No products found in this category yet.</p>
          <p className="text-zinc-500 text-sm">Check back soon — new pieces are added regularly.</p>
        </div>
      )}
    </div>
  )
}

export default function ShopContent() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <h1 className="font-heading text-4xl font-bold mb-8 text-brand-orange">Shop</h1>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          </div>
        </div>
      }
    >
      <ShopContentInner />
    </Suspense>
  )
}
