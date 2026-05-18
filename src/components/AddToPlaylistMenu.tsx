'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import type { Track } from '@/types/index'

interface Playlist { id: string; name: string; cover_art: string | null }

interface Props {
  track: Track
  onClose: () => void
  align?: 'right' | 'left'
  openUp?: boolean
}

export default function AddToPlaylistMenu({ track, onClose, align = 'right', openUp = false }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/playlists')
      .then(r => r.ok ? r.json() : { playlists: [] })
      .then(d => setPlaylists(d.playlists ?? []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const add = async (playlistId: string) => {
    setAdding(playlistId)
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track }),
      })
      if (res.ok) { setAdded(playlistId); setTimeout(onClose, 800) }
    } finally { setAdding(null) }
  }

  const positionClass = [
    openUp ? 'bottom-full mb-2' : 'top-full mt-1',
    align === 'right' ? 'right-0' : 'left-0',
  ].join(' ')

  return (
    <div
      ref={ref}
      className={`absolute ${positionClass} z-50 w-52 bg-[#1C1814] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden`}
      onClick={e => e.stopPropagation()}
    >
      <p className="text-[10px] font-semibold text-[#4A4540] uppercase tracking-widest px-3 pt-3 pb-1.5">Add to playlist</p>
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-4 h-4 border-[1.5px] border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
        </div>
      )}
      {!loading && playlists.length === 0 && (
        <p className="text-[12px] text-[#4A4540] px-3 py-3">No playlists yet</p>
      )}
      {!loading && playlists.map(p => (
        <button
          key={p.id}
          onClick={() => add(p.id)}
          disabled={!!adding || added === p.id}
          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.06] transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 bg-white/[0.06] flex items-center justify-center">
            {p.cover_art
              ? <Image src={p.cover_art} alt={p.name} width={28} height={28} className="object-cover w-full h-full" />
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            }
          </div>
          <span className="text-[12px] text-[#E0DBD5] truncate flex-1">{p.name}</span>
          {added === p.id && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A7FFF" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          )}
          {adding === p.id && (
            <div className="w-3 h-3 border border-[#4A7FFF]/40 border-t-[#4A7FFF] rounded-full animate-spin" />
          )}
        </button>
      ))}
      <div className="border-t border-white/[0.06] mt-1" />
      <button
        onClick={onClose}
        className="w-full text-left px-3 py-2 text-[12px] text-[#4A4540] hover:text-[#8A8580] transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
