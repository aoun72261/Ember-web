import { NextRequest, NextResponse } from 'next/server'
import { searchSpotify } from '@/lib/spotify/client'
import { transformTrack } from '@/lib/spotify/transform'
import type { Track } from '@/types/index'

export const dynamic = 'force-dynamic'

const GENRE_QUERIES: Record<string, string[]> = {
  'pop':         ['genre:"pop" year:2024-2025', 'genre:"pop" year:2022-2023', 'pop hits 2024', 'top pop songs 2025'],
  'hip-hop':     ['genre:"hip hop" year:2024-2025', 'genre:"rap" year:2024', 'hip hop hits 2024', 'genre:"trap" year:2024'],
  'rnb':         ['genre:"r&b" year:2024-2025', 'genre:"soul" year:2024', 'r&b hits 2024', 'genre:"neo soul"'],
  'rock':        ['genre:"rock" year:2024-2025', 'genre:"alternative rock"', 'genre:"indie rock" year:2024', 'rock hits 2024'],
  'electronic':  ['genre:"electronic" year:2024-2025', 'genre:"edm" year:2024', 'genre:"dance" year:2024', 'electronic hits 2024'],
  'indie':       ['genre:"indie pop" year:2024-2025', 'genre:"indie rock" year:2024', 'indie hits 2024', 'genre:"indie folk"'],
  'latin':       ['genre:"latin" year:2024-2025', 'genre:"reggaeton" year:2024', 'latin hits 2024', 'genre:"latin pop"'],
  'desi':        ['genre:"desi pop" year:2024-2025', 'genre:"bollywood" year:2024', 'hindi hits 2024', 'genre:"punjabi" year:2024'],
  'punjabi':     ['genre:"punjabi" year:2024-2025', 'punjabi hits 2024', 'genre:"bhangra"', 'punjabi songs 2025'],
  'kpop':        ['genre:"k-pop" year:2024-2025', 'kpop hits 2024', 'genre:"korean pop"', 'kpop 2025'],
  'afrobeats':   ['genre:"afrobeats" year:2024-2025', 'genre:"amapiano" year:2024', 'afrobeats hits 2024', 'genre:"afropop"'],
  'jazz':        ['genre:"jazz" year:2024-2025', 'genre:"contemporary jazz"', 'jazz hits 2024', 'genre:"smooth jazz"'],
  'classical':   ['genre:"classical" orchestra', 'genre:"classical" piano', 'classical music hits', 'genre:"chamber music"'],
  'country':     ['genre:"country" year:2024-2025', 'genre:"country pop" year:2024', 'country hits 2024', 'genre:"country rock"'],
  'metal':       ['genre:"metal" year:2024-2025', 'genre:"heavy metal"', 'genre:"alt metal"', 'metal hits 2024'],
  'soul':        ['genre:"soul" year:2024-2025', 'genre:"funk" year:2024', 'soul hits 2024', 'genre:"neo soul" year:2024'],
  'folk':        ['genre:"folk" year:2024-2025', 'genre:"folk pop"', 'acoustic folk 2024', 'genre:"indie folk" year:2024'],
  'workout':     ['workout music 2024', 'gym hits 2024', 'genre:"workout" motivation', 'high energy workout songs'],
  'chill':       ['genre:"chill" year:2024-2025', 'chill vibes 2024', 'genre:"lo-fi"', 'relaxing chill songs 2024'],
  'party':       ['party hits 2024', 'genre:"dance pop" year:2024', 'party anthems 2025', 'genre:"edm" party'],
  'focus':       ['focus music study', 'genre:"ambient" study', 'concentration music', 'deep focus instrumental'],
  'romance':     ['love songs 2024', 'genre:"romance"', 'romantic hits 2024', 'love ballads 2025'],
  'decades-90s': ['90s hits best of', 'genre:"pop" year:1990-1999', '90s classic songs', 'best 90s music'],
  'decades-00s': ['2000s hits best of', 'genre:"pop" year:2000-2009', '2000s classic songs', 'y2k music hits'],
  'decades-10s': ['2010s hits best of', 'genre:"pop" year:2010-2019', '2010s top songs', 'decade 2010s music'],
}

