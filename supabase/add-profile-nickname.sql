-- Add an optional nickname for share-card author display.

alter table public.profiles
  add column if not exists nickname text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_nickname_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_nickname_length_check
      check (
        nickname is null
        or char_length(btrim(nickname)) between 2 and 20
      );
  end if;
end $$;
