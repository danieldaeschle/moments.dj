-- Moment likes – each user can like a moment once
create table public.moment_likes (
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, user_id)
);

alter table public.moment_likes enable row level security;

create policy "Authenticated users can read all likes"
  on public.moment_likes for select
  to authenticated
  using (true);

create policy "Users can insert own likes"
  on public.moment_likes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own likes"
  on public.moment_likes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Index for fast lookups
create index moment_likes_moment_id_idx on public.moment_likes (moment_id);

-- Enable realtime
alter publication supabase_realtime add table public.moment_likes;
