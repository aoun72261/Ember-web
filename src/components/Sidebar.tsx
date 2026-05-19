'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { signOut } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import ThemePicker from './ThemePicker'

interface Playlist { id: string; name: string; cover_art: string | null }
interface UserInfo { username: string; email: string }

type LibFilter = 'playlists' | 'liked'
type LibSort  = 'recents' | 'az'

const navItems = [
  {
    label: 'Home',
    href: '/home',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Search',
    href: '/search',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.8} strokeLinecap="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Stats',
    href: '/stats',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.8} strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    label: 'Journal',
    href: '/journal',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.8} strokeLinecap="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    label: 'Social',
    href: '/social',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.8} strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

const MIN_WIDTH = 180
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 280

export default function Sidebar() {
  const pathname   = usePathname()
  const router     = useRouter()
  const [isPending, startTransition] = useTransition()
  const [user, setUser]               = useState<UserInfo | null>(null)
  const [playlists, setPlaylists]     = useState<Playlist[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [filter, setFilter]           = useState<LibFilter>('playlists')
  const [sort, setSort]               = useState<LibSort>('recents')
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [creating, setCreating]       = useState(false)
  const [newName, setNewName]         = useState('')
  const [unreadSends, setUnreadSends] = useState(0)
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const isDragging      = useRef(false)
  const dragStartX      = useRef(0)
  const dragStartWidth  = useRef(DEFAULT_WIDTH)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current    = true
    dragStartX.current    = e.clientX
    dragStartWidth.current = sidebarWidth
    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta    = e.clientX - dragStartX.current
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta))
      setSidebarWidth(newWidth)
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({
        username: user.user_metadata?.username ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
        email: user.email ?? '',
      })
    })
  }, [])

  useEffect(() => {
    fetch('/api/playlists')
      .then(r => r.ok ? r.json() : { playlists: [] })
      .then(d => setPlaylists(d.playlists ?? []))
      .catch(() => {})
  }, [pathname])

  useEffect(() => {
    fetch('/api/social/sends')
      .then(r => r.ok ? r.json() : { received: [] })
      .then(d => setUnreadSends((d.received ?? []).filter((s: { read: boolean }) => !s.read).length))
      .catch(() => {})
  }, [pathname])

  const handleSignOut = () => { startTransition(async () => { await signOut() }) }

  const handleCreate = async () => {
    if (!newName.trim()) return
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: '' }),
    })
    if (res.ok) {
      const { playlist } = await res.json()
      setPlaylists(prev => [playlist, ...prev])
      setNewName('')
      setCreating(false)
      if (playlist?.id) router.push(`/playlist/${playlist.id}`)
    }
  }

  const filteredPlaylists = playlists
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sort === 'az' ? a.name.localeCompare(b.name) : 0)

  const initial  = user?.username?.[0]?.toUpperCase() ?? 'U'
  const collapsed = sidebarWidth < 200

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full relative select-none"
      style={{ width: sidebarWidth, background: '#121212' }}
    >
      {/* ── Resize handle ─────────────────────────────────────── */}
      <div
        onMouseDown={onDragStart}
        className="absolute top-0 right-0 w-[4px] h-full z-50 cursor-col-resize group"
      >
        <div className="absolute top-0 right-0 w-[1px] h-full bg-transparent group-hover:bg-white/10 transition-colors" />
      </div>

      {/* ── Logo / Brand ──────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4">
        <Link href="/home" className="flex items-center gap-2.5 group w-fit">
          <div className="w-8 h-8 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" width="32" height="32">
              <defs>
                <linearGradient id="sp-g" x1="20" y1="36" x2="20" y2="4" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1DB954"/>
                  <stop offset="100%" stopColor="#1ed760"/>
                </linearGradient>
              </defs>
              <path d="M20 5 C20 5 27 13 27 21 C27 24 25.5 27 23 29.5 C21.5 31 20 32 20 32 C20 32 18.5 31 17 29.5 C14.5 27 13 24 13 21 C13 13 20 5 20 5Z" fill="url(#sp-g)"/>
              <path d="M20 13 C20 13 24 19 24 24 C24 28 22.2 31 20 31 C17.8 31 16 28 16 24 C16 19 20 13 20 13Z" fill="#fff" opacity="0.15"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="text-[20px] font-black text-white tracking-tight group-hover:text-white/80 transition-colors">
              Ember
            </span>
          )}
        </Link>
      </div>

      {/* ── Main Navigation ───────────────────────────────────── */}
      <nav className="px-2 flex flex-col gap-0.5 mb-4">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const badge  = item.href === '/social' && unreadSends > 0 ? unreadSends : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-2 rounded-md text-[14px] font-semibold transition-all duration-150
                ${active
                  ? 'text-white bg-[#282828]'
                  : 'text-[#A7A7A7] hover:text-white hover:bg-[#1A1A1A]'}`}
            >
              <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-[#A7A7A7] group-hover:text-white'} transition-colors`}>
                {item.icon(active)}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-[#1DB954] text-black text-[10px] font-black flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Your Library ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 rounded-lg mx-2 mb-2" style={{ background: '#121212' }}>

        {/* Library header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <button
            onClick={() => setSearchOpen(v => { if (!v) setTimeout(() => searchInputRef.current?.focus(), 50); return !v })}
            className="flex items-center gap-2 flex-1 text-left group"
          >
            {/* Stack icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className="text-[#A7A7A7] group-hover:text-white transition-colors flex-shrink-0">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            {!collapsed && (
              <span className="text-[15px] font-bold text-[#A7A7A7] group-hover:text-white transition-colors">
                Your Library
              </span>
            )}
          </button>

          {/* Action icons */}
          <button
            onClick={() => setCreating(true)}
            title="Create playlist"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-white hover:bg-[#282828] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <Link href="/library" title="Expand Library"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-white hover:bg-[#282828] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </Link>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-4 pb-2">
          {(['playlists', 'liked'] as LibFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[13px] font-medium transition-all ${
                filter === f
                  ? 'bg-white text-black'
                  : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {f === 'liked' ? 'Liked Songs' : 'Playlists'}
            </button>
          ))}
        </div>

        {/* Search + sort bar */}
        <div className="flex items-center gap-2 px-4 pb-2">
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 bg-[#2A2A2A] rounded-md px-3 py-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search in Your Library"
                className="flex-1 bg-transparent text-[13px] text-white placeholder-[#A7A7A7] outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#A7A7A7] hover:text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-white hover:bg-[#282828] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => setSort(s => s === 'recents' ? 'az' : 'recents')}
            className="ml-auto flex items-center gap-1 text-[12px] font-medium text-[#A7A7A7] hover:text-white transition-colors"
          >
            <span>{sort === 'recents' ? 'Recents' : 'A–Z'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Create playlist inline form */}
        {creating && (
          <div className="mx-2 mb-2 bg-[#242424] rounded-lg p-3 flex flex-col gap-2">
            <p className="text-[11px] font-bold text-[#A7A7A7] uppercase tracking-wider">New playlist</p>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="Playlist name"
              className="bg-[#3E3E3E] rounded px-3 py-2 text-[13px] text-white placeholder-[#6A6A6A] outline-none focus:bg-[#4A4A4A] transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="flex-1 disabled:opacity-40 bg-[#1DB954] hover:bg-[#1ed760] text-black text-[12px] font-bold py-1.5 rounded-full transition-all">
                Create
              </button>
              <button onClick={() => { setCreating(false); setNewName('') }}
                className="px-3 text-[12px] text-[#A7A7A7] hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Playlist list */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2" style={{ scrollbarWidth: 'none' }}>
          {filter === 'liked' ? (
            <Link href="/library/liked"
              className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#282828] transition-all group">
              <div className="w-10 h-10 rounded flex-shrink-0 bg-gradient-to-br from-[#4B0082] to-[#6A0DAD] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              {!collapsed && (
                <div>
                  <p className="text-[14px] font-medium text-white truncate">Liked Songs</p>
                  <p className="text-[12px] text-[#A7A7A7]">Playlist</p>
                </div>
              )}
            </Link>
          ) : filteredPlaylists.length > 0 ? (
            filteredPlaylists.map(p => {
              const isActive = pathname === `/playlist/${p.id}`
              return (
                <Link
                  key={p.id}
                  href={`/playlist/${p.id}`}
                  className={`flex items-center gap-3 px-2 py-2 rounded-md transition-all group
                    ${isActive ? 'bg-[#282828]' : 'hover:bg-[#1A1A1A]'}`}
                >
                  <div className="w-10 h-10 rounded flex-shrink-0 bg-[#282828] overflow-hidden flex items-center justify-center">
                    {p.cover_art
                      ? <Image src={p.cover_art} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    }
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-medium truncate transition-colors ${isActive ? 'text-white' : 'text-white group-hover:text-white'}`}>
                        {p.name}
                      </p>
                      <p className="text-[12px] text-[#A7A7A7] truncate">Playlist • {user?.username ?? ''}</p>
                    </div>
                  )}
                </Link>
              )
            })
          ) : playlists.length === 0 ? (
            <div className="mx-1 mt-2 rounded-lg bg-[#242424] p-4 flex flex-col gap-3">
              <p className="text-[14px] font-bold text-white">Create your first playlist</p>
              <p className="text-[13px] text-[#A7A7A7] leading-relaxed">It&apos;s easy, we&apos;ll help you.</p>
              <button onClick={() => setCreating(true)}
                className="self-start text-[13px] font-bold bg-white text-black px-4 py-1.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all">
                Create playlist
              </button>
            </div>
          ) : (
            <p className="text-[13px] text-[#A7A7A7] px-2 py-4">No results for &ldquo;{searchQuery}&rdquo;</p>
          )}
        </div>
      </div>

      {/* ── User Footer ───────────────────────────────────────── */}
      <div className="px-2 pb-3 relative">

        {/* User menu popup */}
        {showUserMenu && (
          <div className="absolute bottom-full left-2 right-2 mb-1 rounded-md shadow-2xl overflow-hidden z-50"
            style={{ background: '#282828' }}>
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-[14px] font-bold text-white">{user?.username}</p>
              <p className="text-[12px] text-[#A7A7A7] truncate">{user?.email}</p>
            </div>
            <Link href="/profile" onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#A7A7A7] hover:text-white hover:bg-[#3E3E3E] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Profile
            </Link>
            <Link href="/settings" onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#A7A7A7] hover:text-white hover:bg-[#3E3E3E] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Settings
            </Link>
            <button
              onClick={() => { setShowUserMenu(false); setThemePickerOpen(true) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#A7A7A7] hover:text-white hover:bg-[#3E3E3E] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20"/>
                <path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>
              </svg>
              Theme &amp; Wallpaper
            </button>
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#A7A7A7] hover:text-white hover:bg-[#3E3E3E] transition-colors border-t border-white/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#282828] transition-all duration-150 group"
        >
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-black text-black bg-[#1DB954]">
            {initial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-white truncate">{user?.username ?? 'Profile'}</p>
            </div>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={`flex-shrink-0 text-[#A7A7A7] transition-transform ${showUserMenu ? 'rotate-180' : ''}`}>
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      </div>

      {themePickerOpen && <ThemePicker onClose={() => setThemePickerOpen(false)} />}
    </aside>
  )
}
