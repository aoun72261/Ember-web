import { NextResponse } from 'next/server'
import { getArtist, getSeveralArtists, searchSpotify } from '@/lib/spotify/client'
import { transformArtist, transformTrack } from '@/lib/spotify/transform'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // ── 1. Main artist ──────────────────────────────────────────
    const artist = await getArtist(id)

    // If Spotify returned no images (some artists lack profile photos),
    // fall back to a search result which often has a picture
    if (!artist.images?.length) {
      try {
        const s = await searchSpotify(`artist:"${artist.name}"`, ['artist'])
        const match = (s.artists?.items ?? []).find(a => a.id === id || a.name.toLowerCase() === artist.name.toLowerCase())
        if (match?.images?.length) artist.images = match.images
      } catch { /* ignore */ }
    }

    // ── 2. Top tracks ───────────────────────────────────────────
    // Dedicated endpoint is 403 for unverified apps → fall back to search
    let topTracks: ReturnType<typeof transformTrack>[] = []
    try {
      const { tracks } = await import('@/lib/spotify/client').then(m =>
        m.getArtistTopTracks(id)
      )
      topTracks = tracks.map(transformTrack)
    } catch {
      try {
        const results = await searchSpotify(`artist:"${artist.name}"`, ['track'])
        topTracks = (results.tracks?.items ?? []).map(transformTrack)
      } catch {
        topTracks = []
      }
    }

    // ── 3. Related artists ──────────────────────────────────────
    let relatedArtists: ReturnType<typeof transformArtist>[] = []

    // Strategy A: dedicated endpoint (403 for dev apps, but try anyway)
    try {
      const { artists } = await import('@/lib/spotify/client').then(m =>
        m.getRelatedArtists(id)
      )
      relatedArtists = artists.slice(0, 10).map(transformArtist)
    } catch {
      // Strategy B: genre search — returns full artist objects with images
      try {
        const genre = artist.genres[0]
        if (genre) {
          const results = await searchSpotify(`genre:"${genre}"`, ['artist'])
          relatedArtists = (results.artists?.items ?? [])
            .filter(a => a.id !== id)
            .slice(0, 8)
            .map(transformArtist)
        }
      } catch { /* continue to C */ }

      // Strategy C: pull collaborator IDs from search tracks, then batch-fetch
      // full artist profiles so we get real images
      if (relatedArtists.length === 0) {
        try {
          const results = await searchSpotify(`artist:"${artist.name}"`, ['track'])
          const artistIds = new Set<string>()
          ;(results.tracks?.items ?? []).forEach(track => {
            track.artists.forEach(a => {
              if (a.id !== id && !artistIds.has(a.id)) artistIds.add(a.id)
            })
          })

          if (artistIds.size > 0) {
            // Batch-fetch so we get images, genres, popularity
            const { artists: fullArtists } = await getSeveralArtists([...artistIds])
            relatedArtists = fullArtists
              .filter(Boolean)          // Spotify returns null for missing IDs
              .slice(0, 8)
              .map(transformArtist)
          }
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
