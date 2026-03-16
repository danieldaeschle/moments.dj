-- Replace song_preview_url with song_deezer_id (Deezer track ID for fresh preview URLs)
alter table public.moments
  drop column if exists song_preview_url,
  add column song_deezer_id text;
