import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ tracks: [] })

  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20')

  const { data } = await supabase
    .from('listening_history')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })
    .limit(limit)

  // Deduplicate — keep first (most recent) occurrence of each track
  const seen = new Set<string>()
  const tracks = (data ?? [])
    .filter(r => { if (seen.has(r.spotify_track_id)) return false; seen.add(r.spotify_track_id); return true })
    .map(r => ({
      id: r.spotify_track_id,
      title: r.track_title,
      artist: r.artist,
      album: '',
      albumArt: r.album_art,
      duration: 0,
      spotifyId: r.spotify_track_id,
      youtubeVideoId: null,
      previewUrl: null,
    }))

  return NextResponse.json({ tracks })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  const { track } = await request.json()
  if (!track) return NextResponse.json({ ok: false })

  await supabase.from('listening_history').insert({
    user_id: user.id,
    spotify_track_id: track.spotifyId,
    track_title: track.title,
    artist: track.artist,
    album_art: track.albumArt ?? '',
    played_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
