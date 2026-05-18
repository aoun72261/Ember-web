import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playlistId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: playlist } = await supabase.from('playlists')
    .select('owner_id').eq('id', playlistId).single()
  if (!playlist || playlist.owner_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { track } = await request.json()
  if (!track) return NextResponse.json({ error: 'No track' }, { status: 400 })

  // Get next position
  const { count } = await supabase.from('playlist_tracks')
    .select('*', { count: 'exact', head: true })
    .eq('playlist_id', playlistId)

  await supabase.from('playlist_tracks').upsert({
    playlist_id: playlistId,
    spotify_track_id: track.spotifyId,
    track_title: track.title,
    artist: track.artist,
    album: track.album,
    album_art: track.albumArt,
    duration_ms: track.duration,
    position: (count ?? 0) + 1,
  }, { onConflict: 'playlist_id,spotify_track_id', ignoreDuplicates: true })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playlistId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: playlist } = await supabase.from('playlists')
    .select('owner_id').eq('id', playlistId).single()
  if (!playlist || playlist.owner_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const trackId = request.nextUrl.searchParams.get('trackId')
  if (!trackId) return NextResponse.json({ error: 'No trackId' }, { status: 400 })

  await supabase.from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('spotify_track_id', trackId)

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playlistId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: playlist } = await supabase.from('playlists')
    .select('owner_id').eq('id', playlistId).single()
  if (!playlist || playlist.owner_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { order }: { order: string[] } = await request.json() // array of spotifyIds in new order

  await Promise.all(
    order.map((spotifyId, idx) =>
      supabase.from('playlist_tracks')
        .update({ position: idx + 1 })
        .eq('playlist_id', playlistId)
        .eq('spotify_track_id', spotifyId)
    )
  )

  return NextResponse.json({ ok: true })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playlistId } = await params
  const supabase = await createClient()

  const { data } = await supabase.from('playlist_tracks')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('position')

  const tracks = (data ?? []).map(r => ({
    id: r.spotify_track_id,
    title: r.track_title,
    artist: r.artist,
    album: r.album,
    albumArt: r.album_art,
    duration: r.duration_ms,
    spotifyId: r.spotify_track_id,
    youtubeVideoId: null,
    previewUrl: null,
  }))

  return NextResponse.json({ tracks })
}
