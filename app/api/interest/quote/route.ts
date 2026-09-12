import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { escapeHtml, interestEmailShell } from '@/lib/interest'
import { formatBuildIntent, interestInviteUrl, isInviteToken, parseBuildIntent } from '@/lib/interest-invite'
import {
  parseBespokeQuote,
  saveBespokeQuote,
  signupBespokeQuote,
  splitQuoteTotal,
  type BespokeQuote,
} from '@/lib/interest-quote'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

async function emailCustomer(
  to: string,
  opts: Parameters<typeof interestEmailShell>[0] & { subject: string }
) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: [to],
    subject: opts.subject,
    html: interestEmailShell(opts),
  }).catch((err) => console.error('Interest quote customer email failed:', err))
}

async function emailJames(subject: string, html: string) {
  const resend = getResend()
  if (!resend) return
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
  await resend.emails.send({
    from: from.includes('@') && !from.includes('resend.dev') ? `#TOOLING Notifications <${from}>` : 'onboarding@resend.dev',
    to: ['hashtagwoodworking@gmail.com'],
    subject,
    html,
  }).catch((err) => console.error('Interest quote admin email failed:', err))
}

async function loadByToken(token: string) {
  const supabase = getSupabase()
  const full = await supabase
    .from('interest_signups')
    .select('id, email, name, list_id, invite_token, build_intent, bespoke_quote')
    .eq('invite_token', token)
    .maybeSingle()
  if (!full.error) return { supabase, signup: full.data }
  const fallback = await supabase
    .from('interest_signups')
    .select('id, email, name, list_id, invite_token, build_intent')
    .eq('invite_token', token)
    .maybeSingle()
  return { supabase, signup: fallback.data }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body.action
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hashtag.guru'

    if (action === 'request') {
      const token = typeof body.token === 'string' ? body.token : ''
      const request = typeof body.request === 'string' ? body.request.trim() : ''
      const intent = parseBuildIntent(body.intent)
      if (!isInviteToken(token)) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
      if (!intent) return NextResponse.json({ error: 'Pick your spec first' }, { status: 400 })
      if (request.length < 4) return NextResponse.json({ error: 'Tell me what you want' }, { status: 400 })

      const { supabase, signup } = await loadByToken(token)
      if (!signup) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

      const quote: BespokeQuote = {
        request,
        requestedAt: new Date().toISOString(),
        status: 'requested',
        catalogTotal: intent.total,
        quotedTotal: null,
        quotedDeposit: null,
        quotedBalance: null,
        quotedNote: null,
        quotedAt: null,
        respondedAt: null,
      }
      const saved = await saveBespokeQuote(supabase, signup.id, quote)
      if (saved.error) return NextResponse.json({ error: saved.error }, { status: 500 })

      const { data: list } = await supabase.from('interest_lists').select('name, slug').eq('id', signup.list_id).maybeSingle()
      const href = `${interestInviteUrl(token, siteUrl)}#quote`
      await emailCustomer(signup.email, {
        subject: `I've got your request — ${list?.name || 'your build'}`,
        eyebrow: 'Quote request',
        paragraphs: [
          signup.name ? `Hi ${escapeHtml(signup.name)},` : 'Hi,',
          'Got it. I&apos;ll look at that and email you a price. Don&apos;t pay the standard deposit until we agree.',
        ],
        cardTitle: list?.name,
        cardBody: escapeHtml(request),
        link: { href, label: 'Open your build form →' },
      })
      await emailJames(
        `Quote request — ${signup.name || signup.email}`,
        `<p><strong>${escapeHtml(signup.name || 'Someone')}</strong> (${escapeHtml(signup.email)}) asked for a quote on ${escapeHtml(list?.name || 'a build')}.</p>
         <p><strong>Spec:</strong> ${escapeHtml(formatBuildIntent(intent))}</p>
         <p><strong>Request:</strong></p>
         <p>${escapeHtml(request).replace(/\n/g, '<br/>')}</p>
         <p><a href="https://hashtag.guru/admin/interest">Open interest admin</a></p>`
      )
      return NextResponse.json({ ok: true, quote })
    }

    if (action === 'send') {
      const signupId = typeof body.signupId === 'string' ? body.signupId : ''
      const note = typeof body.note === 'string' ? body.note.trim() : ''
      const total = Number(body.total)
      if (!signupId) return NextResponse.json({ error: 'Missing signup' }, { status: 400 })
      if (!Number.isFinite(total) || total <= 0) return NextResponse.json({ error: 'Quoted total must be a number' }, { status: 400 })

      const supabase = getSupabase()
      const full = await supabase
        .from('interest_signups')
        .select('id, email, name, list_id, invite_token, build_intent, bespoke_quote')
        .eq('id', signupId)
        .maybeSingle()
      const signup = full.error
        ? (await supabase.from('interest_signups').select('id, email, name, list_id, invite_token, build_intent').eq('id', signupId).maybeSingle()).data
        : full.data
      if (!signup) return NextResponse.json({ error: 'Signup not found' }, { status: 404 })
      if (!signup.invite_token) return NextResponse.json({ error: 'Send them a build invite first' }, { status: 400 })

      const existing = signupBespokeQuote(signup)
      if (!existing) return NextResponse.json({ error: 'No request to quote' }, { status: 400 })

      const split = splitQuoteTotal(total)
      const quote: BespokeQuote = {
        ...existing,
        status: 'quoted',
        quotedTotal: split.total,
        quotedDeposit: split.deposit,
        quotedBalance: split.balance,
        quotedNote: note || null,
        quotedAt: new Date().toISOString(),
        respondedAt: null,
      }
      const saved = await saveBespokeQuote(supabase, signup.id, quote)
      if (saved.error) return NextResponse.json({ error: saved.error }, { status: 500 })

      const { data: list } = await supabase.from('interest_lists').select('name').eq('id', signup.list_id).maybeSingle()
      const href = `${interestInviteUrl(signup.invite_token, siteUrl)}#quote`
      const intent = parseBuildIntent(signup.build_intent)
      await emailCustomer(signup.email, {
        subject: `Your quote — ${list?.name || 'your build'}`,
        eyebrow: 'Quote ready',
        paragraphs: [
          signup.name ? `Hi ${escapeHtml(signup.name)},` : 'Hi,',
          `I&apos;ve priced that request. ${escapeHtml(intent ? `${intent.metalName} / ${intent.handleName}` : 'Your spec')} is ${formatPrice(split.total)} — 50% deposit ${formatPrice(split.deposit)} now, balance when it&apos;s done.`,
          note ? escapeHtml(note).replace(/\n/g, '<br/>') : 'Open your build form to accept or refuse.',
        ],
        cardTitle: list?.name,
        cardBody: `${formatPrice(split.total)} · ${escapeHtml(existing.request)}`,
        link: { href, label: 'Accept or refuse this quote →' },
      })
      return NextResponse.json({ ok: true, quote })
    }

    if (action === 'accept' || action === 'refuse') {
      const token = typeof body.token === 'string' ? body.token : ''
      if (!isInviteToken(token)) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
      const { supabase, signup } = await loadByToken(token)
      if (!signup) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
      const existing = signupBespokeQuote(signup)
      if (!existing || existing.status !== 'quoted') {
        return NextResponse.json({ error: 'There is no quote waiting' }, { status: 400 })
      }

      const quote: BespokeQuote = {
        ...existing,
        status: action === 'accept' ? 'accepted' : 'refused',
        respondedAt: new Date().toISOString(),
      }
      const saved = await saveBespokeQuote(supabase, signup.id, quote)
      if (saved.error) return NextResponse.json({ error: saved.error }, { status: 500 })

      const { data: list } = await supabase.from('interest_lists').select('name').eq('id', signup.list_id).maybeSingle()
      const href = `${interestInviteUrl(token, siteUrl)}#quote`
      if (action === 'accept') {
        await emailCustomer(signup.email, {
          subject: `Quote accepted — ${list?.name || 'your build'}`,
          eyebrow: 'Quote accepted',
          paragraphs: [
            signup.name ? `Hi ${escapeHtml(signup.name)},` : 'Hi,',
            `We&apos;re on. ${existing.quotedTotal != null ? formatPrice(existing.quotedTotal) : 'That price'} stands. Pay the 50% deposit from your build form when you&apos;re ready.`,
          ],
          cardTitle: list?.name,
          link: { href, label: 'Pay the deposit →' },
        })
      } else {
        await emailCustomer(signup.email, {
          subject: `Quote refused — ${list?.name || 'your build'}`,
          eyebrow: 'Quote refused',
          paragraphs: [
            signup.name ? `Hi ${escapeHtml(signup.name)},` : 'Hi,',
            'No problem. You can take the standard spec at the listed price, or send me another request from the same form.',
          ],
          cardTitle: list?.name,
          link: { href, label: 'Back to your build form →' },
        })
      }
      await emailJames(
        `Quote ${action === 'accept' ? 'accepted' : 'refused'} — ${signup.name || signup.email}`,
        `<p><strong>${escapeHtml(signup.name || 'Someone')}</strong> (${escapeHtml(signup.email)}) ${action === 'accept' ? 'accepted' : 'refused'} the quote for ${escapeHtml(list?.name || 'a build')}.</p>
         <p><strong>Request:</strong> ${escapeHtml(existing.request)}</p>
         <p><strong>Quoted:</strong> ${existing.quotedTotal != null ? formatPrice(existing.quotedTotal) : '—'}</p>
         <p><a href="https://hashtag.guru/admin/interest">Open interest admin</a></p>`
      )
      return NextResponse.json({ ok: true, quote })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Interest quote error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
