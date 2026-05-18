export interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArt: string
  duration: number
  spotifyId: string
  youtubeVideoId: string | null
  previewUrl: string | null
  artistId?: string
}

export interface Artist {
  id: string
  name: string
  image: string
  genres: string[]
  spotifyId: string
  popularity?: number
}

export interface Album {
  id: string
  title: string
  artist: string
  albumArt: string
  releaseDate: string
  tracks: Track[]
  spotifyId: string
}

export interface Playlist {
  id: string
  name: string
  description: string
  coverArt: string | null
  tracks: Track[]
  isPublic: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  bio: string | null
  isPublic: boolean
  createdAt: string
}

export interface SearchResults {
  tracks: Track[]
  artists: Artist[]
  albums: Album[]
}

export type Mood = 'chill' | 'sad' | 'angry' | 'hyped' | 'focus' | 'happy' | 'romantic'

export interface MoodPlaylist {
  mood: Mood
  tracks: Track[]
}

export interface ListeningHistory {
  trackId: string
  track: Track
  playedAt: string
  userId: string
}

export interface MusicJournalEntry {
  id: string
  trackId: string
  track: Track
  note: string
  userId: string
  createdAt: string
}
