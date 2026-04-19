import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const { token, rating, title, body } = await req.json()

    if (!token || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Token and rating (1-5) required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: review, error: fetchError } = await supabase
      .from('product_reviews')
      .select('id, token_used, customer_name')
      .eq('review_token', token)
      .single()

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Invalid review link' }, { status: 404 })
    }

    if (review.token_used) {
      return NextResponse.json({ error: 'This review link has already been used' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('product_reviews')
      .update({
        rating,
        title: title?.trim() || null,
        body: body?.trim() || null,
        token_used: true,
        created_at: new Date().toISOString(),
      })
      .eq('id', review.id)
      .eq('token_used', false)

    if (updateError) {
      console.error('Review submit error:', updateError)
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
    }

    await supabase
      .from('orders')
      .update({ review_completed_at: new Date().toISOString() })
      .eq('review_token', token)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'
    await fetch(`${siteUrl}/api/send-admin-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_review',
        data: {
          customerName: review.customer_name,
          rating,
          title: title || '(no title)',
          body: body || '(no text)',
        },
      }),
    }).catch(() => {})

    return NextResponse.json({ success: true, name: review.customer_name })
  } catch (err) {
    console.error('Review submit error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
