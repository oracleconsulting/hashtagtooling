'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
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
}

interface WoodLibraryContentProps {
  woods: WoodItem[]
}

export default function WoodLibraryContent({ woods }: WoodLibraryContentProps) {
  const [search, setSearch] = useState('')

  const filteredWoods = useMemo(() => {
    if (!search.trim()) return woods
    const q = search.trim().toLowerCase()
    return woods.filter((w) => w.name.toLowerCase().includes(q))
  }, [woods, search])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-orange mb-2">WOOD SPECIES LIBRARY</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Over 75 exotic timbers to choose from. Each species chosen for its density, hardness, and unique character.
        </p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {filteredWoods.map((wood) => {
          const hasHead = (wood.mallet_head_premium ?? 0) >= 0
          const hasHandle = (wood.mallet_handle_premium ?? 0) >= 0
          const hasAwl = (wood.awl_handle_premium ?? 0) >= 0
          const badges = []
          if (hasHead) badges.push('Mallet head')
          if (hasHandle) badges.push('Mallet handle')
          if (hasAwl) badges.push('Awl')

          return (
            <div
              key={wood.id}
              className="bg-brand-dark-card border border-brand-dark-border rounded-lg overflow-hidden hover:border-brand-orange transition-all"
            >
              <div
                className="h-24 w-full border-b border-brand-dark-border"
                style={{ backgroundColor: wood.color_hex || '#333' }}
                title={wood.name}
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg text-white mb-2">{wood.name}</h3>
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {badges.map((b) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-brand-dark-border text-zinc-400"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
