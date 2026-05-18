'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { formatDuration } from '@/lib/utils'
import type { Track } from '@/types/index'
import AddToPlaylistMenu from './AddToPlaylistMenu'

interface TrackCardProps {
  track: Track
  queue?: Track[]
  index?: number
  showIndex?: boolean
}

export default function TrackCard({ track, queue, index, showIndex }: TrackCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore()
  const isActive = currentTrack?.id === track.id
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const handlePlay = () => {
    if (isActive) togglePlay()
    else playTrack(track, queue ?? [track])
  }

  return (
    <div
      onClick={handlePlay}
      className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 select-none
        ${isActive ? 'bg-[#4A7FFF]/10' : 'hover:bg-white/[0.05]'}`}
    >
      {/* Index / play indicator */}
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        {isActive ? (
          isPlaying ? (
            <div className="playing-bars flex items-end gap-[2px] h-4 w-4">
              <span className="w-[3px] bg-[#4A7FFF] rounded-full" style={{ height: 4 }} />
              <span className="w-[3px] bg-[#4A7FFF] rounded-full" style={{ height: 10 }} />
              <span className="w-[3px] bg-[#4A7FFF] rounded-full" style={{ height: 6 }} />
            </div>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#4A7FFF">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )
        ) : (
          <>
            {showIndex && (
              <span className="text-[12px] tabular-nums text-[#4A4540] group-hover:hidden">{(index ?? 0) + 1}</span>
            )}
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="#8A8580"
              className={showIndex ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100 transition-opacity'}
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </>
        )}
      </div>

      {/* Art */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#1C1C1C]">
        {track.albumArt && (
          <Image src={track.albumArt} alt={track.album} fill className="object-cover" sizes="40px" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate leading-tight ${isActive ? 'text-[#4A7FFF]' : 'text-[#F5F0EB]'}`}>
          {track.title}
        </p>
        {track.artistId ? (
          <Link
            href={`/artist/${track.artistId}`}
            onClick={e => e.stopPropagation()}
            className="text-[11px] text-[#4A4540] hover:text-[#8A8580] truncate mt-0.5 block transition-colors"
          >
            {track.artist}
          </Link>
        ) : (
          <p className="text-[11px] text-[#4A4540] truncate mt-0.5">{track.artist}</p>
        )}
      </div>

      {/* Album */}
      <p className="text-[12px] text-[#4A4540] truncate hidden md:block w-36 text-right">{track.album}</p>

      {/* Duration */}
      <p className="text-[12px] tabular-nums text-[#4A4540] w-10 text-right flex-shrink-0">
        {formatDuration(track.duration / 1000)}
      </p>

      {/* Add to playlist button */}
      <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full border border-white/[0.18] hover:border-white/[0.5] flex items-center justify-center text-[#6A6560] hover:text-white transition-all"
          title="Add to playlist"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        {menuOpen && <AddToPlaylistMenu track={track} onClose={closeMenu} />}
      </div>
    </div>
  )
}
