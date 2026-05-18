'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import TrackCard from '@/components/TrackCard'
import AlbumCard from '@/components/AlbumCard'
import { usePlayerStore } from '@/store/playerStore'
import type { Track, Artist, Album } from '@/types/index'

interface SearchResults { tracks: Track[]; artists: Artist[]; albums: Album[]; source?: string }
interface ArtistPanel { artist: Artist; topTracks: Track[]; relatedArtists: Artist[] }

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ── Category tiles ────────────────────────────────────────────────────────────
interface Category { label: string; sub: string; slug: string; grad: [string, string]; wide?: boolean }
const CATS: Category[] = [
  { label: 'Hip-Hop', sub: 'Rap & Trap',           slug: 'hip-hop',      wide: true, grad: ['#1a0533','#6D28D9'] },
  { label: 'Pop',     sub: 'Charts & Hits',         slug: 'pop',                      grad: ['#500724','#EC4899'] },
  { label: 'R&B',     sub: 'Soul & Groove',         slug: 'rnb',                      grad: ['#451a03','#D97706'] },
  { label: 'Electronic', sub: 'EDM & Dance',        slug: 'electronic',               grad: ['#082f49','#0284C7'] },
  { label: 'Rock',    sub: 'Guitar & Riffs',        slug: 'rock',                     grad: ['#3b0000','#B91C1C'] },
  { label: 'Indie',   sub: 'Alt & Lo-Fi',           slug: 'indie',                    grad: ['#1F2937','#374151'] },
  { label: 'Latin',   sub: 'Reggaeton & Salsa',     slug: 'latin',                    grad: ['#14290a','#15803D'] },
  { label: 'Desi',    sub: 'Bollywood & More',      slug: 'desi',                     grad: ['#7C2D12','#C2410C'] },
  { label: 'Punjabi', sub: 'Bhangra & Beats',       slug: 'punjabi',                  grad: ['#78350F','#D97706'] },
  { label: 'K-Pop',   sub: 'Korean & Idol',         slug: 'kpop',                     grad: ['#500724','#9D174D'] },
  { label: 'Afrobeats', sub: 'Highlife & Amapiano', slug: 'afrobeats',                grad: ['#431407','#C2410C'] },
  { label: 'Jazz',    sub: 'Cool & Bebop',          slug: 'jazz',                     grad: ['#022c22','#047857'] },
  { label: 'Classical', sub: 'Orchestra & Piano',   slug: 'classical',                grad: ['#1e1b4b','#4338CA'] },
  { label: 'Soul',    sub: 'Motown & Gospel',       slug: 'soul',                     grad: ['#450a0a','#991B1B'] },
  { label: 'Country', sub: 'Folk & Americana',      slug: 'country',                  grad: ['#78350F','#92400E'] },
  { label: 'Metal',   sub: 'Hard & Heavy',          slug: 'metal',                    grad: ['#1F2937','#111827'] },
  { label: 'Folk',    sub: 'Acoustic & Roots',      slug: 'folk',                     grad: ['#1A2E1A','#166534'] },
  { label: 'Workout', sub: 'Gym & High Energy',     slug: 'workout',                  grad: ['#4C1D95','#7C3AED'] },
  { label: 'Chill',   sub: 'Lo-Fi & Relax',         slug: 'chill',                    grad: ['#0C4A6E','#0369A1'] },
  { label: 'Party',   sub: 'Dance & Anthems',       slug: 'party',                    grad: ['#4A1D96','#7C3AED'] },
  { label: 'Focus',   sub: 'Study & Ambient',       slug: 'focus',                    grad: ['#0F2027','#1E3A4A'] },
  { label: 'Romance', sub: 'Love Songs',            slug: 'romance',                  grad: ['#831843','#BE185D'] },
  { label: '90s',     sub: 'Nostalgic Hits',        slug: 'decades-90s',              grad: ['#78350F','#B45309'] },
  { label: '2000s',   sub: 'Y2K Bangers',           slug: 'decades-00s',              grad: ['#1E3A5F','#1E40AF'] },
  { label: '2010s',   sub: 'Decade Classics',       slug: 'decades-10s',              grad: ['#1A1A2E','#312E81'] },
]

