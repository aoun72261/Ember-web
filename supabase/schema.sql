-- ============================================================
-- Ember — Full Database Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  username text unique not null,
  avatar_url text,
  bio text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- YOUTUBE VIDEO ID CACHE
-- ============================================================
create table if not exists public.youtube_cache (
  spotify_track_id text primary key,
  youtube_video_id text not null,
  cached_at timestamptz not null default now()
);

-- ============================================================
-- PLAYLISTS
-- ============================================================
create table if not exists public.playlists (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  cover_art text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists playlists_updated_at on public.playlists;
create trigger playlists_updated_at
  before update on public.playlists
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- PLAYLIST TRACKS
-- ============================================================
create table if not exists public.playlist_tracks (
  id uuid primary key default uuid_generate_v4(),
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  spotify_track_id text not null,
  track_title text not null,
  artist text not null,
  album text not null,
  album_art text not null,
  duration_ms integer not null,
  position integer not null,
  added_at timestamptz not null default now(),
  unique(playlist_id, spotify_track_id)
);

-- ============================================================
-- LISTENING HISTORY
-- ============================================================
create table if not exists public.listening_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  spotify_track_id text not null,
  track_title text not null,
  artist text not null,
  album_art text not null,
  played_at timestamptz not null default now()
);

create index if not exists listening_history_user_id_idx on public.listening_history(user_id);
create index if not exists listening_history_played_at_idx on public.listening_history(played_at desc);

-- ============================================================
-- MUSIC JOURNAL
-- ============================================================
create table if not exists public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  spotify_track_id text not null,
  track_title text not null,
  artist text not null,
  album_art text not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists journal_entries_updated_at on public.journal_entries;
create trigger journal_entries_updated_at
  before update on public.journal_entries
  for each row execute procedure public.handle_updated_at();

create index if not exists journal_entries_user_id_idx on public.journal_entries(user_id);

-- ============================================================
-- FOLLOWS
-- ============================================================
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- ============================================================
-- LIKED TRACKS
-- ============================================================
create table if not exists public.liked_tracks (
  user_id uuid references public.profiles(id) on delete cascade not null,
  spotify_track_id text not null,
  track_title text not null,
  artist text not null,
  album_art text not null,
  duration_ms integer not null,
  liked_at timestamptz not null default now(),
  primary key (user_id, spotify_track_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.youtube_cache enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.listening_history enable row level security;
alter table public.journal_entries enable row level security;
alter table public.follows enable row level security;
alter table public.liked_tracks enable row level security;

-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (is_public = true or auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- YouTube cache
drop policy if exists "Authenticated users can read youtube cache" on public.youtube_cache;
create policy "Authenticated users can read youtube cache"
  on public.youtube_cache for select
  to authenticated using (true);

drop policy if exists "Authenticated users can insert youtube cache" on public.youtube_cache;
create policy "Authenticated users can insert youtube cache"
  on public.youtube_cache for insert
  to authenticated with check (true);

-- Playlists
drop policy if exists "Public playlists are viewable by everyone" on public.playlists;
create policy "Public playlists are viewable by everyone"
  on public.playlists for select
  using (is_public = true or auth.uid() = owner_id);

drop policy if exists "Users can create playlists" on public.playlists;
create policy "Users can create playlists"
  on public.playlists for insert
  to authenticated with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own playlists" on public.playlists;
create policy "Users can update their own playlists"
  on public.playlists for update
  using (auth.uid() = owner_id);

drop policy if exists "Users can delete their own playlists" on public.playlists;
create policy "Users can delete their own playlists"
  on public.playlists for delete
  using (auth.uid() = owner_id);

-- Playlist tracks
drop policy if exists "Playlist tracks viewable if playlist is viewable" on public.playlist_tracks;
create policy "Playlist tracks viewable if playlist is viewable"
  on public.playlist_tracks for select
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

drop policy if exists "Users can manage tracks in their playlists" on public.playlist_tracks;
create policy "Users can manage tracks in their playlists"
  on public.playlist_tracks for all
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
  );

-- Listening history
drop policy if exists "Users can view their own history" on public.listening_history;
create policy "Users can view their own history"
  on public.listening_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own history" on public.listening_history;
create policy "Users can insert their own history"
  on public.listening_history for insert
  to authenticated with check (auth.uid() = user_id);

-- Journal entries
drop policy if exists "Users can manage their own journal" on public.journal_entries;
create policy "Users can manage their own journal"
  on public.journal_entries for all
  using (auth.uid() = user_id);

-- Follows
drop policy if exists "Follows are viewable by authenticated users" on public.follows;
create policy "Follows are viewable by authenticated users"
  on public.follows for select
  to authenticated using (true);

drop policy if exists "Users can follow/unfollow" on public.follows;
create policy "Users can follow/unfollow"
  on public.follows for all
  using (auth.uid() = follower_id);

-- Liked tracks
drop policy if exists "Users can manage their own liked tracks" on public.liked_tracks;
create policy "Users can manage their own liked tracks"
  on public.liked_tracks for all
  using (auth.uid() = user_id);
