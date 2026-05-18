'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TrackCard from '@/components/TrackCard'
import { usePlayerStore } from '@/store/playerStore'
import type { Track } from '@/types/index'

export default function LikedSongsPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const { playTrack } = usePlayerStore()

  useEffect(() => {
    fetch('/api/likes')
      .then(r => r.ok ? r.json() : { tracks: [] })
      .then(d => setTracks(d.tracks ?? []))
      .finally(() => setLoading(false))
  }, [])

  const playAll = () => { if (tracks.length > 0) playTrack(tracks[0], tracks) }

  return (
    <div className="min-h-full pb-32">
      {/* Hero */}
      <div className="relative px-8 pt-10 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4B0082]/30 via-[#6A0DAD]/15 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-end gap-6">
          <div className="w-[160px] h-[160px] rounded-2xl flex-shrink-0 bg-gradient-to-br from-[#4B0082] to-[#6A0DAD] flex items-center justify-center shadow-2xl shadow-purple-900/40">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#8A8580] uppercase tracking-widest mb-2">Playlist</p>
            <h1 className="text-[40px] font-black text-white leading-none tracking-tight mb-3">Liked Songs</h1>
            <p className="text-[13px] text-[#4A4540]">{tracks.length} songs</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {tracks.length > 0 && (
        <div className="px-8 pb-6">
          <button
            onClick={playAll}
            className="w-12 h-12 rounded-full bg-[#4A7FFF] hover:bg-[#6690FF] flex items-center justify-center shadow-lg shadow-[#4A7FFF]/30 transition-all hover:scale-105 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: 2 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>
      )}

      {/* Track list */}
      <div className="px-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <p className="text-[15px] font-bold text-[#F0EBE5]">No liked songs yet</p>
            <p className="text-[13px] text-[#4A4540]">Tap the ♥ on any track to save it here.</p>
            <Link href="/search" className="text-[13px] font-bold text-[#4A7FFF] hover:text-[#93C5FD] transition-colors">
              Find music →
            </Link>
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
