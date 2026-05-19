'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserInfo { username: string; avatarUrl: string | null }

export default function TopBar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]           = useState<UserInfo | null>(null)
  const [searchVal, setSearchVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Load user for avatar
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const username = user.user_metadata?.username ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'U'
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      setUser({ username, avatarUrl: profile?.avatar_url ?? null })
    })
  }, [])

  // Sync search input value when navigating away from /search
  useEffect(() => {
    if (!pathname.startsWith('/search')) setSearchVal('')
  }, [pathname])

  const isHome   = pathname === '/home'
  const isSearch = pathname === '/search'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`)
    else router.push('/search')
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? 'U'

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
      style={{ background: '#121212' }}
    >
      {/* ── Back / Forward ─────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 text-[#A7A7A7] hover:text-white transition-colors flex-shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button
        onClick={() => router.forward()}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 text-[#A7A7A7] hover:text-white transition-colors flex-shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {/* ── Home button ─────────────────────────────────────── */}
      <Link
        href="/home"
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
          ${isHome ? 'bg-white text-black' : 'bg-[#242424] text-[#A7A7A7] hover:text-white'}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </Link>

      {/* ── Search bar ─────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex-1 max-w-[480px]">
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all ${
          isSearch ? 'bg-[#2A2A2A] ring-1 ring-white/20' : 'bg-[#242424] hover:bg-[#2A2A2A]'
        }`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="2.2" strokeLinecap="round" className="flex-shrink-0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onFocus={() => { if (!pathname.startsWith('/search')) router.push('/search') }}
            placeholder="What do you want to play?"
            className="flex-1 bg-transparent text-[14px] text-white placeholder-[#A7A7A7] outline-none min-w-0"
          />
          {searchVal && (
            <>
              <div className="w-px h-4 bg-[#535353] flex-shrink-0" />
              <button type="button" onClick={() => { setSearchVal(''); inputRef.current?.focus() }}
                className="text-[#A7A7A7] hover:text-white flex-shrink-0 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </form>

      {/* ── Spacer ─────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Right icons: Stats, Journal, Social, Profile ─── */}
      <div className="flex items-center gap-1">

        {/* Stats */}
        <Link href="/stats" title="Stats"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
            ${pathname.startsWith('/stats') ? 'bg-[#282828] text-white' : 'text-[#A7A7A7] hover:text-white hover:bg-[#1A1A1A]'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </Link>

        {/* Journal */}
        <Link href="/journal" title="Journal"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
            ${pathname.startsWith('/journal') ? 'bg-[#282828] text-white' : 'text-[#A7A7A7] hover:text-white hover:bg-[#1A1A1A]'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </Link>

        {/* Social */}
        <Link href="/social" title="Social"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
            ${pathname.startsWith('/social') ? 'bg-[#282828] text-white' : 'text-[#A7A7A7] hover:text-white hover:bg-[#1A1A1A]'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </Link>

        {/* Profile avatar */}
        <Link href="/profile"
          className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ml-1 ring-2 ring-transparent hover:ring-white/30 transition-all">
          {user?.avatarUrl ? (
            <Image src={user.avatarUrl} alt="Profile" width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full bg-[#535353] flex items-center justify-center text-[13px] font-bold text-white">
              {initial}
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}
