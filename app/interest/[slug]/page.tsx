import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import { INTEREST_PUBLIC_FIELDS, ensureDefaultInterestLists, type InterestList } from '@/lib/interest'
import InterestContent from './InterestContent'

export const revalidate = 60

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function generateStaticParams() {
  try {
    const supabase = getSupabase()
    await ensureDefaultInterestLists(supabase)
    const { data: lists } = await supabase
      .from('interest_lists')
      .select('slug, status')
      .neq('status', 'draft')
    return (lists || []).map((list) => ({ slug: list.slug }))
  } catch (err) {
    console.error('interest generateStaticParams:', err)
    return [{ slug: 'bottle-opener' }]
  }
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabase()
  const { data: list } = await supabase
    .from('interest_lists')
    .select('name, tagline, hero_image_url, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!list || list.status === 'draft') {
    return { title: 'Interest List Not Found' }
  }

  const title = `${list.name} — Register Interest`
  const description = list.tagline || `Register your interest in ${list.name} from #TOOLING.`

  return {
    title,
    description,
    alternates: { canonical: `https://hashtag.guru/interest/${slug}` },
    openGraph: {
      title: `${list.name} — Register Interest | #TOOLING`,
      description,
      url: `https://hashtag.guru/interest/${slug}`,
      ...(list.hero_image_url ? { images: [{ url: list.hero_image_url, width: 1200, height: 630 }] } : {}),
      type: 'website',
    },
  }
}

export default async function InterestPage({ params }: Props) {
  const { slug } = await params
  const supabase = getSupabase()
  await ensureDefaultInterestLists(supabase)
  const { data: list } = await supabase
    .from('interest_lists')
    .select(INTEREST_PUBLIC_FIELDS)
    .eq('slug', slug)
    .maybeSingle()

  if (!list || (list as InterestList).status === 'draft') return notFound()

  const { data: count } = await supabase.rpc('interest_list_count', { list_slug: slug })

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://hashtag.guru' },
          { name: 'Interest', url: `https://hashtag.guru/interest/${slug}` },
          { name: list.name, url: `https://hashtag.guru/interest/${slug}` },
        ]}
      />
      <InterestContent
        list={list as InterestList}
        count={typeof count === 'number' ? count : Number(count) || 0}
      />
    </>
  )
}
