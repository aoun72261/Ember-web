const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

interface TokenCache {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`Spotify token error: ${response.status}`)
  }

  const data = await response.json()

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return tokenCache.accessToken
}

async function spotifyFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const token = await getAccessToken()

  const qs = params
    ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString()
    : ''

  const fullUrl = `${SPOTIFY_API_BASE}${endpoint}${qs}`

  const response = await fetch(fullUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Spotify API error: ${response.status} ${endpoint} — ${body}`)
  }

  return response.json()
}

// ── Search ──────────────────────────────────────────────────

// NOTE: limit param omitted — Spotify rejects it for unverified apps (quota extension required)
// Default returns 20 results per type which is sufficient for now
export async function searchSpotify(query: string, types: string[] = ['track', 'artist', 'album'], offset = 0) {
  const params: Record<string, string> = { q: query, type: types.join(',') }
  if (offset > 0) params.offset = String(offset)
  return spotifyFetch<SpotifySearchResponse>('/search', params)
}

// ── Tracks ──────────────────────────────────────────────────

export async function getTrack(trackId: string) {
  return spotifyFetch<SpotifyTrack>(`/tracks/${trackId}`, { market: 'US' })
}

export async function getSeveralTracks(trackIds: string[]) {
  return spotifyFetch<{ tracks: SpotifyTrack[] }>('/tracks', {
    ids: trackIds.join(','),
    market: 'US',
  })
}

// ── Artists ─────────────────────────────────────────────────

export async function getArtist(artistId: string) {
  return spotifyFetch<SpotifyArtist>(`/artists/${artistId}`)
}

export async function getArtistTopTracks(artistId: string) {
  return spotifyFetch<{ tracks: SpotifyTrack[] }>(`/artists/${artistId}/top-tracks`, { market: 'US' })
}

export async function getRelatedArtists(artistId: string) {
  return spotifyFetch<{ artists: SpotifyArtist[] }>(`/artists/${artistId}/related-artists`)
}

// ── Albums ──────────────────────────────────────────────────

export async function getAlbum(albumId: string) {
  return spotifyFetch<SpotifyAlbum>(`/albums/${albumId}`, { market: 'US' })
}

// ── Recommendations ─────────────────────────────────────────

export async function getRecommendations(opts: {
  seedTracks?: string[]
  seedArtists?: string[]
  seedGenres?: string[]
  limit?: number
}) {
  const params: Record<string, string> = {
    limit: String(opts.limit ?? 20),
    market: 'US',
  }

  if (opts.seedTracks?.length) params.seed_tracks = opts.seedTracks.slice(0, 5).join(',')
  if (opts.seedArtists?.length) params.seed_artists = opts.seedArtists.slice(0, 5).join(',')
  if (opts.seedGenres?.length) params.seed_genres = opts.seedGenres.slice(0, 5).join(',')

  return spotifyFetch<{ tracks: SpotifyTrack[] }>('/recommendations', params)
}

// ── New Releases ─────────────────────────────────────────────

export async function getNewReleases(limit = 20) {
  return spotifyFetch<{ albums: { items: SpotifyAlbum[] } }>('/browse/new-releases', {
    limit: String(limit),
    country: 'US',
  })
}

// ── Spotify Types ────────────────────────────────────────────

export interface SpotifyImage {
  url: string
  width: number
  height: number
}

export interface SpotifyArtist {
  id: string
  name: string
  images: SpotifyImage[]
  genres: string[]
  popularity: number
  external_urls: { spotify: string }
}

export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  popularity: number
  preview_url: string | null
  explicit: boolean
  artists: Pick<SpotifyArtist, 'id' | 'name' | 'external_urls'>[]
  album: {
    id: string
    name: string
    images: SpotifyImage[]
    release_date: string
  }
  external_urls: { spotify: string }
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: SpotifyImage[]
  release_date: string
  total_tracks: number
  artists: Pick<SpotifyArtist, 'id' | 'name' | 'external_urls'>[]
  tracks?: { items: SpotifyTrack[] }
  external_urls: { spotify: string }
}

export interface SpotifySearchResponse {
  tracks?: { items: SpotifyTrack[] }
  artists?: { items: SpotifyArtist[] }
  albums?: { items: SpotifyAlbum[] }
}