type Tab = 'tracks' | 'artists' | 'albums'

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [suggestions, setSuggestions] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('tracks')
  const [artistPanel, setArtistPanel] = useState<ArtistPanel | null>(null)
  const [artistLoading, setArtistLoading] = useState(false)
  const [covers, setCovers] = useState<Record<string, string | null>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const { playTrack } = usePlayerStore()

  // Fetch album art covers for all genre cards on mount
  useEffect(() => {
    const slugs = CATS.map(c => c.slug).join(',')
    fetch(`/api/genre/covers?slugs=${slugs}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.covers) setCovers(d.covers) })
      .catch(() => {})
  }, [])

  // Suggestions — 300ms (was 80ms, caused Spotify 429s)
  const suggestionQuery = useDebounce(query, 300)
  // Main results — 500ms
  const mainQuery = useDebounce(query, 500)

  // Fetch suggestions
  useEffect(() => {
    if (!suggestionQuery.trim()) { setSuggestions(null); return }
    fetch(`/api/search?q=${encodeURIComponent(suggestionQuery)}&type=track,artist`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setSuggestions(d))
      .catch(() => setSuggestions(null))
  }, [suggestionQuery])

  // Fetch full results
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); setSearchError(false); return }
    setLoading(true)
    setSearchError(false)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=track,artist,album`)
      if (res.ok) { setResults(await res.json()); setSearchError(false) }
      else setSearchError(true)
    } catch { setResults(null); setSearchError(true) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { search(mainQuery) }, [mainQuery, search])

  // Auto-load artist panel for top result when search finishes
  useEffect(() => {
    if (results?.tracks?.[0]) loadArtist(results.tracks[0])
  }, [results]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch artist panel — uses artistId if present, falls back to name search
  const loadArtist = useCallback(async (track: Track) => {
    setArtistLoading(true)
    setArtistPanel(null)
    try {
      let artistId = track.artistId
      // Fallback: search by primary artist name to get their Spotify ID
      if (!artistId) {
        const primaryName = track.artist.split(',')[0].trim()
        const res = await fetch(`/api/search?q=${encodeURIComponent(primaryName)}&type=artist`)
        if (res.ok) {
          const data = await res.json()
          artistId = data.artists?.[0]?.spotifyId
        }
      }
      if (!artistId) return
      const res = await fetch(`/api/artists/${artistId}`)
      if (res.ok) setArtistPanel(await res.json())
    } catch { /* silent */ }
    finally { setArtistLoading(false) }
  }, [])

  const pickTrack = useCallback((track: Track, queue: Track[]) => {
    playTrack(track, queue)
    loadArtist(track)
    setFocused(false)
  }, [playTrack, loadArtist])

  const tracks = results?.tracks ?? []
  const artists = results?.artists ?? []
  const albums = results?.albums ?? []
  const hasResults = tracks.length > 0 || artists.length > 0 || albums.length > 0
  const topResult = tracks[0]
  const showSuggestions = focused && query.trim().length > 0 && !!suggestions

  return (
    <div className="min-h-full flex flex-col pb-[68px]">

      {/* ── Sticky search bar ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4">
        <div className="relative max-w-xl">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6A6560] pointer-events-none z-10 flex-shrink-0"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={e => e.key === 'Escape' && (setQuery(''), setFocused(false))}
            placeholder="Artists, songs, podcasts..."
            autoFocus
            className="w-full bg-white/[0.07] border border-white/[0.09] rounded-full pl-10 pr-10 py-2.5
                       text-[14px] text-[#F5F0EB] placeholder-[#4A4540]
                       focus:outline-none focus:border-[#4A7FFF]/40 focus:bg-white/[0.10] transition-all"
          />

          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-[1.5px] border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
            </div>
          )}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResults(null); setSuggestions(null); inputRef.current?.focus() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/[0.15] flex items-center justify-center text-[#8A8580] hover:bg-white/25 hover:text-white transition-all">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}

          {/* ── Suggestions dropdown ──────────────────────────────────── */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50">
              {/* Track suggestions */}
              {suggestions.tracks.slice(0, 5).map(track => (
                <button
                  key={track.id}
                  onMouseDown={() => pickTrack(track, suggestions.tracks)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05]">
                    {track.albumArt && <Image src={track.albumArt} alt="" fill className="object-cover" sizes="36px"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#E0DBD5] group-hover:text-white truncate leading-tight">{track.title}</p>
                    <p className="text-[11px] text-[#5A5550] truncate">Song · {track.artist}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#3A3530] group-hover:text-[#6A6560] flex-shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                  </svg>
                </button>
              ))}

              {/* Artist suggestions */}
              {suggestions.artists.slice(0, 3).length > 0 && (
                <>
                  <div className="mx-4 h-px bg-white/[0.05] my-1"/>
                  {suggestions.artists.slice(0, 3).map(artist => (
                    <button
                      key={artist.id}
                      onMouseDown={() => { setQuery(artist.name); setFocused(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left group"
                    >
                      <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/[0.05]">
                        {artist.image && <Image src={artist.image} alt="" fill className="object-cover" sizes="36px"/>}
                        {!artist.image && (
                          <div className="w-full h-full flex items-center justify-center text-[#3A3530]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#E0DBD5] group-hover:text-white truncate">{artist.name}</p>
                        <p className="text-[11px] text-[#5A5550] truncate">Artist{artist.genres?.[0] ? ` · ${artist.genres[0]}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-6">

        {/* ── Browse categories ──────────────────────────────────────── */}
        {!query && (
          <div className="fade-up">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[18px] font-black text-[#F5F0EB] tracking-tight">Browse</h2>
              <span className="text-[12px] text-[#4A4540]">{CATS.length} genres</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[120px]">
              {CATS.map((cat, i) => {
                const isWide = cat.wide
                const art = covers[cat.slug]
                return (
                  <button
                    key={cat.slug}
                    onClick={() => router.push(`/genre/${cat.slug}`)}
                    className={`group relative overflow-hidden rounded-2xl cursor-pointer
                                 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left
                                 ${isWide ? 'col-span-2 row-span-2' : ''}`}
                    style={{ background: `linear-gradient(145deg, ${cat.grad[0]} 0%, ${cat.grad[1]} 100%)`, boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}
                  >
                    {/* Album art — tilted, bottom-right */}
                    {art && (
                      <div
                        className="absolute overflow-hidden rounded-xl shadow-2xl shadow-black/60 transition-transform duration-300 group-hover:scale-105"
                        style={{
                          width: isWide ? 130 : 76,
                          height: isWide ? 130 : 76,
                          right: isWide ? -14 : -8,
                          bottom: isWide ? -14 : -8,
                          transform: 'rotate(25deg)',
                        }}
                      >
                        <Image src={art} alt="" fill className="object-cover" sizes={isWide ? '130px' : '76px'} />
                      </div>
                    )}
                    {/* Dark gradient overlay so text is always readable */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/60" />
                    {/* Label */}
                    <div className="absolute bottom-0 left-0 p-4">
                      <p className={`font-black text-white leading-tight tracking-tight drop-shadow ${isWide ? 'text-[24px]' : 'text-[14px]'}`}>{cat.label}</p>
                      <p className={`text-white/55 font-medium mt-0.5 drop-shadow ${isWide ? 'text-[13px]' : 'text-[10px]'}`}>{cat.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Search results ─────────────────────────────────────────── */}
        {hasResults && (
          <div className="fade-up flex gap-6">

            {/* Left: results */}
            <div className={`flex-1 min-w-0 transition-all duration-300 ${artistPanel ? 'max-w-[60%]' : ''}`}>
              {/* Fallback source notice */}
              {results?.source === 'youtube' && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 w-fit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#EF4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  <span className="text-[11.5px] text-red-400 font-medium">Showing YouTube results · Spotify is temporarily unavailable</span>
                </div>
              )}
              {results?.source === 'deezer' && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 w-fit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#A855F7"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                  <span className="text-[11.5px] text-purple-400 font-medium">Showing Deezer results · Spotify &amp; YouTube temporarily unavailable</span>
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-1.5 mb-6 flex-wrap">
                {(['tracks', 'artists', 'albums'] as Tab[]).map(tab => {
                  const count = tab === 'tracks' ? tracks.length : tab === 'artists' ? artists.length : albums.length
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all capitalize
                        ${activeTab === tab ? 'bg-white text-black' : 'bg-white/[0.07] text-[#8A8580] hover:bg-white/[0.11] hover:text-[#F5F0EB]'}`}>
                      {tab} <span className="ml-1 opacity-40 text-[11px]">{count}</span>
                    </button>
                  )
                })}
              </div>

              {/* Tracks tab */}
              {activeTab === 'tracks' && (
                <div className="flex gap-5">
                  {topResult && (
                    <div className="hidden lg:flex flex-col gap-2 w-[200px] flex-shrink-0">
                      <p className="text-[10.5px] font-bold text-[#4A4540] uppercase tracking-[0.12em] mb-1">Top result</p>
                      <div
                        onClick={() => pickTrack(topResult, tracks)}
                        className="group relative bg-[#141414] hover:bg-[#1C1C1C] rounded-2xl p-5 cursor-pointer transition-all duration-200"
                      >
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden mb-4 shadow-lg shadow-black/50">
                          {topResult.albumArt && <Image src={topResult.albumArt} alt="" fill className="object-cover" sizes="80px"/>}
                        </div>
                        <p className="text-[15px] font-bold text-[#F5F0EB] truncate leading-tight mb-0.5">{topResult.title}</p>
                        <p className="text-[11.5px] text-[#5A5550] truncate">{topResult.artist}</p>
                        <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[#4A7FFF] flex items-center justify-center
                                        opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                                        hover:scale-105 transition-all duration-200 shadow-lg shadow-[#4A7FFF]/30">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10.5px] font-bold text-[#4A4540] uppercase tracking-[0.12em] mb-3">Songs</p>
                    <div className="flex flex-col gap-0.5">
                      {tracks.map((track, i) => (
                        <div key={track.id} onClick={() => loadArtist(track)}>
                          <TrackCard track={track} queue={tracks} index={i} showIndex />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* More by top artist */}
              {activeTab === 'tracks' && artistPanel && artistPanel.topTracks.length > 0 && (
                <div className="mt-8">
                  <p className="text-[10.5px] font-bold text-[#4A4540] uppercase tracking-[0.12em] mb-3">
                    More by {artistPanel.artist.name}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {artistPanel.topTracks.map((track, i) => (
                      <div key={track.id} onClick={() => loadArtist(track)}>
                        <TrackCard track={track} queue={artistPanel.topTracks} index={i} showIndex />
                      </div>
                    ))}
                  </div>
                  {artistPanel.relatedArtists.length > 0 && (
                    <div className="mt-6">
                      <p className="text-[10.5px] font-bold text-[#4A4540] uppercase tracking-[0.12em] mb-4">Fans also like</p>
                      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                        {artistPanel.relatedArtists.slice(0, 8).map(a => (
                          <button key={a.id} onClick={async () => {
                            setArtistLoading(true); setArtistPanel(null)
                            const res = await fetch(`/api/artists/${a.spotifyId}`)
                            if (res.ok) setArtistPanel(await res.json())
                            setArtistLoading(false)
                          }} className="flex flex-col items-center gap-2 flex-shrink-0 w-[80px] group">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/[0.06]">
                              {a.image
                                ? <Image src={a.image} alt="" fill className="object-cover group-hover:scale-105 transition-transform" sizes="64px"/>
                                : <div className="w-full h-full flex items-center justify-center text-[#3A3530]"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                              }
                            </div>
                            <p className="text-[11px] text-[#6A6560] group-hover:text-white text-center leading-tight truncate w-full transition-colors">{a.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Artists tab */}
              {activeTab === 'artists' && artists.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold text-[#4A4540] uppercase tracking-[0.12em] mb-4">Artists</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5">
                    {artists.map(artist => (
                      <button key={artist.id} onClick={async () => {
                        setArtistLoading(true); setArtistPanel(null)
                        const res = await fetch(`/api/artists/${artist.spotifyId}`)
                        if (res.ok) setArtistPanel(await res.json())
                        setArtistLoading(false)
                      }} className="text-left">
                        <AlbumCard title={artist.name} subtitle={artist.genres?.[0] ?? 'Artist'} imageUrl={artist.image} round />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums tab */}
              {activeTab === 'albums' && albums.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold text-[#4A4540] uppercase tracking-[0.12em] mb-4">Albums</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                    {albums.map(album => (
                      <AlbumCard key={album.id} title={album.title} subtitle={album.artist} imageUrl={album.albumArt} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Artist panel ─────────────────────────────────────── */}
            {(artistPanel || artistLoading) && (
              <div className="w-[300px] flex-shrink-0 self-start sticky top-[88px]">
                {artistLoading && (
                  <div className="rounded-2xl bg-white/[0.04] h-[480px] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin"/>
                  </div>
                )}

                {artistPanel && !artistLoading && (
                  <div className="rounded-2xl overflow-hidden bg-[#111111] border border-white/[0.06]">
                    {/* Artist hero image */}
                    <div className="relative h-[200px]">
                      {artistPanel.artist.image ? (
                        <>
                          <Image src={artistPanel.artist.image} alt={artistPanel.artist.name} fill className="object-cover" sizes="300px"/>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent"/>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#4A7FFF]/20 to-[#C0392B]/10 flex items-center justify-center">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4A7FFF" strokeWidth="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                      )}
                      {/* Close button */}
                      <button onClick={() => setArtistPanel(null)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                      {/* Artist name */}
                      <div className="absolute bottom-3 left-4">
                        <p className="text-[20px] font-black text-white leading-tight tracking-tight">{artistPanel.artist.name}</p>
                        {artistPanel.artist.genres?.[0] && (
                          <p className="text-[11px] text-[#8A8580] capitalize mt-0.5">{artistPanel.artist.genres.slice(0, 2).join(' · ')}</p>
                        )}
                      </div>
                    </div>

                    {/* Top tracks */}
                    <div className="px-4 py-4">
                      <p className="text-[10.5px] font-bold text-[#4A4540] uppercase tracking-[0.12em] mb-3">Popular tracks</p>
                      <div className="flex flex-col gap-0.5">
                        {artistPanel.topTracks.slice(0, 10).map((track, i) => (
                          <button key={track.id} onClick={() => pickTrack(track, artistPanel.topTracks)}
                            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.06] transition-colors group text-left">
                            <span className="text-[11px] text-[#3A3530] w-4 text-center flex-shrink-0 font-semibold group-hover:hidden">{i + 1}</span>
                            <svg className="w-4 h-4 text-[#4A7FFF] hidden group-hover:block flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                              {track.albumArt && <Image src={track.albumArt} alt="" fill className="object-cover" sizes="32px"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12.5px] font-semibold text-[#C0BBB5] group-hover:text-white truncate transition-colors">{track.title}</p>
                              <p className="text-[10.5px] text-[#4A4540] truncate">{track.album}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Related artists */}
                    {artistPanel.relatedArtists.length > 0 && (
                      <div className="px-4 pb-4">
                        <p className="text-[10.5px] font-bold text-[#4A4540] uppercase tracking-[0.12em] mb-3">Fans also like</p>
                        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                          {artistPanel.relatedArtists.slice(0, 6).map(a => (
                            <button key={a.id} onClick={async () => {
                              setArtistLoading(true); setArtistPanel(null)
                              const res = await fetch(`/api/artists/${a.spotifyId}`)
                              if (res.ok) setArtistPanel(await res.json())
                              setArtistLoading(false)
                            }} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[64px] group">
                              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white/[0.06] flex-shrink-0">
                                {a.image ? <Image src={a.image} alt="" fill className="object-cover group-hover:scale-105 transition-transform" sizes="56px"/> :
                                  <div className="w-full h-full flex items-center justify-center text-[#3A3530]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                                }
                              </div>
                              <p className="text-[10px] text-[#6A6560] group-hover:text-white text-center leading-tight truncate w-full transition-colors">{a.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* API error (rate limit etc.) */}
        {searchError && !loading && query && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 fade-up">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A4540" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#4A4540"/></svg>
            </div>
            <p className="text-[14px] font-semibold text-[#F5F0EB]">Search unavailable right now</p>
            <p className="text-[12px] text-[#4A4540]">Spotify is rate limiting — wait a moment and try again</p>
            <button onClick={() => search(query)} className="mt-1 text-[12px] font-bold text-[#4A7FFF] hover:text-[#93C5FD] transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* No results */}
        {results && !hasResults && !loading && query && !searchError && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 fade-up">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2A" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <p className="text-[14px] font-semibold text-[#F5F0EB]">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-[12px] text-[#4A4540]">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
