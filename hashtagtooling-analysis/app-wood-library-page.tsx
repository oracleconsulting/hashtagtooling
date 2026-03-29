import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import WoodLibraryContent from './WoodLibraryContent'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata: Metadata = {
  title: 'Wood Species Library',
  description:
    'Explore over 75 exotic wood species used in #TOOLING handcrafted mallets and awls. Learn about density, hardness, origin, and characteristics of each timber.',
  alternates: { canonical: 'https://hashtag.guru/wood-library' },
}

export default async function WoodLibraryPage() {
  const { data: woods } = await supabase
    .from('materials')
    .select('*')
    .eq('category', 'wood')
    .eq('available', true)
    .order('name')

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://hashtag.guru' },
        { name: 'Wood Species Library', url: 'https://hashtag.guru/wood-library' },
      ]} />
      <WoodLibraryContent woods={woods || []} />
    </>
  )
}
