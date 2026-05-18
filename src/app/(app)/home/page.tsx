import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'
import { getNewReleases, searchSpotify } from '@/lib/spotify/client'
import { transformTrack, transformAlbum } from '@/lib/spotify/transform'
import type { Track, Album } from '@/types/index'

export const dynamic = 'force-dynamic'

// ── Non-personalised cache (1-hour TTL) ───────────────────────
interface HomeCache { trendingTracks: Track[]; chillTracks: Track[]; newReleases: Album[] }
let homeCache: HomeCache | null = null
let homeCacheExpiry = 0
const HOME_TTL = 60 * 60 * 1000

// ── Per-user Spotify recommendation cache (30-min TTL) ────────
interface UserCache {
  recommendedTracks: Track[]
  recommendedBasedOn: string[]
  regionalTracks: Track[]
  regionalLabel: string | null
  expiry: number
}
const userCache = new Map<string, UserCache>()
const USER_TTL = 30 * 60 * 1000

// ── Queries — use specific artists so we get real album art, not compilations ──
const TRENDING_QUERIES = [
  'artist:"Sabrina Carpenter" year:2024-2025',
  'artist:"Kendrick Lamar" year:2024-2025',
  'artist:"Chappell Roan" year:2024-2025',
  'artist:"The Weeknd" year:2024-2025',
  'artist:"Billie Eilish" year:2024-2025',
  'artist:"Drake" year:2024-2025',
  'artist:"Doechii" year:2024-2025',
  'artist:"Gracie Abrams" year:2024-2025',
]
const CHILL_QUERIES = [
  'artist:"Frank Ocean"',
  'artist:"Daniel Caesar" year:2024-2025',
  'artist:"Rex Orange County" year:2024-2025',
]

// ── Region detection ──────────────────────────────────────────
interface RegionInfo { query: string; label: string }
function detectRegion(artists: string[], genres: string[]): RegionInfo | null {
  const text = [...artists, ...genres].join(' ').toLowerCase()
  if (/desi|bollywood|punjabi|urdu|ghazal|qawwali|filmi|sufi|coke studio|pakistan|hindi film/.test(text))
    return { query: 'artist:"Arijit Singh" OR artist:"AP Dhillon" OR artist:"Atif Aslam"', label: 'Trending in South Asia' }
  if (/k-pop|kpop|korean pop/.test(text))
    return { query: 'artist:"BTS" OR artist:"BLACKPINK" OR artist:"NewJeans" year:2024-2025', label: 'Trending K-Pop' }
  if (/afrobeats|afropop|amapiano|naija/.test(text))
    return { query: 'artist:"Burna Boy" OR artist:"Wizkid" OR artist:"Davido" year:2024-2025', label: 'Trending Afrobeats' }
  if (/latin|reggaeton|latin pop|trap latino/.test(text))
    return { query: 'artist:"Bad Bunny" OR artist:"Karol G" OR artist:"J Balvin" year:2024-2025', label: 'Trending Latin' }
  if (/j-pop|jpop|anime|visual kei/.test(text))
    return { query: 'artist:"Yoasobi" OR artist:"Fujii Kaze" year:2024-2025', label: 'Trending J-Pop & Anime' }
  return null
}

