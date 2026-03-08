'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface BlankProduct {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  metadata?: { dimensions?: string; wood_types?: string[] }
}

interface Adoption {
  id: string
  product_id: string
  customer_name: string
  status: string
  adopted_at: string
  products?: { name: string; image_url: string }
}

export default function AdoptPage() {
  const addItem = useCart((state) => state.addItem)
  const [blanks, setBlanks] = useState<BlankProduct[]>([])
  const [adoptions, setAdoptions] = useState<Adoption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [blanksRes, adoptionsRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, description, price, image_url, metadata')
          .eq('category', 'wood')
          .eq('subcategory', 'adopt')
          .eq('stock_status', 'in_stock')
          .order('created_at', { ascending: false }),
        supabase
          .from('blank_adoptions')
          .select('id, product_id, customer_name, status, adopted_at')
          .neq('status', 'shipped')
          .order('adopted_at', { ascending: false })
          .limit(6),
      ])

      if (blanksRes.error) throw blanksRes.error
      setBlanks(blanksRes.data || [])

      if (adoptionsRes.data && adoptionsRes.data.length > 0) {
        const productIds = [...new Set(adoptionsRes.data.map((a) => a.product_id))]
        const { data: products } = await supabase.from('products').select('id, name, image_url').in('id', productIds)
        const productMap = new Map((products || []).map((p) => [p.id, p]))
        setAdoptions(
          adoptionsRes.data.map((a) => ({
            ...a,
            products: productMap.get(a.product_id),
          }))
        )
      } else {
        setAdoptions([])
      }
    } catch (err) {
      console.error('Error loading adopt data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdopt = (blank: BlankProduct) => {
    addItem({
      id: blank.id,
      name: blank.name,
      price: blank.price,
      quantity: 1,
      image_url: blank.image_url,
    })
    window.location.href = '/cart'
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      adopted: 'Adopted',
      in_progress: 'In Progress',
      finishing: 'Finishing',
      complete: 'Complete',
      shipped: 'Shipped',
    }
    return map[s] || s
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-orange mb-4">Adopt a Blank</h1>
        <p className="text-zinc-400 text-lg">
          Choose a blank. I&apos;ll turn it into a tool. You follow every step.
        </p>
        <p className="text-zinc-500 text-sm mt-2">
          Pick a raw timber blank, purchase it, and watch its journey from rough stock to finished tool with photo updates.
        </p>
      </div>

      {blanks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {blanks.map((blank) => (
            <Card key={blank.id} className="bg-brand-dark-card border border-brand-dark-border overflow-hidden">
              <div className="aspect-square relative bg-brand-dark">
                <Image src={blank.image_url} alt={blank.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-white mb-1">{blank.name}</h3>
                {blank.metadata?.dimensions && (
                  <p className="text-sm text-zinc-500 mb-2">{blank.metadata.dimensions}</p>
                )}
                <p className="text-brand-orange font-bold text-xl mb-4">{formatPrice(blank.price)}</p>
                <p className="text-xs text-zinc-400 mb-4">Price includes the finished tool — not just the blank.</p>
                <Button onClick={() => handleAdopt(blank)} className="w-full">
                  Adopt This Blank
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-16">
          <p className="text-zinc-400 mb-4">No blanks available for adoption right now.</p>
          <p className="text-zinc-500 text-sm">Check back soon — new blanks are added regularly.</p>
        </div>
      )}

      {adoptions.length > 0 && (
        <div className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-brand-orange mb-6">Currently in the Workshop</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {adoptions.map((a) => (
              <Link key={a.id} href={`/adopt/${a.product_id}`} className="block group">
                <div className="aspect-square rounded-lg overflow-hidden border border-brand-dark-border group-hover:border-brand-orange transition-colors relative">
                  {a.products?.image_url ? (
                    <Image src={a.products.image_url} alt="" fill className="object-cover" sizes="150px" />
                  ) : (
                    <div className="w-full h-full bg-brand-dark flex items-center justify-center text-zinc-600">—</div>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 truncate">{a.customer_name}</p>
                <span className="text-xs text-brand-orange font-medium">{statusLabel(a.status)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/shop?category=wood">
          <Button variant="outline" size="lg">
            Browse all wood for sale
          </Button>
        </Link>
      </div>
    </div>
  )
}
