'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { formatDuration } from '@/lib/utils'
import type { Track } from '@/types/index'

interface PlaylistDetail {
  id: string
  name: string
  description: string
  cover_art: string | null
  is_public: boolean
  created_at: string
}

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { playTrack } = usePlayerStore()

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [plRes, trRes] = await Promise.all([
        fetch('/api/playlists'),
        fetch(`/api/playlists/${id}/tracks`),
      ])
      if (plRes.ok) {
        const d = await plRes.json()
        const found = (d.playlists ?? []).find((p: PlaylistDetail) => p.id === id)
        setPlaylist(found ?? null)
      }
      if (trRes.ok) {
        const d = await trRes.json()
        setTracks(d.tracks ?? [])
      }
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const playAll = () => {
    if (tracks.length > 0) playTrack(tracks[0], tracks)
  }

  const removeTrack = async (spotifyId: string) => {
    setRemovingId(spotifyId)
    try {
      await fetch(`/api/playlists/${id}/tracks?trackId=${spotifyId}`, { method: 'DELETE' })
      setTracks(prev => prev.filter(t => t.spotifyId !== spotifyId))
    } finally { setRemovingId(null) }
  }

  const deletePlaylist = async () => {
    if (!confirm('Delete this playlist?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' })
      if (res.ok) router.push('/library')
    } finally { setDeleting(false) }
  }

  const handleDragStart = (i: number) => setDragIndex(i)
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    setDragOverIndex(i)
  }
  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return }
    const reordered = [...tracks]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(i, 0, moved)
    setTracks(reordered)
    setDragIndex(null)
    setDragOverIndex(null)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/playlists/${id}/tracks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: reordered.map(t => t.spotifyId) }),
      })
    }, 400)
  }
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null) }

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    try {
      const resized = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = ev => {
          const img = new window.Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 400; canvas.height = 400
            const ctx = canvas.getContext('2d')!
            const ratio = Math.max(400 / img.width, 400 / img.height)
            const w = img.width * ratio, h = img.height * ratio
            ctx.drawImage(img, (400 - w) / 2, (400 - h) / 2, w, h)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          }
          img.onerror = reject
          img.src = ev.target?.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch(`/api/playlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverArt: resized }),
      })
      if (res.ok) {
        const { playlist: updated } = await res.json()
        setPlaylist(updated)
      }
    } finally { setCoverUploading(false) }
  }

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
  const totalMin = Math.floor(totalDuration / 60000)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[#4A4540]">Playlist not found</p>
        <button onClick={() => router.push('/library')} className="text-[#FF6B35] text-sm hover:underline">← Back to library</button>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative px-8 pt-10 pb-8 flex items-end gap-6">
        {/* Blurred bg */}
        <div className="absolute inset-0 overflow-hidden">
          {playlist.cover_art && (
            <Image src={playlist.cover_art} alt="" fill className="object-cover opacity-20 blur-3xl scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]" />
        </div>

        {/* Cover */}
        <div
          className="relative z-10 w-[180px] h-[180px] rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl bg-white/[0.06] group cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
          title="Change cover photo"
        >
          {playlist.cover_art
            ? <Image src={playlist.cover_art} alt={playlist.name} fill className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
          }
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
            {coverUploading
              ? <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1.5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-[11px] font-bold text-white">Change cover</span>
                </div>
            }
          </div>
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />

        {/* Meta */}
        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-[#8A8580] uppercase tracking-widest mb-2">Playlist</p>
          <h1 className="text-[36px] font-black text-white leading-none tracking-tight mb-2">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-[13px] text-[#6A6560] mb-3">{playlist.description}</p>
          )}
          <p className="text-[12px] text-[#4A4540]">
            {tracks.length} songs{totalMin > 0 ? ` · ${totalMin} min` : ''}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-8 pb-6 flex items-center gap-3">
        {tracks.length > 0 && (
          <button
            onClick={playAll}
            className="w-12 h-12 rounded-full bg-[#FF6B35] hover:bg-[#FF7D4D] flex items-center justify-center shadow-lg shadow-[#FF6B35]/30 transition-all hover:scale-105 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: 2 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        )}
        <button
          onClick={deletePlaylist}
          disabled={deleting}
          className="p-2.5 rounded-full text-[#4A4540] hover:text-[#C0392B] hover:bg-[#C0392B]/10 transition-all"
          title="Delete playlist"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>

      {/* Track list */}
      <div className="px-5 pb-32">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <p className="text-[15px] font-bold text-[#F0EBE5]">No tracks yet</p>
            <p className="text-[13px] text-[#4A4540]">Search for music and use the ··· menu to add songs here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {tracks.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={e => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all
                  ${dragIndex === i ? 'opacity-40' : ''}
                  ${dragOverIndex === i && dragIndex !== i ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/30' : 'hover:bg-white/[0.05] border border-transparent'}
                `}
              >
                {/* Drag handle */}
                <div className="w-4 flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="#4A4540">
                    <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
                    <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
                    <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
                  </svg>
                </div>
                {/* Index */}
                <div className="w-6 flex-shrink-0 flex items-center justify-center">
                  <span className="text-[12px] tabular-nums text-[#4A4540] group-hover:hidden">{i + 1}</span>
                  <button
                    onClick={() => { playTrack(track, tracks) }}
                    className="hidden group-hover:flex items-center justify-center text-[#8A8580] hover:text-white"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </button>
                </div>
                {/* Art */}
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#1C1C1C]">
                  {track.albumArt && (
                    <Image src={track.albumArt} alt={track.album} fill className="object-cover" sizes="40px" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playTrack(track, tracks)}>
                  <p className="text-[13px] font-medium text-[#F5F0EB] truncate">{track.title}</p>
                  <p className="text-[11px] text-[#4A4540] truncate mt-0.5">{track.artist}</p>
                </div>
                {/* Album */}
                <p className="text-[12px] text-[#4A4540] truncate hidden md:block w-36 text-right">{track.album}</p>
                {/* Duration */}
                <p className="text-[12px] tabular-nums text-[#4A4540] w-10 text-right flex-shrink-0">
                  {track.duration > 0 ? formatDuration(track.duration / 1000) : '--:--'}
                </p>
                {/* Remove */}
                <button
                  onClick={() => removeTrack(track.spotifyId)}
                  disabled={removingId === track.spotifyId}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full text-[#4A4540] hover:text-[#C0392B] hover:bg-[#C0392B]/10 flex-shrink-0"
                  title="Remove from playlist"
                >
                  {removingId === track.spotifyId
                    ? <div className="w-3.5 h-3.5 border border-[#4A4540]/40 border-t-[#4A4540] rounded-full animate-spin" />
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
