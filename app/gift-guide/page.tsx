import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata: Metadata = {
  title: 'Gift Guide — Gifts for Woodworkers',
  description:
    'The best gifts for woodworkers and tool enthusiasts. Handcrafted mallets, marking awls, and exotic timber tools made in the UK. Free UK shipping available.',
  alternates: { canonical: 'https://hashtag.guru/gift-guide' },
  openGraph: {
    title: 'Gift Guide — Gifts for Woodworkers | #TOOLING',
    description:
      'Handcrafted woodworking tools make the most thoughtful gifts. Browse curated picks for every level and budget.',
    url: 'https://hashtag.guru/gift-guide',
  },
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  stock_status: 'in_stock' | 'made_to_order' | 'sold' | 'out_of_stock'
  subcategory?: string
  metadata?: { shipping?: { uk: number; europe: number; world: number } }
}

// ---------------------------------------------------------------------------
// Curated section definitions
// ---------------------------------------------------------------------------
const SECTIONS = [
  {
    id: 'enthusiast',
    title: 'For the Mallet Enthusiast',
    subtitle: 'Someone who takes their joinery seriously deserves a tool that matches their ambition.',
    categories: ['mallet'],
    maxPrice: undefined as number | undefined,
    minPrice: 80,
    limit: 3,
    builderFallback: {
      href: '/custom-mallet',
      label: 'Build a Custom Mallet',
      description: 'No two pieces identical. Choose from 75+ exotic timbers.',
    },
  },
  {
    id: 'beginner',
    title: 'For the Woodworker Just Starting Out',
    subtitle: 'A quality marking awl is the first real tool a woodworker should own. Precise, personal, lasting.',
    categories: ['awl'],
    maxPrice: 80,
    minPrice: undefined as number | undefined,
    limit: 3,
    builderFallback: {
      href: '/custom-awl',
      label: 'Build a Custom Awl',
      description: 'Pick the handle wood, ferrule material, and style. Ships in 3–4 weeks.',
    },
  },
  {
    id: 'premium',
    title: 'For Someone Who Has Everything',
    subtitle: 'Rare timbers, unusual configurations, pieces they would never think to buy themselves.',
    categories: ['mallet'],
    maxPrice: undefined,
    minPrice: 120,
    limit: 3,
    builderFallback: {
      href: '/commissions',
      label: 'Commission Something Unique',
      description: 'A fully bespoke piece made to their exact specification. The ultimate gift.',
    },
  },
  {
    id: 'fillers',
    title: 'Stocking Fillers',
    subtitle: 'Small, considered, and genuinely useful. Things a woodworker will actually use.',
    categories: ['coin', 'awl'],
    maxPrice: 60,
    minPrice: undefined,
    limit: 4,
    builderFallback: {
      href: '/shop',
      label: 'Browse the Full Shop',
      description: 'Marking awls, EDC coins, and more — all handcrafted to the same standard.',
    },
  },
]

