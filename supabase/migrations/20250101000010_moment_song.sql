-- Add optional song fields to moments
alter table public.moments
  add column song_title text,
  add column song_artist text,
  add column song_preview_url text,
  add column song_cover_url text,
  add column song_spotify_url text;
