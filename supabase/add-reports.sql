-- Add impression reporting for the 여운 MVP.
-- Run this once in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  impression_id uuid not null references public.impressions(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  detail text,
  status text not null default 'pending',
  created_at timestamp with time zone default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_status_check'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_status_check
      check (status in ('pending', 'reviewed', 'dismissed', 'action_taken'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_reason_check'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_reason_check
      check (
        reason in (
          'offensive',
          'sexual',
          'violence_crime',
          'hate_discrimination',
          'spoiler',
          'spam',
          'other'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_impression_reporter_unique'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_impression_reporter_unique
      unique (impression_id, reporter_id);
  end if;
end $$;

create index if not exists reports_impression_id_idx
  on public.reports (impression_id);

create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id);

create index if not exists reports_status_idx
  on public.reports (status);

create index if not exists reports_created_at_idx
  on public.reports (created_at desc);

alter table public.reports enable row level security;

drop policy if exists "Authenticated users can create their own reports"
  on public.reports;

create policy "Authenticated users can create their own reports"
  on public.reports
  for insert
  to authenticated
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1
      from public.impressions
      where impressions.id = impression_id
        and impressions.user_id is distinct from auth.uid()
    )
  );

drop policy if exists "Users can read their own reports"
  on public.reports;

create policy "Users can read their own reports"
  on public.reports
  for select
  to authenticated
  using (auth.uid() = reporter_id);
