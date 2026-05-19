'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TrackCard from '@/components/TrackCard'
import type { Track } from '@/types/index'

const tabs = ['Playlists', 'Liked songs', 'Albums', 'Artists'] as const
type Tab = typeof tabs[number]

interface Playlist {
  id: string
  name: string
  description: string
  cover_art: string | null
  is_public: boolean
  created_at: string
  playlist_tracks: { count: number }[]
}

// ── Resize image to 400×400 JPEG base64 ──────────────────────────────────────
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 400
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')!
        const ratio = Math.max(size / img.width, size / img.height)
        const w = img.width * ratio, h = img.height * ratio
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Create Playlist Modal ─────────────────────────────────────────────────────
function CreatePlaylistModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (p: Playlist) => void
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [cover, setCover] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setCover(await resizeImage(file)) } catch { /* ignore */ }
  }

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, coverArt: cover }),
      })
      if (res.ok) {
        const { playlist } = await res.json()
        onCreate(playlist)
        onClose()
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6 w-[380px] shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-black text-white">Create playlist</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-[#6A6560] hover:text-white transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Cover image picker */}
        <div className="flex justify-center mb-6">
          <button onClick={() => fileRef.current?.click()}
            className="relative w-[120px] h-[120px] rounded-2xl overflow-hidden bg-white/[0.05] border border-white/[0.08]
                       hover:border-white/20 transition-all group">
            {cover
              ? <Image src={cover} alt="" fill className="object-cover"/>
              : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#4A4540] group-hover:text-[#8A8580]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-[11px] font-medium">Add cover</span>
                </div>
            }
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage}/>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Playlist name" maxLength={60}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3
                       text-[14px] text-white placeholder-[#4A4540] focus:outline-none focus:border-[#1DB954]/50 transition-colors"
          />
          <input
            type="text" value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Description (optional)" maxLength={120}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3
                       text-[14px] text-white placeholder-[#4A4540] focus:outline-none focus:border-[#1DB954]/50 transition-colors"
          />
        </div>

        <button
          onClick={submit}
          disabled={!name.trim() || saving}
          className="mt-5 w-full bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-40 disabled:cursor-not-allowed
                     text-white text-[14px] font-bold py-3 rounded-full transition-all"
        >
          {saving ? 'Creating…' : 'Create playlist'}
        </button>
      </div>
    </div>
  )
}

// ── Main Library Page ─────────────────────────────────────────────────────────
export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Playlists')
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [likedTracks, setLikedTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'Playlists') {
        const res = await fetch('/api/playlists')
        if (res.ok) { const d = await res.json(); setPlaylists(d.playlists) }
      }
      if (activeTab === 'Liked songs') {
        const res = await fetch('/api/likes')
        if (res.ok) { const d = await res.json(); setLikedTracks(d.tracks) }
      }
    } finally { setLoading(false) }
  }, [activeTab])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#0A0A0A]/90 backdrop-blur-md px-8 pt-8 pb-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[26px] font-black text-white tracking-tight">Your Library</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white text-[13px] font-bold px-4 py-2.5 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#1DB954]/30"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New playlist
          </button>
        </div>
        <div className="flex items-center gap-2 pb-4">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]
                ${activeTab === tab
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.07] text-[#6A6560] hover:bg-white/[0.12] hover:text-[#E0DBD5]'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin"/>
          </div>
        )}

        {/* Playlists */}
        {!loading && activeTab === 'Playlists' && (
          playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {playlists.map(p => (
                <Link key={p.id} href={`/playlist/${p.id}`}
                  className="group flex flex-col gap-3 bg-white/[0.03] hover:bg-white/[0.07] rounded-2xl p-4 transition-all cursor-pointer">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.06]">
                    {p.cover_art
                      ? <Image src={p.cover_art} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300"/>
                      : <div className="w-full h-full flex items-center justify-center">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2" strokeLinecap="round">
                            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                          </svg>
                        </div>
                    }
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#E0DBD5] truncate">{p.name}</p>
                    <p className="text-[11px] text-[#4A4540] mt-0.5">
                      {p.playlist_tracks?.[0]?.count ?? 0} songs
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="w-24 h-24 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <div className="text-center max-w-xs">
                <h2 className="text-[18px] font-bold text-[#F0EBE5] mb-2">No playlists yet</h2>
                <p className="text-[13px] text-[#4A4540] leading-relaxed">Create a playlist to collect your favourite tracks.</p>
              </div>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2.5 bg-white text-black text-[13.5px] font-bold px-6 py-3 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create your first playlist
              </button>
            </div>
          )
        )}

        {/* Liked songs */}
        {!loading && activeTab === 'Liked songs' && (
          likedTracks.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {likedTracks.map((track, i) => (
                <TrackCard key={track.id} track={track} queue={likedTracks} index={i} showIndex/>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1DB954]/20 to-[#C0392B]/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <p className="text-[16px] font-bold text-[#F0EBE5]">No liked songs yet</p>
              <p className="text-[13px] text-[#4A4540]">Tap the ♥ on any track to save it here.</p>
              <Link href="/search" className="text-[13px] font-bold text-[#1DB954] hover:text-[#1ed760] transition-colors">
                Find music →
              </Link>
            </div>
          )
        )}

        {/* Albums / Artists empty states */}
        {!loading && (activeTab === 'Albums' || activeTab === 'Artists') && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.04] flex items-center justify-center">
              {activeTab === 'Albums'
                ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5" fill="#3A3530"/></svg>
                : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              }
            </div>
            <p className="text-[16px] font-bold text-[#F0EBE5]">No {activeTab.toLowerCase()} saved</p>
            <Link href="/search" className="text-[13px] font-bold text-[#1DB954] hover:text-[#1ed760] transition-colors">
              Browse music →
            </Link>
          </div>
        )}
      </div>

      {/* Create playlist modal */}
      {showCreate && (
        <CreatePlaylistModal
          onClose={() => setShowCreate(false)}
          onCreate={p => setPlaylists(prev => [p, ...prev])}
        />
      )}
    </div>
  )
}
