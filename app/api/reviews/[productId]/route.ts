import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params

  const { data: reviews, error } = await supabase
    .from('product_reviews')
    .select('id, customer_name, rating, title, body, verified_purchase, source, created_at')
    .eq('product_id', productId)
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return NextResponse.json({
    reviews: reviews || [],
    count: reviews?.length || 0,
    averageRating: Math.round(avgRating * 10) / 10,
  })
}
