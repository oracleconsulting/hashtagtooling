import { createClient } from '@supabase/supabase-js'
import HomeContent, { type SiteImages } from './HomeContent'
import { LocalBusinessJsonLd } from '@/components/LocalBusinessJsonLd'
import { FAQJsonLd } from '@/components/FAQJsonLd'

export const dynamic = 'force-dynamic'

const HOMEPAGE_FAQS = [
  {
    question: 'Why use an exotic wood mallet instead of a standard beech mallet?',
    answer:
      'Exotic hardwoods like Lignum Vitae, Cocobolo, and African Blackwood have significantly higher density and Janka hardness ratings than common workshop woods. A smaller mallet made from a dense exotic timber delivers the same striking force as a much larger beech mallet, giving you more control and less fatigue during extended chisel work. The natural oils in many tropical hardwoods also make them exceptionally durable and resistant to splitting.',
  },
  {
    question: 'How do I choose the right wood species for my mallet?',
    answer:
      'It depends on your primary use. For heavy chisel work and timber framing, choose a dense species with a Janka hardness above 2000 lbf — Lignum Vitae, Snakewood, or Purpleheart are excellent choices. For detail carving where control matters more than weight, a mid-range hardwood like Walnut, Cherry, or Bocote gives a softer strike. Our Wood Library has detailed specifications for all 75+ species, and the Custom Mallet Builder lets you mix different woods for the head and handle.',
  },
  {
    question: 'What makes #TOOLING mallets different from mass-produced alternatives?',
    answer:
      "Every mallet is made entirely by hand, one at a time, from individually selected timber blanks. The brass dowel construction — where a custom-turned brass rod runs through the head and into the handle — creates a joint that is stronger and better balanced than traditional mortise-and-tenon or friction-fit designs. Each mallet has its dowel cut and turned specifically for that piece, with the balance point calibrated at the transition ring. No two are identical.",
  },
  {
    question: 'Do you ship internationally?',
    answer:
      'Yes. We ship worldwide from the UK. Standard UK delivery is 3-5 business days via Royal Mail, European orders take 5-10 business days, and rest-of-world orders arrive in 10-15 business days. All orders include tracking. Custom and made-to-order pieces have additional production time — typically 2-4 weeks depending on complexity.',
  },
  {
    question: 'Can I commission a completely custom tool?',
    answer:
      "Absolutely. The commission form lets you describe exactly what you want — whether it is a specific wood combination, unusual dimensions, a matching set, or something entirely original. Commissions typically take 4-8 weeks and pricing depends on materials and complexity. Every commission starts with a conversation to make sure the finished piece is exactly what you envisioned.",
  },
]

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
      .in('stock_status', ['in_stock', 'made_to_order'])
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('products')
      .select('image_url')
      .eq('category', 'mallet')
      .in('stock_status', ['in_stock', 'made_to_order'])
      .limit(1)
      .maybeSingle(),
    supabase
      .from('products')
      .select('image_url')
      .eq('category', 'awl')
      .in('stock_status', ['in_stock', 'made_to_order'])
      .limit(1)
      .maybeSingle(),
    supabase
      .from('products')
      .select('image_url')
      .eq('category', 'wood')
      .in('stock_status', ['in_stock', 'made_to_order'])
      .limit(1)
      .maybeSingle(),
    supabase
      .from('products')
      .select('image_url')
      .eq('category', 'coin')
      .in('stock_status', ['in_stock', 'made_to_order'])
      .limit(1)
      .maybeSingle(),
  ])

  const images: SiteImages = { ...defaultImages }
  let heroVideoUrl: string | undefined
  const data = siteImagesRes.data
  if (data) {
    data.forEach((row: { section_key: string; image_url: string }) => {
      if (row.image_url && row.section_key === 'hero_video') {
        heroVideoUrl = row.image_url
      } else if (row.image_url && row.section_key in defaultImages) {
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
      <FAQJsonLd faqs={HOMEPAGE_FAQS} />
      <HomeContent
        images={images}
        heroVideoUrl={heroVideoUrl}
        latestProducts={latestProducts}
        categoryImages={categoryImages}
      />
    </>
  )
}
