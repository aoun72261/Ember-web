import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ liked: false, tracks: [] })

  const trackId = request.nextUrl.searchParams.get('trackId')

  if (trackId) {
    // Check if a specific track is liked
    const { data } = await supabase
      .from('liked_tracks')
      .select('spotify_track_id')
      .eq('user_id', user.id)
      .eq('spotify_track_id', trackId)
      .maybeSingle()
    return NextResponse.json({ liked: !!data })
  }

  // Return all liked tracks
  const { data } = await supabase
    .from('liked_tracks')
    .select('*')
    .eq('user_id', user.id)
    .order('liked_at', { ascending: false })

  const tracks = (data ?? []).map(r => ({
    id: r.spotify_track_id,
    title: r.track_title,
    artist: r.artist,
    album: r.album ?? '',
    albumArt: r.album_art,
    duration: r.duration_ms,
    spotifyId: r.spotify_track_id,
    youtubeVideoId: null,
    previewUrl: null,
  }))

  return NextResponse.json({ tracks })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { track } = await request.json()
  if (!track) return NextResponse.json({ error: 'No track' }, { status: 400 })

  await supabase.from('liked_tracks').upsert({
    user_id: user.id,
    spotify_track_id: track.spotifyId,
    track_title: track.title,
    artist: track.artist,
    album_art: track.albumArt,
    duration_ms: track.duration,
  })

  return NextResponse.json({ liked: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trackId = request.nextUrl.searchParams.get('trackId')
  if (!trackId) return NextResponse.json({ error: 'No trackId' }, { status: 400 })

  await supabase.from('liked_tracks').delete()
    .eq('user_id', user.id)
    .eq('spotify_track_id', trackId)

  return NextResponse.json({ liked: false })
}
