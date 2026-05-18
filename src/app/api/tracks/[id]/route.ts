import { NextResponse } from 'next/server'
import { getTrack, getRecommendations } from '@/lib/spotify/client'
import { transformTrack } from '@/lib/spotify/transform'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const withRecommendations = searchParams.get('recommendations') === 'true'

  try {
    const track = await getTrack(id)
    const result: Record<string, unknown> = { track: transformTrack(track) }

    if (withRecommendations) {
      const recs = await getRecommendations({ seedTracks: [id], limit: 10 })
      result.recommendations = recs.tracks.map(transformTrack)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Track API]', error)
    return NextResponse.json({ error: 'Track not found' }, { status: 404 })
  }
}
