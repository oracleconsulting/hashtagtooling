import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import GalleryContent from './GalleryContent'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Gallery — Past Work',
  description:
    "Browse the gallery of sold #TOOLING pieces. Every handcrafted mallet and awl is unique — see what's been created from exotic timbers.",
  alternates: { canonical: 'https://hashtag.guru/gallery' },
}

interface Product {
  id: string
  name: string
  description?: string
  image_url: string
  category: string
  created_at: string
  metadata?: { head_wood?: string; handle_wood?: string }
}

export default async function GalleryPage() {
  const [soldRes, currentRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, image_url, category, created_at, metadata')
      .eq('stock_status', 'sold')
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('created_at', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, description, image_url, category, created_at, metadata')
      .in('stock_status', ['in_stock', 'made_to_order'])
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const soldProducts = (soldRes.data || []) as Product[]
  const currentProducts = (currentRes.data || []) as Product[]

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://hashtag.guru' },
        { name: 'Gallery', url: 'https://hashtag.guru/gallery' },
      ]} />
      <GalleryContent soldProducts={soldProducts} currentProducts={currentProducts} />
    </>
  )
}
