'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import TrackCard from '@/components/TrackCard'
import type { Track } from '@/types/index'

interface GenreMeta {
  label: string
  color: string
  textColor?: string
  subGenres: { label: string; slug: string }[]
}

const GENRE_META: Record<string, GenreMeta> = {
  'pop':         { label: 'Pop', color: '#1D63A0', subGenres: [{ label: 'Dance Pop', slug: 'electronic' }, { label: 'Indie Pop', slug: 'indie' }, { label: 'K-Pop', slug: 'kpop' }, { label: 'Latin Pop', slug: 'latin' }] },
  'hip-hop':     { label: 'Hip-Hop', color: '#4C1D95', subGenres: [{ label: 'Trap', slug: 'hip-hop' }, { label: 'Drill', slug: 'hip-hop' }, { label: 'R&B', slug: 'rnb' }, { label: 'Afrobeats', slug: 'afrobeats' }] },
  'rnb':         { label: 'R&B', color: '#92400E', subGenres: [{ label: 'Soul', slug: 'soul' }, { label: 'Neo Soul', slug: 'soul' }, { label: 'Hip-Hop', slug: 'hip-hop' }, { label: 'Pop', slug: 'pop' }] },
  'rock':        { label: 'Rock', color: '#7F1D1D', subGenres: [{ label: 'Indie Rock', slug: 'indie' }, { label: 'Metal', slug: 'metal' }, { label: 'Alternative', slug: 'rock' }, { label: 'Folk', slug: 'folk' }] },
  'electronic':  { label: 'Electronic', color: '#1E3A5F', subGenres: [{ label: 'EDM', slug: 'electronic' }, { label: 'Dance Pop', slug: 'pop' }, { label: 'Party', slug: 'party' }, { label: 'Chill', slug: 'chill' }] },
  'indie':       { label: 'Indie', color: '#1F2937', subGenres: [{ label: 'Indie Rock', slug: 'rock' }, { label: 'Indie Pop', slug: 'pop' }, { label: 'Folk', slug: 'folk' }, { label: 'Alternative', slug: 'rock' }] },
  'latin':       { label: 'Latin', color: '#064E3B', subGenres: [{ label: 'Reggaeton', slug: 'latin' }, { label: 'Salsa', slug: 'latin' }, { label: 'Latin Pop', slug: 'pop' }, { label: 'Afrobeats', slug: 'afrobeats' }] },
  'desi':        { label: 'Desi', color: '#7C2D12', subGenres: [{ label: 'Punjabi', slug: 'punjabi' }, { label: 'Bollywood', slug: 'desi' }, { label: 'Indie Urdu', slug: 'desi' }, { label: 'Coke Studio', slug: 'desi' }] },
  'punjabi':     { label: 'Punjabi', color: '#78350F', subGenres: [{ label: 'Desi', slug: 'desi' }, { label: 'Bhangra', slug: 'punjabi' }, { label: 'Hip-Hop', slug: 'hip-hop' }, { label: 'Pop', slug: 'pop' }] },
  'kpop':        { label: 'K-Pop', color: '#831843', subGenres: [{ label: 'Pop', slug: 'pop' }, { label: 'Electronic', slug: 'electronic' }, { label: 'Hip-Hop', slug: 'hip-hop' }, { label: 'Indie', slug: 'indie' }] },
  'afrobeats':   { label: 'Afrobeats', color: '#7C2D12', subGenres: [{ label: 'Amapiano', slug: 'afrobeats' }, { label: 'Afropop', slug: 'afrobeats' }, { label: 'Latin', slug: 'latin' }, { label: 'R&B', slug: 'rnb' }] },
  'jazz':        { label: 'Jazz', color: '#064E3B', subGenres: [{ label: 'Soul', slug: 'soul' }, { label: 'Classical', slug: 'classical' }, { label: 'Chill', slug: 'chill' }, { label: 'Focus', slug: 'focus' }] },
  'classical':   { label: 'Classical', color: '#1E1B4B', subGenres: [{ label: 'Jazz', slug: 'jazz' }, { label: 'Focus', slug: 'focus' }, { label: 'Chill', slug: 'chill' }, { label: 'Folk', slug: 'folk' }] },
  'country':     { label: 'Country', color: '#78350F', subGenres: [{ label: 'Folk', slug: 'folk' }, { label: 'Rock', slug: 'rock' }, { label: 'Pop', slug: 'pop' }, { label: 'Soul', slug: 'soul' }] },
  'metal':       { label: 'Metal', color: '#1F2937', subGenres: [{ label: 'Rock', slug: 'rock' }, { label: 'Indie', slug: 'indie' }, { label: 'Electronic', slug: 'electronic' }, { label: 'Alt', slug: 'rock' }] },
  'soul':        { label: 'Soul', color: '#7F1D1D', subGenres: [{ label: 'R&B', slug: 'rnb' }, { label: 'Funk', slug: 'soul' }, { label: 'Jazz', slug: 'jazz' }, { label: 'Gospel', slug: 'soul' }] },
  'folk':        { label: 'Folk & Acoustic', color: '#1A2E1A', subGenres: [{ label: 'Indie Folk', slug: 'indie' }, { label: 'Country', slug: 'country' }, { label: 'Classical', slug: 'classical' }, { label: 'Chill', slug: 'chill' }] },
  'workout':     { label: 'Workout', color: '#7C3AED', subGenres: [{ label: 'Hip-Hop', slug: 'hip-hop' }, { label: 'Electronic', slug: 'electronic' }, { label: 'Rock', slug: 'rock' }, { label: 'Pop', slug: 'pop' }] },
  'chill':       { label: 'Chill', color: '#0C4A6E', subGenres: [{ label: 'Lo-Fi', slug: 'chill' }, { label: 'Jazz', slug: 'jazz' }, { label: 'Indie', slug: 'indie' }, { label: 'Focus', slug: 'focus' }] },
  'party':       { label: 'Party', color: '#4A1D96', subGenres: [{ label: 'Dance', slug: 'electronic' }, { label: 'Pop', slug: 'pop' }, { label: 'Hip-Hop', slug: 'hip-hop' }, { label: 'Latin', slug: 'latin' }] },
  'focus':       { label: 'Focus', color: '#0F2027', subGenres: [{ label: 'Classical', slug: 'classical' }, { label: 'Ambient', slug: 'chill' }, { label: 'Jazz', slug: 'jazz' }, { label: 'Lo-Fi', slug: 'chill' }] },
  'romance':     { label: 'Romance', color: '#831843', subGenres: [{ label: 'R&B', slug: 'rnb' }, { label: 'Pop', slug: 'pop' }, { label: 'Soul', slug: 'soul' }, { label: 'Indie', slug: 'indie' }] },
  'decades-90s': { label: '90s', color: '#78350F', subGenres: [{ label: '2000s', slug: 'decades-00s' }, { label: '2010s', slug: 'decades-10s' }, { label: 'Pop', slug: 'pop' }, { label: 'Rock', slug: 'rock' }] },
  'decades-00s': { label: '2000s', color: '#1E3A5F', subGenres: [{ label: '90s', slug: 'decades-90s' }, { label: '2010s', slug: 'decades-10s' }, { label: 'Pop', slug: 'pop' }, { label: 'Hip-Hop', slug: 'hip-hop' }] },
  'decades-10s': { label: '2010s', color: '#1A1A2E', subGenres: [{ label: '90s', slug: 'decades-90s' }, { label: '2000s', slug: 'decades-00s' }, { label: 'Pop', slug: 'pop' }, { label: 'Hip-Hop', slug: 'hip-hop' }] },
}

