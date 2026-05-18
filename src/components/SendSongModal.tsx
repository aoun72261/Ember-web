'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Track } from '@/types/index'

interface UserProfile { id: string; username: string; avatar_url: string | null }

interface Props {
  track: Track
  onClose: () => void
}

export default function SendSongModal({ track, onClose }: Props) {
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [selected, setSelected] = useState<UserProfile | null>(null)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/social/following')
      .then(r => r.ok ? r.json() : { following: [] })
      .then(d => setFollowing(d.following ?? []))
      .finally(() => setLoading(false))
  }, [])

  const send = async () => {
    if (!selected) return
    setSending(true)
    try {
      await fetch('/api/social/sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: selected.id, track, note }),
      })
      setSent(true)
      setTimeout(onClose, 1400)
    } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[#111] border border-white/[0.08] rounded-3xl shadow-2xl w-[360px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[14px] font-black text-white">Send this song</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#8A8580] hover:text-white transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          {/* Track preview */}
          <div className="flex items-center gap-3 mt-3">
            {track.albumArt && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#1C1C1C]">
                <Image src={track.albumArt} alt="" fill className="object-cover" sizes="40px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-[#F0EBE5] truncate">{track.title}</p>
              <p className="text-[11px] text-[#4A4540] truncate">{track.artist}</p>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-[#4A7FFF]/15 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A7FFF" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-[14px] font-bold text-white">Sent to {selected?.username}!</p>
          </div>
        ) : (
          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Friend picker */}
            <div>
              <p className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-2">Send to</p>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-[1.5px] border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
                </div>
              ) : following.length === 0 ? (
                <p className="text-[12px] text-[#4A4540] py-2">You&apos;re not following anyone yet. Follow friends first.</p>
              ) : (
                <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  {following.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelected(u.id === selected?.id ? null : u)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${
                        selected?.id === u.id ? 'bg-[#4A7FFF]/15 border border-[#4A7FFF]/30' : 'hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      {u.avatar_url ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image src={u.avatar_url} alt="" fill className="object-cover" sizes="32px" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A7FFF] to-[#C0392B] flex items-center justify-center text-[12px] font-black text-white flex-shrink-0">
                          {u.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <p className="flex-1 text-[13px] font-semibold text-[#C0BBB5]">{u.username}</p>
                      {selected?.id === u.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A7FFF" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            {selected && (
              <div>
                <p className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-2">Add a note (optional)</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="This song made me think of you…"
                  rows={2}
                  maxLength={200}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-[#3A3530] outline-none focus:border-[#4A7FFF]/30 transition-colors resize-none"
                />
              </div>
            )}

            <button
              onClick={send}
              disabled={!selected || sending}
              className="w-full py-3 rounded-xl bg-[#4A7FFF] hover:bg-[#6690FF] disabled:opacity-40 text-[13px] font-black text-black transition-all"
            >
              {sending ? 'Sending…' : `Send${selected ? ` to ${selected.username}` : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
