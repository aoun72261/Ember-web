'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

// ── Amber accent instead of blue ──────────────────────────────
const A = '#F97316'   // amber primary
const A2 = '#A855F7' // purple secondary

// ── Section header — matches the warm aesthetic ────────────────
function SectionHeader({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        {sub && (
          <p className="text-[10.5px] font-black uppercase tracking-[0.2em] mb-1.5"
            style={{ color: A }}>{sub}</p>
        )}
        <h2 className="text-[19px] font-black text-white/90 tracking-tight drop-shadow">{title}</h2>
      </div>
      {href && (
        <Link href={href}
          className="text-[12px] font-semibold transition-colors"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => (e.currentTarget.style.color = A)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
          Show all →
        </Link>
      )}
    </div>
  )
}

// ── Glass card wrapper ─────────────────────────────────────────
function Glass({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] ${className}`}
      style={{
        background: 'rgba(14, 8, 28, 0.52)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Horizontal scroll with arrow buttons ──────────────────────
function HScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
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

  const scroll = (dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  return (
    <div className="relative -mx-6">
      {/* Left arrow */}
      {canLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(14,8,28,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}
      {/* Right arrow */}
      {canRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(14,8,28,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 px-6" style={{ scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
  )
}

// ── Square card — amber play button, glass hover ───────────────
function SquareCard({ track, queue, size = 155 }: { track: Track; queue: Track[]; size?: number }) {
  const { playTrack } = usePlayerStore()
  return (
    <button onClick={() => playTrack(track, queue)} className="flex-shrink-0 group text-left" style={{ width: size }}>
      <div className="relative rounded-2xl overflow-hidden mb-3 border border-white/[0.06]"
        style={{ width: size, height: size, background: 'rgba(255,255,255,0.04)' }}>
        {track.albumArt && (
          <Image src={track.albumArt} alt={track.title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500" sizes={`${size}px`} />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-xl ml-auto"
            style={{ background: A, boxShadow: `0 4px 20px rgba(249,115,22,0.55)` }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>
      <p className="text-[13px] font-semibold text-white/80 group-hover:text-white truncate transition-colors drop-shadow">{track.title}</p>
      <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{track.artist}</p>
    </button>
  )
}

// ── Top bar — fully transparent, glass on scroll ──────────────
function TopBar({ greeting, username, avatarUrl }: {
  greeting: string; username: string | null; avatarUrl: string | null
}) {
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = ref.current?.closest('.overflow-y-auto')
    if (!parent) return
    const onScroll = () => setScrolled(parent.scrollTop > 40)
    parent.addEventListener('scroll', onScroll, { passive: true })
    return () => parent.removeEventListener('scroll', onScroll)
  }, [])

  const initial = username ? username[0].toUpperCase() : 'U'
  return (
    <div ref={ref} className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(14,8,28,0.80)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}>
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-medium drop-shadow" style={{ color: 'rgba(255,255,255,0.55)' }}>{greeting}</span>
        {username && <span className="text-[14px] font-black text-white drop-shadow">{username} ✦</span>}
      </div>
      <div className="flex items-center gap-2.5">
        <Link href="/search"
          className="w-9 h-9 rounded-full flex items-center justify-center border border-white/[0.12] transition-all hover:border-white/30"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </Link>
        <button className="w-9 h-9 rounded-full flex items-center justify-center border border-white/[0.12] transition-all hover:border-white/30"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <Link href="/profile"
          className="w-9 h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-105"
          style={{ borderColor: `rgba(249,115,22,0.5)`, boxShadow: `0 0 12px rgba(249,115,22,0.3)` }}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profile" width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[13px] font-black text-white"
              style={{ background: `linear-gradient(135deg, ${A}, ${A2})` }}>{initial}</div>
          )}
        </Link>
      </div>
    </div>
  )
}

// ── Onboarding ─────────────────────────────────────────────────
function OnboardingModal({ username, onDismiss }: { username: string | null; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="rounded-3xl shadow-2xl w-[400px] p-8 flex flex-col items-center text-center gap-5 border border-white/[0.1]"
        style={{ background: 'rgba(14,8,28,0.9)', backdropFilter: 'blur(30px)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${A}, ${A2})`, boxShadow: `0 8px 24px rgba(249,115,22,0.4)` }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.5 7 4 11 4 14a8 8 0 0 0 16 0c0-3-2.5-7-8-12z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-[24px] font-black text-white">Welcome to Ember{username ? `, ${username}` : ''}</h2>
          <p className="text-[13px] mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Your personal music universe. Discover songs, track your listening, journal your memories.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Link href="/search" onClick={onDismiss}
            className="w-full py-3 rounded-xl text-[13px] font-black text-white transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${A}, ${A2})` }}>
            Start exploring
          </Link>
          <button onClick={onDismiss}
            className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all hover:bg-white/[0.1]"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            I&apos;ll look around
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function HomeClient({
  greeting, username, avatarUrl,
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
  const [videoReady, setVideoReady]           = useState(false)
  const [mounted, setMounted]                 = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('ember_onboarded')
      && !recentlyPlayed.length && !topHistoryTracks.length) {
      setShowOnboarding(true)
    }
  }, [recentlyPlayed.length, topHistoryTracks.length])

  const dismissOnboarding = () => { localStorage.setItem('ember_onboarded', '1'); setShowOnboarding(false) }

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
      await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track: heroTrack }) })
      setHeroLiked(true)
    }
    setHeroLikeLoading(false)
  }

  const upNextList = trendingTracks.length ? trendingTracks : topHistoryTracks

  return (
    <>
      {showOnboarding && <OnboardingModal username={username} onDismiss={dismissOnboarding} />}

      {/* ── Anime video background — portaled to body to escape overflow clipping ── */}
      {mounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <video
            autoPlay muted loop playsInline
            onLoadedData={() => setVideoReady(true)}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: videoReady ? 1 : 0,
              transition: 'opacity 1.2s ease',
            }}
          >
            <source src="/luffy-meditation.3840x2160.mp4" type="video/mp4" />
          </video>
          {/* dark wash */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,4,16,0.60)' }} />
          {/* top-to-bottom vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(14,8,28,0.25) 0%, transparent 30%, transparent 65%, rgba(8,5,20,0.88) 100%)' }} />
          {/* ambient flame/purple haze */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 15% 85%, rgba(168,85,247,0.09) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 15%, rgba(249,115,22,0.07) 0%, transparent 60%)' }} />
        </div>,
        document.body
      )}

      <div className="min-h-full relative" style={{ zIndex: 1 }}>

        {/* ── Top bar ─────────────────────────────────────────── */}
        <TopBar greeting={greeting} username={username} avatarUrl={avatarUrl} />

        {/* ── Hero ────────────────────────────────────────────── */}
        {heroTrack && (
          <div className="px-8 pt-2 pb-8">
            <Glass className="overflow-hidden" style={{ background: 'rgba(12, 7, 25, 0.55)' }}>
              <div className="flex items-center gap-6 p-6">
                {/* Album art */}
                <div className="relative w-[130px] h-[130px] flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/[0.08]"
                  style={{ boxShadow: `0 8px 40px rgba(249,115,22,0.3)` }}>
                  {heroTrack.albumArt && (
                    <Image src={heroTrack.albumArt} alt="" fill className="object-cover" sizes="130px" priority />
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: A }}>
                    ✦ Featured
                  </p>
                  <h1 className="text-[28px] font-black text-white leading-tight tracking-tight truncate drop-shadow-lg mb-1">
                    {heroTrack.title}
                  </h1>
                  <p className="text-[13px] font-medium mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {heroTrack.artist}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => playTrack(heroTrack, heroQueue)}
                      className="flex items-center gap-2.5 text-[13px] font-black text-white px-6 py-2.5 rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: `linear-gradient(135deg, ${A}, #FB923C)`,
                        boxShadow: `0 4px 20px rgba(249,115,22,0.5)`,
                      }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 1 }}>
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Play now
                    </button>
                    <button
                      onClick={toggleHeroLike} disabled={heroLikeLoading}
                      className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-full border transition-all"
                      style={{
                        borderColor: heroLiked ? `rgba(249,115,22,0.5)` : 'rgba(255,255,255,0.15)',
                        color: heroLiked ? A : 'rgba(255,255,255,0.55)',
                        background: heroLiked ? `rgba(249,115,22,0.12)` : 'rgba(255,255,255,0.05)',
                      }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={heroLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      {heroLiked ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Up next */}
                {upNextList.length > 1 && (
                  <div className="hidden lg:flex flex-col gap-0.5 w-[220px] flex-shrink-0 border-l border-white/[0.06] pl-5">
                    <p className="text-[9.5px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Up next
                    </p>
                    {upNextList.slice(1, 5).map((track, i) => (
                      <button key={track.id} onClick={() => playTrack(track, upNextList)}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all group text-left"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span className="text-[10px] w-3 text-center font-semibold flex-shrink-0"
                          style={{ color: 'rgba(255,255,255,0.25)' }}>{i + 2}</span>
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.08]">
                          {track.albumArt && <Image src={track.albumArt} alt="" fill className="object-cover" sizes="28px" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] font-semibold truncate transition-colors"
                            style={{ color: 'rgba(255,255,255,0.7)' }}>{track.title}</p>
                          <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{track.artist}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Glass>
          </div>
        )}

        {/* ── Feed ────────────────────────────────────────────── */}
        <div className="px-8 pb-10 flex flex-col gap-10">

          {/* 1. Quick picks grid */}
          {trendingTracks.length > 0 && (
            <section>
              <SectionHeader title={`Good picks for ${username ?? 'you'}`} />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {trendingTracks.slice(0, 6).map(track => (
                  <button key={track.id} onClick={() => playTrack(track, trendingTracks)}
                    className="flex items-center gap-3 rounded-2xl overflow-hidden pr-4 transition-all group text-left border border-white/[0.06] hover:border-white/[0.14]"
                    style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                    <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-l-2xl overflow-hidden">
                      {track.albumArt && <Image src={track.albumArt} alt="" fill className="object-cover" sizes="52px" />}
                    </div>
                    <span className="text-[13px] font-semibold text-white/75 group-hover:text-white truncate flex-1 transition-colors drop-shadow">
                      {track.title}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: A, boxShadow: `0 2px 12px rgba(249,115,22,0.5)` }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 1 }}>
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 2. Your top tracks */}
          {topHistoryTracks.length > 0 && (
            <section>
              <SectionHeader
                sub="Your listening"
                title={topHistoryArtists.length > 0 ? `Top picks for ${username ?? 'you'}` : 'Your favourites'}
              />
              {topHistoryArtists.length > 0 && (
                <p className="text-[12px] -mt-3 mb-5 drop-shadow" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Curated from your plays · <span style={{ color: 'rgba(255,255,255,0.55)' }}>{topHistoryArtists.slice(0, 3).join(', ')}</span>
                </p>
              )}
              <HScroll>
                {topHistoryTracks.map(t => <SquareCard key={t.id} track={t} queue={topHistoryTracks} size={155} />)}
              </HScroll>
            </section>
          )}

          {/* 3. Made for you */}
          {recommendedTracks.length > 0 && (
            <section>
              <SectionHeader sub="Personalized" title="Made for you" />
              {recommendedBasedOn.length > 0 && (
                <p className="text-[12px] -mt-3 mb-5 drop-shadow" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Based on · <span style={{ color: 'rgba(255,255,255,0.55)' }}>{recommendedBasedOn.slice(0, 3).join(', ')}</span>
                </p>
              )}
              <HScroll>
                {recommendedTracks.map(t => <SquareCard key={t.id} track={t} queue={recommendedTracks} size={155} />)}
              </HScroll>
            </section>
          )}

          {/* 4. Regional */}
          {regionalTracks.length > 0 && regionalLabel && (
            <section>
              <SectionHeader sub="Your region" title={regionalLabel} />
              <HScroll>
                {regionalTracks.map(t => <SquareCard key={t.id} track={t} queue={regionalTracks} size={155} />)}
              </HScroll>
            </section>
          )}

          {/* 5. Recently played */}
          {recentlyPlayed.length > 0 && (
            <section>
              <SectionHeader title="Recently played" />
              <HScroll>
                {recentlyPlayed.map(t => <SquareCard key={t.id} track={t} queue={recentlyPlayed} size={145} />)}
              </HScroll>
            </section>
          )}

          {/* 6. New releases */}
          {newReleases.length > 0 && (
            <section>
              <SectionHeader title="New releases" />
              <HScroll>
                {newReleases.map(album => (
                  <div key={album.id} className="w-[155px] flex-shrink-0">
                    <AlbumCard title={album.title} subtitle={album.artist} imageUrl={album.albumArt} />
                  </div>
                ))}
              </HScroll>
            </section>
          )}

          {/* 7. Trending list */}
          {trendingTracks.length > 0 && (
            <section>
              <SectionHeader title="Trending right now" />
              <Glass className="overflow-hidden divide-y divide-white/[0.04]">
                {trendingTracks.slice(0, 8).map((track, i) => (
                  <div key={track.id} className="transition-colors hover:bg-white/[0.04]">
                    <TrackCard track={track} queue={trendingTracks} index={i} showIndex />
                  </div>
                ))}
              </Glass>
            </section>
          )}

          {/* 8. Chill out */}
          {chillTracks.length > 0 && (
            <section>
              <SectionHeader title="Chill out ✦" />
              <HScroll>
                {chillTracks.map(t => (
                  <div key={t.id} className="w-[155px] flex-shrink-0">
                    <AlbumCard title={t.title} subtitle={t.artist} imageUrl={t.albumArt} firstTrack={t} tracks={chillTracks} />
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
