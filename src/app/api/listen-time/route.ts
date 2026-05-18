import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  const { seconds } = await request.json()
  if (!seconds || typeof seconds !== 'number' || seconds <= 0) return NextResponse.json({ ok: false })

  await supabase.from('listen_time').insert({
    user_id: user.id,
    seconds,
    logged_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ totalSeconds: 0 })

  const { data } = await supabase
    .from('listen_time')
    .select('seconds')
    .eq('user_id', user.id)

  const totalSeconds = (data ?? []).reduce((sum, r) => sum + (r.seconds ?? 0), 0)
  return NextResponse.json({ totalSeconds })
}
