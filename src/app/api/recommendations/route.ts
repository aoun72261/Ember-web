import { NextResponse } from 'next/server'
import { getRecommendations } from '@/lib/spotify/client'
import { transformTrack } from '@/lib/spotify/transform'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seedTracks = searchParams.get('seed_tracks')?.split(',').filter(Boolean) ?? []
  const seedArtists = searchParams.get('seed_artists')?.split(',').filter(Boolean) ?? []
  const seedGenres = searchParams.get('seed_genres')?.split(',').filter(Boolean) ?? []
  const limit = Number(searchParams.get('limit') ?? 20)

  const totalSeeds = seedTracks.length + seedArtists.length + seedGenres.length
  if (totalSeeds === 0) {
    return NextResponse.json({ error: 'At least one seed (track, artist, or genre) is required' }, { status: 400 })
  }

  try {
    const data = await getRecommendations({ seedTracks, seedArtists, seedGenres, limit })
    return NextResponse.json({ tracks: data.tracks.map(transformTrack) })
  } catch (error) {
    console.error('[Recommendations API]', error)
    return NextResponse.json({ error: 'Recommendations failed' }, { status: 500 })
  }
}
