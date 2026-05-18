'use client'

import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import type { Track } from '@/types/index'

interface AlbumCardProps {
  title: string
  subtitle: string
  imageUrl: string
  tracks?: Track[]
  firstTrack?: Track
  round?: boolean   // for artist cards
  href?: string
}

export default function AlbumCard({ title, subtitle, imageUrl, tracks, firstTrack, round }: AlbumCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore()

  const trackToPlay = firstTrack ?? tracks?.[0]
  const isThisPlaying = currentTrack && tracks?.some(t => t.id === currentTrack.id) && isPlaying

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!trackToPlay) return
    if (isThisPlaying) {
      togglePlay()
    } else {
      playTrack(trackToPlay, tracks)
    }
  }

  return (
    <div className="group flex flex-col gap-3 cursor-pointer select-none">
      {/* Cover image */}
      <div className={`relative aspect-square overflow-hidden bg-[#1C1C1C] flex-shrink-0
        ${round ? 'rounded-full' : 'rounded-2xl'}
        shadow-md shadow-black/30 group-hover:shadow-xl group-hover:shadow-black/50 transition-shadow duration-300`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 150px, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2A2A2A" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}

        {/* Overlay + play button */}
        {trackToPlay && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end justify-end p-3">
            <button
              onClick={handlePlay}
              className="w-11 h-11 rounded-full bg-[#4A7FFF] flex items-center justify-center shadow-lg shadow-[#4A7FFF]/40
                         translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                         hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {isThisPlaying ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="3" width="5" height="18" rx="2" />
                  <rect x="14" y="3" width="5" height="18" rx="2" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 px-0.5">
        <p className="text-[13px] font-semibold text-[#F5F0EB] truncate leading-tight group-hover:text-[#4A7FFF] transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-[#4A4540] truncate mt-0.5 leading-tight">{subtitle}</p>
      </div>
    </div>
  )
}
