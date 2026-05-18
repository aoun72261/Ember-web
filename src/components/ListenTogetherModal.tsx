'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { usePlayerStore } from '@/store/playerStore'
import { seekYouTubePlayer } from '@/hooks/useYouTubePlayer'
import type { Track } from '@/types/index'

type Screen = 'home' | 'hosting' | 'joined'

interface SyncPayload {
  spotifyId: string
  title: string
  artist: string
  album: string
  albumArt: string
  duration: number
  positionMs: number
  isPlaying: boolean
  ts: number
}

interface Props {
  onClose: () => void
}

export default function ListenTogetherModal({ onClose }: Props) {
  const [screen, setScreen] = useState<Screen>('home')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [hostName, setHostName] = useState('')
  const [listeners, setListeners] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [myUsername, setMyUsername] = useState('')

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const screenRef = useRef<Screen>('home')
  const supabaseRef = useRef(createClient())

  const { currentTrack } = usePlayerStore()

  useEffect(() => { screenRef.current = screen }, [screen])

  useEffect(() => {
    supabaseRef.current.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setMyUsername(
        user.user_metadata?.username ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User'
      )
    })
  }, [])

  const broadcast = useCallback(() => {
    if (!channelRef.current || screenRef.current !== 'hosting') return
    const s = usePlayerStore.getState()
    if (!s.currentTrack) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'sync',
      payload: {
        spotifyId: s.currentTrack.spotifyId,
        title: s.currentTrack.title,
        artist: s.currentTrack.artist,
        album: s.currentTrack.album,
        albumArt: s.currentTrack.albumArt ?? '',
        duration: s.currentTrack.duration,
        positionMs: s.progress * s.duration * 1000,
        isPlaying: s.isPlaying,
        ts: Date.now(),
      } satisfies SyncPayload,
    })
  }, [])

  const trackId = usePlayerStore(s => s.currentTrack?.spotifyId)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  useEffect(() => {
    if (screenRef.current === 'hosting') broadcast()
  }, [trackId, isPlaying, broadcast])

  useEffect(() => {
    if (screen !== 'hosting') return
    const t = setInterval(broadcast, 3000)
    return () => clearInterval(t)
  }, [screen, broadcast])

  useEffect(() => {
    return () => { channelRef.current?.unsubscribe(); channelRef.current = null }
  }, [])

  const buildPresenceChannel = useCallback((code: string, username: string) => {
    return supabaseRef.current.channel(`listen:${code}`, {
      config: { presence: { key: username } },
    })
  }, [])

  const startSession = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const res = await fetch('/api/listen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, hostUsername: myUsername }),
    })
    if (!res.ok) return

    const ch = buildPresenceChannel(code, myUsername)
    channelRef.current = ch

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ username: string }>()
      setListeners(
        Object.values(state).flat().map(p => p.username).filter(n => n && n !== myUsername)
      )
    }).subscribe(async status => {
      if (status === 'SUBSCRIBED') await ch.track({ username: myUsername })
    })

    setRoomCode(code)
    setScreen('hosting')
  }

  const joinSession = async () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) return
    setJoining(true)
    setJoinError('')

    const res = await fetch(`/api/listen?code=${code}`)
    if (!res.ok) {
      setJoinError('Room not found. Check the code and try again.')
      setJoining(false)
      return
    }
    const { session } = await res.json()

    const ch = buildPresenceChannel(code, myUsername)
    channelRef.current = ch

    ch
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<{ username: string }>()
        setListeners(
          Object.values(state).flat().map(p => p.username)
            .filter(n => n && n !== myUsername && n !== session.host_username)
        )
      })
      .on('broadcast', { event: 'sync' }, ({ payload }: { payload: SyncPayload }) => {
        const store = usePlayerStore.getState()

        if (payload.spotifyId && payload.spotifyId !== store.currentTrack?.spotifyId) {
          const track: Track = {
            id: payload.spotifyId,
            title: payload.title,
            artist: payload.artist,
            album: payload.album,
            albumArt: payload.albumArt || '',
            duration: payload.duration,
            spotifyId: payload.spotifyId,
            youtubeVideoId: null,
            previewUrl: null,
          }
          store.playTrack(track, [track])
          return
        }

        const adjustedMs = payload.positionMs + (Date.now() - payload.ts)
        const totalMs = payload.duration || 1
        const target = Math.min(Math.max(adjustedMs / totalMs, 0), 1)
        if (Math.abs(target - store.progress) > 0.02) {
          store.seek(target)
          seekYouTubePlayer(target)
        }

        if (payload.isPlaying !== store.isPlaying) store.togglePlay()
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') await ch.track({ username: myUsername })
      })

    setHostName(session.host_username)
    setRoomCode(code)
    setScreen('joined')
    setJoining(false)
  }

  const endSession = async () => {
    await fetch(`/api/listen/${roomCode}`, { method: 'DELETE' })
    channelRef.current?.unsubscribe()
    channelRef.current = null
    setScreen('home')
    setRoomCode('')
    setListeners([])
  }

  const leaveSession = () => {
    channelRef.current?.unsubscribe()
    channelRef.current = null
    setScreen('home')
    setRoomCode('')
    setHostName('')
    setListeners([])
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        className="relative w-full max-w-[400px] overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: 'linear-gradient(145deg, #0F1629 0%, #0A0F1E 100%)', border: '1px solid rgba(74,127,255,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #4A7FFF, transparent)' }} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(74,127,255,0.3), rgba(74,127,255,0.1))', border: '1px solid rgba(74,127,255,0.25)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A7FFF" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p className="text-[14.5px] font-bold text-white leading-tight">Listen Together</p>
              <p className="text-[11px] text-[#4A5568]">Sync music in real time</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#4A5568] hover:text-white hover:bg-white/[0.08] transition-all">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="h-px mx-5 bg-white/[0.06]" />

        {/* ── Home ── */}
        {screen === 'home' && (
          <div className="px-5 py-4 flex flex-col gap-3">
            <button
              onClick={startSession}
              disabled={!myUsername}
              className="group w-full rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, rgba(74,127,255,0.15), rgba(74,127,255,0.06))', border: '1px solid rgba(74,127,255,0.18)' }}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-[#4A7FFF]/20 flex items-center justify-center flex-shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#4A7FFF"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <p className="text-[13px] font-bold text-white">Start a session</p>
                <svg className="ml-auto opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all text-[#4A7FFF]"
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
              <p className="text-[11px] text-[#4A5568] leading-relaxed pl-8">
                Get a room code and invite friends to hear exactly what you&apos;re playing
              </p>
            </button>

            <div className="flex items-center gap-3 my-0.5">
              <div className="flex-1 h-px bg-white/[0.05]"/>
              <span className="text-[10px] font-bold text-[#2D3748] uppercase tracking-wider">or join</span>
              <div className="flex-1 h-px bg-white/[0.05]"/>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10.5px] font-bold text-[#4A5568] uppercase tracking-wider">Join with a code</p>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && joinSession()}
                  placeholder="A1B2C3"
                  maxLength={6}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[16px] font-black text-white placeholder-[#2D3748] outline-none focus:border-[#4A7FFF]/35 transition-colors font-mono tracking-[0.22em] uppercase"
                />
                <button
                  onClick={joinSession}
                  disabled={joinCode.length < 4 || joining}
                  className="px-5 rounded-xl bg-[#4A7FFF] hover:bg-[#6690FF] disabled:opacity-40 text-[13px] font-bold text-white transition-all"
                >
                  {joining ? <div className="w-4 h-4 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" /> : 'Join'}
                </button>
              </div>
              {joinError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1.5 mt-0.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {joinError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Hosting ── */}
        {screen === 'hosting' && (
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="rounded-xl p-4 flex flex-col items-center gap-2.5 text-center"
              style={{ background: 'rgba(74,127,255,0.06)', border: '1px solid rgba(74,127,255,0.12)' }}>
              <p className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.15em]">Your room code</p>
              <div className="flex items-center gap-2">
                <span className="text-[36px] font-black text-white tracking-[0.28em] font-mono leading-none">{roomCode}</span>
                <button onClick={copyCode}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.08] transition-all">
                  {copied
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A7FFF" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                </button>
              </div>
              <p className="text-[10.5px] text-[#4A5568]">Share this code with friends</p>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${listeners.length > 0 ? 'bg-[#4A7FFF] animate-pulse' : 'bg-[#2D3748]'}`} />
              <p className="text-[11.5px] font-medium text-[#718096] flex-1">
                {listeners.length === 0 ? 'Waiting for listeners…' : `${listeners.length} listening now`}
              </p>
              {listeners.length > 0 && (
                <div className="flex gap-1">
                  {listeners.slice(0, 2).map(n => (
                    <span key={n} className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#4A7FFF]"
                      style={{ background: 'rgba(74,127,255,0.12)' }}>{n}</span>
                  ))}
                  {listeners.length > 2 && <span className="text-[10px] text-[#4A5568] self-center">+{listeners.length - 2}</span>}
                </div>
              )}
            </div>

            {currentTrack && (
              <div className="flex items-center gap-3">
                {currentTrack.albumArt && (
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={currentTrack.albumArt} alt="" fill className="object-cover" sizes="36px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#E2E8F0] truncate">{currentTrack.title}</p>
                  <p className="text-[11px] text-[#4A5568] truncate">{currentTrack.artist}</p>
                </div>
              </div>
            )}

            <button onClick={endSession}
              className="w-full py-2.5 rounded-xl text-[12.5px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-all border border-red-500/[0.1] hover:border-red-500/[0.2]">
              End session
            </button>
          </div>
        )}

        {/* ── Joined ── */}
        {screen === 'joined' && (
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(74,127,255,0.1), rgba(74,127,255,0.04))', border: '1px solid rgba(74,127,255,0.16)' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-[#4A7FFF] animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white">Live with {hostName}</p>
                <p className="text-[11px] text-[#4A5568]">Room {roomCode}{listeners.length > 0 ? ` · +${listeners.length} others` : ''}</p>
              </div>
            </div>

            {currentTrack ? (
              <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.05]">
                {currentTrack.albumArt && (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={currentTrack.albumArt} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white truncate">{currentTrack.title}</p>
                  <p className="text-[11px] text-[#4A5568] truncate">{currentTrack.artist}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <div className="w-4 h-4 border-[1.5px] border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
                <p className="text-[12px] text-[#4A5568]">Waiting for {hostName} to play something…</p>
              </div>
            )}

            <p className="text-[10.5px] text-[#2D3748] text-center">Volume is yours to control locally</p>

            <button onClick={leaveSession}
              className="w-full py-2.5 rounded-xl text-[12.5px] font-bold text-[#718096] hover:text-white hover:bg-white/[0.06] transition-all border border-white/[0.06] hover:border-white/[0.1]">
              Leave session
            </button>
          </div>
        )}

        <div className="h-1" />
      </div>
    </div>
  )
}