export default async function GiftGuidePage() {
  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .in('stock_status', ['in_stock', 'made_to_order'])
    .order('price', { ascending: false })

  const products: Product[] = allProducts || []

  // Assign products to sections — each product only appears in first matching section
  const usedIds = new Set<string>()

  const sectionsWithProducts = SECTIONS.map((section) => {
    const matches = products
      .filter((p) => {
        if (usedIds.has(p.id)) return false
        if (!section.categories.includes(p.category)) return false
        if (section.minPrice && p.price < section.minPrice) return false
        if (section.maxPrice && p.price > section.maxPrice) return false
        return true
      })
      .slice(0, section.limit)

    matches.forEach((p) => usedIds.add(p.id))
    return { ...section, products: matches }
  })

  return (
    <>
      {/* FAQ / Article JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Gifts for Woodworkers — #TOOLING Gift Guide',
            description: 'Curated handcrafted woodworking tools as gifts, made in the UK from exotic timber.',
            url: 'https://hashtag.guru/gift-guide',
            numberOfItems: products.length,
          }),
        }}
      />

      <div className="container mx-auto px-4 py-16 max-w-6xl">

        {/* Hero */}
        <div className="mb-16 max-w-2xl">
          <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-3">Gift Guide</p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
            Gifts for<br />Woodworkers
          </h1>
          <p className="text-zinc-400 text-xl leading-relaxed">
            The woodworker in your life probably has a drawer full of cheap tools.
            Give them something worth keeping — handcrafted from rare timber, built to last a lifetime.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-20">
          {sectionsWithProducts.map((section) => (
            <section key={section.id}>
              {/* Section header */}
              <div className="mb-8 pb-6 border-b border-brand-dark-border">
                <h2 className="font-heading text-3xl font-bold text-white mb-2">{section.title}</h2>
                <p className="text-zinc-400 text-lg">{section.subtitle}</p>
              </div>

              {section.products.length > 0 ? (
                <>
                  <div className={`grid gap-6 ${
                    section.products.length === 1
                      ? 'grid-cols-1 max-w-sm'
                      : section.products.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {section.products.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>

                  {/* View more link */}
                  <div className="mt-6">
                    <Link
                      href={`/shop?category=${section.categories[0]}`}
                      className="text-brand-orange text-sm font-medium hover:underline"
                    >
                      See all {section.categories[0] === 'mallet' ? 'mallets' : section.categories[0] === 'awl' ? 'awls' : 'products'} →
                    </Link>
                  </div>
                </>
              ) : (
                /* Fallback CTA when no matching products in stock */
                <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-8 max-w-lg">
                  <h3 className="text-white font-semibold text-lg mb-2">{section.builderFallback.label}</h3>
                  <p className="text-zinc-400 mb-5">{section.builderFallback.description}</p>
                  <Link
                    href={section.builderFallback.href}
                    className="inline-block px-5 py-2.5 bg-brand-orange text-brand-dark font-semibold rounded hover:bg-brand-orange/90 transition-colors"
                  >
                    {section.builderFallback.label} →
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Custom builder interlude */}
        <div className="my-20 rounded-xl bg-gradient-to-r from-brand-orange/10 to-transparent border border-brand-orange/20 p-10">
          <div className="max-w-xl">
            <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-3">Custom Build</p>
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Design it yourself
            </h2>
            <p className="text-zinc-400 text-lg mb-6">
              Choose the timber, the style, the metal accents. Every combination is unique — and they&apos;ll know exactly how much thought went into it.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/custom-mallet"
                className="inline-block px-5 py-2.5 bg-brand-orange text-brand-dark font-semibold rounded hover:bg-brand-orange/90 transition-colors"
              >
                Build a Mallet
              </Link>
              <Link
                href="/custom-awl"
                className="inline-block px-5 py-2.5 border border-brand-dark-border text-zinc-300 rounded hover:border-zinc-400 transition-colors"
              >
                Build an Awl
              </Link>
            </div>
          </div>
        </div>

        {/* Gift voucher CTA */}
        <div className="rounded-xl border border-brand-dark-border bg-brand-dark-card p-10 text-center">
          <p className="text-4xl mb-4">🎁</p>
          <h2 className="font-heading text-3xl font-bold text-white mb-3">Not sure which to choose?</h2>
          <p className="text-zinc-400 text-lg mb-2 max-w-xl mx-auto">
            Give them a gift voucher and let them pick exactly what they want — the wood, the style, the size.
          </p>
          <p className="text-zinc-500 text-sm mb-8">
            Denominations from £25 to £150. Valid for 12 months. Delivered instantly by email.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/gift-vouchers"
              className="inline-block px-8 py-3 bg-brand-orange text-brand-dark font-bold rounded-lg hover:bg-brand-orange/90 transition-colors text-lg"
            >
              Buy a Gift Voucher
            </Link>
            <Link
              href="/commissions"
              className="inline-block px-8 py-3 border border-brand-dark-border text-zinc-300 rounded-lg hover:border-zinc-400 transition-colors text-lg"
            >
              Request a Commission
            </Link>
          </div>
        </div>

        {/* SEO footer text */}
        <div className="mt-16 pt-8 border-t border-brand-dark-border">
          <p className="text-zinc-600 text-sm leading-relaxed max-w-3xl">
            All #TOOLING tools are handcrafted in the UK from sustainably sourced exotic timber species including Ebony, Cocobolo, Purpleheart, Lignum Vitae, Bocote, and 70+ more.
            Each piece features brass dowel construction for superior joint strength and is finished by hand.
            Shipping to the UK, Europe, and worldwide.{' '}
            <Link href="/wood-library" className="text-zinc-500 hover:text-brand-orange transition-colors">
              Explore the full wood library →
            </Link>
          </p>
        </div>

      </div>
    </>
  )
}