function getGreeting(hour: number): string {
  if (hour >= 5  && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  if (hour >= 21 && hour < 24) return 'Good night'
  return ['Burning the midnight oil', 'Late night session', 'Up late?'][Math.floor(Math.random() * 3)]
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hour     = new Date().getHours()
  const greeting = getGreeting(hour)
  const username = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? null

  const profileResult = user
    ? await supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
    : null
  const avatarUrl: string | null = profileResult?.data?.avatar_url ?? null

  // ── ALWAYS-AVAILABLE: build from Supabase history ─────────
  // These sections show even when Spotify is rate-limited
  let topHistoryTracks: Track[]  = []   // most-played tracks from history
  let recentlyPlayed: Track[]    = []   // last played (deduped)
  let topHistoryArtists: string[] = []  // for Spotify personalization

  if (user) {
    const { data: histRows } = await supabase
      .from('listening_history')
      .select('spotify_track_id, track_title, artist, album_art, played_at')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(300)

    if (histRows?.length) {
      // ── Recently played (deduped, last 12 unique) ────────
      const seenRecent = new Set<string>()
      recentlyPlayed = histRows
        .filter(r => {
          if (seenRecent.has(r.spotify_track_id)) return false
          seenRecent.add(r.spotify_track_id); return true
        })
        .slice(0, 12)
        .map(r => ({
          id: r.spotify_track_id, title: r.track_title,
          artist: r.artist, album: '', albumArt: r.album_art,
          duration: 0, spotifyId: r.spotify_track_id,
          youtubeVideoId: null, previewUrl: null,
        }))

      // ── Top tracks by play count ─────────────────────────
      const playCounts: Record<string, { title: string; artist: string; art: string; plays: number }> = {}
      const artistCounts: Record<string, number> = {}

      for (const r of histRows) {
        if (!playCounts[r.spotify_track_id]) {
          playCounts[r.spotify_track_id] = {
            title: r.track_title, artist: r.artist,
            art: r.album_art, plays: 0,
          }
        }
        playCounts[r.spotify_track_id].plays++

        const primary = (r.artist ?? '').split(',')[0].trim()
        if (primary) artistCounts[primary] = (artistCounts[primary] ?? 0) + 1
      }

      topHistoryTracks = Object.entries(playCounts)
        .sort((a, b) => b[1].plays - a[1].plays)
        .slice(0, 20)
        .map(([id, d]) => ({
          id, title: d.title, artist: d.artist, album: '', albumArt: d.art,
          duration: 0, spotifyId: id, youtubeVideoId: null, previewUrl: null,
        }))

      topHistoryArtists = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name)
    }
  }

  // ── SPOTIFY: personalised recs (cached 30 min per user) ───
  let recommendedTracks: Track[]   = []
  let recommendedBasedOn: string[] = []
  let regionalTracks: Track[]      = []
  let regionalLabel: string | null = null

  if (user && topHistoryArtists.length) {
    const cached = userCache.get(user.id)
    if (cached && Date.now() < cached.expiry) {
      recommendedTracks  = cached.recommendedTracks
      recommendedBasedOn = cached.recommendedBasedOn
      regionalTracks     = cached.regionalTracks
      regionalLabel      = cached.regionalLabel
    } else {
      try {
        // CALL 1: combined artist search (1 call replaces 4)
        const artistQuery = topHistoryArtists.slice(0, 3).map(a => `artist:"${a}"`).join(' OR ')
        const [artistTracksRes, artistObjRes] = await Promise.allSettled([
          searchSpotify(artistQuery, ['track']),
          searchSpotify(`artist:"${topHistoryArtists[0]}"`, ['artist']),
        ])

        const genres: string[] = []
        if (artistObjRes.status === 'fulfilled') {
          artistObjRes.value.artists?.items[0]?.genres?.slice(0, 4).forEach(g => genres.push(g))
        }

        const regionInfo = detectRegion(topHistoryArtists, genres)

        // CALL 3 (optional): regional
        let regionalRes = null
        if (regionInfo) {
          regionalRes = await searchSpotify(regionInfo.query, ['track']).catch(() => null)
        }

        if (artistTracksRes.status === 'fulfilled') {
          const seen = new Set<string>()
          recommendedTracks = (artistTracksRes.value.tracks?.items ?? [])
            .filter(t => { if (seen.has(t.id) || !t.album?.images?.[0]) return false; seen.add(t.id); return true })
            .map(transformTrack)
            .sort(() => Math.random() - 0.5)
            .slice(0, 24)
          recommendedBasedOn = topHistoryArtists.slice(0, 3)
        }

        if (regionInfo && regionalRes) {
          const seenR = new Set<string>()
          regionalTracks = (regionalRes.tracks?.items ?? [])
            .filter(t => { if (seenR.has(t.id) || !t.album?.images?.[0]) return false; seenR.add(t.id); return true })
            .map(transformTrack)
            .sort(() => Math.random() - 0.5)
            .slice(0, 24)
          regionalLabel = regionInfo.label
        }

        userCache.set(user.id, {
          recommendedTracks, recommendedBasedOn,
          regionalTracks, regionalLabel,
          expiry: Date.now() + USER_TTL,
        })
      } catch { /* Spotify unavailable — Supabase sections still show */ }
    }
  }

  // ── SPOTIFY: non-personalised data (cached 1 hour) ────────
  let newReleases: Album[]    = []
  let trendingTracks: Track[] = []
  let chillTracks: Track[]    = []

  if (homeCache && Date.now() < homeCacheExpiry) {
    newReleases    = homeCache.newReleases
    trendingTracks = [...homeCache.trendingTracks].sort(() => Math.random() - 0.5)
    chillTracks    = homeCache.chillTracks
  } else {
    try {
      const [relRes, trendRes, chillRes] = await Promise.allSettled([
        getNewReleases(12),
        searchSpotify(pick(TRENDING_QUERIES), ['track']),
        searchSpotify(pick(CHILL_QUERIES), ['track']),
      ])
      newReleases = relRes.status === 'fulfilled' ? relRes.value.albums.items.map(transformAlbum) : []
      const allTrending = trendRes.status === 'fulfilled' ? (trendRes.value.tracks?.items ?? []).map(transformTrack) : []
      trendingTracks = [...allTrending].sort(() => Math.random() - 0.5).slice(0, 10)
      chillTracks = chillRes.status === 'fulfilled' ? (chillRes.value.tracks?.items ?? []).map(transformTrack).slice(0, 10) : []
      if (trendingTracks.length || newReleases.length) {
        homeCache = { newReleases, trendingTracks: allTrending.slice(0, 10), chillTracks }
        homeCacheExpiry = Date.now() + HOME_TTL
      }
    } catch { /* Spotify unavailable */ }
  }

  // Hero: prefer trending → top history track → recently played
  const heroTrack = trendingTracks[0] ?? topHistoryTracks[0] ?? recentlyPlayed[0] ?? null
  const heroQueue = trendingTracks.length ? trendingTracks
    : topHistoryTracks.length ? topHistoryTracks : recentlyPlayed

  return (
    <HomeClient
      greeting={greeting}
      username={username}
      avatarUrl={avatarUrl}
      heroTrack={heroTrack}
      heroQueue={heroQueue}
      newReleases={newReleases}
      trendingTracks={trendingTracks}
      chillTracks={chillTracks}
      recentlyPlayed={recentlyPlayed}
      topHistoryTracks={topHistoryTracks}
      topHistoryArtists={topHistoryArtists}
      recommendedTracks={recommendedTracks}
      recommendedBasedOn={recommendedBasedOn}
      regionalTracks={regionalTracks}
      regionalLabel={regionalLabel}
    />
  )
}
