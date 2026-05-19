import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum } from './client'
import type { Track, Artist, Album } from '@/types/index'

export function transformTrack(t: SpotifyTrack): Track {
  return {
    id: t.id,
    title: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    album: t.album.name,
    albumArt: t.album.images[0]?.url ?? '',
    duration: t.duration_ms,
    spotifyId: t.id,
    youtubeVideoId: null,
    previewUrl: t.preview_url,
    artistId: t.artists[0]?.id,
  }
}

export function transformArtist(a: SpotifyArtist): Artist {
  return {
    id: a.id,
    name: a.name,
    image: a.images[0]?.url ?? '',
    genres: a.genres ?? [],
    spotifyId: a.id,
    popularity: a.popularity,
    followers: (a as any).followers?.total ?? 0,
  }
}

export function transformAlbum(a: SpotifyAlbum): Album {
  return {
    id: a.id,
    title: a.name,
    artist: a.artists.map(ar => ar.name).join(', '),
    albumArt: a.images[0]?.url ?? '',
    releaseDate: a.release_date,
    tracks: a.tracks?.items.map(transformTrack) ?? [],
    spotifyId: a.id,
  }
}
