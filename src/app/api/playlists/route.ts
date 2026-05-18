import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ playlists: [] })

  const { data } = await supabase
    .from('playlists')
    .select('*, playlist_tracks(count)')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  return NextResponse.json({ playlists: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, coverArt } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase.from('playlists').insert({
    owner_id: user.id,
    name: name.trim(),
    description: description ?? '',
    cover_art: coverArt ?? null,
    is_public: false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ playlist: data })
}
