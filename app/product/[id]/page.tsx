import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ProductContent from './ProductContent'
import { ProductJsonLd } from '@/components/ProductJsonLd'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    openGraph: {
      title: `${product.name} | #TOOLING`,
      description: product.description,
      images: [{ url: product.image_url, width: 600, height: 600 }],
      type: 'website',
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
