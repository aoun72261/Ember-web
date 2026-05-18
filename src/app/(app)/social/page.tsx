'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { formatDuration } from '@/lib/utils'
import type { Track } from '@/types/index'
import ListenTogetherModal from '@/components/ListenTogetherModal'

type Tab = 'feed' | 'friends' | 'inbox'

interface UserProfile { id: string; username: string; avatar_url: string | null }

interface FeedItem {
  id: string
  userId: string
  username: string
  avatarUrl: string | null
  track: Track
  playedAt: string
}

interface SendItem {
  id: string
  fromUserId: string
  toUserId: string
  otherUser: { username: string; avatar_url: string | null }
  track: Track
  note: string
  read: boolean
  createdAt: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Avatar({ url, name, size = 36 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    <div className="relative flex-shrink-0 rounded-full overflow-hidden" style={{ width: size, height: size }}>
      <Image src={url} alt={name} fill className="object-cover" sizes={`${size}px`} />
    </div>
  ) : (
    <div
      className="flex-shrink-0 rounded-full bg-gradient-to-br from-[#4A7FFF] to-[#C0392B] flex items-center justify-center font-black text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export default function SocialPage() {
  const { playTrack } = usePlayerStore()
  const [tab, setTab] = useState<Tab>('feed')

  // Feed
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [feedLoading, setFeedLoading] = useState(true)

  // Friends
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set())
  const [pendingFollow, setPendingFollow] = useState<Set<string>>(new Set())

  // Inbox
  const [received, setReceived] = useState<SendItem[]>([])
  const [sent, setSent] = useState<SendItem[]>([])
  const [inboxLoading, setInboxLoading] = useState(true)
  const [inboxTab, setInboxTab] = useState<'received' | 'sent'>('received')
  const [unreadCount, setUnreadCount] = useState(0)

  const loadFeed = useCallback(async () => {
    setFeedLoading(true)
    try {
      const r = await fetch('/api/social/feed')
      if (r.ok) { const d = await r.json(); setFeed(d.feed ?? []) }
    } finally { setFeedLoading(false) }
  }, [])

  const loadFriends = useCallback(async () => {
    const r = await fetch('/api/social/following')
    if (r.ok) {
      const d = await r.json()
      setFollowing(d.following ?? [])
      setFollowers(d.followers ?? [])
      setFollowingSet(new Set((d.following ?? []).map((u: UserProfile) => u.id)))
    }
  }, [])

  const loadInbox = useCallback(async () => {
    setInboxLoading(true)
    try {
      const r = await fetch('/api/social/sends')
      if (r.ok) {
        const d = await r.json()
        setReceived(d.received ?? [])
        setSent(d.sent ?? [])
        setUnreadCount((d.received ?? []).filter((s: SendItem) => !s.read).length)
      }
    } finally { setInboxLoading(false) }
  }, [])

  useEffect(() => { loadFeed(); loadFriends(); loadInbox() }, [loadFeed, loadFriends, loadInbox])

  // User search with debounce
  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const r = await fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}`)
        if (r.ok) { const d = await r.json(); setSearchResults(d.users ?? []) }
      } finally { setSearchLoading(false) }
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQ])

  const toggleFollow = async (userId: string, isFollowing: boolean) => {
    setPendingFollow(s => new Set([...s, userId]))
    if (isFollowing) {
      await fetch(`/api/social/follow?userId=${userId}`, { method: 'DELETE' })
      setFollowingSet(s => { const n = new Set(s); n.delete(userId); return n })
      setFollowing(f => f.filter(u => u.id !== userId))
    } else {
      await fetch('/api/social/follow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      setFollowingSet(s => new Set([...s, userId]))
      const target = searchResults.find(u => u.id === userId) ?? followers.find(u => u.id === userId)
      if (target) setFollowing(f => [...f, target])
    }
    setPendingFollow(s => { const n = new Set(s); n.delete(userId); return n })
  }

  const markRead = async (id: string) => {
    await fetch('/api/social/sends', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setReceived(r => r.map(s => s.id === id ? { ...s, read: true } : s))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const [listenOpen, setListenOpen] = useState(false)

  const tabClass = (t: Tab) =>
    `px-5 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all relative ${
      tab === t ? 'bg-[#4A7FFF]/15 text-[#4A7FFF]' : 'text-[#3A3530] hover:text-[#6A6560]'
    }`

  return (
    <div className="min-h-full pb-32">
      {/* Header */}
      <div className="relative px-8 pt-10 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A7FFF]/[0.06] via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[11px] font-bold text-[#4A7FFF] uppercase tracking-[0.16em]">Social</p>
          <h1 className="text-[36px] font-black text-white leading-tight tracking-tight mt-1">Friends</h1>
          <p className="text-[13px] text-[#4A4540] mt-1">See what your friends are listening to</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-8 mb-6">
        <button className={tabClass('feed')} onClick={() => setTab('feed')}>Feed</button>
        <button className={tabClass('friends')} onClick={() => setTab('friends')}>Friends</button>
        <button className={`${tabClass('inbox')} flex items-center gap-1.5`} onClick={() => setTab('inbox')}>
          Inbox
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#4A7FFF] text-white text-[9px] font-black flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {listenOpen && <ListenTogetherModal onClose={() => setListenOpen(false)} />}

      {/* ── Feed tab ──────────────────────────────────────── */}
      {tab === 'feed' && (
        <div className="px-5">
          {/* Quick join / start */}
          <div className="flex items-center gap-2 mb-4 px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-xl bg-[#4A7FFF]/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A7FFF" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-[#C0BBB5]">Listen Together</p>
              <p className="text-[11px] text-[#4A4540]">Start or join a synced listening session</p>
            </div>
            <button
              onClick={() => setListenOpen(true)}
              className="px-3 py-1.5 rounded-full bg-[#4A7FFF]/10 hover:bg-[#4A7FFF]/20 border border-[#4A7FFF]/20 text-[11px] font-bold text-[#4A7FFF] transition-all flex-shrink-0"
            >
              Open
            </button>
          </div>
          {feedLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
            </div>
          ) : feed.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p className="text-[15px] font-bold text-[#F0EBE5]">Nothing here yet</p>
              <p className="text-[13px] text-[#4A4540]">Follow friends to see what they&apos;re listening to.</p>
              <button onClick={() => setTab('friends')} className="text-[13px] font-bold text-[#4A7FFF] hover:text-[#93C5FD] transition-colors">
                Find friends →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {feed.map(item => (
                <button
                  key={item.id}
                  onClick={() => playTrack(item.track, [item.track])}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.05] transition-all text-left group"
                >
                  <Avatar url={item.avatarUrl} name={item.username} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#6A6560]">
                      <span className="font-bold text-[#C0BBB5]">{item.username}</span> played
                    </p>
                    <p className="text-[13px] font-semibold text-[#F0EBE5] truncate group-hover:text-white transition-colors">
                      {item.track.title}
                    </p>
                    <p className="text-[11px] text-[#4A4540] truncate">{item.track.artist}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {item.track.albumArt && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#1C1C1C]">
                        <Image src={item.track.albumArt} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                    )}
                    <span className="text-[11px] text-[#3A3530]">{timeAgo(item.playedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Friends tab ───────────────────────────────────── */}
      {tab === 'friends' && (
        <div className="px-8 flex flex-col gap-6">
          {/* Search */}
          <div>
            <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A4540" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by username…"
                className="flex-1 bg-transparent text-[13px] text-white placeholder-[#3A3530] outline-none"
              />
              {searchLoading && <div className="w-4 h-4 border-[1.5px] border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />}
            </div>
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-0.5">
                {searchResults.map(u => (
                  <UserRow key={u.id} user={u} isFollowing={followingSet.has(u.id)} pending={pendingFollow.has(u.id)} onToggle={toggleFollow} />
                ))}
              </div>
            )}
          </div>

          {/* Following */}
          {following.length > 0 && (
            <section>
              <p className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-3">Following ({following.length})</p>
              <div className="flex flex-col gap-0.5">
                {following.map(u => (
                  <UserRow key={u.id} user={u} isFollowing={true} pending={pendingFollow.has(u.id)} onToggle={toggleFollow} />
                ))}
              </div>
            </section>
          )}

          {/* Followers */}
          {followers.length > 0 && (
            <section>
              <p className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-3">Followers ({followers.length})</p>
              <div className="flex flex-col gap-0.5">
                {followers.map(u => (
                  <UserRow key={u.id} user={u} isFollowing={followingSet.has(u.id)} pending={pendingFollow.has(u.id)} onToggle={toggleFollow} />
                ))}
              </div>
            </section>
          )}

          {following.length === 0 && followers.length === 0 && !searchQ && (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <p className="text-[15px] font-bold text-[#F0EBE5]">No connections yet</p>
              <p className="text-[13px] text-[#4A4540]">Search for friends by their username above.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Inbox tab ─────────────────────────────────────── */}
      {tab === 'inbox' && (
        <div className="px-8">
          {/* Sub-tabs */}
          <div className="flex gap-2 mb-5">
            {(['received', 'sent'] as const).map(t => (
              <button
                key={t}
                onClick={() => setInboxTab(t)}
                className={`px-4 py-1.5 rounded-full text-[11.5px] font-bold uppercase tracking-wider transition-all capitalize ${
                  inboxTab === t ? 'bg-white/[0.1] text-white' : 'text-[#4A4540] hover:text-[#8A8580]'
                }`}
              >
                {t}
                {t === 'received' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-[#4A7FFF] text-white text-[9px] font-black rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          {inboxLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(inboxTab === 'received' ? received : sent).length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <p className="text-[14px] font-bold text-[#F0EBE5]">
                    {inboxTab === 'received' ? 'No songs received yet' : 'No songs sent yet'}
                  </p>
                  <p className="text-[12px] text-[#4A4540]">
                    {inboxTab === 'received'
                      ? 'Friends can send you songs from the player.'
                      : 'Send a song from the expanded player.'}
                  </p>
                </div>
              ) : (inboxTab === 'received' ? received : sent).map(item => (
                <SendCard
                  key={item.id}
                  item={item}
                  mode={inboxTab}
                  onPlay={() => {
                    playTrack(item.track, [item.track])
                    if (inboxTab === 'received' && !item.read) markRead(item.id)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UserRow({ user, isFollowing, pending, onToggle }: {
  user: UserProfile
  isFollowing: boolean
  pending: boolean
  onToggle: (id: string, isFollowing: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all">
      <Avatar url={user.avatar_url} name={user.username} size={36} />
      <p className="flex-1 text-[13px] font-semibold text-[#C0BBB5]">{user.username}</p>
      <button
        onClick={() => onToggle(user.id, isFollowing)}
        disabled={pending}
        className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all disabled:opacity-50 ${
          isFollowing
            ? 'bg-white/[0.08] text-[#8A8580] hover:bg-[#C0392B]/10 hover:text-[#C0392B]'
            : 'bg-[#4A7FFF] text-black hover:bg-[#6690FF]'
        }`}
      >
        {pending ? '…' : isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}

