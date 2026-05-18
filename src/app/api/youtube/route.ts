import { NextResponse } from 'next/server'
import { getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const spotifyTrackId = searchParams.get('trackId')
  const trackTitle = searchParams.get('title')
  const artist = searchParams.get('artist')

  if (!spotifyTrackId || !trackTitle || !artist) {
    return NextResponse.json(
      { error: 'trackId, title, and artist are required' },
      { status: 400 }
    )
  }

  try {
    const videoId = await getYouTubeVideoId(spotifyTrackId, trackTitle, artist)

    if (!videoId) {
      return NextResponse.json({ error: 'No YouTube video found' }, { status: 404 })
    }

    return NextResponse.json({
      videoId,
      embedUrl: getYouTubeEmbedUrl(videoId),
    })
  } catch (error) {
    console.error('[YouTube API]', error)
    return NextResponse.json({ error: 'YouTube lookup failed' }, { status: 500 })
  }
}
