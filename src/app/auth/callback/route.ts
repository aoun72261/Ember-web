import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert profile for OAuth users (Google login — no signup form)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.name ?? data.user.email?.split('@')[0],
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
      }, { onConflict: 'id' })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