function SendCard({ item, mode, onPlay }: { item: SendItem; mode: 'received' | 'sent'; onPlay: () => void }) {
  const isUnread = mode === 'received' && !item.read
  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      isUnread ? 'bg-[#4A7FFF]/[0.06] border-[#4A7FFF]/20' : 'bg-white/[0.03] border-white/[0.06]'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Avatar url={item.otherUser.avatar_url} name={item.otherUser.username} size={24} />
        <p className="text-[12px] text-[#6A6560]">
          {mode === 'received' ? (
            <><span className="font-bold text-[#C0BBB5]">{item.otherUser.username}</span> sent you a song</>
          ) : (
            <>Sent to <span className="font-bold text-[#C0BBB5]">{item.otherUser.username}</span></>
          )}
        </p>
        {isUnread && <span className="ml-auto w-2 h-2 rounded-full bg-[#4A7FFF] flex-shrink-0" />}
        <span className="ml-auto text-[11px] text-[#3A3530]">{timeAgo(item.createdAt)}</span>
      </div>
      <button onClick={onPlay} className="w-full flex items-center gap-3 group">
        {item.track.albumArt && (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#1C1C1C]">
            <Image src={item.track.albumArt} alt="" fill className="object-cover" sizes="48px" />
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-bold text-[#F0EBE5] truncate group-hover:text-white transition-colors">{item.track.title}</p>
          <p className="text-[11px] text-[#4A4540] truncate">{item.track.artist}</p>
          {item.track.duration > 0 && (
            <p className="text-[11px] text-[#3A3530]">{formatDuration(item.track.duration / 1000)}</p>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-[#4A7FFF]/10 group-hover:bg-[#4A7FFF]/20 flex items-center justify-center transition-all flex-shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#4A7FFF" style={{ marginLeft: 1 }}>
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </button>
      {item.note && (
        <div className="mt-3 px-3 py-2 bg-white/[0.04] rounded-xl">
          <p className="text-[12px] text-[#8A8580] italic">&ldquo;{item.note}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
