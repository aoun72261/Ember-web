'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

function resizeImage(file: File, size = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')!
        const ratio = Math.max(size / img.width, size / img.height)
        const w = img.width * ratio, h = img.height * ratio
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function SettingsPage() {
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setUsername(d.profile?.username ?? '')
        setAvatar(d.profile?.avatar_url ?? null)
        setEmail(d.email ?? '')
      })
      .finally(() => setLoading(false))
  }, [])

  const pickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setAvatar(await resizeImage(file)) } catch { /* ignore */ }
  }

  const saveProfile = async () => {
    setUsernameError('')
    if (username.trim().length < 2) { setUsernameError('Must be at least 2 characters'); return }
    setProfileSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), avatarUrl: avatar }),
      })
      const d = await res.json()
      if (!res.ok) { setUsernameError(d.error ?? 'Failed to save'); return }
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } finally { setProfileSaving(false) }
  }

  const changePassword = async () => {
    setPasswordError('')
    if (!newPassword) { setPasswordError('Enter a new password'); return }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    setPasswordSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { setPasswordError(error.message); return }
      setPasswordSaved(true)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 2500)
    } finally { setPasswordSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full pb-32 max-w-[560px] px-8 pt-10">
      <p className="text-[11px] font-bold text-[#4A7FFF] uppercase tracking-[0.16em]">Account</p>
      <h1 className="text-[36px] font-black text-white leading-tight tracking-tight mt-1 mb-8">Settings</h1>

      {/* ── Profile ──────────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-4">Profile</p>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => fileRef.current?.click()}
              className="relative w-[80px] h-[80px] rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#4A7FFF] to-[#C0392B] group"
            >
              {avatar
                ? <Image src={avatar} alt="" fill className="object-cover" />
                : <span className="w-full h-full flex items-center justify-center text-[28px] font-black text-white">
                    {username[0]?.toUpperCase() ?? '?'}
                  </span>
              }
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
            <div>
              <p className="text-[13px] font-semibold text-[#C0BBB5]">Profile photo</p>
              <p className="text-[11px] text-[#4A4540] mt-0.5">Click to upload a new photo</p>
              {avatar && (
                <button onClick={() => setAvatar(null)} className="text-[11px] text-[#C0392B] hover:text-[#E74C3C] mt-1 transition-colors">
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider block mb-1.5">Username</label>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setUsernameError('') }}
              placeholder="your_username"
              maxLength={30}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-[#3A3530] outline-none focus:border-[#4A7FFF]/40 transition-colors"
            />
            {usernameError && <p className="text-[11px] text-[#E74C3C] mt-1">{usernameError}</p>}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider block mb-1.5">Email</label>
            <input
              value={email}
              readOnly
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-2.5 text-[14px] text-[#4A4540] outline-none cursor-default"
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={profileSaving}
            className="self-start px-6 py-2.5 rounded-full bg-[#4A7FFF] hover:bg-[#6690FF] disabled:opacity-50 text-[13px] font-bold text-black transition-all"
          >
            {profileSaving ? 'Saving…' : profileSaved ? '✓ Saved' : 'Save profile'}
          </button>
        </div>
      </section>

      {/* ── Password ─────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-4">Password</p>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider block mb-1.5">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPasswordError('') }}
              placeholder="••••••••"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-[#3A3530] outline-none focus:border-[#4A7FFF]/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#4A4540] uppercase tracking-wider block mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
              placeholder="••••••••"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-[#3A3530] outline-none focus:border-[#4A7FFF]/40 transition-colors"
            />
          </div>
          {passwordError && <p className="text-[11px] text-[#E74C3C]">{passwordError}</p>}
          <button
            onClick={changePassword}
            disabled={passwordSaving || !newPassword}
            className="self-start px-6 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-50 text-[13px] font-bold text-white transition-all"
          >
            {passwordSaving ? 'Updating…' : passwordSaved ? '✓ Password updated' : 'Update password'}
          </button>
        </div>
      </section>
    </div>
  )
}
