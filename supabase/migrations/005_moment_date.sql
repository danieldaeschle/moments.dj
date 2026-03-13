-- Add moment_date column to separate display date from insertion timestamp.
-- Previously created_at was overridden with the user-selected date, losing
-- the real insertion order.  Now created_at keeps its DB default (now()) and
-- moment_date stores the calendar date the user picked.

alter table public.moments
  add column moment_date date;

-- Back-fill from existing data (extract date in Europe/Berlin timezone)
update public.moments
  set moment_date = (created_at at time zone 'Europe/Berlin')::date;

-- Make it non-nullable with a sensible default going forward
alter table public.moments
  alter column moment_date set not null,
  alter column moment_date set default current_date;
