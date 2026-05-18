import { NextRequest, NextResponse } from 'next/server'

export interface LyricLine {
  time: number // seconds
  text: string
}

export interface LyricsResponse {
  type: 'synced' | 'plain' | 'not_found'
  lines: LyricLine[]
}

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = []
  for (const raw of lrc.split('\n')) {
    const match = raw.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/)
    if (!match) continue
    const mins = parseInt(match[1])
    const secs = parseInt(match[2])
    const ms = parseInt(match[3].padEnd(3, '0'))
    const time = mins * 60 + secs + ms / 1000
    const text = match[4].trim()
    lines.push({ time, text })
  }
  return lines.sort((a, b) => a.time - b.time)
}

function plainToLines(plain: string): LyricLine[] {
  return plain
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('****'))
    .map((text, i) => ({ time: i, text }))
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? ''
  const artist = searchParams.get('artist') ?? ''
  const album = searchParams.get('album') ?? ''
  const duration = parseFloat(searchParams.get('duration') ?? '0')

  if (!title || !artist) {
    return NextResponse.json<LyricsResponse>({ type: 'not_found', lines: [] })
  }

  // 1. Try lrclib.net (free, timestamped LRC)
  try {
    const params = new URLSearchParams({ track_name: title, artist_name: artist })
    if (album) params.set('album_name', album)
    if (duration > 0) params.set('duration', String(Math.round(duration)))

    const res = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'Lrclib-Client': 'Ember/1.0 (https://ember.app)' },
      next: { revalidate: 86400 },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.syncedLyrics) {
        const lines = parseLRC(data.syncedLyrics).filter(l => l.text.length > 0)
        if (lines.length > 0) {
          return NextResponse.json<LyricsResponse>({ type: 'synced', lines })
        }
      }
      if (data.plainLyrics) {
        return NextResponse.json<LyricsResponse>({ type: 'plain', lines: plainToLines(data.plainLyrics) })
      }
    }
  } catch {
    // fall through
  }

  // 2. Try Musixmatch (if key configured)
  const mmKey = process.env.MUSIXMATCH_API_KEY
  if (mmKey && mmKey !== 'your_musixmatch_api_key') {
    try {
      const mmParams = new URLSearchParams({
        q_track: title,
        q_artist: artist,
        apikey: mmKey,
        format: 'json',
      })
      const res = await fetch(`https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?${mmParams}`, {
        next: { revalidate: 86400 },
      })
      if (res.ok) {
        const data = await res.json()
        const lyricsBody: string = data?.message?.body?.lyrics?.lyrics_body ?? ''
        if (lyricsBody.length > 10) {
          return NextResponse.json<LyricsResponse>({ type: 'plain', lines: plainToLines(lyricsBody) })
        }
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.json<LyricsResponse>({ type: 'not_found', lines: [] })
}
