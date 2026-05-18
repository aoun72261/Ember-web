import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsClient from './StatsClient'

export const dynamic = 'force-dynamic'

interface HistoryRow {
  spotify_track_id: string
  track_title: string
  artist: string
  album_art: string
  played_at: string
}

function formatListenTime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function getPersonality(topHour: number, totalPlays: number, topArtist: string): { label: string; desc: string } {
  if (totalPlays === 0) return { label: 'Explorer', desc: 'Just getting started' }
  if (topHour >= 0 && topHour < 6) return { label: 'Night Owl', desc: 'You come alive after midnight' }
  if (topHour >= 6 && topHour < 10) return { label: 'Morning Person', desc: 'Music with your coffee' }
  if (topHour >= 10 && topHour < 14) return { label: 'Midday Groover', desc: 'Powering through the day' }
  if (topHour >= 14 && topHour < 18) return { label: 'Afternoon Vibe', desc: 'Peak hours, peak music' }
  if (topHour >= 18 && topHour < 22) return { label: 'Evening Listener', desc: 'Winding down in style' }
  return { label: 'Late Night', desc: 'The city never sleeps, neither do you' }
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch full history and listen time in parallel
  const [{ data: rows }, { data: timeRows }] = await Promise.all([
    supabase
      .from('listening_history')
      .select('spotify_track_id, track_title, artist, album_art, played_at')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false }),
    supabase
      .from('listen_time')
      .select('seconds')
      .eq('user_id', user.id),
  ])

  const totalListenSeconds = (timeRows ?? []).reduce((sum, r) => sum + (r.seconds ?? 0), 0)
  const listenTimeLabel = formatListenTime(totalListenSeconds)

  const history: HistoryRow[] = rows ?? []
  const totalPlays = history.length

  // ── Top tracks (by play count) ──────────────────────────────
  const trackCounts: Record<string, { title: string; artist: string; art: string; plays: number; spotifyId: string }> = {}
  history.forEach(r => {
    if (!trackCounts[r.spotify_track_id]) {
      trackCounts[r.spotify_track_id] = { title: r.track_title, artist: r.artist, art: r.album_art, plays: 0, spotifyId: r.spotify_track_id }
    }
    trackCounts[r.spotify_track_id].plays++
  })
  const topTracks = Object.values(trackCounts).sort((a, b) => b.plays - a.plays).slice(0, 10)

  // ── Top artists (by play count) ─────────────────────────────
  const artistCounts: Record<string, { name: string; art: string; plays: number }> = {}
  history.forEach(r => {
    const key = r.artist.split(',')[0].trim() // use first artist only
    if (!artistCounts[key]) artistCounts[key] = { name: key, art: r.album_art, plays: 0 }
    artistCounts[key].plays++
  })
  const topArtists = Object.values(artistCounts).sort((a, b) => b.plays - a.plays).slice(0, 5)

  // ── Plays by hour (0–23) ────────────────────────────────────
  const byHour = Array(24).fill(0)
  history.forEach(r => {
    const h = new Date(r.played_at).getHours()
    byHour[h]++
  })
  const topHour = byHour.indexOf(Math.max(...byHour))

  // ── Plays by day of week (0=Sun … 6=Sat) ───────────────────
  const byDay = Array(7).fill(0)
  history.forEach(r => { byDay[new Date(r.played_at).getDay()]++ })

  // ── Plays by month (last 6 months) ─────────────────────────
  const now = new Date()
  const months: { label: string; plays: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const plays = history.filter(r => {
      const rd = new Date(r.played_at)
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
    }).length
    months.push({ label, plays })
  }

  // ── Listening streak (consecutive days with at least 1 play) ─
  const playDays = new Set(history.map(r => new Date(r.played_at).toDateString()))
  let streak = 0
  const check = new Date()
  while (playDays.has(check.toDateString())) {
    streak++
    check.setDate(check.getDate() - 1)
  }

  // ── Unique counts ───────────────────────────────────────────
  const uniqueTracks = Object.keys(trackCounts).length
  const uniqueArtists = Object.keys(artistCounts).length

  const personality = getPersonality(topHour, totalPlays, topArtists[0]?.name ?? '')

  return (
    <StatsClient
      totalPlays={totalPlays}
      uniqueTracks={uniqueTracks}
      uniqueArtists={uniqueArtists}
      streak={streak}
      listenTimeLabel={listenTimeLabel}
      topTracks={topTracks}
      topArtists={topArtists}
      byHour={byHour}
      byDay={byDay}
      months={months}
      topHour={topHour}
      personality={personality}
    />
  )
}
