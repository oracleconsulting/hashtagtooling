import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import ProductContent from './ProductContent'
import { ProductDetailSkeleton } from '@/components/ProductDetailSkeleton'
import { ProductJsonLd } from '@/components/ProductJsonLd'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'

export const revalidate = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PLACEHOLDER_IMAGE = 'https://hashtag.guru/og-image.png'

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .in('stock_status', ['in_stock', 'made_to_order'])
  return (products || []).map((p) => ({ id: p.id }))
}

interface Props {
  params: Promise<{ id: string }>
}

async function resolveProductHeroImage(
  imageUrl: string | null,
  materialId: string | null | undefined
): Promise<string | null> {
  const isReal = imageUrl && !imageUrl.includes('placehold.co')
  if (isReal) return imageUrl
  if (!materialId) return null
  const { data: mat } = await supabase.from('materials').select('grain_image_url').eq('id', materialId).maybeSingle()
  return mat?.grain_image_url ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, image_url, stock_status, material_id')
    .eq('id', id)
    .single()

  if (!product) {
    return { title: 'Product Not Found' }
  }

  const hero = await resolveProductHeroImage(product.image_url, product.material_id)
  const ogImage = hero || PLACEHOLDER_IMAGE

  return {
    title: product.name,
    description: product.description || '',
    alternates: { canonical: `https://hashtag.guru/product/${id}` },
    openGraph: {
      title: `${product.name} | #TOOLING`,
      description: product.description || '',
      ...(ogImage ? { images: [{ url: ogImage, width: 600, height: 600 }] } : {}),
      type: 'website',
    },
    other: {
      'product:price:amount': (product.price ?? 0).toString(),
      'product:price:currency': 'GBP',
      'product:availability': product.stock_status === 'in_stock' ? 'instock' : product.stock_status === 'made_to_order' ? 'pending' : 'oos',
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, image_url, stock_status, material_id, metadata')
    .eq('id', id)
    .single()

  if (!product) return notFound()

  const jsonLdImage = (await resolveProductHeroImage(product.image_url, product.material_id)) || PLACEHOLDER_IMAGE

  const availability =
    product.stock_status === 'in_stock'
      ? 'InStock'
      : product.stock_status === 'made_to_order'
        ? 'PreOrder'
        : 'SoldOut'

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://hashtag.guru' },
        { name: 'Shop', url: 'https://hashtag.guru/shop' },
        { name: product.name, url: `https://hashtag.guru/product/${id}` },
      ]} />
      <ProductJsonLd
        name={product.name}
        description={product.description || ''}
        price={product.price ?? 0}
        image={jsonLdImage}
        url={`https://hashtag.guru/product/${id}`}
        availability={availability}
        shipping={(product.metadata as Record<string, unknown> | null)?.shipping as { uk: number; europe: number; world: number } | undefined}
      />
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductContent />
      </Suspense>
    </>
  )
}
