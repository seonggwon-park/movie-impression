-- Add optional watch method metadata for impressions.
-- Run this once in the Supabase SQL Editor.

alter table public.impressions
  add column if not exists watch_method text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'impressions_watch_method_check'
      and conrelid = 'public.impressions'::regclass
  ) then
    alter table public.impressions
      add constraint impressions_watch_method_check
      check (
        watch_method is null
        or watch_method in (
          'theater',
          'netflix',
          'disney_plus',
          'watcha',
          'tving',
          'wavve',
          'coupang_play',
          'other_ott',
          'tv',
          'rent_buy',
          'home',
          'other'
        )
      );
  end if;
end $$;

create index if not exists impressions_watch_method_idx
  on public.impressions(watch_method);
