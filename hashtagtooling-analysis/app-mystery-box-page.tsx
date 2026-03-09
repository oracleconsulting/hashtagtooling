'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { HelpCircle } from 'lucide-react'

interface MysteryProduct {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  metadata?: { tier?: string }
}

const TIER_CONFIG = [
  { tier: 'carver', name: 'THE CARVER', malletType: 'Carving mallet', fallbackPrice: 220 },
  { tier: 'detailer', name: 'THE DETAILER', malletType: 'Detailing mallet', fallbackPrice: 240 },
  { tier: 'joiner', name: 'THE JOINER', malletType: 'Joiners mallet', fallbackPrice: 260 },
]

const FAQ = [
  {
    q: 'What species will I get?',
    a: "Genuinely no idea until I pick up the blank. Could be Maple Burl, could be Lignum Vitae, could be something I've never worked with before. That's the point.",
  },
  {
    q: 'Can I specify anything?',
    a: 'Nope. That would defeat the purpose. Trust the process.',
  },
  {
    q: "What if I don't like it?",
    a: "You will. But if somehow you don't, get in touch.",
  },
  {
    q: 'Is it really random?',
    a: "Yes. I pick the blank based on what's speaking to me that day. No algorithm, no system, just instinct and whatever's looking good in the timber rack.",
  },
]

export default function MysteryBoxPage() {
  const addItem = useCart((s) => s.addItem)
  const [products, setProducts] = useState<MysteryProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, metadata')
        .eq('category', 'mystery')
        .neq('stock_status', 'out_of_stock')
      setProducts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const getProductForTier = (tier: string) =>
    products.find((p) => (p.metadata?.tier || '').toLowerCase() === tier)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-dark/95 to-brand-dark" />
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="relative w-64 h-64 md:w-96 md:h-96">
            <div className="absolute inset-0 bg-brand-orange/30 rounded-full blur-3xl" />
            <div className="absolute inset-0 flex items-center justify-center text-8xl md:text-9xl font-heading font-bold text-brand-orange/50">
              ?
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
            MYSTERY WOOD BOX
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A finished tool. A species you didn&apos;t choose. A surprise worth unwrapping.
          </p>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TIER_CONFIG.map((config) => {
              const product = getProductForTier(config.tier)
              const price = product ? product.price : config.fallbackPrice
              const canAdd = !!product

              return (
                <Card
                  key={config.tier}
                  className="bg-brand-dark-card border border-brand-dark-border overflow-hidden hover:border-brand-orange/50 transition-colors"
                >
                  <div className="relative aspect-square bg-brand-dark">
                    {product?.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={config.name}
                        fill
                        className="object-cover opacity-80"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl font-heading font-bold text-brand-orange/30">?</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-heading text-2xl font-bold text-brand-orange">{config.name}</h3>
                      <p className="text-zinc-300 text-sm">{config.malletType}</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-2 mb-4">
                      <p className="text-zinc-400 text-sm">Head wood: <span className="text-brand-orange">Mystery Species</span></p>
                      <p className="text-zinc-400 text-sm">Handle wood: <span className="text-brand-orange">Mystery Species</span></p>
                    </div>
                    <p className="text-2xl font-bold text-brand-orange mb-4">{formatPrice(price)}</p>
                    {canAdd ? (
                      <Button
                        className="w-full"
                        onClick={() =>
                          addItem({
                            id: product!.id,
                            name: product!.name,
                            price: product!.price,
                            quantity: 1,
                            image_url: product!.image_url || 'https://placehold.co/600x400/333/666?text=?',
                            shipping: { uk: 5.99, europe: 15.99, world: 25.99 },
                          })
                        }
                      >
                        Add to Cart
                      </Button>
                    ) : (
                      <p className="text-zinc-500 text-sm text-center py-2">Coming soon</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-brand-dark-card border-y border-brand-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-brand-orange mb-10 text-center">
              FAQ
            </h2>
            <div className="space-y-8">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <h3 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-brand-orange shrink-0" />
                    {item.q}
                  </h3>
                  <p className="text-zinc-400 pl-7 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-zinc-400 mb-4">Not feeling brave?</p>
          <Link href="/custom-mallet">
            <Button variant="outline" size="lg">
              Build your own instead →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
