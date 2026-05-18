'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Track } from '@/types/index'

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  progress: number        // 0–1
  duration: number        // seconds
  volume: number          // 0–1
  isMuted: boolean
  isShuffled: boolean
  repeatMode: 'off' | 'all' | 'one'
  accentColor: string | null  // dominant RGB from album art e.g. "74,127,255"
  isExpanded: boolean

  // Actions
  playTrack: (track: Track, queue?: Track[]) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  seek: (progress: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  setLoading: (loading: boolean) => void
  setAccentColor: (color: string | null) => void
  setExpanded: (expanded: boolean) => void
  addToQueue: (track: Track) => void
  clearQueue: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      isLoading: false,
      progress: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'off',
      accentColor: null,
      isExpanded: false,

      playTrack: (track, queue) => {
        const newQueue = queue ?? [track]
        const index = newQueue.findIndex(t => t.id === track.id)
        set({
          currentTrack: track,
          queue: newQueue,
          queueIndex: index >= 0 ? index : 0,
          isPlaying: true,
          isLoading: true,
          progress: 0,
          duration: 0,
        })
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ track }),
        }).catch(() => {})
      },

      pause: () => set({ isPlaying: false }),
      resume: () => set({ isPlaying: true }),
      togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

      next: () => {
        const { queue, queueIndex, isShuffled } = get()
        if (queue.length === 0) return

        let nextIndex: number
        if (isShuffled) {
          nextIndex = Math.floor(Math.random() * queue.length)
        } else if (queueIndex < queue.length - 1) {
          nextIndex = queueIndex + 1
        } else {
          nextIndex = 0
        }

        const nextTrack = queue[nextIndex]
        set({ currentTrack: nextTrack, queueIndex: nextIndex, isPlaying: true, isLoading: true, progress: 0, duration: 0 })
        fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track: nextTrack }) }).catch(() => {})
      },

      previous: () => {
        const { queue, queueIndex, progress } = get()
        if (queue.length === 0) return

        if (progress > 0.05) {
          set({ progress: 0 })
          return
        }

        const prevIndex = queueIndex > 0 ? queueIndex - 1 : 0
        const prevTrack = queue[prevIndex]
        set({ currentTrack: prevTrack, queueIndex: prevIndex, isPlaying: true, isLoading: true, progress: 0, duration: 0 })
        fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track: prevTrack }) }).catch(() => {})
      },

      seek: (progress) => set({ progress }),
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => set(s => ({ isMuted: !s.isMuted })),
      toggleShuffle: () => set(s => ({ isShuffled: !s.isShuffled })),

      cycleRepeat: () => set(s => ({
        repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off'
      })),

      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setLoading: (loading) => set({ isLoading: loading }),

      setAccentColor: (color) => set({ accentColor: color }),
      setExpanded: (expanded) => set({ isExpanded: expanded }),
      addToQueue: (track) => set(s => ({ queue: [...s.queue, track] })),
      clearQueue: () => set({ queue: [], queueIndex: 0 }),
    }),
    {
      name: 'ember-player-state',
      storage: createJSONStorage(() => {
        // Guard for SSR — sessionStorage doesn't exist on the server
        if (typeof window === 'undefined') return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
        return sessionStorage
      }),
      // Only persist the data we want to survive navigation / accidental remounts.
      // isPlaying is intentionally NOT persisted so the player starts paused after
      // a full page reload (instead of auto-playing with no user interaction).
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        isMuted: state.isMuted,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
      }),
    }
  )
)
