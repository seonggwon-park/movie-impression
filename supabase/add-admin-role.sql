-- Add a minimal admin role for moderation.
-- Run this once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin'));
  end if;
end $$;

create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.get_profile_role(profile_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = profile_id
$$;

drop policy if exists "Users can insert their own profile"
  on public.profiles;

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (
    auth.uid() = id
    and role = 'user'
  );

drop policy if exists "Users can update their own profile"
  on public.profiles;

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = coalesce(public.get_profile_role(auth.uid()), 'user')
  );
