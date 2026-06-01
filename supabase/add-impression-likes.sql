create table if not exists public.impression_likes (
  id uuid primary key default gen_random_uuid(),
  impression_id uuid not null references public.impressions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  constraint impression_likes_impression_user_unique unique (impression_id, user_id)
);

create index if not exists impression_likes_impression_id_idx
  on public.impression_likes(impression_id);

create index if not exists impression_likes_user_id_idx
  on public.impression_likes(user_id);

create index if not exists impression_likes_created_at_idx
  on public.impression_likes(created_at desc);

alter table public.impression_likes enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'impression_likes'
      and policyname = 'Authenticated users can read impression likes'
  ) then
    create policy "Authenticated users can read impression likes"
      on public.impression_likes
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'impression_likes'
      and policyname = 'Authenticated users can insert their own impression likes'
  ) then
    create policy "Authenticated users can insert their own impression likes"
      on public.impression_likes
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'impression_likes'
      and policyname = 'Authenticated users can delete their own impression likes'
  ) then
    create policy "Authenticated users can delete their own impression likes"
      on public.impression_likes
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
