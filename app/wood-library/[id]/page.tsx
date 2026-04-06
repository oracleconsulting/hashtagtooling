import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import WoodDetailContent from './WoodDetailContent'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const revalidate = 60

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { data: wood } = await supabase
    .from('materials')
    .select('name, grain_description, grain_image_url, origin')
    .eq('id', id)
    .eq('category', 'wood')
    .maybeSingle()

  if (!wood) return { title: 'Wood Species Not Found' }

  const title = `${wood.name} — Wood Species | #TOOLING`
  const description = wood.grain_description
    ? `${wood.name}${wood.origin ? ` from ${wood.origin}` : ''}. ${wood.grain_description}`
    : `Explore ${wood.name} — an exotic hardwood species used in #TOOLING handcrafted tools.`

  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `https://hashtag.guru/wood-library/${id}` },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url: `https://hashtag.guru/wood-library/${id}`,
      images: wood.grain_image_url ? [{ url: wood.grain_image_url, width: 1200, height: 630 }] : undefined,
      type: 'article',
    },
  }
}

export default async function WoodDetailPage({ params }: PageProps) {
  const { id } = await params

  const { data: wood } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .eq('category', 'wood')
    .eq('available', true)
    .maybeSingle()

  if (!wood) notFound()

  const { data: relatedProducts } = await supabase
    .from('products')
    .select('id, name, price, image_url, category, stock_status, sku, dimensions, parent_product_id, material_id, material_ids, metadata')
    .in('stock_status', ['in_stock', 'made_to_order'])

  const matchingProducts = (relatedProducts || []).filter((p) => {
    const r = p as { material_id?: string | null; material_ids?: string[] | null }
    return r.material_id === id || (r.material_ids && r.material_ids.includes(id))
  })

  const parentProducts = matchingProducts.filter((p) => !p.parent_product_id)
  const childProducts = matchingProducts.filter((p) => p.parent_product_id)

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://hashtag.guru' },
          { name: 'Wood Species Library', url: 'https://hashtag.guru/wood-library' },
          { name: wood.name, url: `https://hashtag.guru/wood-library/${id}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${wood.name} — Wood Species`,
            description: wood.grain_description || `Exotic hardwood: ${wood.name}`,
            image: wood.grain_image_url || undefined,
            author: { '@type': 'Organization', name: '#TOOLING' },
          }),
        }}
      />
      <WoodDetailContent wood={wood} tools={parentProducts} stock={childProducts} />
    </>
  )
}
