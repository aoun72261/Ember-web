import { NextRequest, NextResponse } from 'next/server'
import { searchSpotify } from '@/lib/spotify/client'
import { transformTrack } from '@/lib/spotify/transform'

// 4 queries per mood — Spotify returns ~20 per query → up to 80 raw, ~40-50 unique after dedup
const MOOD_QUERIES: Record<string, string[]> = {
  happy:    ['happy feel good pop', 'upbeat summer pop hits', 'feel good dance pop', 'positive vibes pop'],
  sad:      ['sad heartbreak ballad', 'melancholy indie acoustic', 'sad love songs', 'emotional breakup songs'],
  chill:    ['chill vibes lo-fi', 'mellow acoustic relax', 'chill indie pop', 'laid back beats'],
  energetic:['workout pump energy', 'high energy electronic', 'intense workout music', 'power gym hits'],
  focus:    ['study instrumental focus', 'concentration piano ambient', 'focus work music', 'productivity instrumental'],
  party:    ['party dance club hits', 'edm banger festival', 'dance hits remix', 'club night dance'],
  romance:  ['romantic love songs', 'slow dance soul r&b', 'love ballad romantic', 'sweet love pop'],
  sleep:    ['sleep calm ambient', 'peaceful night piano', 'relaxing sleep music', 'soft lullaby calm'],
}

// ── Per-mood cache (2-hour TTL) ──────────────────────────────
const moodCache: Record<string, { tracks: ReturnType<typeof transformTrack>[]; expiry: number }> = {}
const MOOD_TTL = 2 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const mood = request.nextUrl.searchParams.get('mood') ?? ''

  const queries = MOOD_QUERIES[mood]
  if (!queries) {
    return NextResponse.json({ error: 'Unknown mood' }, { status: 400 })
  }

  // Serve from cache if fresh (shuffled for variety)
  const cached = moodCache[mood]
  if (cached && Date.now() < cached.expiry) {
    const shuffled = [...cached.tracks].sort(() => Math.random() - 0.5)
    return NextResponse.json({ tracks: shuffled })
  }

  try {
    const results = await Promise.all(
      queries.map(q =>
        searchSpotify(q, ['track'])
          .then(d => d.tracks?.items ?? [])
          .catch(() => [])
      )
    )

    const seen = new Set<string>()
    const tracks = results.flat()
      .filter(t => {
        if (seen.has(t.id) || !t.album.images[0]) return false
        seen.add(t.id)
        return true
      })
      .map(transformTrack)
      .slice(0, 50)

    moodCache[mood] = { tracks, expiry: Date.now() + MOOD_TTL }

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error('[Mood API]', error)
    return NextResponse.json({ error: 'Failed to fetch mood tracks' }, { status: 500 })
  }
}
