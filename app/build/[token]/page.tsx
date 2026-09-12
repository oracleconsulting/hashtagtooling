import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { INTEREST_PUBLIC_FIELDS, type InterestList } from '@/lib/interest'
import { isInviteToken, parseBuildIntent } from '@/lib/interest-invite'
import { loadInterestPricingCatalog } from '@/lib/interest-pricing'
import InterestBuildContent from '@/app/interest/[slug]/build/InterestBuildContent'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Your private build form | #TOOLING',
  robots: { index: false, follow: false },
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function PrivateBuildPage({ params }: Props) {
  const { token } = await params
  if (!isInviteToken(token)) return notFound()

  const supabase = getSupabase()
  const { data: signup } = await supabase
    .from('interest_signups')
    .select('id, list_id, build_intent, invite_viewed_at')
    .eq('invite_token', token)
    .maybeSingle()

  if (!signup) return notFound()

  if (!signup.invite_viewed_at) {
    await supabase
      .from('interest_signups')
      .update({ invite_viewed_at: new Date().toISOString() })
      .eq('id', signup.id)
  }

  const { data: list } = await supabase
    .from('interest_lists')
    .select(INTEREST_PUBLIC_FIELDS)
    .eq('id', signup.list_id)
    .maybeSingle()

  if (!list) return notFound()

  const catalog = await loadInterestPricingCatalog(supabase, list.slug)
  if (!catalog) return notFound()

  return (
    <InterestBuildContent
      list={list as InterestList}
      catalog={catalog}
      token={token}
      initialIntent={parseBuildIntent(signup.build_intent)}
    />
  )
}
