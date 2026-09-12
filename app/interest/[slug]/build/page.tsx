import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { INTEREST_PUBLIC_FIELDS, type InterestList } from '@/lib/interest'
import { isPricedInterestSlug, loadInterestPricingCatalog } from '@/lib/interest-pricing'
import InterestBuildContent from './InterestBuildContent'

export const revalidate = 60

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabase()
  const { data: list } = await supabase
    .from('interest_lists')
    .select('name, tagline, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!list || list.status === 'draft' || !isPricedInterestSlug(slug)) {
    return { title: 'Build form not found' }
  }

  return {
    title: `Build your ${list.name}`,
    description: list.tagline || `Build your ${list.name}, see the price, and pay a 50% deposit.`,
    alternates: { canonical: `https://hashtag.guru/interest/${slug}/build` },
    robots: { index: false, follow: false },
  }
}

export default async function InterestBuildPage({ params }: Props) {
  const { slug } = await params
  if (!isPricedInterestSlug(slug)) return notFound()

  const supabase = getSupabase()
  const { data: list } = await supabase
    .from('interest_lists')
    .select(INTEREST_PUBLIC_FIELDS)
    .eq('slug', slug)
    .maybeSingle()

  if (!list || (list as InterestList).status === 'draft') return notFound()

  const catalog = await loadInterestPricingCatalog(supabase, slug)
  if (!catalog) return notFound()

  return <InterestBuildContent list={list as InterestList} catalog={catalog} />
}
