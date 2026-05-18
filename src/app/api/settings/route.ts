import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ profile, email: user.email })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, string | null> = {}

  if (body.username !== undefined) {
    const username = body.username.trim()
    if (username.length < 2) return NextResponse.json({ error: 'Username too short' }, { status: 400 })
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()
    if (taken) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    updates.username = username
  }

  if (body.avatarUrl !== undefined) {
    updates.avatar_url = body.avatarUrl
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('profiles').update(updates).eq('id', user.id)
  }

  return NextResponse.json({ ok: true })
}
