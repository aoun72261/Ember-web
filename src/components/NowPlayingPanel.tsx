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

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function NowPlayingPanel() {
  const { currentTrack, showNowPlayingPanel, toggleNowPlayingPanel } = usePlayerStore()
  const [panel, setPanel] = useState<ArtistPanel | null>(null)
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

  return (
    <div
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        width: 280,
        background: '#121212',
        borderLeft: '1px solid #282828',
      }}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #282828' }}>
        <span className="text-[13px] font-bold text-white">Now Playing</span>
        <button
          onClick={toggleNowPlayingPanel}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-white hover:bg-white/10 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Scrollable content ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {!currentTrack ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.2">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <p className="text-[13px] text-[#535353]">Nothing is playing</p>
          </div>
        ) : (
          <>
            {/* ── Album art ──────────────────────────────────── */}
            <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
              {currentTrack.albumArt ? (
                <Image
                  src={currentTrack.albumArt} alt={currentTrack.title}
                  fill className="object-cover"
                  sizes="280px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#282828' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.2">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
              )}
            </div>

            {/* ── Track info ─────────────────────────────────── */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-[15px] font-bold text-white leading-tight mb-0.5 truncate">
                {currentTrack.title}
              </p>
              {currentTrack.artistId ? (
                <Link
                  href={`/artist/${currentTrack.artistId}`}
                  className="text-[13px] text-[#A7A7A7] hover:text-white hover:underline truncate block transition-colors"
                >
                  {currentTrack.artist}
                </Link>
              ) : (
                <p className="text-[13px] text-[#A7A7A7] truncate">{currentTrack.artist}</p>
              )}
              {currentTrack.album && (
                <p className="text-[12px] text-[#535353] truncate mt-0.5">{currentTrack.album}</p>
              )}
            </div>

            {/* ── Divider ────────────────────────────────────── */}
            <div className="h-px mx-4 mb-4" style={{ background: '#282828' }} />

            {/* ── About the artist ──────────────────────────── */}
            <div className="px-4 pb-6">
              <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">
                About the artist
              </p>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin" />
                </div>
              )}

              {!loading && panel && (
                <>
                  {/* Artist image */}
                  <div
                    className="relative w-full rounded-lg overflow-hidden mb-3"
                    style={{ aspectRatio: '1/1', background: '#282828' }}
                  >
                    {panel.artist.image ? (
                      <Image
                        src={panel.artist.image} alt={panel.artist.name}
                        fill className="object-cover"
                        sizes="252px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Artist name + followers */}
                  <div className="mb-3">
                    <p className="text-[14px] font-bold text-white mb-0.5">{panel.artist.name}</p>
                    {typeof panel.artist.followers === 'number' && panel.artist.followers > 0 && (
                      <p className="text-[12px] text-[#A7A7A7]">
                        {formatFollowers(panel.artist.followers)} monthly listeners
                      </p>
                    )}
                    {panel.artist.genres && panel.artist.genres.length > 0 && (
                      <p className="text-[11px] text-[#535353] capitalize mt-1">
                        {panel.artist.genres.slice(0, 2).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* View artist button */}
                  {currentTrack.artistId && (
                    <Link
                      href={`/artist/${currentTrack.artistId}`}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white border border-[#535353] hover:border-white rounded-full px-4 py-1.5 transition-colors"
                    >
                      View artist
                    </Link>
                  )}

                  {/* Related artists */}
                  {panel.relatedArtists.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">
                        Fans also like
                      </p>
                      <div className="flex flex-col gap-2">
                        {panel.relatedArtists.slice(0, 5).map(a => (
                          <div key={a.id} className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#282828' }}>
                              {a.image && <Image src={a.image} alt={a.name} fill className="object-cover" sizes="36px" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-white truncate">{a.name}</p>
                              <p className="text-[11px] text-[#A7A7A7] truncate capitalize">
                                {a.genres?.[0] ?? 'Artist'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!loading && !panel && currentTrack && (
                <div className="text-center py-6">
                  <p className="text-[12px] text-[#535353]">No artist info available</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
