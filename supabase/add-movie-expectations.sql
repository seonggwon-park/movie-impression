create table if not exists public.movie_expectations (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  constraint movie_expectations_movie_user_unique unique (movie_id, user_id)
);

create index if not exists movie_expectations_movie_id_idx
  on public.movie_expectations(movie_id);

create index if not exists movie_expectations_user_id_idx
  on public.movie_expectations(user_id);

create index if not exists movie_expectations_created_at_idx
  on public.movie_expectations(created_at desc);

alter table public.movie_expectations enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'movie_expectations'
      and policyname = 'Everyone can read movie expectations'
  ) then
    create policy "Everyone can read movie expectations"
      on public.movie_expectations
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'movie_expectations'
      and policyname = 'Authenticated users can insert their own movie expectations'
  ) then
    create policy "Authenticated users can insert their own movie expectations"
      on public.movie_expectations
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'movie_expectations'
      and policyname = 'Authenticated users can delete their own movie expectations'
  ) then
    create policy "Authenticated users can delete their own movie expectations"
      on public.movie_expectations
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
