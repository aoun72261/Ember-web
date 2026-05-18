import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: received } = await supabase
    .from('song_sends')
    .select('*')
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: sent } = await supabase
    .from('song_sends')
    .select('*')
    .eq('from_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get sender profiles for received
  const senderIds = [...new Set((received ?? []).map(r => r.from_user_id))]
  const recipientIds = [...new Set((sent ?? []).map(r => r.to_user_id))]
  const allIds = [...new Set([...senderIds, ...recipientIds])]

  const { data: profiles } = allIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url').in('id', allIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const mapSend = (r: Record<string, unknown>, otherKey: string) => ({
    id: r.id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    otherUser: profileMap[r[otherKey] as string] ?? { username: 'Unknown', avatar_url: null },
    track: {
      id: r.spotify_track_id,
      title: r.track_title,
      artist: r.artist,
      album: r.album ?? '',
      albumArt: r.album_art,
      duration: r.duration_ms ?? 0,
      spotifyId: r.spotify_track_id,
      youtubeVideoId: null,
      previewUrl: null,
    },
    note: r.note ?? '',
    read: r.read,
    createdAt: r.created_at,
  })

  return NextResponse.json({
    received: (received ?? []).map(r => mapSend(r, 'from_user_id')),
    sent: (sent ?? []).map(r => mapSend(r, 'to_user_id')),
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { toUserId, track, note } = await request.json()
  if (!toUserId || !track) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { error } = await supabase.from('song_sends').insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    track_title: track.title,
    artist: track.artist,
    album: track.album ?? '',
    album_art: track.albumArt ?? null,
    spotify_track_id: track.spotifyId,
    duration_ms: track.duration ?? 0,
    note: note?.trim() ?? null,
    read: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await supabase.from('song_sends').update({ read: true }).eq('id', id).eq('to_user_id', user.id)
  return NextResponse.json({ ok: true })
}
