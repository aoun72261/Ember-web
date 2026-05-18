'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

let ytApiLoaded = false
let ytApiLoading = false
const ytApiCallbacks: (() => void)[] = []

// Singleton seek function — PlayerBar imports this instead of calling the full hook
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _ytPlayer: any = null
export function seekYouTubePlayer(progress: number) {
  if (!_ytPlayer) return
  try {
    const duration = _ytPlayer.getDuration?.() ?? 0
    _ytPlayer.seekTo?.(duration * progress, true)
  } catch { /* ignore */ }
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiLoaded) { resolve(); return }
    ytApiCallbacks.push(resolve)
    if (!ytApiLoading) {
      ytApiLoading = true
      window.onYouTubeIframeAPIReady = () => {
        ytApiLoaded = true
        ytApiCallbacks.forEach(cb => cb())
        ytApiCallbacks.length = 0
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
}

export function useYouTubePlayer(containerId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null)
  const isReadyRef = useRef(false)
  const pendingVideoIdRef = useRef<string | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentVideoIdRef = useRef<string | null>(null)

  const { currentTrack, isPlaying, volume, isMuted, repeatMode,
          setProgress, setDuration, setLoading, next, queue, queueIndex } = usePlayerStore()

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const startProgressTracking = useCallback(() => {
    clearProgressInterval()
    progressIntervalRef.current = setInterval(() => {
      const player = playerRef.current
      if (!player) return
      const current = player.getCurrentTime?.() ?? 0
      const total = player.getDuration?.() ?? 0
      if (total > 0) {
        setProgress(current / total)
        setDuration(total)
        // Pre-fetch next track's video ID when 80% through current song
        if (current / total > 0.8) {
          const q = queueRef.current
          const qi = queueIndexRef.current
          const nextTrack = q[qi + 1]
          if (nextTrack && nextTrack.spotifyId && !nextTrack.youtubeVideoId
            && !prefetchCache.current.has(nextTrack.spotifyId)
            && !prefetchingRef.current.has(nextTrack.spotifyId)) {
            prefetchingRef.current.add(nextTrack.spotifyId)
            fetch(`/api/youtube?trackId=${nextTrack.spotifyId}&title=${encodeURIComponent(nextTrack.title)}&artist=${encodeURIComponent(nextTrack.artist)}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => { if (d?.videoId) prefetchCache.current.set(nextTrack.spotifyId, d.videoId) })
              .catch(() => {})
              .finally(() => prefetchingRef.current.delete(nextTrack.spotifyId))
          }
        }
      }
    }, 500)
  }, [clearProgressInterval, setProgress, setDuration])

  // Stable refs so effects never use stale closures
  const startTrackingRef = useRef(startProgressTracking)
  const clearTrackingRef = useRef(clearProgressInterval)
  const repeatModeRef = useRef(repeatMode)
  const nextRef = useRef(next)
  const queueRef = useRef(queue)
  const queueIndexRef = useRef(queueIndex)
  startTrackingRef.current = startProgressTracking
  clearTrackingRef.current = clearProgressInterval
  repeatModeRef.current = repeatMode
  nextRef.current = next
  queueRef.current = queue
  queueIndexRef.current = queueIndex

  // Pre-fetch cache: spotifyId → videoId
  const prefetchCache = useRef<Map<string, string>>(new Map())
  const prefetchingRef = useRef<Set<string>>(new Set())

  const loadVideoSafe = useCallback((videoId: string) => {
    if (!isReadyRef.current || !playerRef.current) {
      pendingVideoIdRef.current = videoId
      return
    }
    try {
      playerRef.current.loadVideoById(videoId)
    } catch (e) {
      console.error('[YouTubePlayer] loadVideoById failed', e)
    }
  }, [])

  // Create player once
  useEffect(() => {
    loadYouTubeAPI().then(() => {
      if (playerRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      playerRef.current = new window.YT.Player(containerId, {
        height: '0',
        width: '0',
        playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            isReadyRef.current = true
            _ytPlayer = playerRef.current
            // Load any video that was requested before the player was ready
            if (pendingVideoIdRef.current) {
              try {
                playerRef.current.loadVideoById(pendingVideoIdRef.current)
              } catch (e) {
                console.error('[YouTubePlayer] pending load failed', e)
              }
              pendingVideoIdRef.current = null
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (event: any) => {
            const S = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 }
            if (event.data === S.PLAYING)   { setLoading(false); startTrackingRef.current() }
            if (event.data === S.PAUSED)    { clearTrackingRef.current() }
            if (event.data === S.BUFFERING) { setLoading(true) }
            if (event.data === S.ENDED) {
              clearTrackingRef.current()
              if (repeatModeRef.current === 'one') { playerRef.current?.seekTo(0, true); playerRef.current?.playVideo() }
              else nextRef.current()
            }
          },
          onError: () => { setLoading(false); nextRef.current() },
        },
      })
    })
    return () => { clearProgressInterval() }
  }, [containerId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load video when track changes
  useEffect(() => {
    if (!currentTrack) return
    const loadVideo = async () => {
      // If the track already has a YouTube video ID (e.g. from YouTube fallback search),
      // use it directly — no API call needed
      if (currentTrack.youtubeVideoId) {
        setLoading(true)
        if (currentVideoIdRef.current !== currentTrack.youtubeVideoId) {
          currentVideoIdRef.current = currentTrack.youtubeVideoId
          loadVideoSafe(currentTrack.youtubeVideoId)
        }
        return
      }

      // Can't look up a track without a spotifyId — skip immediately
      if (!currentTrack.spotifyId) {
        setLoading(false)
        nextRef.current()
        return
      }
      // Use pre-fetched video ID if available — instant start, no API call
      const cached = prefetchCache.current.get(currentTrack.spotifyId)
      if (cached) {
        if (currentVideoIdRef.current !== cached) {
          currentVideoIdRef.current = cached
          loadVideoSafe(cached)
        }
        return
      }
      setLoading(true)
      try {
        const res = await fetch(
          `/api/youtube?trackId=${currentTrack.spotifyId}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`
        )
        if (res.status === 404) {
          // Song not on YouTube — skip to next
          setLoading(false)
          nextRef.current()
          return
        }
        if (!res.ok) throw new Error('YouTube lookup failed')
        const { videoId } = await res.json()
        if (!videoId) throw new Error('No video found')
        if (currentVideoIdRef.current !== videoId) {
          currentVideoIdRef.current = videoId
          loadVideoSafe(videoId)
        }
      } catch (err) {
        console.error('[YouTubePlayer]', err)
        setLoading(false)
      }
    }
    loadVideo()
  }, [currentTrack?.spotifyId, currentTrack?.youtubeVideoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause + ensure progress tracking stays alive
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return
    try {
      if (isPlaying) {
        playerRef.current.playVideo?.()
        startTrackingRef.current()
      } else {
        playerRef.current.pauseVideo?.()
        clearTrackingRef.current()
      }
    } catch (e) { console.error('[YouTubePlayer] play/pause', e) }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return
    try { playerRef.current.setVolume?.(isMuted ? 0 : Math.round(volume * 100)) }
    catch (e) { console.error('[YouTubePlayer] volume', e) }
  }, [volume, isMuted])

  const seekTo = useCallback((progress: number) => {
    if (!isReadyRef.current || !playerRef.current) return
    try {
      const duration = playerRef.current.getDuration?.() ?? 0
      playerRef.current.seekTo?.(duration * progress, true)
    } catch (e) { console.error('[YouTubePlayer] seek', e) }
  }, [])

  return { seekTo }
}
