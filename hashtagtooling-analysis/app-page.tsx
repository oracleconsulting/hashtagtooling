import { createClient } from '@supabase/supabase-js'
import HomeContent, { type SiteImages } from './HomeContent'
import { LocalBusinessJsonLd } from '@/components/LocalBusinessJsonLd'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const defaultImages: SiteImages = {
  hero_background: '',
  wood_collection: '',
  brass_transitions: '',
  mallet_lineup: '',
}

export default async function Home() {
  const [siteImagesRes, latestRes, malletRes, awlRes, woodRes, coinRes] = await Promise.all([
    supabase.from('site_images').select('section_key, image_url'),
    supabase
      .from('products')
      .select('*')
      .neq('stock_status', 'out_of_stock')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('products')
      .select('image_url')
      .eq('category', 'mallet')
      .neq('stock_status', 'out_of_stock')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('products')
      .select('image_url')
      .eq('category', 'awl')
      .neq('stock_status', 'out_of_stock')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('products')
      .select('image_url')
      .eq('category', 'wood')
      .neq('stock_status', 'out_of_stock')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('products')
      .select('image_url')
      .eq('category', 'coin')
      .neq('stock_status', 'out_of_stock')
      .limit(1)
      .maybeSingle(),
  ])

  const images: SiteImages = { ...defaultImages }
  const data = siteImagesRes.data
  if (data) {
    data.forEach((row: { section_key: string; image_url: string }) => {
      if (row.image_url && row.section_key in defaultImages) {
        images[row.section_key as keyof SiteImages] = row.image_url
      }
    })
  }

  const latestProducts = latestRes.data || []
  const categoryImages: Record<string, string> = {}
  if (malletRes.data?.image_url) categoryImages.mallet = malletRes.data.image_url
  if (awlRes.data?.image_url) categoryImages.awl = awlRes.data.image_url
  if (woodRes.data?.image_url) categoryImages.wood = woodRes.data.image_url
  if (coinRes.data?.image_url) categoryImages.coin = coinRes.data.image_url

  return (
    <>
      <LocalBusinessJsonLd />
      <HomeContent
        images={images}
        latestProducts={latestProducts}
        categoryImages={categoryImages}
      />
    </>
  )
}
