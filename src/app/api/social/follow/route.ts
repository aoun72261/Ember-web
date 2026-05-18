import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await request.json()
  if (!userId || userId === user.id) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  await supabase.from('follows').upsert(
    { follower_id: user.id, following_id: userId },
    { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'No userId' }, { status: 400 })

  await supabase.from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', userId)

  return NextResponse.json({ ok: true })
}
