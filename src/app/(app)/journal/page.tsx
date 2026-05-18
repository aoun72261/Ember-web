'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/store/playerStore'

interface Entry {
  id: string
  spotify_track_id: string
  track_title: string
  artist: string
  album_art: string
  content: string
  mood: string | null
  created_at: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function JournalPage() {
  const { playTrack } = usePlayerStore()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/journal')
      .then(async r => {
        const d = await r.json()
        if (!r.ok) { setError(d.error ?? 'Failed to load entries'); return }
        setEntries(d.entries ?? [])
      })
      .catch(e => setError(e.message ?? 'Network error'))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (e: Entry) => {
    setEditing(e.id)
    setEditContent(e.content)
    setExpanded(e.id)
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const res = await fetch(`/api/journal/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent, mood: entries.find(e => e.id === id)?.mood }),
    })
    if (res.ok) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, content: editContent } : e))
      setEditing(null)
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/journal/${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-full pb-32">
      {/* Header */}
      <div className="relative px-8 pt-10 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A7FFF]/[0.06] via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[11px] font-bold text-[#4A7FFF] uppercase tracking-[0.16em]">Your memories</p>
          <h1 className="text-[36px] font-black text-white leading-tight tracking-tight mt-1">Music Journal</h1>
          <p className="text-[13px] text-[#4A4540] mt-1">
            {entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : 'Write memories attached to songs'}
          </p>
        </div>
      </div>

      <div className="px-8">
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#C0392B]/10 border border-[#C0392B]/20 text-[13px] text-[#C0392B]">
            <p className="font-bold">Could not load journal entries</p>
            <p className="opacity-70">{error}</p>
            <p className="text-[11px] opacity-50">If this says "permission denied", run the RLS fix in your Supabase SQL editor (see console for the SQL).</p>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.04] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2" strokeLinecap="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <p className="text-[15px] font-bold text-[#F0EBE5]">No journal entries yet</p>
            <p className="text-[13px] text-[#4A4540] max-w-[260px] leading-relaxed">
              Open the full-screen player and tap the ✏️ button to attach a memory to any song.
            </p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="flex flex-col gap-3">
            {entries.map(entry => {
              const isExpanded = expanded === entry.id
              const isEditing = editing === entry.id

              return (
                <div
                  key={entry.id}
                  className="bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] rounded-2xl overflow-hidden transition-all"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-4 p-4">
                    <button
                      onClick={() => {
                        const track = { id: entry.spotify_track_id, title: entry.track_title, artist: entry.artist, album: '', albumArt: entry.album_art, duration: 0, spotifyId: entry.spotify_track_id, youtubeVideoId: null, previewUrl: null }
                        playTrack(track, [track])
                      }}
                      className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.06] group"
                    >
                      {entry.album_art && <Image src={entry.album_art} alt={entry.track_title} fill className="object-cover group-hover:scale-110 transition-transform" sizes="48px"/>}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ marginLeft: 1 }}>
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </div>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.mood && <span className="text-[14px]">{entry.mood}</span>}
                        <p className="text-[13px] font-semibold text-[#E0DBD5] truncate">{entry.track_title}</p>
                      </div>
                      <p className="text-[11px] text-[#4A4540] truncate">{entry.artist} · {timeAgo(entry.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(entry)}
                        className="w-8 h-8 rounded-lg hover:bg-white/[0.07] flex items-center justify-center text-[#4A4540] hover:text-white transition-all"
                        title="Edit"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => remove(entry.id)}
                        disabled={deleting === entry.id}
                        className="w-8 h-8 rounded-lg hover:bg-[#C0392B]/10 flex items-center justify-center text-[#4A4540] hover:text-[#C0392B] transition-all disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === entry.id
                          ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>
                          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        }
                      </button>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : entry.id)}
                        className="w-8 h-8 rounded-lg hover:bg-white/[0.07] flex items-center justify-center text-[#4A4540] hover:text-white transition-all"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                      {isEditing ? (
                        <div className="flex flex-col gap-3">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={4}
                            autoFocus
                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-[13px] text-white outline-none resize-none leading-relaxed focus:border-[#4A7FFF]/40 transition-colors"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditing(null)} className="px-4 py-1.5 rounded-lg text-[12px] text-[#4A4540] hover:text-white transition-colors">
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(entry.id)}
                              disabled={saving || !editContent.trim()}
                              className="px-4 py-1.5 rounded-lg bg-[#4A7FFF] hover:bg-[#6690FF] disabled:opacity-40 text-white text-[12px] font-bold transition-all"
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[13px] text-[#C0BBB5] leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
