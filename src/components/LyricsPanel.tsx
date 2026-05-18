'use client'

import { useEffect, useRef, useState } from 'react'
import type { LyricLine, LyricsResponse } from '@/app/api/lyrics/route'

interface Props {
  title: string
  artist: string
  album: string
  duration: number   // seconds
  progress: number   // 0–1
  accentColor: string // "r,g,b"
}

export default function LyricsPanel({ title, artist, album, duration, progress, accentColor }: Props) {
  const [data, setData] = useState<LyricsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fetchKey = useRef('')

  useEffect(() => {
    const key = `${title}|${artist}`
    if (key === fetchKey.current) return
    fetchKey.current = key
    setData(null)
    setLoading(true)

    const params = new URLSearchParams({ title, artist, album })
    if (duration > 0) params.set('duration', String(Math.round(duration)))

    fetch(`/api/lyrics?${params}`)
      .then(r => r.json())
      .then((d: LyricsResponse) => { setData(d); setLoading(false) })
      .catch(() => { setData({ type: 'not_found', lines: [] }); setLoading(false) })
  }, [title, artist, album, duration])

  // Find active line index
  const elapsed = duration * progress
  let activeIdx = 0
  if (data?.type === 'synced' && data.lines.length > 0) {
    for (let i = 0; i < data.lines.length; i++) {
      if (data.lines[i].time <= elapsed) activeIdx = i
      else break
    }
  } else if (data?.type === 'plain' && data.lines.length > 0) {
    // pseudo-karaoke: estimate line by song progress
    activeIdx = Math.min(
      Math.floor(progress * data.lines.length),
      data.lines.length - 1,
    )
  }

  // Auto-scroll active line into view
  useEffect(() => {
    if (!activeRef.current || !containerRef.current) return
    const container = containerRef.current
    const el = activeRef.current
    const target = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2
    container.scrollTo({ top: target, behavior: 'smooth' })
  }, [activeIdx])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-3 px-6 pt-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-full bg-white/[0.05] animate-pulse"
            style={{ width: `${55 + (i % 3) * 20}%`, opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
    )
  }

  if (!data || data.type === 'not_found' || data.lines.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#2A2520]">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
        <p className="text-[13px] text-[#3A3530]">No lyrics found</p>
        <p className="text-[11px] text-[#2A2520]">for {title}</p>
      </div>
    )
  }

  const accent = `rgb(${accentColor})`

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'none' }}>
      <div className="flex flex-col gap-1 pb-24">
        {data.lines.map((line, i) => {
          const isActive = i === activeIdx
          const isPast = i < activeIdx
          const isFuture = i > activeIdx

          return (
            <div
              key={i}
              ref={isActive ? activeRef : undefined}
              className="py-1.5 transition-all duration-300"
            >
              <p
                className="text-[15px] font-semibold leading-snug transition-all duration-300"
                style={{
                  color: isActive ? accent : isPast ? '#3A3530' : isFuture ? '#5A5550' : '#5A5550',
                  textShadow: isActive ? `0 0 20px rgba(${accentColor},0.4)` : 'none',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  transformOrigin: 'left center',
                  fontSize: isActive ? 16 : 14,
                }}
              >
                {line.text || ' '}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
