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
type LibSort = 'recents' | 'az'

const navItems = [
  {
    label: 'Home',
    href: '/home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Search',
    href: '/search',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Library',
    href: '/library',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: 'Stats',
    href: '/stats',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    label: 'Journal',
    href: '/journal',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    label: 'Social',
    href: '/social',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round">
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
const DEFAULT_WIDTH = 272

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [filter, setFilter] = useState<LibFilter>('playlists')
  const [sort, setSort] = useState<LibSort>('recents')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [unreadSends, setUnreadSends] = useState(0)
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(DEFAULT_WIDTH)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = sidebarWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = e.clientX - dragStartX.current
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta))
      setSidebarWidth(newWidth)
    }

    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
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
      if (user) {
        setUser({
          username: user.user_metadata?.username ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
          email: user.email ?? '',
        })
      }
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
  }, [pathname]) // re-fetch when navigating (catches new playlist creation)

  const handleSignOut = () => {
    startTransition(async () => { await signOut() })
  }

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

  const initial = user?.username?.[0]?.toUpperCase() ?? 'U'
  const collapsed = sidebarWidth < 200

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full relative"
      style={{
        width: sidebarWidth,
        background: 'rgba(8,4,20,0.35)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* ── Resize handle ───────────────────────────────── */}
      <div
        onMouseDown={onDragStart}
        className="absolute top-0 right-0 w-[5px] h-full z-50 group"
        style={{ cursor: 'col-resize' }}
      >
        {/* visible bar on hover */}
        <div className="absolute top-0 right-0 w-[2px] h-full bg-transparent group-hover:bg-[#F97316]/40 transition-colors duration-150" />
      </div>

      {/* ── Logo ─────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/home" className="flex items-center gap-2.5 group w-fit">
          {/* Ember flame logo — SVG with deep purple/amber palette */}
          <div className="w-9 h-9 flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" width="36" height="36">
              <defs>
                <radialGradient id="sb-bg" cx="50%" cy="70%" r="60%">
                  <stop offset="0%" stopColor="#2D1060"/>
                  <stop offset="100%" stopColor="#0D0818"/>
                </radialGradient>
                <linearGradient id="sb-fo" x1="20" y1="36" x2="20" y2="5" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F97316"/>
                  <stop offset="45%" stopColor="#C026D3"/>
                  <stop offset="100%" stopColor="#7C3AED"/>
                </linearGradient>
                <linearGradient id="sb-fi" x1="20" y1="34" x2="20" y2="13" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FBBF24"/>
                  <stop offset="55%" stopColor="#F97316"/>
                  <stop offset="100%" stopColor="#E879F9"/>
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="11" fill="url(#sb-bg)"/>
              <ellipse cx="20" cy="30" rx="9" ry="5" fill="#F97316" opacity="0.15"/>
              <path d="M20 5 C20 5 27 13 27 21 C27 24 25.5 27 23 29.5 C21.5 31 20 32 20 32 C20 32 18.5 31 17 29.5 C14.5 27 13 24 13 21 C13 13 20 5 20 5Z" fill="url(#sb-fo)"/>
              <path d="M16 20 C14 17 15 13 17 11 C16 15 17 18 19 20Z" fill="#7C3AED" opacity="0.5"/>
              <path d="M20 13 C20 13 24 19 24 24 C24 28 22.2 31 20 31 C17.8 31 16 28 16 24 C16 19 20 13 20 13Z" fill="url(#sb-fi)" opacity="0.9"/>
              <ellipse cx="20" cy="27" rx="3" ry="4" fill="#FDE68A" opacity="0.45"/>
              <ellipse cx="20" cy="28.5" rx="1.5" ry="2" fill="white" opacity="0.35"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="text-[22px] bg-gradient-to-r from-[#F97316] via-[#C084FC] to-[#818CF8] bg-clip-text text-transparent"
              style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
              Ember
            </span>
          )}
        </Link>
      </div>

      {/* ── Main Navigation ──────────────────────────── */}
      <nav className="px-2 flex flex-col gap-0.5 mb-2">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const badge = item.href === '/social' && unreadSends > 0 ? unreadSends : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200
                ${active ? 'text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'}`}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(168,85,247,0.1) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(249,115,22,0.18)',
              } : {}}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{ background: 'linear-gradient(to bottom, #F97316, #A855F7)' }} />
              )}
              <span className={`flex-shrink-0 transition-all duration-200 ${active ? 'text-[#F97316]' : 'group-hover:text-white/60'}`}>
                {item.icon(active)}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-black flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      {/* Divider */}
      <div className="mx-4 h-px mb-2" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' }} />

      {/* ── Your Library ─────────────────────────────── */}
      <div className="flex-1 flex flex-col mt-3 overflow-hidden min-h-0">

        {/* Header row */}
        <div className="flex items-center gap-1 px-4 mb-2">
          <button
            onClick={() => setSearchOpen(v => { if (!v) setTimeout(() => searchInputRef.current?.focus(), 50); return !v })}
            className="flex items-center gap-2 flex-1 text-left group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              className="text-[#F97316]/60 group-hover:text-[#F97316] transition-colors flex-shrink-0">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            {!collapsed && <span className="text-[11.5px] font-bold tracking-widest uppercase text-white/30 group-hover:text-white/60 transition-colors">Library</span>}
          </button>
          {/* Create + link to library */}
          <button
            onClick={() => setCreating(true)}
            title="Create playlist"
            className="w-7 h-7 rounded-full hover:bg-[#F97316]/15 flex items-center justify-center text-white/30 hover:text-[#F97316] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <Link href="/library" title="Open Library"
            className="w-7 h-7 rounded-full hover:bg-white/[0.07] flex items-center justify-center text-white/30 hover:text-white/80 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </Link>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 px-4 mb-2">
          {(['playlists', 'liked'] as LibFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all capitalize ${
                filter === f
                  ? 'text-white'
                  : 'bg-white/[0.06] text-white/35 hover:bg-white/[0.1] hover:text-white/70'
              }`}
              style={filter === f ? {
                background: 'linear-gradient(135deg, rgba(249,115,22,0.25) 0%, rgba(168,85,247,0.2) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(249,115,22,0.3)',
              } : {}}
            >
              {f === 'liked' ? 'Liked Songs' : 'Playlists'}
            </button>
          ))}
        </div>

        {/* Search + sort bar */}
        <div className="flex items-center gap-2 px-4 mb-2">
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 bg-white/[0.08] rounded-lg px-2.5 py-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search in library"
                className="flex-1 bg-transparent text-[12px] text-white placeholder-[#4A4540] outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#4A4540] hover:text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
              className="w-7 h-7 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-[#4A4540] hover:text-white transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => setSort(s => s === 'recents' ? 'az' : 'recents')}
            className="ml-auto flex items-center gap-1 text-[10.5px] font-bold text-white/25 hover:text-white/60 transition-colors"
            title="Sort"
          >
            <span>{sort === 'recents' ? 'Recents' : 'A–Z'}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Create playlist inline form */}
        {creating && (
          <div className="mx-3 mb-2 bg-white/[0.06] rounded-xl p-3 flex flex-col gap-2">
            <p className="text-[11px] font-bold text-[#6A6560] uppercase tracking-wider">New playlist</p>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="Playlist name"
              className="bg-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#4A4540] outline-none focus:bg-white/[0.12] transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="flex-1 disabled:opacity-40 text-white text-[12px] font-bold py-1.5 rounded-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #F97316, #A855F7)' }}>
                Create
              </button>
              <button onClick={() => { setCreating(false); setNewName('') }}
                className="px-3 text-[12px] text-[#4A4540] hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Playlist list */}
        <div className="flex-1 overflow-y-auto px-2 min-h-0" style={{ scrollbarWidth: 'none' }}>
          {filter === 'liked' ? (
            <Link href="/library/liked"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-all group">
              <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-gradient-to-br from-[#4B0082] to-[#6A0DAD] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#C0BBB5] group-hover:text-white transition-colors">Liked Songs</p>
                <p className="text-[11px] text-[#4A4540]">Playlist</p>
              </div>
            </Link>
          ) : filteredPlaylists.length > 0 ? (
            filteredPlaylists.map(p => {
              const isActive = pathname === `/playlist/${p.id}`
              return (
                <Link
                  key={p.id}
                  href={`/playlist/${p.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group
                    ${isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'}`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.06] flex items-center justify-center">
                    {p.cover_art
                      ? <Image src={p.cover_art} alt="" width={36} height={36} className="object-cover w-full h-full" />
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium truncate transition-colors ${isActive ? 'text-white' : 'text-[#C0BBB5] group-hover:text-white'}`}>
                      {p.name}
                    </p>
                    <p className="text-[11px] text-[#4A4540]">Playlist</p>
                  </div>
                </Link>
              )
            })
          ) : playlists.length === 0 ? (
            <div className="mx-1 mt-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 flex flex-col gap-3">
              <p className="text-[12.5px] font-bold text-[#F0EBE5]">Create your first playlist</p>
              <p className="text-[11.5px] text-[#4A4540] leading-relaxed">It&apos;s easy — we&apos;ll help you get started.</p>
              <button onClick={() => setCreating(true)}
                className="self-start text-[12px] font-bold bg-white text-black px-4 py-1.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all">
                Create playlist
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-[#4A4540] px-3 py-4">No results for &ldquo;{searchQuery}&rdquo;</p>
          )}
        </div>
      </div>

      {/* ── User Footer ──────────────────────────────── */}
      <div className="px-3 pb-4 mt-2 relative">
        <div className="h-px mb-3 mx-1" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' }} />

        {/* User menu popup */}
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(14,10,30,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(249,115,22,0.15)',
            }}>
            <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[13px] font-bold text-white">{user?.username}</p>
              <p className="text-[11px] text-white/30 truncate">{user?.email}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Settings
            </Link>
            {/* Theme picker */}
            <button
              onClick={() => { setShowUserMenu(false); setThemePickerOpen(true) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[12.5px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20"/>
                <path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>
              </svg>
              Theme &amp; Wallpaper
            </button>
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[12.5px] text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.05] transition-all duration-150 group"
        >
          {/* Avatar with amber-purple ring on hover */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F97316, #A855F7)' }}>
              {initial}
            </div>
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: '0 0 0 2px rgba(249,115,22,0.45)' }} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12.5px] font-semibold text-white/70 group-hover:text-white truncate transition-colors">
                {user?.username ?? 'Profile'}
              </p>
              <p className="text-[10.5px] text-white/25 truncate">{user?.email ?? ''}</p>
            </div>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={`flex-shrink-0 text-white/25 group-hover:text-white/60 transition-all ${showUserMenu ? 'rotate-180' : ''}`}>
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      </div>

      {/* Theme Picker modal */}
      {themePickerOpen && <ThemePicker onClose={() => setThemePickerOpen(false)} />}
    </aside>
  )
}
