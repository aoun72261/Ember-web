-- Run this in your Supabase SQL editor

-- People table (one row per friend)
create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nickname text,
  bio text,
  superlative text,
  photo_url text,
  types text[] default '{}',
  hp integer default 100,
  created_at timestamptz default now()
);

-- Photos table
create table photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text,
  person_ids uuid[] default '{}',
  chapter text,
  is_group boolean default false,
  created_at timestamptz default now()
);

-- Config table (passcode lives here)
create table config (
  key text primary key,
  value text not null
);

-- Set your passcode (change '2023SMA' to whatever you want)
insert into config (key, value) values ('passcode', '2023SMA');

-- Allow public read access (app uses anon key)
alter table people enable row level security;
alter table photos enable row level security;
alter table config enable row level security;

create policy "Public read people" on people for select using (true);
create policy "Public read photos" on photos for select using (true);
create policy "Public read config" on config for select using (true);

-- Storage bucket for photos
-- Go to Storage in Supabase dashboard → New bucket → name it "photos" → Public bucket

-- Example: insert a person
-- insert into people (name, nickname, superlative, types, hp)
-- values ('Ahmad Rizky', 'Kiky', 'become CEO before 30', ARRAY['Hype', 'Leader'], 240);

-- Example: insert a photo
-- insert into photos (url, caption, chapter, is_group)
-- values ('https://your-project.supabase.co/storage/v1/object/public/photos/prom.jpg', 'Prom night 2023', 'Prom', true);
