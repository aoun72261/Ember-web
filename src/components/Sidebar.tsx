'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { signOut } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import ThemePicker from './ThemePicker'

interface Playlist { id: string; name: string; cover_art: string | null }
interface UserInfo  { username: string; email: string }

type LibFilter = 'playlists' | 'liked'
type LibSort   = 'recents'  | 'az'

const MIN_WIDTH     = 180
const MAX_WIDTH     = 420
const DEFAULT_WIDTH = 280

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
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
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const isDragging     = useRef(false)
  const dragStartX     = useRef(0)
  const dragStartWidth = useRef(DEFAULT_WIDTH)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current     = true
    dragStartX.current     = e.clientX
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
      isDragging.current             = false
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

  const initial   = user?.username?.[0]?.toUpperCase() ?? 'U'
  const collapsed = sidebarWidth < 160

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full relative select-none"
      style={{ width: sidebarWidth, background: '#121212' }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onDragStart}
        className="absolute top-0 right-0 w-[4px] h-full z-50 cursor-col-resize group"
      >
        <div className="absolute top-0 right-0 w-[1px] h-full bg-transparent group-hover:bg-white/10 transition-colors" />
      </div>

      {/* ── Your Library header ───────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button
          onClick={() => setSearchOpen(v => { if (!v) setTimeout(() => searchInputRef.current?.focus(), 50); return !v })}
          className="flex items-center gap-2.5 flex-1 min-w-0 group text-left"
        >
          {/* Spotify library icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
            className="text-[#A7A7A7] group-hover:text-white transition-colors flex-shrink-0">
            <path d="M3 22V2h2v20H3zm4-8V8h2v6H7zm4 6V4h2v16h-2zm4-4v-4h2v4h-2zm4 4v-6h2v6h-2z"/>
          </svg>
          {!collapsed && (
            <span className="text-[15px] font-bold text-[#A7A7A7] group-hover:text-white transition-colors truncate">
              Your Library
            </span>
          )}
        </button>

        {/* Tooltip-wrapped action buttons */}
        <button onClick={() => setCreating(true)} title="Create playlist"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-white hover:bg-[#1A1A1A] transition-all flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <Link href="/library" title="See all"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-white hover:bg-[#1A1A1A] transition-all flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </Link>
      </div>

      {/* ── Filter pills ──────────────────────────────────── */}
      {!collapsed && (
        <div className="flex gap-2 px-2 pb-2 flex-wrap">
          {(['playlists', 'liked'] as LibFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                filter === f ? 'bg-white text-black' : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {f === 'liked' ? 'Liked Songs' : 'Playlists'}
            </button>
          ))}
        </div>
      )}

      {/* ── Search + sort ─────────────────────────────────── */}
      {!collapsed && (
        <div className="flex items-center gap-2 px-2 pb-2">
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
                className="flex-1 bg-transparent text-[13px] text-white placeholder-[#6A6A6A] outline-none min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#A7A7A7] hover:text-white flex-shrink-0">
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
            className="ml-auto flex items-center gap-1 text-[12px] font-medium text-[#A7A7A7] hover:text-white transition-colors whitespace-nowrap"
          >
            <span>{sort === 'recents' ? 'Recents' : 'A–Z'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Create playlist form ───────────────────────────── */}
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

      {/* ── Playlist list ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2" style={{ scrollbarWidth: 'none' }}>

        {filter === 'liked' ? (
          <Link href="/library/liked"
            className={`flex items-center gap-3 px-2 py-2 rounded-md transition-all group
              ${pathname === '/library/liked' ? 'bg-[#282828]' : 'hover:bg-[#1A1A1A]'}`}>
            <div className="w-12 h-12 rounded flex-shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
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
                <div className="w-12 h-12 rounded flex-shrink-0 bg-[#282828] overflow-hidden flex items-center justify-center">
                  {p.cover_art
                    ? <Image src={p.cover_art} alt="" width={48} height={48} className="object-cover w-full h-full" />
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.5">
                        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                      </svg>
                  }
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-medium truncate transition-colors ${isActive ? 'text-white' : 'text-white'}`}>
                      {p.name}
                    </p>
                    <p className="text-[12px] text-[#A7A7A7] truncate">Playlist • {user?.username ?? ''}</p>
                  </div>
                )}
              </Link>
            )
          })
        ) : playlists.length === 0 && !searchQuery ? (
          <div className="mx-1 mt-2 rounded-lg bg-[#242424] p-4 flex flex-col gap-2">
            <p className="text-[14px] font-bold text-white">Create your first playlist</p>
            <p className="text-[13px] text-[#A7A7A7] leading-relaxed">It&apos;s easy, we&apos;ll help you.</p>
            <button onClick={() => setCreating(true)}
              className="self-start text-[13px] font-bold bg-white text-black px-4 py-1.5 rounded-full hover:scale-[1.02] transition-all mt-1">
              Create playlist
            </button>
          </div>
        ) : (
          <p className="text-[13px] text-[#A7A7A7] px-2 py-4">No results for &ldquo;{searchQuery}&rdquo;</p>
        )}
      </div>

      {/* ── User footer ───────────────────────────────────── */}
      <div className="px-2 pb-3 mt-1 relative">
        <div className="h-px bg-[#282828] mb-2 mx-2" />

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
              Profile
            </Link>
            <Link href="/settings" onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#A7A7A7] hover:text-white hover:bg-[#3E3E3E] transition-colors">
              Settings
            </Link>
            <button
              onClick={() => { setShowUserMenu(false); setThemePickerOpen(true) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#A7A7A7] hover:text-white hover:bg-[#3E3E3E] transition-colors text-left"
            >
              Theme &amp; Wallpaper
            </button>
            <button onClick={handleSignOut} disabled={isPending}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#A7A7A7] hover:text-white hover:bg-[#3E3E3E] transition-colors border-t border-white/10">
              {isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#282828] transition-all group"
        >
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-black text-black bg-[#1DB954]">
            {initial}
          </div>
          {!collapsed && (
            <span className="text-[13px] font-semibold text-white truncate flex-1 text-left">{user?.username ?? 'Profile'}</span>
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
