'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// Always returns the real live URL — works on localhost AND Vercel
async function getCallbackUrl() {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}/auth/callback`
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  const callbackUrl = await getCallbackUrl()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: callbackUrl,
    },
  })

  if (error) {
    const msg = error.message.includes('already registered')
      ? 'An account with this email already exists. Try signing in instead.'
      : error.message
    return { error: msg }
  }

  // Insert profile row — trigger handles this too, explicit is safer
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      username,
      email,
    }, { onConflict: 'id' })
  }

  // If session exists, email confirmation is disabled — go straight to app
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/home')
  }

  // Email confirmation required — tell the client to show a confirmation screen
  return { needsConfirmation: true }
}

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message.includes('Invalid login credentials')
      ? 'Wrong email or password. Please try again.'
      : error.message.includes('Email not confirmed')
      ? 'Please confirm your email first. Check your inbox.'
      : error.message
    return { error: msg }
  }

  revalidatePath('/', 'layout')
  redirect('/home')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const callbackUrl = await getCallbackUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error) return { error: error.message }

  // Return the URL — the client will do window.location.href = url
  // (server redirect() doesn't work for external OAuth URLs in server actions)
  if (data.url) return { url: data.url }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}
