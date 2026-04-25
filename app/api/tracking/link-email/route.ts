import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { sessionId, email } = await req.json()
    if (!sessionId || !email) return NextResponse.json({ ok: false }, { status: 400 })

    await supabase
      .from('tracking_sessions')
      .upsert({ session_id: sessionId, email, last_seen_at: new Date().toISOString() }, { onConflict: 'session_id' })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
