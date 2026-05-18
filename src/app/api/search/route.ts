import { NextResponse } from 'next/server'
import { searchSpotify } from '@/lib/spotify/client'
import { transformTrack, transformArtist, transformAlbum } from '@/lib/spotify/transform'
import type { Track } from '@/types/index'

// ── Search result cache (5-minute TTL) ───────────────────────
// Key: "query::type"  →  cached response + expiry timestamp
interface CacheEntry {
  data: { tracks: Track[]; artists: ReturnType<typeof transformArtist>[]; albums: ReturnType<typeof transformAlbum>[] }
  expiry: number
}
const searchCache = new Map<string, CacheEntry>()
const SEARCH_TTL = 5 * 60 * 1000 // 5 minutes

// Prune stale entries occasionally so memory doesn't grow forever
function maybePrune() {
  if (searchCache.size < 200) return
  const now = Date.now()
  for (const [key, entry] of searchCache) {
    if (now >= entry.expiry) searchCache.delete(key)
  }
}

// ── YouTube fallback (when Spotify is rate-limited) ──────────
interface YTSnippet {
  title: string
  channelTitle: string
  thumbnails: { high?: { url: string }; medium?: { url: string } }
}
interface YTItem {
  id: { videoId: string }
  snippet: YTSnippet
}

async function searchYouTubeFallback(query: string): Promise<Track[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || apiKey === 'your_youtube_api_key') return []

  const params = new URLSearchParams({
    part: 'snippet',
    q: `${query} official audio`,
    type: 'video',
    videoCategoryId: '10', // Music category
    maxResults: '15',
    key: apiKey,
  })

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      next: { revalidate: 300 }, // 5-min edge cache
    })
    if (!res.ok) return []

    const data: { items?: YTItem[] } = await res.json()
    if (!data.items?.length) return []

    return data.items
      .filter(item => item.id?.videoId)
      .map((item) => {
        const videoId = item.id.videoId
        const rawTitle = item.snippet.title
        const channelTitle = item.snippet.channelTitle
          .replace(/\s*-\s*Topic$/i, '')         // "Drake - Topic" → "Drake"
          .replace(/\s*(VEVO|Music|Official|Records|Entertainment)\s*/gi, '')
          .trim()

        // Parse "Artist - Song Title" format when present
        const dashIdx = rawTitle.indexOf(' - ')
        let title = rawTitle
        let artist = channelTitle

        if (dashIdx > 0) {
          artist = rawTitle.substring(0, dashIdx).trim()
          title = rawTitle
            .substring(dashIdx + 3)
            .replace(/\s*-\s*Topic$/i, '')      // strip trailing "- Topic"
            .replace(/\s*[\[(]Official.*?[\])]|\s*[\[(]Audio.*?[\])]|\s*[\[(]Lyrics.*?[\])]/gi, '')
            .replace(/\s*[\[(]ft\..*?[\])]/gi, '')
            .trim()
        }

        const albumArt =
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

        return {
          id: videoId,
          title,
          artist,
          album: '',
          albumArt,
          duration: 0,
          spotifyId: videoId,      // used as a unique ID; player skips the /api/youtube call
          youtubeVideoId: videoId, // pre-filled → player loads this directly, no extra quota
          previewUrl: null,
        } satisfies Track
      })
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''
  const type  = searchParams.get('type') ?? 'track,artist,album'

  if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 })

  // Normalise key: lowercase so "Drake" and "drake" share the same slot
  const cacheKey = `${query.toLowerCase()}::${type}`

  // Serve from cache if fresh
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' },
    })
  }

  try {
    const types = type.split(',')
    const data  = await searchSpotify(query, types)

    const result = {
      tracks:  data.tracks?.items.map(transformTrack)   ?? [],
      artists: data.artists?.items.map(transformArtist) ?? [],
      albums:  data.albums?.items.map(transformAlbum)   ?? [],
    }

    // Store in cache
    searchCache.set(cacheKey, { data: result, expiry: Date.now() + SEARCH_TTL })
    maybePrune()

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (error: unknown) {
    const is429 = error instanceof Error && error.message.includes('429')
    console.error('[Search API]', error)

    // ── Spotify rate-limited → fall back to YouTube → Deezer ──
    if (is429) {
      // 1) Try YouTube
      console.log('[Search API] Spotify rate-limited — trying YouTube fallback')
      try {
        const ytTracks = await searchYouTubeFallback(query)
        if (ytTracks.length) {
          const result = { tracks: ytTracks, artists: [], albums: [], source: 'youtube' }
          searchCache.set(cacheKey, { data: result, expiry: Date.now() + SEARCH_TTL })
          maybePrune()
          return NextResponse.json(result, {
            headers: { 'X-Cache': 'MISS', 'X-Source': 'youtube-fallback' },
          })
        }
      } catch (ytErr) {
        console.error('[Search API] YouTube fallback failed', ytErr)
      }

      // 2) Try Deezer (no API key, always available)
      console.log('[Search API] YouTube unavailable — trying Deezer fallback')
      try {
        const dzRes = await fetch(
          `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=20&output=json`
        )
        if (dzRes.ok) {
          const dzData: { data?: { id: number; title: string; artist: { name: string }; album: { title: string; cover_big: string; cover_medium: string }; duration: number; preview: string }[] } = await dzRes.json()
          const dzTracks: Track[] = (dzData.data ?? []).map(t => ({
            id:            String(t.id),
            title:         t.title,
            artist:        t.artist.name,
            album:         t.album.title,
            albumArt:      t.album.cover_big ?? t.album.cover_medium,
            duration:      t.duration,
            spotifyId:     String(t.id),
            youtubeVideoId: null,
            previewUrl:    t.preview ?? null,
          }))
          if (dzTracks.length) {
            const result = { tracks: dzTracks, artists: [], albums: [], source: 'deezer' }
            searchCache.set(cacheKey, { data: result, expiry: Date.now() + SEARCH_TTL })
            maybePrune()
            return NextResponse.json(result, {
              headers: { 'X-Cache': 'MISS', 'X-Source': 'deezer-fallback' },
            })
          }
        }
      } catch (dzErr) {
        console.error('[Search API] Deezer fallback failed', dzErr)
      }

      return NextResponse.json(
        { error: 'rate_limited', tracks: [], artists: [], albums: [] },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
