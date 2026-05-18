'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTransition, useRef, useState } from 'react'
import { signOut } from '@/app/actions/auth'
import { usePlayerStore } from '@/store/playerStore'
import type { Track } from '@/types/index'

interface TopArtist { name: string; plays: number; art: string }

interface Props {
  username: string
  email: string
  joinDate: string | null
  totalPlays: number
  likedCount: number
  playlistCount: number
  recentTracks: Track[]
  topArtists: TopArtist[]
  avatarUrl?: string | null
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-6 py-5 flex-1">
      <span className="text-[28px] font-black text-white">{value}</span>
      <span className="text-[12px] text-[#4A4540] font-medium">{label}</span>
    </div>
  )
}

function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 150
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')!
        const ratio = Math.max(size / img.width, size / img.height)
        const w = img.width * ratio, h = img.height * ratio
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProfileClient({ username, email, joinDate, totalPlays, likedCount, playlistCount, recentTracks, topArtists, avatarUrl: initialAvatarUrl }: Props) {
  const { playTrack } = usePlayerStore()
  const [isPending, startTransition] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const initial = username[0]?.toUpperCase() ?? 'U'

  const handleSignOut = () => startTransition(async () => { await signOut() })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const resized = await resizeAvatar(file)
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: resized }),
      })
      if (res.ok) setAvatarUrl(resized)
    } catch { /* silent */ }
    finally { setAvatarUploading(false) }
  }

  return (
    <div className="min-h-full pb-32">
      {/* Hero */}
      <div className="relative px-8 pt-10 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-[#4A7FFF]/[0.06] to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-end gap-7">
          {/* Avatar — editable */}
          <div className="relative flex-shrink-0 group">
            <div className="w-[120px] h-[120px] rounded-full overflow-hidden shadow-2xl shadow-[#4A7FFF]/30">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={username} width={120} height={120} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#4A7FFF] to-[#1D4ED8] flex items-center justify-center text-[48px] font-black text-white">
                  {initial}
                </div>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#1C1C1C] border border-white/[0.15] flex items-center justify-center text-white/70 hover:text-white hover:bg-[#2A2A2A] transition-all shadow-lg opacity-0 group-hover:opacity-100"
              title="Change photo"
            >
              {avatarUploading
                ? <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              }
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex-1 min-w-0 pb-2">
            <p className="text-[11px] font-bold text-[#8A8580] uppercase tracking-widest mb-1">Profile</p>
            <h1 className="text-[40px] font-black text-white leading-none tracking-tight">{username}</h1>
            <p className="text-[13px] text-[#4A4540] mt-2">{email}{joinDate ? ` · Joined ${joinDate}` : ''}</p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.1] text-[#6A6560] hover:text-[#C0392B] hover:border-[#C0392B]/30 hover:bg-[#C0392B]/10 text-[13px] font-semibold transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>

      <div className="px-8 flex flex-col gap-10">
        {/* Stats row */}
        <div className="flex gap-3">
          <StatCard value={totalPlays} label="Songs played" />
          <StatCard value={likedCount} label="Liked songs" />
          <StatCard value={playlistCount} label="Playlists" />
        </div>

        {/* Top artists */}
        {topArtists.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold text-[#F5F0EB] mb-5">Your top artists</h2>
            <div className="flex flex-col gap-1">
              {topArtists.map((a, i) => (
                <div key={a.name} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <span className="text-[14px] font-bold text-[#3A3530] w-5 text-center flex-shrink-0">{i + 1}</span>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/[0.06]">
                    {a.art && <Image src={a.art} alt={a.name} fill className="object-cover" sizes="40px" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#E0DBD5] truncate">{a.name}</p>
                  </div>
                  <span className="text-[12px] text-[#4A4540] flex-shrink-0">{a.plays} {a.plays === 1 ? 'play' : 'plays'}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently played */}
        {recentTracks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[17px] font-bold text-[#F5F0EB]">Recently played</h2>
              <Link href="/library" className="text-[12px] font-semibold text-[#4A4540] hover:text-[#4A7FFF] transition-colors">
                Library →
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {recentTracks.map(track => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track, recentTracks)}
                  className="group flex flex-col gap-2 text-left"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/[0.06]">
                    {track.albumArt && (
                      <Image src={track.albumArt} alt={track.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="150px" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-[#4A7FFF] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-[12px] font-medium text-[#C0BBB5] group-hover:text-white truncate transition-colors">{track.title}</p>
                  <p className="text-[11px] text-[#4A4540] truncate -mt-1.5">{track.artist}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {recentTracks.length === 0 && topArtists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.04] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
            <p className="text-[15px] font-bold text-[#F0EBE5]">No listening history yet</p>
            <p className="text-[13px] text-[#4A4540]">Start playing music to build your profile.</p>
            <Link href="/search" className="text-[13px] font-bold text-[#4A7FFF] hover:text-[#93C5FD] transition-colors">
              Discover music →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
