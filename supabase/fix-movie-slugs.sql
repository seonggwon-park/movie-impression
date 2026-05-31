-- Normalize existing TMDb movie slugs to ASCII-safe values.
-- Run this once in the Supabase SQL Editor after deploying the app change.
-- This keeps movies, impressions, and emotion links intact.

begin;

update public.movies
set slug = 'tmdb-' || tmdb_id::text
where tmdb_id is not null
  and slug is distinct from 'tmdb-' || tmdb_id::text;

commit;
