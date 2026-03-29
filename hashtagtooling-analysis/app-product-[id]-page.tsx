import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ProductContent from './ProductContent'
import { ProductJsonLd } from '@/components/ProductJsonLd'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'

export const revalidate = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .neq('stock_status', 'out_of_stock')
  return (products || []).map((p) => ({ id: p.id }))
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, image_url, stock_status')
    .eq('id', id)
    .single()

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `https://hashtag.guru/product/${id}` },
    openGraph: {
      title: `${product.name} | #TOOLING`,
      description: product.description,
      images: [{ url: product.image_url, width: 600, height: 600 }],
      type: 'website',
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'GBP',
      'product:availability': product.stock_status === 'in_stock' ? 'instock' : product.stock_status === 'made_to_order' ? 'pending' : 'oos',
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, image_url, stock_status')
    .eq('id', id)
    .single()

  const availability =
    product?.stock_status === 'in_stock'
      ? 'InStock'
      : product?.stock_status === 'made_to_order'
        ? 'PreOrder'
        : 'SoldOut'

  return (
    <>
      {product && (
        <BreadcrumbJsonLd items={[
          { name: 'Home', url: 'https://hashtag.guru' },
          { name: 'Shop', url: 'https://hashtag.guru/shop' },
          { name: product.name, url: `https://hashtag.guru/product/${id}` },
        ]} />
      )}
      {product && (
        <ProductJsonLd
          name={product.name}
          description={product.description}
          price={product.price}
          image={product.image_url}
          url={`https://hashtag.guru/product/${id}`}
          availability={availability}
        />
      )}
      <ProductContent />
    </>
  )
}
