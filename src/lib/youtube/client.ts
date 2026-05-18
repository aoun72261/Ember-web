const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    channelTitle: string
    thumbnails: { medium: { url: string } }
  }
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[]
}

async function searchYouTube(query: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set')

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '10', // Music category
    maxResults: '5',
    key: apiKey,
  })

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`YouTube API error: ${response.status} — ${body}`)
  }

  const data: YouTubeSearchResponse = await response.json()

  if (!data.items || data.items.length === 0) return null

  // Prefer results with "official" or "audio" in the title
  const preferred = data.items.find(item => {
    const title = item.snippet.title.toLowerCase()
    return title.includes('official') || title.includes('audio') || title.includes('lyrics')
  })

  return (preferred ?? data.items[0]).id.videoId
}

// ── Public API ───────────────────────────────────────────────
// Always go through this — it handles caching automatically

export async function getYouTubeVideoId(
  spotifyTrackId: string,
  trackTitle: string,
  artist: string
): Promise<string | null> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Check cache first
  const { data: cached } = await supabase
    .from('youtube_cache')
    .select('youtube_video_id')
    .eq('spotify_track_id', spotifyTrackId)
    .single()

  if (cached?.youtube_video_id) {
    return cached.youtube_video_id
  }

  // Search YouTube — costs 100 quota units
  const query = `${trackTitle} ${artist} official audio`
  const videoId = await searchYouTube(query)

  if (videoId) {
    // Cache for future requests
    await supabase.from('youtube_cache').upsert({
      spotify_track_id: spotifyTrackId,
      youtube_video_id: videoId,
    })
  }

  return videoId
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&enablejsapi=1`
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}
