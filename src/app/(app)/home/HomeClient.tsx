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

// ── Spotify green ─────────────────────────────────────────────
const GREEN = '#1DB954'

// ── Section header — Spotify style ────────────────────────────
function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[22px] font-bold text-white">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-[12px] font-bold text-[#A7A7A7] hover:text-white uppercase tracking-wide transition-colors"
        >
          Show all
        </Link>
      )}
    </div>
  )
}

// ── Horizontal scroll carousel ────────────────────────────────
function HScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
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

  const scroll = (dir: 'left' | 'right') =>
    ref.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })

  return (
    <div className="relative -mx-1">
      {canLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-8 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-[#282828] hover:bg-[#3E3E3E] transition-colors shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-8 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-[#282828] hover:bg-[#3E3E3E] transition-colors shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}
      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto pb-2 px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Square card — Spotify style ────────────────────────────────
function SquareCard({ track, queue, size = 180 }: { track: Track; queue: Track[]; size?: number }) {
  const { playTrack } = usePlayerStore()
  return (
    <button
      onClick={() => playTrack(track, queue)}
      className="flex-shrink-0 group text-left rounded-md p-3 transition-colors hover:bg-[#282828]"
      style={{ width: size + 24 }}
    >
      <div
        className="relative rounded-md overflow-hidden mb-3 shadow-xl"
        style={{ width: size, height: size, background: '#282828' }}
      >
        {track.albumArt && (
          <Image
            src={track.albumArt} alt={track.title} fill
            className="object-cover" sizes={`${size}px`}
          />
        )}
        {/* Green play button on hover */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: GREEN, boxShadow: `0 8px 24px rgba(0,0,0,0.5)` }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="black" style={{ marginLeft: 2 }}>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>
      </div>
      <p className="text-[14px] font-semibold text-white truncate mb-1">{track.title}</p>
      <p className="text-[13px] text-[#A7A7A7] truncate">{track.artist}</p>
    </button>
  )
}

// ── Onboarding modal ───────────────────────────────────────────
function OnboardingModal({ username, onDismiss }: { username: string | null; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="rounded-lg shadow-2xl w-[400px] p-8 flex flex-col items-center text-center gap-6"
        style={{ background: '#282828' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: GREEN }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.5 7 4 11 4 14a8 8 0 0 0 16 0c0-3-2.5-7-8-12z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-white mb-2">
            Welcome to Ember{username ? `, ${username}` : ''}
          </h2>
          <p className="text-[14px] text-[#A7A7A7] leading-relaxed">
            Your personal music universe. Discover songs, track your listening, journal your memories.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/search" onClick={onDismiss}
            className="w-full py-3 rounded-full text-[14px] font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: GREEN }}
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
  const [heroLiked, setHeroLiked]             = useState(false)
  const [heroLikeLoading, setHeroLikeLoading] = useState(false)
  const [showOnboarding, setShowOnboarding]   = useState(false)

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

  const upNextList = trendingTracks.length ? trendingTracks : topHistoryTracks

  return (
    <>
      {showOnboarding && (
        <OnboardingModal username={username} onDismiss={dismissOnboarding} />
      )}

      <div className="min-h-full" style={{ background: '#121212' }}>

        {/* ── Greeting ───────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-2">
          <h1 className="text-[28px] font-bold text-white">{greeting}</h1>
        </div>

        {/* ── Quick picks grid ───────────────────────────────────── */}
        {trendingTracks.length > 0 && (
          <div className="px-6 pt-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {trendingTracks.slice(0, 6).map(track => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track, trendingTracks)}
                  className="flex items-center gap-3 rounded-md overflow-hidden text-left transition-colors group"
                  style={{ background: '#282828' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#3E3E3E')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#282828')}
                >
                  <div className="relative w-[52px] h-[52px] flex-shrink-0">
                    {track.albumArt && (
                      <Image src={track.albumArt} alt="" fill className="object-cover" sizes="52px" />
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-white pr-3 truncate flex-1">
                    {track.title}
                  </span>
                  {/* Play button */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-3 flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: GREEN }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="black" style={{ marginLeft: 1 }}>
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Feed sections ──────────────────────────────────────── */}
        <div className="px-6 pb-8 flex flex-col gap-8 mt-8">

          {/* Hero track — featured */}
          {heroTrack && (
            <section>
              <SectionHeader title="Featured" />
              <div
                className="flex items-center gap-5 rounded-md p-4 transition-colors"
                style={{ background: '#181818' }}
              >
                {/* Album art */}
                <div className="relative w-[120px] h-[120px] flex-shrink-0 rounded-md overflow-hidden shadow-2xl">
                  {heroTrack.albumArt && (
                    <Image src={heroTrack.albumArt} alt="" fill className="object-cover" sizes="120px" priority />
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#A7A7A7] mb-1 uppercase tracking-wider font-semibold">Song</p>
                  <h2 className="text-[26px] font-bold text-white leading-tight truncate mb-1">
                    {heroTrack.title}
                  </h2>
                  <p className="text-[14px] text-[#A7A7A7] mb-4">{heroTrack.artist}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => playTrack(heroTrack, heroQueue)}
                      className="flex items-center gap-2 text-[14px] font-bold text-black px-7 py-3 rounded-full transition-all hover:scale-[1.04] active:scale-[0.97]"
                      style={{ background: GREEN }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}>
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Play
                    </button>
                    <button
                      onClick={toggleHeroLike}
                      disabled={heroLikeLoading}
                      className="flex items-center gap-2 text-[14px] font-semibold px-5 py-2.5 rounded-full border transition-all"
                      style={{
                        borderColor: heroLiked ? GREEN : '#535353',
                        color: heroLiked ? GREEN : '#A7A7A7',
                        background: 'transparent',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24"
                        fill={heroLiked ? 'currentColor' : 'none'}
                        stroke="currentColor" strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      {heroLiked ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Up next */}
                {upNextList.length > 1 && (
                  <div className="hidden lg:flex flex-col gap-1 w-[220px] flex-shrink-0 border-l border-[#282828] pl-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A7A7A7] mb-2">
                      Up next
                    </p>
                    {upNextList.slice(1, 5).map((track, i) => (
                      <button
                        key={track.id}
                        onClick={() => playTrack(track, upNextList)}
                        className="flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-left group"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#282828')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span className="text-[12px] w-4 text-center text-[#A7A7A7] flex-shrink-0">{i + 2}</span>
                        <div className="relative w-8 h-8 rounded flex-shrink-0 overflow-hidden">
                          {track.albumArt && (
                            <Image src={track.albumArt} alt="" fill className="object-cover" sizes="32px" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-white truncate">{track.title}</p>
                          <p className="text-[11px] text-[#A7A7A7] truncate">{track.artist}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Your top tracks */}
          {topHistoryTracks.length > 0 && (
            <section>
              <SectionHeader
                title={topHistoryArtists.length > 0
                  ? `Top picks for ${username ?? 'you'}`
                  : 'Your favourites'}
              />
              {topHistoryArtists.length > 0 && (
                <p className="text-[13px] -mt-2 mb-4 text-[#A7A7A7]">
                  Based on {topHistoryArtists.slice(0, 3).join(', ')}
                </p>
              )}
              <HScroll>
                {topHistoryTracks.map(t => (
                  <SquareCard key={t.id} track={t} queue={topHistoryTracks} />
                ))}
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
                {recommendedTracks.map(t => (
                  <SquareCard key={t.id} track={t} queue={recommendedTracks} />
                ))}
              </HScroll>
            </section>
          )}

          {/* Regional */}
          {regionalTracks.length > 0 && regionalLabel && (
            <section>
              <SectionHeader title={regionalLabel} />
              <HScroll>
                {regionalTracks.map(t => (
                  <SquareCard key={t.id} track={t} queue={regionalTracks} />
                ))}
              </HScroll>
            </section>
          )}

          {/* Recently played */}
          {recentlyPlayed.length > 0 && (
            <section>
              <SectionHeader title="Recently played" />
              <HScroll>
                {recentlyPlayed.map(t => (
                  <SquareCard key={t.id} track={t} queue={recentlyPlayed} />
                ))}
              </HScroll>
            </section>
          )}

          {/* New releases */}
          {newReleases.length > 0 && (
            <section>
              <SectionHeader title="New releases" />
              <HScroll>
                {newReleases.map(album => (
                  <div key={album.id} className="w-[204px] flex-shrink-0">
                    <AlbumCard
                      title={album.title}
                      subtitle={album.artist}
                      imageUrl={album.albumArt}
                    />
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
                  <div key={t.id} className="w-[204px] flex-shrink-0">
                    <AlbumCard
                      title={t.title}
                      subtitle={t.artist}
                      imageUrl={t.albumArt}
                      firstTrack={t}
                      tracks={chillTracks}
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
