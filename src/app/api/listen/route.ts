import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, hostUsername } = await request.json()
  if (!code || !hostUsername) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await supabase.from('listen_sessions').upsert({
    code,
    host_user_id: user.id,
    host_username: hostUsername,
  }, { onConflict: 'code' })

  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 })

  const { data: session } = await supabase
    .from('listen_sessions')
    .select('*')
    .eq('code', code)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ session })
}
