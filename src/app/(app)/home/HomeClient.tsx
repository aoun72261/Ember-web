'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import AlbumCard from '@/components/AlbumCard'
import TrackCard from '@/components/TrackCard'
import { usePlayerStore } from '@/store/playerStore'
import type { Track, Album } from '@/types/index'

interface Props {
  greeting: string
  username: string | null
  avatarUrl: string | null
  heroTrack: Track | null
  heroQueue: Track[]
  newReleases: Album[]
  trendingTracks: Track[]
  chillTracks: Track[]
  recentlyPlayed: Track[]
  topHistoryTracks: Track[]
  topHistoryArtists: string[]
  recommendedTracks: Track[]
  recommendedBasedOn: string[]
  regionalTracks: Track[]
  regionalLabel: string | null
}

// ── Extract dominant color from an image URL via canvas ──────────
async function extractColor(src: string): Promise<string> {
  return new Promise(resolve => {
    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = 50; c.height = 50
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0, 50, 50)
        const d = ctx.getImageData(0, 0, 50, 50).data
        let r = 0, g = 0, b = 0
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2] }
        const n = d.length / 4
        // Darken the color for the Spotify-style subtle gradient
        resolve(`${Math.round(r / n * 0.4)},${Math.round(g / n * 0.4)},${Math.round(b / n * 0.4)}`)
      } catch {
        resolve('30,20,40')
      }
    }
    img.onerror = () => resolve('30,20,40')
    img.src = src
  })
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[22px] font-bold text-white hover:underline cursor-default">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-[11px] font-bold text-[#A7A7A7] hover:text-white uppercase tracking-widest transition-colors"
        >
          Show all
        </Link>
      )}
    </div>
  )
}

