import { NextRequest, NextResponse } from 'next/server'
import { getArtist, getArtistTopTracks, getRelatedArtists } from '@/lib/spotify/client'
import { transformTrack, transformArtist } from '@/lib/spotify/transform'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const [artist, topTracksRes, relatedRes] = await Promise.all([
      getArtist(id),
      getArtistTopTracks(id),
      getRelatedArtists(id).catch(() => ({ artists: [] })),
    ])

    return NextResponse.json({
      artist: transformArtist(artist),
      topTracks: topTracksRes.tracks.slice(0, 10).map(transformTrack),
      related: relatedRes.artists.slice(0, 6).map(transformArtist),
      popularity: artist.popularity,
      genres: artist.genres,
    })
  } catch {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
  }
}
