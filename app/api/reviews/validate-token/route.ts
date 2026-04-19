import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, customer_name, token_used, product_id, product_description')
    .eq('review_token', token)
    .single()

  if (error || !data) return NextResponse.json({ valid: false, reason: 'not_found' })
  if (data.token_used) return NextResponse.json({ valid: false, reason: 'already_used', name: data.customer_name })

  let productName = data.product_description || null
  if (data.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', data.product_id)
      .single()
    if (product) productName = product.name
  }

  return NextResponse.json({
    valid: true,
    name: data.customer_name,
    product_name: productName,
  })
}
