import { NextRequest, NextResponse } from 'next/server'
import { searchSpotify } from '@/lib/spotify/client'

export const dynamic = 'force-dynamic'

const GENRE_COVER_QUERY: Record<string, string> = {
  'pop':         'genre:"pop" year:2024-2025',
  'hip-hop':     'genre:"hip hop" year:2024-2025',
  'rnb':         'genre:"r&b" year:2024-2025',
  'rock':        'genre:"rock" year:2024-2025',
  'electronic':  'genre:"electronic" year:2024-2025',
  'indie':       'genre:"indie pop" year:2024-2025',
  'latin':       'genre:"latin" year:2024-2025',
  'desi':        'genre:"bollywood" year:2024',
  'punjabi':     'genre:"punjabi" year:2024-2025',
  'kpop':        'genre:"k-pop" year:2024-2025',
  'afrobeats':   'genre:"afrobeats" year:2024-2025',
  'jazz':        'genre:"jazz" year:2024-2025',
  'classical':   'genre:"classical" orchestra',
  'country':     'genre:"country" year:2024-2025',
  'metal':       'genre:"metal" year:2024-2025',
  'soul':        'genre:"soul" year:2024-2025',
  'folk':        'genre:"folk" year:2024-2025',
  'workout':     'workout music 2024',
  'chill':       'genre:"chill" year:2024-2025',
  'party':       'party hits 2024',
  'focus':       'focus music study',
  'romance':     'love songs 2024',
  'decades-90s': '90s hits best of',
  'decades-00s': '2000s hits best of',
  'decades-10s': '2010s hits best of',
}

// YouTube fallback search queries — music video style, gets artist photos
const GENRE_YT_QUERY: Record<string, string> = {
  'pop':         'pop music official music video 2024',
  'hip-hop':     'hip hop rap official music video 2024',
  'rnb':         'r&b soul official music video 2024',
  'rock':        'rock music official music video 2024',
  'electronic':  'electronic edm official music video 2024',
  'indie':       'indie pop official music video 2024',
  'latin':       'latin reggaeton official music video 2024',
  'desi':        'bollywood hindi song official video 2024',
  'punjabi':     'punjabi song official music video 2024',
  'kpop':        'kpop official music video 2024',
  'afrobeats':   'afrobeats official music video 2024',
  'jazz':        'jazz music live performance 2024',
  'classical':   'classical orchestra symphony performance',
  'country':     'country music official music video 2024',
  'metal':       'metal rock official music video 2024',
  'soul':        'soul music official music video 2024',
  'folk':        'folk acoustic official music video 2024',
  'workout':     'gym workout music mix 2024',
  'chill':       'chill lofi music aesthetic 2024',
  'party':       'party dance hits official video 2024',
  'focus':       'focus study music ambient 2024',
  'romance':     'romantic love songs official video 2024',
  'decades-90s': '90s hits music video',
  'decades-00s': '2000s throwback hits music video',
  'decades-10s': '2010s hits music video',
}

// In-memory cache — Spotify covers cached 6h, YouTube covers cached 24h
let cachedCovers: Record<string, string | null> | null = null
let cacheExpiry = 0
const SPOTIFY_TTL  = 6  * 60 * 60 * 1000
const YOUTUBE_TTL  = 24 * 60 * 60 * 1000

// ── YouTube thumbnail fallback ────────────────────────────────
async function fetchYouTubeCover(slug: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || apiKey.startsWith('your_')) return null

  const query = GENRE_YT_QUERY[slug]
  if (!query) return null

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '10',  // Music
    maxResults: '3',
    key: apiKey,
  })

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    if (!item?.id?.videoId) return null
    // Use high-quality thumbnail; falls back to medium
    return (
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.medium?.url ??
      `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`
    )
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get('slugs') ?? ''
  const slugs = slugsParam.split(',').filter(Boolean)

  // Return from cache if all requested slugs are already covered
  if (cachedCovers && Date.now() < cacheExpiry && slugs.every(s => s in cachedCovers!)) {
    const covers: Record<string, string | null> = {}
    for (const slug of slugs) covers[slug] = cachedCovers[slug]
    return NextResponse.json({ covers })
  }

  // Only fetch slugs not already in cache
  const missing = cachedCovers ? slugs.filter(s => !(s in cachedCovers!)) : slugs

  if (!cachedCovers || Date.now() >= cacheExpiry) {
    cachedCovers = {}
    cacheExpiry = Date.now() + SPOTIFY_TTL
  }

  // ── Try Spotify first ─────────────────────────────────────
  let spotifyBlocked = false
  const spotifyResults = await Promise.allSettled(
    missing.map(async slug => {
      const query = GENRE_COVER_QUERY[slug]
      if (!query) return { slug, albumArt: null, source: 'none' }
      try {
        const result = await searchSpotify(query, ['track'])
        const first = result.tracks?.items[0]
        return { slug, albumArt: first?.album?.images?.[0]?.url ?? null, source: 'spotify' }
      } catch (e) {
        if (e instanceof Error && e.message.includes('429')) spotifyBlocked = true
        return { slug, albumArt: null, source: 'error' }
      }
    })
  )

  const needsYouTube: string[] = []
  for (const res of spotifyResults) {
    if (res.status === 'fulfilled') {
      if (res.value.albumArt) {
        cachedCovers[res.value.slug] = res.value.albumArt
      } else {
        needsYouTube.push(res.value.slug)
      }
    }
  }

  // ── YouTube fallback for any slug that Spotify couldn't cover ─
  if (spotifyBlocked || needsYouTube.length > 0) {
    const ytSlugs = spotifyBlocked ? missing : needsYouTube
    // Limit concurrency — YouTube API quota is precious (100 units each)
    const ytResults = await Promise.allSettled(
      ytSlugs.map(async slug => ({ slug, url: await fetchYouTubeCover(slug) }))
    )
    for (const res of ytResults) {
      if (res.status === 'fulfilled' && res.value.url) {
        cachedCovers[res.value.slug] = res.value.url
        // YouTube covers are valid longer
        cacheExpiry = Math.max(cacheExpiry, Date.now() + YOUTUBE_TTL)
      } else if (res.status === 'fulfilled') {
        cachedCovers[res.value.slug] = null
      }
    }
  }

  const covers: Record<string, string | null> = {}
  for (const slug of slugs) covers[slug] = cachedCovers[slug] ?? null

  return NextResponse.json({ covers })
}
