import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata: Metadata = {
  title: 'Gallery — Past Work',
  description:
    "Browse the gallery of sold #TOOLING pieces. Every handcrafted mallet and awl is unique — see what's been created from exotic timbers.",
  alternates: { canonical: 'https://hashtag.guru/gallery' },
}

interface SoldProduct {
  id: string
  name: string
  image_url: string
  category: string
  metadata?: {
    head_wood?: string
    handle_wood?: string
  }
}

export default async function GalleryPage() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('stock_status', 'sold')
    .order('created_at', { ascending: false })

  const soldProducts = (products || []) as SoldProduct[]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-orange mb-2">GALLERY</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Every piece is one of a kind. Here&apos;s what&apos;s been crafted so far.
        </p>
      </div>

      {soldProducts.length === 0 ? (
        <div className="max-w-xl mx-auto text-center py-16 bg-brand-dark-card border border-brand-dark-border rounded-lg">
          <p className="text-zinc-400 text-lg">
            Gallery coming soon — check back as pieces are completed and sold.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {soldProducts.map((product) => {
            const builderHref =
              product.category === 'mallet' ? '/custom-mallet' : product.category === 'awl' ? '/custom-awl' : '/shop'
            const builderLabel =
              product.category === 'mallet' ? 'Build Your Mallet' : product.category === 'awl' ? 'Build Your Awl' : 'Browse Shop'

            return (
              <div
                key={product.id}
                className="bg-brand-dark-card border border-brand-dark-border rounded-lg overflow-hidden hover:border-brand-orange transition-all group"
              >
                <Link href={builderHref} className="block">
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
                </Link>
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
                  <Link href={builderHref} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline">
                    Love this style? <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
