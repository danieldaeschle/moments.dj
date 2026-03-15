-- Add optional time column so users can store a time alongside the date.
-- Stored as "HH:MM" text (24-hour format). NULL means no time was set.

alter table public.moments
  add column moment_time text;
