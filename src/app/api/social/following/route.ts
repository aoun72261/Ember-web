import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Who I follow
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = (following ?? []).map(r => r.following_id)

  if (followingIds.length === 0) return NextResponse.json({ following: [], followers: [] })

  // Their profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', followingIds)

  // Who follows me
  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', user.id)

  const followerIds = (followers ?? []).map(r => r.follower_id)
  const { data: followerProfiles } = followerIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url').in('id', followerIds)
    : { data: [] }

  return NextResponse.json({ following: profiles ?? [], followers: followerProfiles ?? [] })
}
