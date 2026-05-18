'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { signInWithEmail, signInWithGoogle } from '@/app/actions/auth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

export default function LoginPage() {
  const [error, setError]        = useState<string | null>(null)
  const [isPending, start]       = useTransition()
  const [focused, setFocused]    = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const res = await signInWithEmail(fd)
      if (res?.error) setError(res.error)
    })
  }

  const handleGoogle = () => {
    start(async () => {
      const res = await signInWithGoogle()
      if (!res) return
      if (res.error) { setError(res.error); return }
      if (res.url) window.location.href = res.url
    })
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: `1.5px solid ${focused === field ? 'rgba(74,127,255,0.8)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 14,
    padding: '13px 16px',
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    boxShadow: focused === field ? '0 0 0 4px rgba(74,127,255,0.12)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    caretColor: '#4A7FFF',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

      {/* ── Background video ─────────────────────────────────── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: videoReady ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      >
        <source src="/luffy-meditation.3840x2160.mp4" type="video/mp4" />
      </video>

      {/* ── Dark overlay ─────────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* ── Vignette edges ───────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)',
      }} />

      {/* ── Form card ────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400, padding: '0 20px' }}>
        <div style={{
          background: 'rgba(8, 6, 18, 0.35)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 28,
          padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #4A7FFF, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 28px rgba(74,127,255,0.45)',
              marginBottom: 16,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.5 7 4 11 4 14a8 8 0 0 0 16 0c0-3-2.5-7-8-12z" />
              </svg>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              Sign in to continue to Ember
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={isPending}
            className="group"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.13)',
              borderRadius: 14, padding: '13px 16px',
              fontSize: 14, fontWeight: 600, color: '#fff',
              cursor: 'pointer', marginBottom: 20,
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              name="email" type="email" placeholder="Email address"
              required autoComplete="email"
              className="auth-input"
              style={inputStyle('email')}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
            <input
              name="password" type="password" placeholder="Password"
              required autoComplete="current-password"
              className="auth-input"
              style={inputStyle('password')}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.25)',
                borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#FF6B6B',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              style={{
                marginTop: 4, width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, #4A7FFF 0%, #7C3AED 100%)',
                border: 'none', borderRadius: 14,
                padding: '14px 16px', fontSize: 14, fontWeight: 700,
                color: '#fff', cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(74,127,255,0.4)',
                transition: 'opacity 0.2s, transform 0.15s',
                opacity: isPending ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!isPending) e.currentTarget.style.transform = 'scale(1.01)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {isPending ? <><SpinnerIcon /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#4A7FFF', fontWeight: 700, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
