import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = (following ?? []).map(r => r.following_id)
  if (followingIds.length === 0) return NextResponse.json({ feed: [] })

  const { data: history } = await supabase
    .from('listening_history')
    .select('*')
    .in('user_id', followingIds)
    .order('played_at', { ascending: false })
    .limit(60)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', followingIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  // Dedupe: one entry per user per track (most recent play)
  const seen = new Set<string>()
  const feed = (history ?? [])
    .filter(r => {
      const key = `${r.user_id}:${r.spotify_track_id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 30)
    .map(r => ({
      id: r.id,
      userId: r.user_id,
      username: profileMap[r.user_id]?.username ?? 'Unknown',
      avatarUrl: profileMap[r.user_id]?.avatar_url ?? null,
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
      playedAt: r.played_at,
    }))

  return NextResponse.json({ feed })
}