// Deezer search queries — free API, no key needed, great metadata
const GENRE_DEEZER_QUERIES: Record<string, string[]> = {
  'pop':         ['artist:"Taylor Swift"', 'artist:"Dua Lipa"', 'artist:"Harry Styles"'],
  'hip-hop':     ['artist:"Drake"', 'artist:"Kendrick Lamar"', 'artist:"Travis Scott"'],
  'rnb':         ['artist:"SZA"', 'artist:"The Weeknd"', 'artist:"Bryson Tiller"'],
  'rock':        ['artist:"Arctic Monkeys"', 'artist:"Imagine Dragons"', 'artist:"Twenty One Pilots"'],
  'electronic':  ['artist:"Calvin Harris"', 'artist:"Martin Garrix"', 'artist:"Marshmello"'],
  'indie':       ['artist:"Hozier"', 'artist:"Phoebe Bridgers"', 'artist:"Mitski"'],
  'latin':       ['artist:"Bad Bunny"', 'artist:"J Balvin"', 'artist:"Karol G"'],
  'desi':        ['artist:"Arijit Singh"', 'artist:"AP Dhillon"', 'artist:"Atif Aslam"'],
  'punjabi':     ['artist:"AP Dhillon"', 'artist:"Sidhu Moosewala"', 'artist:"Diljit Dosanjh"'],
  'kpop':        ['artist:"BTS"', 'artist:"BLACKPINK"', 'artist:"NewJeans"'],
  'afrobeats':   ['artist:"Burna Boy"', 'artist:"Wizkid"', 'artist:"Davido"'],
  'jazz':        ['artist:"Norah Jones"', 'artist:"Jamie Cullum"', 'artist:"Diana Krall"'],
  'classical':   ['artist:"Yo-Yo Ma"', 'artist:"Lang Lang"', 'artist:"Ludovico Einaudi"'],
  'country':     ['artist:"Morgan Wallen"', 'artist:"Luke Combs"', 'artist:"Zach Bryan"'],
  'metal':       ['artist:"Metallica"', 'artist:"Tool"', 'artist:"Bring Me The Horizon"'],
  'soul':        ['artist:"Bruno Mars"', 'artist:"Lizzo"', 'artist:"Anderson .Paak"'],
  'folk':        ['artist:"Mumford and Sons"', 'artist:"The Lumineers"', 'artist:"Fleet Foxes"'],
  'workout':     ['artist:"Eminem"', 'artist:"Jay-Z"', 'artist:"Kanye West"'],
  'chill':       ['artist:"Frank Ocean"', 'artist:"Daniel Caesar"', 'artist:"Rex Orange County"'],
  'party':       ['artist:"Dua Lipa"', 'artist:"Harry Styles"', 'artist:"Lizzo"'],
  'focus':       ['artist:"Hans Zimmer"', 'artist:"Brian Eno"', 'artist:"Max Richter"'],
  'romance':     ['artist:"Ed Sheeran"', 'artist:"John Legend"', 'artist:"Adele"'],
  'decades-90s': ['artist:"Backstreet Boys"', 'artist:"TLC"', 'artist:"Spice Girls"'],
  'decades-00s': ['artist:"Eminem"', 'artist:"Beyonce"', 'artist:"Nelly"'],
  'decades-10s': ['artist:"Adele"', 'artist:"Ed Sheeran"', 'artist:"Katy Perry"'],
}

// ── Per-slug cache ───────────────────────────────────────────
const genreCache: Record<string, { tracks: Track[]; expiry: number }> = {}
const GENRE_TTL       = 2  * 60 * 60 * 1000  // 2h  (Spotify)
const GENRE_FALLBACK_TTL = 6 * 60 * 60 * 1000 // 6h  (Deezer)

// ── Deezer fallback ──────────────────────────────────────────
interface DeezerTrack {
  id: number
  title: string
  artist: { name: string }
  album: { title: string; cover_medium: string; cover_big: string }
  duration: number
  preview: string
}

async function fetchDeezerTracks(queries: string[]): Promise<Track[]> {
  const results = await Promise.allSettled(
    queries.map(async q => {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=15&output=json`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) return []
      const data: { data?: DeezerTrack[] } = await res.json()
      return data.data ?? []
    })
  )

  const seen = new Set<number>()
  const tracks: Track[] = []

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const t of r.value) {
      if (!t.id || seen.has(t.id)) continue
      seen.add(t.id)
      tracks.push({
        id:           String(t.id),
        title:        t.title,
        artist:       t.artist.name,
        album:        t.album.title,
        albumArt:     t.album.cover_big ?? t.album.cover_medium,
        duration:     t.duration,
        spotifyId:    String(t.id),   // Deezer ID used as lookup key for YouTube cache
        youtubeVideoId: null,         // looked up on-demand when user plays
        previewUrl:   t.preview ?? null,
      })
    }
  }

  return tracks
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') ?? ''
  const queries = GENRE_QUERIES[slug]
  if (!queries) return NextResponse.json({ tracks: [] })

  // Serve from cache if fresh
  const cached = genreCache[slug]
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json({ tracks: [...cached.tracks].sort(() => Math.random() - 0.5) })
  }

  // ── Try Spotify first ────────────────────────────────────────
  let spotifyBlocked = false
  const results = await Promise.allSettled(
    queries.map(q => searchSpotify(q, ['track']))
  )

  const seen = new Set<string>()
  const tracks: Track[] = []

  for (const res of results) {
    if (res.status === 'fulfilled') {
      for (const t of res.value.tracks?.items ?? []) {
        if (!seen.has(t.id)) { seen.add(t.id); tracks.push(transformTrack(t)) }
      }
    } else if (res.reason instanceof Error && res.reason.message.includes('429')) {
      spotifyBlocked = true
    }
  }

  // ── Deezer fallback if Spotify is blocked or returned nothing ─
  if (spotifyBlocked || tracks.length === 0) {
    console.log(`[Genre API] Spotify unavailable for "${slug}" — falling back to Deezer`)
    const deezerQueries = GENRE_DEEZER_QUERIES[slug] ?? [`${slug} music`]
    const deezerTracks = await fetchDeezerTracks(deezerQueries)

    if (deezerTracks.length > 0) {
      genreCache[slug] = { tracks: deezerTracks, expiry: Date.now() + GENRE_FALLBACK_TTL }
      return NextResponse.json({
        tracks: [...deezerTracks].sort(() => Math.random() - 0.5),
        source: 'deezer',
      })
    }
  }

  if (tracks.length > 0) {
    genreCache[slug] = { tracks, expiry: Date.now() + GENRE_TTL }
  }

  return NextResponse.json({ tracks: [...tracks].sort(() => Math.random() - 0.5) })
}