// ── Horizontal scroll carousel ─────────────────────────────────
function HScroll({ children }: { children: React.ReactNode }) {
  const ref                       = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(false)

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', check); ro.disconnect() }
  }, [check])

  const scroll = (d: 'left' | 'right') =>
    ref.current?.scrollBy({ left: d === 'left' ? -350 : 350, behavior: 'smooth' })

  return (
    <div className="relative">
      {canLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-[72px] -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-[#3E3E3E] hover:bg-[#4E4E4E] shadow-xl transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-[72px] -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-[#3E3E3E] hover:bg-[#4E4E4E] shadow-xl transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}
      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Spotify-style square card ──────────────────────────────────
function SquareCard({ track, queue }: { track: Track; queue: Track[] }) {
  const { playTrack } = usePlayerStore()
  const SIZE = 160
  return (
    <button
      onClick={() => playTrack(track, queue)}
      className="flex-shrink-0 group text-left rounded-md p-3 transition-colors"
      style={{ width: SIZE + 24, background: 'transparent' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#282828')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <div
        className="relative rounded-md overflow-hidden mb-3 shadow-xl"
        style={{ width: SIZE, height: SIZE, background: '#282828' }}
      >
        {track.albumArt && (
          <Image src={track.albumArt} alt={track.title} fill className="object-cover" sizes={`${SIZE}px`} />
        )}
        {/* Spotify green play button */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: '#1DB954', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="black" style={{ marginLeft: 2 }}>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>
      </div>
      <p className="text-[14px] font-semibold text-white truncate mb-1">{track.title}</p>
      <p className="text-[12px] text-[#A7A7A7] truncate leading-snug">{track.artist}</p>
    </button>
  )
}

// ── Onboarding modal ───────────────────────────────────────────
function OnboardingModal({ username, onDismiss }: { username: string | null; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-lg shadow-2xl w-[400px] p-8 flex flex-col items-center text-center gap-6" style={{ background: '#282828' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#1DB954' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.5 7 4 11 4 14a8 8 0 0 0 16 0c0-3-2.5-7-8-12z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-[22px] font-bold text-white mb-2">
            Welcome to Ember{username ? `, ${username}` : ''}
          </h2>
          <p className="text-[14px] text-[#A7A7A7] leading-relaxed">
            Your personal music universe. Discover songs, track your listening, journal your memories.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/search" onClick={onDismiss}
            className="w-full py-3 rounded-full text-[14px] font-bold text-black transition-all hover:scale-[1.02]"
            style={{ background: '#1DB954' }}
          >
            Start exploring
          </Link>
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-full text-[14px] font-semibold text-white border border-[#535353] hover:border-white transition-colors"
          >
            I&apos;ll look around
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function HomeClient({
  greeting, username,
  heroTrack, heroQueue,
  newReleases, trendingTracks, chillTracks,
  recentlyPlayed, topHistoryTracks, topHistoryArtists,
  recommendedTracks, recommendedBasedOn,
  regionalTracks, regionalLabel,
}: Props) {
  const { playTrack } = usePlayerStore()
  const [heroLiked, setHeroLiked]           = useState(false)
  const [heroLikeLoading, setHeroLikeLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [headerBg, setHeaderBg]             = useState('30,20,50')
  const [mounted, setMounted]               = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Extract dominant color for gradient banner
  useEffect(() => {
    if (!mounted) return
    const art = heroTrack?.albumArt ?? recentlyPlayed[0]?.albumArt ?? trendingTracks[0]?.albumArt
    if (!art) return
    extractColor(art).then(setHeaderBg)
  }, [mounted, heroTrack?.albumArt]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window !== 'undefined'
      && !localStorage.getItem('ember_onboarded')
      && !recentlyPlayed.length
      && !topHistoryTracks.length) {
      setShowOnboarding(true)
    }
  }, [recentlyPlayed.length, topHistoryTracks.length])

  const dismissOnboarding = () => {
    localStorage.setItem('ember_onboarded', '1')
    setShowOnboarding(false)
  }

  useEffect(() => {
    if (!heroTrack) return
    fetch(`/api/likes?trackId=${heroTrack.spotifyId}`)
      .then(r => r.json()).then(d => setHeroLiked(d.liked)).catch(() => {})
  }, [heroTrack?.spotifyId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleHeroLike = async () => {
    if (!heroTrack || heroLikeLoading) return
    setHeroLikeLoading(true)
    if (heroLiked) {
      await fetch(`/api/likes?trackId=${heroTrack.spotifyId}`, { method: 'DELETE' })
      setHeroLiked(false)
    } else {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: heroTrack }),
      })
      setHeroLiked(true)
    }
    setHeroLikeLoading(false)
  }

  return (
    <>
      {showOnboarding && <OnboardingModal username={username} onDismiss={dismissOnboarding} />}

      <div className="min-h-full" style={{ background: '#121212' }}>

        {/* ── Gradient banner header ──────────────────────────────── */}
        <div
          style={{
            background: `linear-gradient(to bottom, rgb(${headerBg}) 0%, rgba(${headerBg},0.5) 60%, #121212 100%)`,
            transition: 'background 0.6s ease',
          }}
        >
          {/* Greeting */}
          <div className="px-6 pt-5 pb-3">
            <h1 className="text-[28px] font-bold text-white">{greeting}</h1>
          </div>

          {/* ── Quick picks (4-column grid, 2 rows) ────────────────── */}
          {trendingTracks.length > 0 && (
            <div className="px-6 pb-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {trendingTracks.slice(0, 8).map(track => (
                  <button
                    key={track.id}
                    onClick={() => playTrack(track, trendingTracks)}
                    className="flex items-center gap-0 rounded overflow-hidden text-left transition-colors group"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}
                  >
                    {/* Album art — left, flush, square */}
                    <div className="relative w-[52px] h-[52px] flex-shrink-0">
                      {track.albumArt ? (
                        <Image src={track.albumArt} alt="" fill className="object-cover" sizes="52px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: '#535353' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="1.5">
                            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Track name */}
                    <span className="text-[13px] font-semibold text-white px-3 truncate flex-1 leading-none">
                      {track.title}
                    </span>
                    {/* Play indicator on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-3 flex-shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: '#1DB954' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="black" style={{ marginLeft: 1 }}>
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Content sections ────────────────────────────────────── */}
        <div className="px-6 pb-8 flex flex-col gap-8 mt-4">

          {/* Featured (Jump back in style) */}
          {heroTrack && (
            <section>
              <SectionHeader title="Featured" />
              <div
                className="flex items-center gap-5 rounded-md p-4 group cursor-pointer"
                style={{ background: '#181818' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#282828')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#181818')}
                onClick={() => playTrack(heroTrack, heroQueue)}
              >
                {/* Album art */}
                <div className="relative w-[80px] h-[80px] flex-shrink-0 rounded shadow-2xl overflow-hidden">
                  {heroTrack.albumArt && (
                    <Image src={heroTrack.albumArt} alt="" fill className="object-cover" sizes="80px" priority />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#A7A7A7] uppercase tracking-wider mb-1">Song</p>
                  <p className="text-[18px] font-bold text-white truncate">{heroTrack.title}</p>
                  <p className="text-[13px] text-[#A7A7A7] truncate">{heroTrack.artist}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); toggleHeroLike() }}
                    disabled={heroLikeLoading}
                    className="p-2 text-[#A7A7A7] hover:text-white transition-colors"
                    title={heroLiked ? 'Remove from liked' : 'Save to liked'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24"
                      fill={heroLiked ? '#1DB954' : 'none'}
                      stroke={heroLiked ? '#1DB954' : 'currentColor'}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 shadow-xl"
                    style={{ background: '#1DB954' }}
                    onClick={e => { e.stopPropagation(); playTrack(heroTrack, heroQueue) }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="black" style={{ marginLeft: 2 }}>
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Your top tracks */}
          {topHistoryTracks.length > 0 && (
            <section>
              <SectionHeader
                title={topHistoryArtists.length > 0 ? `Top picks for ${username ?? 'you'}` : 'Your favourites'}
              />
              {topHistoryArtists.length > 0 && (
                <p className="text-[13px] -mt-2 mb-4 text-[#A7A7A7]">
                  Based on {topHistoryArtists.slice(0, 3).join(', ')}
                </p>
              )}
              <HScroll>
                {topHistoryTracks.map(t => <SquareCard key={t.id} track={t} queue={topHistoryTracks} />)}
              </HScroll>
            </section>
          )}

          {/* Made for you */}
          {recommendedTracks.length > 0 && (
            <section>
              <SectionHeader title="Made for you" />
              {recommendedBasedOn.length > 0 && (
                <p className="text-[13px] -mt-2 mb-4 text-[#A7A7A7]">
                  Based on {recommendedBasedOn.slice(0, 3).join(', ')}
                </p>
              )}
              <HScroll>
                {recommendedTracks.map(t => <SquareCard key={t.id} track={t} queue={recommendedTracks} />)}
              </HScroll>
            </section>
          )}

          {/* Jump back in (recently played) */}
          {recentlyPlayed.length > 0 && (
            <section>
              <SectionHeader title="Jump back in" />
              <HScroll>
                {recentlyPlayed.map(t => <SquareCard key={t.id} track={t} queue={recentlyPlayed} />)}
              </HScroll>
            </section>
          )}

          {/* Regional */}
          {regionalTracks.length > 0 && regionalLabel && (
            <section>
              <SectionHeader title={regionalLabel} />
              <HScroll>
                {regionalTracks.map(t => <SquareCard key={t.id} track={t} queue={regionalTracks} />)}
              </HScroll>
            </section>
          )}

          {/* New releases */}
          {newReleases.length > 0 && (
            <section>
              <SectionHeader title="New releases" />
              <HScroll>
                {newReleases.map(album => (
                  <div key={album.id} className="flex-shrink-0" style={{ width: 184 }}>
                    <AlbumCard title={album.title} subtitle={album.artist} imageUrl={album.albumArt} />
                  </div>
                ))}
              </HScroll>
            </section>
          )}

          {/* Trending */}
          {trendingTracks.length > 0 && (
            <section>
              <SectionHeader title="Trending right now" />
              <div className="rounded-md overflow-hidden" style={{ background: '#181818' }}>
                {trendingTracks.slice(0, 8).map((track, i) => (
                  <div
                    key={track.id}
                    className="transition-colors"
                    style={{ borderBottom: i < 7 ? '1px solid #282828' : 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = '#282828')}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                  >
                    <TrackCard track={track} queue={trendingTracks} index={i} showIndex />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Chill out */}
          {chillTracks.length > 0 && (
            <section>
              <SectionHeader title="Chill out" />
              <HScroll>
                {chillTracks.map(t => (
                  <div key={t.id} className="flex-shrink-0" style={{ width: 184 }}>
                    <AlbumCard
                      title={t.title} subtitle={t.artist}
                      imageUrl={t.albumArt} firstTrack={t} tracks={chillTracks}
                    />
                  </div>
                ))}
              </HScroll>
            </section>
          )}

          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
