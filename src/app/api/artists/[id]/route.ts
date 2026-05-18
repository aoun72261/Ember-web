import { NextResponse } from 'next/server'
import { getArtist, searchSpotify } from '@/lib/spotify/client'
import { transformArtist, transformTrack } from '@/lib/spotify/transform'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Fetch artist profile — always available
    const artist = await getArtist(id)

    // Top tracks: try the dedicated endpoint, fall back to artist name search
    // (top-tracks and related-artists are 403 for unverified Spotify apps)
    let topTracks: ReturnType<typeof transformTrack>[] = []
    try {
      const { tracks } = await import('@/lib/spotify/client').then(m =>
        m.getArtistTopTracks(id)
      )
      topTracks = tracks.map(transformTrack)
    } catch {
      // Fallback: search for this artist's songs
      try {
        const results = await searchSpotify(`artist:${artist.name}`, ['track'])
        topTracks = (results.tracks?.items ?? []).map(transformTrack)
      } catch {
        topTracks = []
      }
    }

    // Related artists: try dedicated endpoint, fall back to multi-strategy search
    let relatedArtists: ReturnType<typeof transformArtist>[] = []
    try {
      const { artists } = await import('@/lib/spotify/client').then(m =>
        m.getRelatedArtists(id)
      )
      relatedArtists = artists.slice(0, 10).map(transformArtist)
    } catch {
      // Fallback strategy 1: genre search (works when artist has genres)
      try {
        const genre = artist.genres[0]
        if (genre) {
          const results = await searchSpotify(`genre:"${genre}"`, ['artist'])
          relatedArtists = (results.artists?.items ?? [])
            .filter(a => a.id !== id)
            .slice(0, 8)
            .map(transformArtist)
        }
      } catch { /* continue to strategy 2 */ }

      // Fallback strategy 2: search tracks by this artist, pull their collaborators/similar artists
      if (relatedArtists.length === 0) {
        try {
          const results = await searchSpotify(`artist:${artist.name}`, ['track'])
          const artistIds = new Set<string>()
          const candidates: ReturnType<typeof transformArtist>[] = [];
          (results.tracks?.items ?? []).forEach(track => {
            track.artists.forEach(a => {
              if (a.id !== id && !artistIds.has(a.id)) {
                artistIds.add(a.id)
                candidates.push({ id: a.id, name: a.name, spotifyId: a.id, image: '', genres: [] })
              }
            })
          })
          relatedArtists = candidates.slice(0, 8)
        } catch {
          relatedArtists = []
        }
      }
    }

    return NextResponse.json({
      artist: transformArtist(artist),
      topTracks,
      relatedArtists,
    })
  } catch (error) {
    console.error('[Artist API]', error)
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
  }
}
