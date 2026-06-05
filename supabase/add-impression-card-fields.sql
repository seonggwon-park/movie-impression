-- Add optional emotional detail fields for future impression share cards.

alter table public.impressions
  add column if not exists memorable_scene text,
  add column if not exists personal_sentence text;
