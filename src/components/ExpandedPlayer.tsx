'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { seekYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { formatDuration } from '@/lib/utils'
import LyricsPanel from './LyricsPanel'
import JournalModal from './JournalModal'
import SendSongModal from './SendSongModal'
import ListenTogetherModal from './ListenTogetherModal'

export default function ExpandedPlayer() {
  const {
    currentTrack, isPlaying, isLoading, progress, duration,
    volume, isMuted, isShuffled, repeatMode, accentColor, isExpanded,
    queue, queueIndex,
    togglePlay, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, setExpanded, playTrack,
  } = usePlayerStore()

  const panelRef = useRef<HTMLDivElement>(null)
  const [rightTab, setRightTab] = useState<'lyrics' | 'queue'>('lyrics')
  const [journalOpen, setJournalOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [listenOpen, setListenOpen] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false) }
    if (isExpanded) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isExpanded, setExpanded])

  // Lock body scroll when expanded
  useEffect(() => {
    document.body.style.overflow = isExpanded ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isExpanded])

  if (!isExpanded || !currentTrack) return null

  const elapsed = duration * progress
  const remaining = duration - elapsed
  const pct = `${(progress * 100).toFixed(2)}%`
  const accent = accentColor ?? '74,127,255'

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    seek(val); seekYouTubePlayer(val)
  }

  return (
    <>
    <div
      className="fixed inset-0 z-[100] flex"
      style={{ background: `rgba(${accent},0.08)` }}
    >
      {/* Blurred album art background */}
      <div className="absolute inset-0 overflow-hidden">
        {currentTrack.albumArt && (
          <Image
            src={currentTrack.albumArt}
            alt=""
            fill
            className="object-cover scale-110 blur-[80px] opacity-40"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-[#0A0A0A]/70" />
      </div>

      {/* Main panel */}
      <div ref={panelRef} className="relative z-10 flex w-full h-full">

        {/* ── Left: Art + Controls ─────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-16 gap-10 min-w-0">

          {/* Close button */}
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-[#8A8580] hover:text-white transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>

          {/* Journal button */}
          <button
            onClick={() => setJournalOpen(true)}
            title="Add to journal"
            className="absolute top-6 left-20 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-[#8A8580] hover:text-[#4A7FFF] transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>

          {/* Send song button */}
          <button
            onClick={() => setSendOpen(true)}
            title="Send to a friend"
            className="absolute top-6 left-[136px] w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-[#8A8580] hover:text-[#4A7FFF] transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>

          {/* Listen Together button */}
          <button
            onClick={() => setListenOpen(true)}
            title="Listen Together"
            className="absolute top-6 left-[192px] w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-[#8A8580] hover:text-[#4A7FFF] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>

          {/* Album art */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              width: 'min(380px, 45vw)',
              height: 'min(380px, 45vw)',
              boxShadow: `0 32px 80px rgba(${accent},0.4), 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            {currentTrack.albumArt && (
              <Image src={currentTrack.albumArt} alt={currentTrack.album} fill className="object-cover" sizes="380px" priority />
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="w-full max-w-[380px] text-center">
            <h1 className="text-[28px] font-black text-white leading-tight tracking-tight truncate">{currentTrack.title}</h1>
            <p className="text-[16px] text-[#8A8580] mt-1 truncate">{currentTrack.artist}</p>
            <p className="text-[13px] text-[#4A4540] mt-0.5 truncate">{currentTrack.album}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-[420px] flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[12px] tabular-nums text-[#4A4540] w-9 text-right select-none">{formatDuration(elapsed)}</span>
              <div className="flex-1 relative flex items-center h-5">
                <input
                  type="range" min={0} max={1} step={0.001} value={progress}
                  onChange={handleSeek}
                  className="seek-bar w-full"
                  style={{ '--p': pct, '--accent': `rgb(${accent})` } as React.CSSProperties}
                />
              </div>
              <span className="text-[12px] tabular-nums text-[#4A4540] w-9 select-none">
                {duration > 0 ? `-${formatDuration(remaining)}` : '--:--'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6 w-full max-w-[380px]">
            <div className="flex items-center gap-7">
              <button onClick={toggleShuffle} title="Shuffle"
                className={`p-2 rounded-full transition-all ${isShuffled ? 'text-[#4A7FFF]' : 'text-[#4A4540] hover:text-[#8A8580]'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
              </button>

              <button onClick={previous} className="p-2 text-[#8A8580] hover:text-white transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="19 20 9 12 19 4 19 20"/><rect x="5" y="4" width="2.5" height="16" rx="1.25"/>
                </svg>
              </button>

              <button
                onClick={togglePlay}
                disabled={!currentTrack}
                className="w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-40"
                style={{
                  background: `rgb(${accent})`,
                  boxShadow: `0 8px 32px rgba(${accent},0.5)`,
                }}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-[2.5px] border-black/20 border-t-black rounded-full animate-spin" />
                ) : isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
                    <rect x="5" y="3" width="5" height="18" rx="2"/><rect x="14" y="3" width="5" height="18" rx="2"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: 3 }}>
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>

              <button onClick={next} className="p-2 text-[#8A8580] hover:text-white transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 4 15 12 5 20 5 4"/><rect x="16.5" y="4" width="2.5" height="16" rx="1.25"/>
                </svg>
              </button>

              <button onClick={cycleRepeat} title="Repeat"
                className={`p-2 rounded-full transition-all relative ${repeatMode !== 'off' ? 'text-[#4A7FFF]' : 'text-[#4A4540] hover:text-[#8A8580]'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                {repeatMode === 'one' && (
                  <span className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] bg-[#4A7FFF] rounded-full text-[8px] text-white flex items-center justify-center font-bold">1</span>
                )}
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <button onClick={toggleMute} className="text-[#4A4540] hover:text-[#8A8580] transition-colors">
                {isMuted || volume === 0 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                )}
              </button>
              <input
                type="range" min={0} max={1} step={0.01}
                value={isMuted ? 0 : volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="vol-bar"
                style={{ '--vp': `${((isMuted ? 0 : volume) * 100).toFixed(0)}%`, width: 100 } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* ── Right: Lyrics / Queue ────────────────────────────── */}
        <div className="w-[340px] flex-shrink-0 flex flex-col border-l border-white/[0.06] overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-5 pt-6 pb-4 flex-shrink-0">
            {(['lyrics', 'queue'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all ${
                  rightTab === tab
                    ? 'text-white'
                    : 'text-[#3A3530] hover:text-[#6A6560]'
                }`}
                style={rightTab === tab ? { background: `rgba(${accent},0.2)`, color: `rgb(${accent})` } : {}}
              >
                {tab}
              </button>
            ))}
            {rightTab === 'queue' && (
              <span className="ml-auto text-[11px] text-[#3A3530]">{queue.length} tracks</span>
            )}
          </div>

          {/* Lyrics tab */}
          {rightTab === 'lyrics' && (
            <LyricsPanel
              title={currentTrack.title}
              artist={currentTrack.artist}
              album={currentTrack.album}
              duration={duration}
              progress={progress}
              accentColor={accent}
            />
          )}

          {/* Queue tab */}
          {rightTab === 'queue' && (
            <div className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'none' }}>
              {queue.map((track, i) => {
                const isCurrent = i === queueIndex
                return (
                  <button
                    key={`${track.id}-${i}`}
                    onClick={() => playTrack(track, queue)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group
                      ${isCurrent ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'}`}
                  >
                    <div className="w-6 flex-shrink-0 flex items-center justify-center">
                      {isCurrent
                        ? isPlaying
                          ? <div className="playing-bars flex items-end gap-[2px] h-3 w-3">
                              <span className="w-[2.5px] bg-[#4A7FFF] rounded-full" style={{ height: 3 }}/>
                              <span className="w-[2.5px] bg-[#4A7FFF] rounded-full" style={{ height: 8 }}/>
                              <span className="w-[2.5px] bg-[#4A7FFF] rounded-full" style={{ height: 5 }}/>
                            </div>
                          : <svg width="11" height="11" viewBox="0 0 24 24" fill="#4A7FFF"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        : <span className="text-[11px] tabular-nums text-[#3A3530] group-hover:hidden">{i + 1}</span>
                      }
                      {!isCurrent && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#8A8580" className="hidden group-hover:block">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      )}
                    </div>
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#1C1C1C]">
                      {track.albumArt && <Image src={track.albumArt} alt="" fill className="object-cover" sizes="36px"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12.5px] font-medium truncate ${isCurrent ? 'text-[#4A7FFF]' : 'text-[#C0BBB5] group-hover:text-white'} transition-colors`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#4A4540] truncate">{track.artist}</p>
                    </div>
                    <span className="text-[11px] tabular-nums text-[#3A3530] flex-shrink-0">
                      {formatDuration(track.duration / 1000)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>

    {journalOpen && currentTrack && (
      <JournalModal track={currentTrack} onClose={() => setJournalOpen(false)} />
    )}
    {sendOpen && currentTrack && (
      <SendSongModal track={currentTrack} onClose={() => setSendOpen(false)} />
    )}
    {listenOpen && (
      <ListenTogetherModal onClose={() => setListenOpen(false)} />
    )}
    </>
  )
}