export default function GenrePage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { playTrack } = usePlayerStore()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  const meta = GENRE_META[slug] ?? { label: slug, color: '#1a1a1a', subGenres: [] }

  useEffect(() => {
    setLoading(true)
    setTracks([])
    fetch(`/api/genre?slug=${slug}`)
      .then(r => r.json())
      .then(d => setTracks(d.tracks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const heroTrack = tracks[0] ?? null

  return (
    <div className="min-h-full pb-32">
      {/* ── Hero header ───────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
        {/* Blurred album art bg */}
        {heroTrack?.albumArt && (
          <div className="absolute inset-[-40px]"
            style={{ backgroundImage: `url(${heroTrack.albumArt})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(60px)', opacity: 0.25 }} />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${meta.color}CC 0%, ${meta.color}44 60%, transparent 100%)` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]" />

        <div className="relative z-10 px-8 pt-8 pb-6">
          {/* Back button */}
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>

          <div className="flex items-end gap-6">
            {/* Album art collage */}
            <div className="relative w-[160px] h-[160px] flex-shrink-0">
              {tracks.slice(0, 4).map((t, i) => (
                <div key={t.id} className="absolute w-[72px] h-[72px] rounded-xl overflow-hidden shadow-xl"
                  style={{
                    top: i < 2 ? 0 : 'auto', bottom: i >= 2 ? 0 : 'auto',
                    left: i % 2 === 0 ? 0 : 'auto', right: i % 2 === 1 ? 0 : 'auto',
                    transform: `rotate(${[-4, 3, 3, -4][i]}deg)`,
                  }}>
                  {t.albumArt && <Image src={t.albumArt} alt="" fill className="object-cover" sizes="72px" />}
                </div>
              ))}
            </div>

            {/* Title + meta */}
            <div>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-[0.18em] mb-2">Genre</p>
              <h1 className="text-[52px] font-black text-white leading-none tracking-tight mb-3">{meta.label}</h1>
              <p className="text-[13px] text-white/50">{loading ? 'Loading songs…' : `${tracks.length} songs`}</p>
            </div>
          </div>

          {/* Play all button */}
          {tracks.length > 0 && (
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => playTrack(tracks[0], tracks)}
                className="flex items-center gap-2.5 bg-[#4A7FFF] hover:bg-[#6690FF] text-white text-[13px] font-bold px-6 py-2.5 rounded-full transition-all hover:scale-[1.02] shadow-lg shadow-[#4A7FFF]/30"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 1 }}>
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Play all
              </button>
              <button
                onClick={() => { const shuffled = [...tracks].sort(() => Math.random() - 0.5); playTrack(shuffled[0], shuffled) }}
                className="flex items-center gap-2 text-[13px] font-semibold text-white/70 hover:text-white px-4 py-2.5 rounded-full border border-white/15 hover:border-white/30 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
                Shuffle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Sub-genre pills ───────────────────────────── */}
      {meta.subGenres.length > 0 && (
        <div className="px-8 py-4 flex gap-2 flex-wrap">
          {meta.subGenres.map(sg => (
            <button
              key={sg.slug + sg.label}
              onClick={() => router.push(`/genre/${sg.slug}`)}
              className="px-4 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.13] text-[12px] font-semibold text-white/70 hover:text-white transition-all border border-white/[0.06] hover:border-white/[0.15]"
            >
              {sg.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Track list ─────────────────────────────────── */}
      <div className="px-5 mt-2">
        {loading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" style={{ animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-[16px] font-bold text-white/60">No tracks found</p>
            <p className="text-[13px] text-white/30">Try a different genre</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {tracks.map((track, i) => (
              <TrackCard key={track.id} track={track} queue={tracks} index={i} showIndex />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
