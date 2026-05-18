'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePlayerStore } from '@/store/playerStore'
import { seekYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { formatDuration } from '@/lib/utils'
import AddToPlaylistMenu from './AddToPlaylistMenu'
import LyricsPanel from './LyricsPanel'
import JournalModal from './JournalModal'
import SendSongModal from './SendSongModal'
import ListenTogetherModal from './ListenTogetherModal'

function extractVibrantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }
        const size = 60
        canvas.width = size
        canvas.height = size
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data

        let bestR = 255, bestG = 107, bestB = 53
        let maxScore = 0

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const max = Math.max(r, g, b), min = Math.min(r, g, b)
          const brightness = (r + g + b) / 3
          const saturation = max - min
          // Prefer vibrant colors: high saturation, mid brightness
          if (brightness < 25 || brightness > 230) continue
          const score = saturation * (1 - Math.abs(brightness - 128) / 128)
          if (score > maxScore) {
            maxScore = score
            bestR = r; bestG = g; bestB = b
          }
        }
        resolve(`${bestR},${bestG},${bestB}`)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, isLoading, progress, duration,
    volume, isMuted, isShuffled, repeatMode, accentColor,
    togglePlay, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, setAccentColor, setExpanded,
  } = usePlayerStore()

  const lastArtRef = useRef<string | null>(null)
  const volumeRef = useRef(volume)
  volumeRef.current = volume
  const [mounted, setMounted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [listenOpen, setListenOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => { setMounted(true) }, [])

  // ── Global keyboard shortcuts ──────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.code === 'Space')       { e.preventDefault(); togglePlay() }
      else if (e.code === 'ArrowRight' && !e.shiftKey) { e.preventDefault(); next() }
      else if (e.code === 'ArrowLeft'  && !e.shiftKey) { e.preventDefault(); previous() }
      else if (e.code === 'ArrowUp')   { e.preventDefault(); setVolume(Math.min(1, volumeRef.current + 0.05)) }
      else if (e.code === 'ArrowDown') { e.preventDefault(); setVolume(Math.max(0, volumeRef.current - 0.05)) }
      else if (e.code === 'KeyM')      { toggleMute() }
    }
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      setVolume(Math.min(1, Math.max(0, volumeRef.current + delta)))
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('wheel', onWheel) }
  }, [togglePlay, next, previous, setVolume, toggleMute])

  // Sync like state when track changes
  useEffect(() => {
    if (!currentTrack) { setIsLiked(false); return }
    fetch(`/api/likes?trackId=${currentTrack.spotifyId}`)
      .then(r => r.ok ? r.json() : { liked: false })
      .then(d => setIsLiked(d.liked))
      .catch(() => setIsLiked(false))
  }, [currentTrack?.spotifyId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLike = useCallback(async () => {
    if (!currentTrack) return
    if (isLiked) {
      await fetch(`/api/likes?trackId=${currentTrack.spotifyId}`, { method: 'DELETE' })
      setIsLiked(false)
    } else {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: currentTrack }),
      })
      setIsLiked(true)
    }
  }, [currentTrack, isLiked])

  // Extract dominant color whenever album art changes
  useEffect(() => {
    const art = currentTrack?.albumArt ?? null
    if (!art || art === lastArtRef.current) return
    lastArtRef.current = art
    extractVibrantColor(art).then(color => setAccentColor(color))
    return () => { if (!currentTrack) setAccentColor(null) }
  }, [currentTrack?.albumArt]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen-time heartbeat — every 30s of actual playback, log to DB
  useEffect(() => {
    if (!isPlaying || !currentTrack) return
    const interval = setInterval(() => {
      fetch('/api/listen-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds: 30 }),
      }).catch(() => {})
    }, 30_000)
    return () => clearInterval(interval)
  }, [isPlaying, currentTrack?.spotifyId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    seek(val); seekYouTubePlayer(val)
  }

  const elapsed = duration * progress
  const remaining = duration - elapsed
  const pct = `${(progress * 100).toFixed(2)}%`
  const vpct = `${((isMuted ? 0 : volume) * 100).toFixed(0)}%`

  const accent = accentColor ?? '74,127,255'

  return (
  <>
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Accent glow line */}
      <div
        className="h-[1.5px] transition-all duration-1000"
        style={{ background: `linear-gradient(to right, transparent 5%, rgba(${accent},0.8) 40%, rgba(${accent},0.8) 60%, transparent 95%)` }}
      />

      {/* Player bar — slimmer at 68px */}
      <div
        className="flex items-center h-[68px] px-4 gap-3 border-t border-white/[0.05] transition-all duration-1000"
        style={{
          background: `linear-gradient(135deg, rgba(${accent},0.10) 0%, rgba(8,4,20,0.35) 55%, rgba(${accent},0.05) 100%)`,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
        }}
      >
        {/* ── LEFT: Track info ──────────────────────────────── */}
        <div className="flex items-center gap-2.5 w-[240px] min-w-0 flex-shrink-0">
          {/* Album art */}
          <button
            onClick={() => currentTrack && setExpanded(true)}
            disabled={!currentTrack}
            className="relative w-[44px] h-[44px] rounded-lg overflow-hidden flex-shrink-0 bg-[#1C1C1C] disabled:cursor-default group transition-all duration-300"
            style={accentColor ? { boxShadow: `0 0 20px rgba(${accentColor},0.4)` } : { boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          >
            {currentTrack?.albumArt && (
              <Image src={currentTrack.albumArt} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="44px" />
            )}
            {!currentTrack && (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-[1.5px] border-white/20 border-t-white rounded-full spin" />
              </div>
            )}
            {currentTrack && !isLoading && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </div>
            )}
          </button>

          {currentTrack ? (
            <div className="min-w-0 flex-1">
              <button onClick={() => setExpanded(true)} className="w-full text-left group">
                <p className="text-[13.5px] font-semibold text-[#F0EBE5] group-hover:text-white truncate leading-tight transition-colors">{currentTrack.title}</p>
              </button>
              {currentTrack.artistId ? (
                <Link href={`/artist/${currentTrack.artistId}`}
                  className="text-[12px] text-[#6A6560] hover:text-white hover:underline truncate mt-0.5 block transition-colors">
                  {currentTrack.artist}
                </Link>
              ) : (
                <p className="text-[12px] text-[#6A6560] truncate mt-0.5">{currentTrack.artist}</p>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-[#3A3530]">Nothing playing</p>
          )}

          {/* Like */}
          <button onClick={toggleLike} disabled={!currentTrack} title={isLiked ? 'Unlike' : 'Like'}
            className={`flex-shrink-0 p-1.5 rounded-full transition-all disabled:opacity-25
              ${isLiked ? 'text-[#4A7FFF]' : 'text-white/40 hover:text-[#4A7FFF]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Add to playlist */}
          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMenuOpen(v => !v)} disabled={!currentTrack} title="Add to playlist"
              className="w-6 h-6 rounded-full border border-white/[0.12] hover:border-white/30 flex items-center justify-center text-white/40 hover:text-white transition-all disabled:opacity-25">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            {menuOpen && currentTrack && <AddToPlaylistMenu track={currentTrack} onClose={closeMenu} openUp align="left" />}
          </div>
        </div>

        {/* ── CENTER: Controls + progress ───────────────────── */}
        <div className="flex-1 flex flex-col items-center gap-2 max-w-[520px] mx-auto">
          {/* Control buttons */}
          <div className="flex items-center gap-3">
            <button onClick={toggleShuffle} title="Shuffle (S)"
              className={`p-2 rounded-full transition-all ${isShuffled ? 'text-[#4A7FFF]' : 'text-white/65 hover:text-white hover:bg-white/10'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
              </svg>
            </button>

            <button onClick={previous} title="Previous (←)" className="p-2 text-white/65 hover:text-white transition-colors rounded-full hover:bg-white/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="19 20 9 12 19 4 19 20" /><rect x="5" y="4" width="2.5" height="16" rx="1.25" />
              </svg>
            </button>

            <button onClick={togglePlay} disabled={!currentTrack} title="Play/Pause (Space)"
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-40"
              style={{
                background: accentColor ? `rgb(${accentColor})` : '#fff',
                boxShadow: accentColor ? `0 4px 18px rgba(${accentColor},0.55)` : '0 4px 12px rgba(0,0,0,0.3)',
              }}>
              {isLoading ? (
                <div className="w-4 h-4 border-[2px] border-black/20 border-t-black rounded-full spin" />
              ) : isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
                  <rect x="5" y="3" width="5" height="18" rx="2" /><rect x="14" y="3" width="5" height="18" rx="2" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: 2 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button onClick={next} title="Next (→)" className="p-2 text-white/65 hover:text-white transition-colors rounded-full hover:bg-white/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4" /><rect x="16.5" y="4" width="2.5" height="16" rx="1.25" />
              </svg>
            </button>

            <button onClick={cycleRepeat} title="Repeat (R)"
              className={`p-2 rounded-full transition-all relative ${repeatMode !== 'off' ? 'text-[#4A7FFF]' : 'text-white/65 hover:text-white hover:bg-white/10'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              {repeatMode === 'one' && (
                <span className="absolute -top-0.5 -right-0.5 w-[13px] h-[13px] bg-[#4A7FFF] rounded-full text-[7px] text-white flex items-center justify-center font-bold">1</span>
              )}
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-[10px] tabular-nums text-[#3A3530] w-7 text-right select-none">{formatDuration(elapsed)}</span>
            <div className="flex-1 relative flex items-center h-4">
              <input type="range" min={0} max={1} step={0.001} value={progress}
                onChange={handleSeek} className="seek-bar w-full"
                style={{ '--p': pct, '--accent': `rgb(${accent})` } as React.CSSProperties} />
            </div>
            <span className="text-[10px] tabular-nums text-[#3A3530] w-7 select-none">
              {duration > 0 ? `-${formatDuration(remaining)}` : '--:--'}
            </span>
          </div>
        </div>

        {/* ── RIGHT: Volume first, then actions ─────────────── */}
        <div className="flex items-center gap-0.5 w-[280px] justify-end flex-shrink-0">

          {/* Volume — leftmost in right section */}
          <button onClick={toggleMute} title="Mute (M)" className="p-2 text-white/65 hover:text-white transition-colors rounded-full hover:bg-white/10 flex-shrink-0">
            {isMuted || volume === 0 ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : volume < 0.4 ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          <input type="range" min={0} max={1} step={0.01}
            value={isMuted ? 0 : volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="vol-bar flex-shrink-0"
            style={{ '--vp': vpct } as React.CSSProperties} />

          <div className="w-px h-3.5 bg-white/[0.08] mx-1.5 flex-shrink-0" />

          {/* Queue */}
          <button onClick={() => currentTrack && setExpanded(true)} disabled={!currentTrack}
            className="p-2 text-white/65 hover:text-white disabled:opacity-30 transition-colors rounded-full hover:bg-white/10" title="Queue">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>

          {/* Lyrics */}
          <button onClick={() => currentTrack && setLyricsOpen(v => !v)} disabled={!currentTrack}
            className={`p-2 rounded-full transition-all disabled:opacity-30 ${lyricsOpen && currentTrack ? 'text-[#4A7FFF]' : 'text-white/65 hover:text-white hover:bg-white/10'}`} title="Lyrics">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>

          {/* Journal */}
          <button onClick={() => currentTrack && setJournalOpen(true)} disabled={!currentTrack}
            className="p-2 text-white/65 hover:text-white disabled:opacity-30 transition-colors rounded-full hover:bg-white/10" title="Journal">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>

          {/* Send */}
          <button onClick={() => currentTrack && setSendOpen(true)} disabled={!currentTrack}
            className="p-2 text-white/65 hover:text-white disabled:opacity-30 transition-colors rounded-full hover:bg-white/10" title="Send to friend">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>

          {/* Listen Together */}
          <button onClick={() => setListenOpen(true)}
            className="p-2 text-white/65 hover:text-white transition-colors rounded-full hover:bg-white/10" title="Listen Together">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Floating lyrics panel ──────────────────────────────── */}
      {lyricsOpen && currentTrack && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[420px] max-h-[360px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/[0.07]"
          style={{ background: 'rgba(12,12,14,0.97)', backdropFilter: 'blur(40px)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <p className="text-[13px] font-bold text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-[#4A5568]">{currentTrack.artist}</p>
            </div>
            <button onClick={() => setLyricsOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[#4A5568] hover:text-white hover:bg-white/[0.08] transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <LyricsPanel
            title={currentTrack.title}
            artist={currentTrack.artist}
            album={currentTrack.album ?? ''}
            duration={duration}
            progress={progress}
            accentColor={accent}
          />
        </div>
      )}
    </div>

    {/* Modals — portaled to body to avoid fixed/stacking context conflicts */}
    {mounted && journalOpen && currentTrack && createPortal(
      <JournalModal track={currentTrack} onClose={() => setJournalOpen(false)} />,
      document.body
    )}
    {mounted && sendOpen && currentTrack && createPortal(
      <SendSongModal track={currentTrack} onClose={() => setSendOpen(false)} />,
      document.body
    )}
    {mounted && listenOpen && createPortal(
      <ListenTogetherModal onClose={() => setListenOpen(false)} />,
      document.body
    )}
  </>
  )
}
