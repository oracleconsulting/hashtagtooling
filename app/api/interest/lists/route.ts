import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  INTEREST_PUBLIC_FIELDS,
  ensureDefaultInterestLists,
  parseGalleryImages,
  parseQuestions,
  validateQuestionBuilder,
  type InterestListStatus,
  type InterestQuestion,
} from '@/lib/interest'
import { parseInterestPricing } from '@/lib/interest-pricing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

const STATUSES: InterestListStatus[] = ['draft', 'open', 'closed', 'launched']

function normalizeListPayload(body: Record<string, unknown>): {
  error?: string
  payload?: {
    slug: string
    name: string
    tagline: string | null
    description: string | null
    hero_image_url: string | null
    gallery_images: string[]
    price_from: number | null
    price_to: number | null
    expected_launch: string | null
    status: InterestListStatus
    show_count: boolean
    questions: InterestQuestion[]
    launched_product_id: string | null
  }
} {
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const status = STATUSES.includes(body.status as InterestListStatus)
    ? (body.status as InterestListStatus)
    : 'draft'

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and hyphens' }
  }
  if (!name) {
    return { error: 'Name is required' }
  }

  const questions = parseQuestions(body.questions)
  const questionsError = validateQuestionBuilder(questions)
  if (questionsError) return { error: questionsError }

  const priceFrom = body.price_from === '' || body.price_from === null || body.price_from === undefined
    ? null
    : Number(body.price_from)
  const priceTo = body.price_to === '' || body.price_to === null || body.price_to === undefined
    ? null
    : Number(body.price_to)

  if (priceFrom !== null && !Number.isFinite(priceFrom)) {
    return { error: 'price_from must be a number' }
  }
  if (priceTo !== null && !Number.isFinite(priceTo)) {
    return { error: 'price_to must be a number' }
  }

  const cleanedQuestions: InterestQuestion[] = questions.map((q) => ({
    key: q.key.trim(),
    label: q.label.trim(),
    type: q.type,
    required: q.required === true,
    ...(q.type === 'text' ? {} : { options: (q.options || []).map((o) => o.trim()).filter(Boolean) }),
  }))

  return {
    payload: {
      slug,
      name,
      tagline: typeof body.tagline === 'string' ? body.tagline.trim() || null : null,
      description: typeof body.description === 'string' ? body.description.trim() || null : null,
      hero_image_url: typeof body.hero_image_url === 'string' ? body.hero_image_url.trim() || null : null,
      gallery_images: parseGalleryImages(body.gallery_images),
      price_from: priceFrom,
      price_to: priceTo,
      expected_launch: typeof body.expected_launch === 'string' ? body.expected_launch.trim() || null : null,
      status,
      show_count: body.show_count === true,
      questions: cleanedQuestions,
      launched_product_id:
        typeof body.launched_product_id === 'string' && body.launched_product_id.trim()
          ? body.launched_product_id.trim()
          : null,
    },
  }
}

export async function GET() {
  try {
    const supabase = getSupabase()
    await ensureDefaultInterestLists(supabase)
    let { data: lists, error: listsError } = await supabase
      .from('interest_lists')
      .select(INTEREST_PUBLIC_FIELDS)
      .order('created_at', { ascending: false })

    if (listsError && String(listsError.message || '').includes('pricing')) {
      const fallback = await supabase
        .from('interest_lists')
        .select('id, slug, name, tagline, description, hero_image_url, gallery_images, price_from, price_to, expected_launch, status, show_count, questions, launched_product_id, created_at, updated_at')
        .order('created_at', { ascending: false })
      lists = (fallback.data || []).map((list) => ({ ...list, pricing: {} }))
      listsError = fallback.error
    }

    if (listsError) {
      console.error('Interest lists fetch error:', listsError)
      return NextResponse.json({ error: 'Failed to load lists' }, { status: 500 })
    }

    const { data: signupRows, error: signupsError } = await supabase
      .from('interest_signups')
      .select('list_id')

    if (signupsError) {
      console.error('Interest list counts error:', signupsError)
      return NextResponse.json({ error: 'Failed to load signup counts' }, { status: 500 })
    }

    const counts = new Map<string, number>()
    for (const row of signupRows || []) {
      counts.set(row.list_id, (counts.get(row.list_id) || 0) + 1)
    }

    return NextResponse.json({
      lists: (lists || []).map((list) => ({
        ...list,
        signup_count: counts.get(list.id) || 0,
      })),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err) {
    console.error('Interest lists GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const normalized = normalizeListPayload(body)
    if (!normalized.payload) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('interest_lists')
      .insert(normalized.payload)
      .select(INTEREST_PUBLIC_FIELDS)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A list with that slug already exists' }, { status: 409 })
      }
      console.error('Interest list create error:', error)
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
    }

    return NextResponse.json({ list: data })
  } catch (err) {
    console.error('Interest lists POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const id = typeof body.id === 'string' ? body.id : ''
    if (!id) {
      return NextResponse.json({ error: 'Missing list id' }, { status: 400 })
    }

    const supabase = getSupabase()

    if (body.pricingOnly === true) {
      const { data, error } = await supabase
        .from('interest_lists')
        .update({
          pricing: parseInterestPricing(body.pricing, typeof body.slug === 'string' ? body.slug : undefined),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(INTEREST_PUBLIC_FIELDS)
        .single()

      if (error) {
        console.error('Interest pricing update error:', error)
        return NextResponse.json({
          error: error.message?.includes('pricing')
            ? 'Failed to save cost base. Run the interest pricing SQL first.'
            : error.message || 'Failed to save pricing',
        }, { status: 500 })
      }
      if (!data) return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })
      return NextResponse.json({ list: data })
    }

    const normalized = normalizeListPayload(body)
    if (!normalized.payload) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('interest_lists')
      .update({ ...normalized.payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(INTEREST_PUBLIC_FIELDS)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A list with that slug already exists' }, { status: 409 })
      }
      console.error('Interest list update error:', error)
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })
    }

    return NextResponse.json({ list: data })
  } catch (err) {
    console.error('Interest lists PATCH error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
