-- Supabase MVP schema for 여운.
-- Run this once in a fresh Supabase project from the SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  title text not null,
  original_title text,
  overview text,
  poster_url text,
  release_date date,
  runtime integer,
  genres text[],
  slug text unique,
  created_at timestamp with time zone default now()
);

create table if not exists public.emotions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text,
  description text
);

create table if not exists public.impressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  one_line text not null,
  note text,
  rating integer check (rating is null or rating between 1 and 5),
  is_spoiler boolean default false,
  watched_at date,
  created_at timestamp with time zone default now()
);

create table if not exists public.impression_emotions (
  impression_id uuid references public.impressions(id) on delete cascade,
  emotion_id uuid references public.emotions(id) on delete cascade,
  primary key (impression_id, emotion_id)
);

create table if not exists public.critic_reviews (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references public.movies(id) on delete cascade,
  critic_name text,
  outlet text,
  rating text,
  short_quote text,
  source_url text,
  created_at timestamp with time zone default now()
);

create table if not exists public.booking_links (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references public.movies(id) on delete cascade,
  provider text not null,
  url text not null
);

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.emotions enable row level security;
alter table public.impressions enable row level security;
alter table public.impression_emotions enable row level security;
alter table public.critic_reviews enable row level security;
alter table public.booking_links enable row level security;

create policy "Profiles are readable by everyone"
  on public.profiles
  for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Movies are readable by everyone"
  on public.movies
  for select
  using (true);

create policy "Emotions are readable by everyone"
  on public.emotions
  for select
  using (true);

create policy "Critic reviews are readable by everyone"
  on public.critic_reviews
  for select
  using (true);

create policy "Booking links are readable by everyone"
  on public.booking_links
  for select
  using (true);

create policy "Impressions are readable by everyone"
  on public.impressions
  for select
  using (true);

create policy "Authenticated users can insert their own impressions"
  on public.impressions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Authenticated users can update their own impressions"
  on public.impressions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own impressions"
  on public.impressions
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Impression emotions are readable by everyone"
  on public.impression_emotions
  for select
  using (true);

create policy "Authenticated users can add emotions to their impressions"
  on public.impression_emotions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.impressions
      where impressions.id = impression_emotions.impression_id
        and impressions.user_id = auth.uid()
    )
  );

create policy "Authenticated users can remove emotions from their impressions"
  on public.impression_emotions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.impressions
      where impressions.id = impression_emotions.impression_id
        and impressions.user_id = auth.uid()
    )
  );

create index if not exists movies_slug_idx on public.movies (slug);
create index if not exists movies_tmdb_id_idx on public.movies (tmdb_id);
create index if not exists movies_release_date_idx on public.movies (release_date);
create index if not exists impressions_user_id_idx on public.impressions (user_id);
create index if not exists impressions_movie_id_idx on public.impressions (movie_id);
create index if not exists impressions_created_at_idx on public.impressions (created_at desc);
create index if not exists impressions_watched_at_idx on public.impressions (watched_at desc);
create index if not exists impression_emotions_emotion_id_idx on public.impression_emotions (emotion_id);
create index if not exists critic_reviews_movie_id_idx on public.critic_reviews (movie_id);
create index if not exists booking_links_movie_id_idx on public.booking_links (movie_id);
create index if not exists booking_links_provider_idx on public.booking_links (provider);

insert into public.emotions (name, description)
values
  ('먹먹함', '말로 다 설명하기 어려운 묵직한 감정'),
  ('설렘', '다시 떠올리면 마음이 가볍게 움직이는 감정'),
  ('위로됨', '영화가 조용히 곁에 있어 준 듯한 감정'),
  ('통쾌함', '막힌 마음이 시원하게 풀리는 감정'),
  ('찝찝함', '끝난 뒤에도 쉽게 털어내기 어려운 감정'),
  ('무서움', '긴장과 두려움이 오래 남는 감정'),
  ('혼란스러움', '생각과 감정이 한동안 정리되지 않는 상태'),
  ('따뜻함', '마음 한쪽이 부드럽게 데워지는 감정'),
  ('슬픔', '조용히 가라앉는 아픔이 남는 감정'),
  ('웃김', '장면을 떠올리면 다시 웃게 되는 감정'),
  ('압도됨', '화면과 소리, 이야기에 크게 휩쓸리는 감정'),
  ('여운 남음', '영화가 끝난 뒤에도 오래 머무는 감정')
on conflict (name) do update
set description = excluded.description;

insert into public.movies (
  title,
  original_title,
  overview,
  runtime,
  genres,
  slug
)
values
  (
    '파묘',
    'Exhuma',
    '오래 묻혀 있던 이야기가 천천히 드러나며 낯선 공기와 불길한 감정을 남기는 영화.',
    134,
    array['미스터리'],
    'pamyo'
  ),
  (
    '인사이드 아웃 2',
    'Inside Out 2',
    '새로운 감정들이 찾아오며 흔들리는 마음을 조금 더 다정하게 바라보게 만드는 이야기.',
    96,
    array['애니메이션'],
    'inside-out-2'
  ),
  (
    '너의 이름은.',
    '君の名は。',
    '서로 다른 시간을 지나 마주하려는 두 사람의 감정이 빛과 음악처럼 오래 남는 영화.',
    106,
    array['로맨스'],
    'your-name'
  )
on conflict (slug) do update
set
  title = excluded.title,
  original_title = excluded.original_title,
  overview = excluded.overview,
  runtime = excluded.runtime,
  genres = excluded.genres;
