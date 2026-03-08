'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, X, LayoutGrid, List } from 'lucide-react'

interface Product {
  id: string
  name: string
  description?: string
  image_url: string
  category: string
  created_at: string
  metadata?: { head_wood?: string; handle_wood?: string }
}

interface GalleryContentProps {
  soldProducts: Product[]
  currentProducts: Product[]
}

const CATEGORIES = ['all', 'mallet', 'awl', 'square', 'coin', 'wood', 'mystery']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function getYear(dateStr: string) {
  return new Date(dateStr).getFullYear()
}

function uniqueSpecies(products: Product[]): Set<string> {
  const set = new Set<string>()
  products.forEach((p) => {
    if (p.metadata?.head_wood) set.add(p.metadata.head_wood)
    if (p.metadata?.handle_wood) set.add(p.metadata.handle_wood)
  })
  return set
}

export default function GalleryContent({ soldProducts, currentProducts }: GalleryContentProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())

  const filteredSold = useMemo(() => {
    let list = soldProducts
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list
  }, [soldProducts, categoryFilter, searchQuery])

  const groupedByYear = useMemo(() => {
    const groups: Record<number, Product[]> = {}
    filteredSold.forEach((p) => {
      const y = getYear(p.created_at)
      if (!groups[y]) groups[y] = []
      groups[y].push(p)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, items]) => ({ year: Number(year), items }))
  }, [filteredSold])

  const stats = useMemo(() => {
    const total = soldProducts.length
    const species = uniqueSpecies(soldProducts).size
    const years = soldProducts.length
      ? (() => {
          const years = soldProducts.map((p) => getYear(p.created_at))
          return Math.max(...years) - Math.min(...years) + 1
        })()
      : 0
    return { total, species, years }
  }, [soldProducts])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev)
          entries.forEach((e) => {
            const id = (e.target as HTMLElement).dataset.productId
            if (id && e.isIntersecting) next.add(id)
          })
          return next
        })
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.1 }
    )
    const els = document.querySelectorAll('[data-product-id]')
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [groupedByYear, viewMode])

  const builderHref = (p: Product) =>
    p.category === 'mallet' ? '/custom-mallet' : p.category === 'awl' ? '/custom-awl' : '/shop'

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-orange mb-2">GALLERY</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Every piece is one of a kind. Here&apos;s what&apos;s been crafted so far.
        </p>
      </div>

      {soldProducts.length === 0 && currentProducts.length === 0 ? (
        <div className="max-w-xl mx-auto text-center py-16 bg-brand-dark-card border border-brand-dark-border rounded-lg">
          <p className="text-zinc-400 text-lg">
            Gallery coming soon — check back as pieces are completed and sold.
          </p>
        </div>
      ) : (
        <>
          {/* Stats banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-brand-orange">{stats.total}</p>
              <p className="text-zinc-400 text-sm">Pieces made</p>
            </div>
            <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-brand-orange">{stats.species}</p>
              <p className="text-zinc-400 text-sm">Wood species used</p>
            </div>
            <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-brand-orange">{stats.years}</p>
              <p className="text-zinc-400 text-sm">Years active</p>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-brand-orange text-brand-dark'
                      : 'border border-brand-dark-border text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2 rounded border border-brand-dark-border bg-brand-dark text-white placeholder:text-zinc-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded border transition-colors ${
                  viewMode === 'timeline'
                    ? 'border-brand-orange bg-brand-orange/20 text-brand-orange'
                    : 'border-brand-dark-border text-zinc-400 hover:border-zinc-500'
                }`}
                title="Timeline view"
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded border transition-colors ${
                  viewMode === 'grid'
                    ? 'border-brand-orange bg-brand-orange/20 text-brand-orange'
                    : 'border-brand-dark-border text-zinc-400 hover:border-zinc-500'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSold.map((product) => (
                <div
                  key={product.id}
                  className="bg-brand-dark-card border border-brand-dark-border rounded-lg overflow-hidden hover:border-brand-orange transition-all group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative aspect-square bg-brand-dark">
                    <Image
                      src={product.image_url || 'https://placehold.co/600x400/333/666?text=No+Image'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-2xl font-heading font-bold text-white tracking-wider">SOLD</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-white mb-1">{product.name}</h3>
                    {(product.metadata?.head_wood || product.metadata?.handle_wood) && (
                      <p className="text-sm text-zinc-400 mb-2">
                        {[product.metadata?.head_wood, product.metadata?.handle_wood].filter(Boolean).join(' / ')}
                      </p>
                    )}
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-brand-dark-border text-zinc-400 capitalize">
                      {product.category}
                    </span>
                    <p className="text-xs text-zinc-500 mt-2">{formatDate(product.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-brand-orange/50 md:block hidden" style={{ transform: 'translateX(-50%)' }} />
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-brand-orange/50 md:hidden" />

              <div className="space-y-16 pb-16">
                {groupedByYear.map(({ year, items }) => (
                  <div key={year}>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-8 text-center md:text-left">
                      {year}
                    </h2>
                    <div className="space-y-12">
                      {items.map((product, idx) => {
                        const isLeft = idx % 2 === 0
                        const isVisible = visibleIds.has(product.id)
                        return (
                          <div
                            key={product.id}
                            ref={(el) => {
                              if (el) nodeRefs.current.set(product.id, el)
                            }}
                            data-product-id={product.id}
                            className={`relative flex flex-col md:flex-row items-center gap-6 md:gap-8 ${
                              isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                            }`}
                          >
                            <div
                              className={`w-full md:w-5/12 transition-all duration-500 ${
                                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                              }`}
                            >
                              <div
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-brand-dark-border hover:border-brand-orange cursor-pointer transition-colors"
                                onClick={() => setSelectedProduct(product)}
                              >
                                <Image
                                  src={product.image_url || 'https://placehold.co/600x400/333/666?text=No+Image'}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 40vw"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="text-xl font-heading font-bold text-white tracking-wider">SOLD</span>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`w-full md:w-5/12 text-center md:text-left transition-all duration-500 delay-100 ${
                                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                              } ${isLeft ? 'md:text-left' : 'md:text-right'}`}
                            >
                              <h3 className="font-semibold text-xl text-white mb-1">{product.name}</h3>
                              {(product.metadata?.head_wood || product.metadata?.handle_wood) && (
                                <p className="text-sm text-zinc-400 mb-2">
                                  {[product.metadata?.head_wood, product.metadata?.handle_wood].filter(Boolean).join(' / ')}
                                </p>
                              )}
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-brand-orange/20 text-brand-orange capitalize mb-2">
                                {product.category}
                              </span>
                              <p className="text-zinc-500 text-sm mb-4">{formatDate(product.created_at)}</p>
                              <Link href={builderHref(product)}>
                                <Button variant="outline" size="sm">
                                  Build one like this
                                  <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* In the workshop now */}
                {currentProducts.length > 0 && (
                  <div>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-8 text-center md:text-left">
                      In the workshop now
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentProducts
                        .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
                        .filter((p) => !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((product) => (
                          <div
                            key={product.id}
                            className="bg-brand-dark-card border border-brand-dark-border rounded-lg overflow-hidden hover:border-brand-orange transition-all cursor-pointer"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <div className="relative aspect-square bg-brand-dark">
                              <Image
                                src={product.image_url || 'https://placehold.co/600x400/333/666?text=No+Image'}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 33vw"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-lg text-white mb-1">{product.name}</h3>
                              {(product.metadata?.head_wood || product.metadata?.handle_wood) && (
                                <p className="text-sm text-zinc-400 mb-2">
                                  {[product.metadata?.head_wood, product.metadata?.handle_wood].filter(Boolean).join(' / ')}
                                </p>
                              )}
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400 capitalize">
                                {product.category}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detail modal */}
          {selectedProduct && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setSelectedProduct(null)}
            >
              <div
                className="bg-brand-dark-card border border-brand-dark-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative aspect-square md:aspect-video">
                  <Image
                    src={selectedProduct.image_url || 'https://placehold.co/600x400/333/666?text=No+Image'}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover rounded-t-xl"
                    sizes="100vw"
                  />
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-2xl font-bold text-white mb-2">{selectedProduct.name}</h3>
                  {(selectedProduct.metadata?.head_wood || selectedProduct.metadata?.handle_wood) && (
                    <p className="text-zinc-400 mb-2">
                      {[selectedProduct.metadata?.head_wood, selectedProduct.metadata?.handle_wood].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  {selectedProduct.description && (
                    <p className="text-zinc-300 mb-4">{selectedProduct.description}</p>
                  )}
                  <Link href={builderHref(selectedProduct)} onClick={() => setSelectedProduct(null)}>
                    <Button>
                      Build one like this
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
