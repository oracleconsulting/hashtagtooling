import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { escapeHtml, interestEmailShell } from '@/lib/interest'

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
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const link = typeof body.link === 'string' ? body.link.trim() : ''

    if (!slug || !subject || !message) {
      return NextResponse.json({ error: 'slug, subject, and message are required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: list, error: listError } = await supabase
      .from('interest_lists')
      .select('id, name')
      .eq('slug', slug)
      .maybeSingle()

    if (listError) {
      console.error('Interest notify list lookup error:', listError)
      return NextResponse.json({ error: 'Failed to load list' }, { status: 500 })
    }

    if (!list) {
      return NextResponse.json({ error: 'Interest list not found' }, { status: 404 })
    }

    const { data: signups, error: signupsError } = await supabase
      .from('interest_signups')
      .select('id, email, name')
      .eq('list_id', list.id)
      .eq('notified', false)

    if (signupsError) {
      console.error('Interest notify signups error:', signupsError)
      return NextResponse.json({ error: 'Failed to load signups' }, { status: 500 })
    }

    if (!signups?.length) {
      return NextResponse.json({ count: 0 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Email is not configured' }, { status: 500 })
    }

    const resend = new Resend(apiKey)
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>')
    const safeLink = link ? escapeHtml(link) : ''

    for (const signup of signups) {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
        to: [signup.email],
        subject,
        html: interestEmailShell({
          eyebrow: list.name,
          paragraphs: [safeMessage],
          cardTitle: list.name,
          link: safeLink
            ? { href: safeLink, label: 'Take a look →' }
            : undefined,
        }),
      }).catch((err) => console.error('Interest notify email failed:', err))
    }

    const ids = signups.map((s) => s.id)
    const { error: updateError } = await supabase
      .from('interest_signups')
      .update({ notified: true, notified_at: new Date().toISOString() })
      .in('id', ids)

    if (updateError) {
      console.error('Interest notify update error:', updateError)
      return NextResponse.json({ error: 'Emails sent but failed to mark notified' }, { status: 500 })
    }

    return NextResponse.json({ count: signups.length })
  } catch (err) {
    console.error('Interest notify error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
