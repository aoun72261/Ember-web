'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import type { Track, Artist } from '@/types/index'

interface ArtistPanel {
  artist: Artist
  topTracks: Track[]
  relatedArtists: Artist[]
}

// Format like Spotify: "459,476" with commas
function formatListeners(n: number): string {
  return n.toLocaleString('en-US')
}

// Green verified badge — same as Spotify
function VerifiedBadge() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#3D91F4"/>
      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function NowPlayingPanel() {
  const {
    currentTrack, queue, queueIndex,
    showNowPlayingPanel, toggleNowPlayingPanel,
  } = usePlayerStore()

  const [panel, setPanel]     = useState<ArtistPanel | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentTrack?.artistId) { setPanel(null); return }
    setLoading(true)
    setPanel(null)
    fetch(`/api/artists/${currentTrack.artistId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPanel(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentTrack?.artistId])

  if (!showNowPlayingPanel) return null

  // Next track in queue
  const nextTrack: Track | null =
    queue.length > 0 && queueIndex < queue.length - 1
      ? queue[queueIndex + 1]
      : null

  return (
    <div
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{ width: 280, background: '#121212', borderLeft: '1px solid #282828' }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #282828' }}
      >
        {/* Panel toggle icon + label */}
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="18" rx="2"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
          <span className="text-[13px] font-semibold text-white">
            {currentTrack?.title ?? 'Now Playing'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Three dots */}
          <button className="w-7 h-7 flex items-center justify-center text-[#A7A7A7] hover:text-white transition-colors rounded-full hover:bg-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          {/* Expand */}
          <button className="w-7 h-7 flex items-center justify-center text-[#A7A7A7] hover:text-white transition-colors rounded-full hover:bg-white/10">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
          {/* Close */}
          <button
            onClick={toggleNowPlayingPanel}
            className="w-7 h-7 flex items-center justify-center text-[#A7A7A7] hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {!currentTrack ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <p className="text-[14px] font-semibold text-white">Nothing playing right now</p>
            <p className="text-[12px]" style={{ color: '#A7A7A7' }}>Play a song to see it here</p>
          </div>
        ) : (
          <>
            {/* ── Album art — full width square ─────────────────── */}
            <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
              {currentTrack.albumArt ? (
                <Image
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                  sizes="280px"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#282828' }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
              )}
            </div>

            {/* ── Track info row ───────────────────────────────── */}
            <div className="flex items-start justify-between px-4 pt-4 pb-3 gap-3">
              <div className="flex-1 min-w-0">
                {/* Track title */}
                <p className="text-[20px] font-bold text-white leading-tight truncate">
                  {currentTrack.title}
                </p>
                {/* Artist */}
                {currentTrack.artistId ? (
                  <Link
                    href={`/artist/${currentTrack.artistId}`}
                    className="text-[13px] hover:underline block truncate mt-0.5 transition-colors"
                    style={{ color: '#A7A7A7' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#A7A7A7')}
                  >
                    {currentTrack.artist}
                  </Link>
                ) : (
                  <p className="text-[13px] truncate mt-0.5" style={{ color: '#A7A7A7' }}>
                    {currentTrack.artist}
                  </p>
                )}
              </div>

              {/* Right: share + verified */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                <button className="text-[#A7A7A7] hover:text-white transition-colors" title="Share">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </button>
                {/* Green circle checkmark — like Spotify's verified mark */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1DB954' }}
                  title="Playing now"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* ── Divider ──────────────────────────────────────── */}
            <div className="h-px mx-4" style={{ background: '#282828' }} />

            {/* ── About the artist card ────────────────────────── */}
            <div className="mx-3 my-4 rounded-lg overflow-hidden" style={{ background: '#1A1A1A' }}>
              <p className="px-4 pt-4 pb-3 text-[14px] font-bold text-white">About the artist</p>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div
                    className="w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#1DB954', borderTopColor: 'transparent' }}
                  />
                </div>
              )}

              {!loading && panel && (
                <>
                  {/* Artist photo */}
                  <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                    {panel.artist.image ? (
                      <Image
                        src={panel.artist.image}
                        alt={panel.artist.name}
                        fill
                        className="object-cover"
                        sizes="252px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: '#282828' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Artist name + follow */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[15px] font-bold text-white truncate">{panel.artist.name}</p>
                        <VerifiedBadge />
                      </div>
                      {currentTrack.artistId && (
                        <Link
                          href={`/artist/${currentTrack.artistId}`}
                          className="flex-shrink-0 px-4 py-1 rounded-full text-[12px] font-bold text-white border transition-colors hover:border-white"
                          style={{ border: '1px solid #727272' }}
                        >
                          Follow
                        </Link>
                      )}
                    </div>

                    {/* Monthly listeners */}
                    {typeof panel.artist.followers === 'number' && panel.artist.followers > 0 && (
                      <p className="text-[13px] mb-2" style={{ color: '#A7A7A7' }}>
                        {formatListeners(panel.artist.followers)} monthly listeners
                      </p>
                    )}

                    {/* Genres as genre tags */}
                    {panel.artist.genres && panel.artist.genres.length > 0 && (
                      <p className="text-[12px] capitalize leading-relaxed" style={{ color: '#A7A7A7' }}>
                        {panel.artist.genres.slice(0, 3).join(' · ')}
                      </p>
                    )}
                  </div>
                </>
              )}

              {!loading && !panel && (
                <div className="px-4 pb-4">
                  <p className="text-[13px]" style={{ color: '#A7A7A7' }}>No artist info available</p>
                </div>
              )}
            </div>

            {/* ── Credits card (top tracks) ────────────────────── */}
            {!loading && panel && panel.topTracks.length > 0 && (
              <div className="mx-3 mb-4 rounded-lg overflow-hidden" style={{ background: '#1A1A1A' }}>
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <p className="text-[14px] font-bold text-white">Credits</p>
                  <Link
                    href={currentTrack.artistId ? `/artist/${currentTrack.artistId}` : '/search'}
                    className="text-[12px] font-semibold hover:underline"
                    style={{ color: '#A7A7A7' }}
                  >
                    Show all
                  </Link>
                </div>

                {/* Primary artist row */}
                <div className="px-4 pb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-white truncate">{panel.artist.name}</p>
                    <p className="text-[12px] truncate" style={{ color: '#A7A7A7' }}>
                      Main Artist
                      {panel.artist.genres?.[0] ? ` · ${panel.artist.genres[0]}` : ''}
                    </p>
                  </div>
                  {currentTrack.artistId && (
                    <Link
                      href={`/artist/${currentTrack.artistId}`}
                      className="flex-shrink-0 px-4 py-1 rounded-full text-[12px] font-bold text-white border transition-colors hover:border-white"
                      style={{ border: '1px solid #727272' }}
                    >
                      Follow
                    </Link>
                  )}
                </div>

                {/* Album credit */}
                {currentTrack.album && (
                  <div className="px-4 pb-4 mt-1">
                    <p className="text-[14px] font-semibold text-white truncate">{currentTrack.album}</p>
                    <p className="text-[12px]" style={{ color: '#A7A7A7' }}>Album</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Next in queue ────────────────────────────────── */}
            {nextTrack && (
              <div className="mx-3 mb-4 rounded-lg overflow-hidden" style={{ background: '#1A1A1A' }}>
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <p className="text-[14px] font-bold text-white">Next in queue</p>
                  <button
                    className="text-[12px] font-semibold hover:underline"
                    style={{ color: '#A7A7A7' }}
                  >
                    Open queue
                  </button>
                </div>

                <div className="px-4 pb-4 flex items-center gap-3">
                  <div
                    className="relative w-10 h-10 rounded flex-shrink-0 overflow-hidden"
                    style={{ background: '#282828' }}
                  >
                    {nextTrack.albumArt && (
                      <Image src={nextTrack.albumArt} alt={nextTrack.title} fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{nextTrack.title}</p>
                    <p className="text-[12px] truncate" style={{ color: '#A7A7A7' }}>{nextTrack.artist}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Related artists ──────────────────────────────── */}
            {!loading && panel && panel.relatedArtists.length > 0 && (
              <div className="mx-3 mb-6 rounded-lg overflow-hidden" style={{ background: '#1A1A1A' }}>
                <p className="px-4 pt-4 pb-3 text-[14px] font-bold text-white">Fans also like</p>
                <div className="px-4 pb-4 flex flex-col gap-3">
                  {panel.relatedArtists.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div
                        className="relative w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
                        style={{ background: '#282828' }}
                      >
                        {a.image && (
                          <Image src={a.image} alt={a.name} fill className="object-cover" sizes="40px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{a.name}</p>
                        <p className="text-[12px] capitalize truncate" style={{ color: '#A7A7A7' }}>
                          {a.genres?.[0] ?? 'Artist'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-4" />
          </>
        )}
      </div>
    </div>
  )
}
