import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, historyRes, likesRes, playlistsRes] = await Promise.allSettled([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('listening_history').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(50),
    supabase.from('liked_tracks').select('spotify_track_id').eq('user_id', user.id),
    supabase.from('playlists').select('id').eq('owner_id', user.id),
  ])

  const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null
  const historyRows = historyRes.status === 'fulfilled' ? (historyRes.value.data ?? []) : []
  const likedCount = likesRes.status === 'fulfilled' ? (likesRes.value.data?.length ?? 0) : 0
  const playlistCount = playlistsRes.status === 'fulfilled' ? (playlistsRes.value.data?.length ?? 0) : 0

  // Deduplicated recent tracks
  const seen = new Set<string>()
  const recentTracks = historyRows
    .filter(r => { if (seen.has(r.spotify_track_id)) return false; seen.add(r.spotify_track_id); return true })
    .slice(0, 12)
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

  // Top artists from history
  const artistCounts: Record<string, { name: string; plays: number; art: string }> = {}
  historyRows.forEach(r => {
    if (!artistCounts[r.artist]) artistCounts[r.artist] = { name: r.artist, plays: 0, art: r.album_art }
    artistCounts[r.artist].plays++
  })
  const topArtists = Object.values(artistCounts).sort((a, b) => b.plays - a.plays).slice(0, 5)

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <ProfileClient
      username={profile?.username ?? user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'User'}
      email={user.email ?? ''}
      joinDate={joinDate}
      totalPlays={historyRows.length}
      likedCount={likedCount}
      playlistCount={playlistCount}
      recentTracks={recentTracks}
      topArtists={topArtists}
      avatarUrl={profile?.avatar_url ?? null}
    />
  )
}
