'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import type { Track } from '@/types/index'

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '⚡', label: 'Hyped' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🤔', label: 'Pensive' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '🌙', label: 'Mellow' },
]

interface Entry { id: string; content: string; mood: string | null; created_at: string }
interface Props { track: Track; onClose: () => void }

export default function JournalModal({ track, onClose }: Props) {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [existing, setExisting] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/journal?trackId=${track.spotifyId}`)
      .then(r => r.json())
      .then(({ entries }: { entries: Entry[] }) => {
        const match = entries?.[0] ?? null
        if (match) { setExisting(match); setContent(match.content); setMood(match.mood) }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setTimeout(() => textareaRef.current?.focus(), 120) })
  }, [track.spotifyId])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const save = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      if (existing) {
        const res = await fetch(`/api/journal/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, mood }),
        })
        if (res.ok) { const { entry } = await res.json(); setExisting(entry) }
      } else {
        const res = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spotify_track_id: track.spotifyId, track_title: track.title, artist: track.artist, album_art: track.albumArt, content, mood }),
        })
        if (res.ok) { const { entry } = await res.json(); setExisting(entry) }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } finally { setSaving(false) }
  }

  const remove = async () => {
    if (!existing) return
    setDeleting(true)
    await fetch(`/api/journal/${existing.id}`, { method: 'DELETE' })
    setExisting(null); setContent(''); setMood(null)
    setDeleting(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0D1117 0%, #0A0C14 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Subtle top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-40"
          style={{ background: 'linear-gradient(to bottom, rgba(74,127,255,0.08), transparent)' }} />

        {/* Track header */}
        <div className="relative flex items-center gap-4 p-5">
          <div className="relative w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-black/40">
            {track.albumArt
              ? <Image src={track.albumArt} alt={track.title} fill className="object-cover" sizes="52px"/>
              : <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#4A7FFF] uppercase tracking-[0.18em] mb-0.5">Music Journal</p>
            <p className="text-[15px] font-bold text-white truncate leading-tight">{track.title}</p>
            <p className="text-[12px] text-[#4A5568] truncate mt-0.5">{track.artist}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A5568] hover:text-white hover:bg-white/[0.07] transition-all flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="h-px bg-white/[0.05] mx-5" />

        <div className="p-5 flex flex-col gap-5">
          {/* Mood picker */}
          <div>
            <p className="text-[10.5px] font-bold text-[#4A5568] uppercase tracking-wider mb-3">How does this song make you feel?</p>
            <div className="flex gap-1.5 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m.emoji}
                  onClick={() => setMood(mood === m.emoji ? null : m.emoji)}
                  title={m.label}
                  className={`w-10 h-10 rounded-xl text-[19px] flex items-center justify-center transition-all duration-150
                    ${mood === m.emoji
                      ? 'scale-110 shadow-md'
                      : 'hover:scale-105 hover:bg-white/[0.08]'
                    }`}
                  style={mood === m.emoji
                    ? { background: 'rgba(74,127,255,0.15)', boxShadow: '0 0 0 1.5px rgba(74,127,255,0.4)' }
                    : { background: 'rgba(255,255,255,0.04)' }
                  }
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <p className="text-[10.5px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Your memory or thought</p>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What does this song remind you of? A memory, a feeling, a moment…"
                rows={4}
                className="w-full bg-white/[0.04] border rounded-xl px-4 py-3.5 text-[13.5px] text-white placeholder-[#2D3748] outline-none transition-colors resize-none leading-relaxed"
                style={{ borderColor: content ? 'rgba(74,127,255,0.3)' : 'rgba(255,255,255,0.07)' }}
              />
              <p className="text-[10px] text-[#2D3748] absolute bottom-3 right-3.5">{content.length}</p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-[11px] text-[#4A5568]">
              <div className="w-3 h-3 border border-[#4A5568] border-t-transparent rounded-full animate-spin" />
              Loading your entry…
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {existing && (
              <button
                onClick={remove}
                disabled={deleting}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#C0392B]/60 hover:text-[#C0392B] hover:bg-[#C0392B]/10 transition-all disabled:opacity-40"
                title="Delete entry"
              >
                {deleting
                  ? <div className="w-3.5 h-3.5 border border-[#C0392B]/30 border-t-[#C0392B] rounded-full animate-spin" />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                }
              </button>
            )}
            {existing && (
              <p className="text-[11px] text-[#2D3748] flex-1">
                Last saved {new Date(existing.created_at).toLocaleDateString()}
              </p>
            )}
            <div className="flex-1" />
            <button
              onClick={save}
              disabled={saving || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-40"
              style={{ background: saving || !content.trim() ? 'rgba(74,127,255,0.3)' : 'linear-gradient(135deg, #4A7FFF, #1D4ED8)' }}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              ) : saved ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Saved!
                </>
              ) : (
                existing ? 'Update' : 'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
