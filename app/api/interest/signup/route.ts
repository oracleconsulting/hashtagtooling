import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  EMAIL_REGEX,
  interestEmailShell,
  parseQuestions,
  sanitizeAnswers,
} from '@/lib/interest'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    const trimmed = (body.email || '').trim().toLowerCase()
    const name = typeof body.name === 'string' ? body.name.trim() || null : null
    const notes = typeof body.notes === 'string' ? body.notes.trim() || null : null
    const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim() : 'interest-page'
    const marketingConsent = body.marketing_consent === true

    if (!slug) {
      return NextResponse.json({ error: 'Missing list slug' }, { status: 400 })
    }

    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: list, error: listError } = await supabase
      .from('interest_lists')
      .select('id, slug, name, status, questions')
      .eq('slug', slug)
      .maybeSingle()

    if (listError) {
      console.error('Interest list lookup error:', listError)
      return NextResponse.json({ error: 'Failed to look up list' }, { status: 500 })
    }

    if (!list) {
      return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })
    }

    if (list.status !== 'open') {
      return NextResponse.json({ error: 'This list is not open for signups' }, { status: 409 })
    }

    const questions = parseQuestions(list.questions)
    const { answers, error: answersError } = sanitizeAnswers(questions, body.answers)
    if (answersError) {
      return NextResponse.json({ error: answersError }, { status: 400 })
    }

    const { error: insertError } = await supabase.from('interest_signups').insert({
      list_id: list.id,
      email: trimmed,
      name,
      answers,
      notes,
      source,
      marketing_consent: marketingConsent,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ status: 'already' })
      }
      console.error('Interest signup insert error:', insertError)
      return NextResponse.json({ error: 'Failed to join the list' }, { status: 500 })
    }

    if (marketingConsent) {
      const { error: newsletterError } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: trimmed, source: `interest-${slug}` })
      if (newsletterError && newsletterError.code !== '23505') {
        console.error('Interest newsletter upsert error:', newsletterError)
      }
    }

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
        to: [trimmed],
        subject: `You're on the list — ${list.name}`,
        html: interestEmailShell({
          eyebrow: "You're on the list",
          paragraphs: [
            'Cheers — you&apos;re down.',
            'I&apos;ll email you when there&apos;s something worth emailing about. If it turns out I&apos;m not making these, I&apos;ll tell you that too rather than leaving you hanging.',
            'No payment taken, nothing owed. You can drop off the list any time by replying to this email.',
          ],
          cardTitle: list.name,
        }),
      }).catch((err) => console.error('Interest confirmation email failed:', err))
    }

    return NextResponse.json({ status: 'success' })
  } catch (err) {
    console.error('Interest signup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
