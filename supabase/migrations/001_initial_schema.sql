-- ============================================
-- moments.dj — Initial Schema
-- Strict 2-user MVP for Daniel & Johanna
-- ============================================

-- 1. Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  emoji text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Authenticated users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Allow insert from service role only (auth callback upsert)
create policy "Service role can insert profiles"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- 2. Moments
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  text text,
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.moments enable row level security;

create policy "Authenticated users can read all moments"
  on public.moments for select
  to authenticated
  using (true);

create policy "Users can insert own moments"
  on public.moments for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Users can update own moments"
  on public.moments for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Users can delete own moments"
  on public.moments for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- 3. Memory Capsules (schema ready, UI deferred)
create table public.memory_capsules (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id),
  title text not null,
  message text not null,
  image_path text,
  trigger_type text not null check (trigger_type in ('bad_day', 'date', 'manual')),
  open_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.memory_capsules enable row level security;

create policy "Users can read own capsules (author or recipient)"
  on public.memory_capsules for select
  to authenticated
  using ((select auth.uid()) = author_id or (select auth.uid()) = recipient_id);

create policy "Users can insert own capsules"
  on public.memory_capsules for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

-- 4. Storage bucket for moment images
insert into storage.buckets (id, name, public)
values ('moment-images', 'moment-images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'moment-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Anyone can view moment images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'moment-images');

create policy "Users can delete own images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'moment-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 5. Indexes
create index moments_created_at_idx on public.moments (created_at desc);
create index moments_author_id_idx on public.moments (author_id);
create index memory_capsules_author_id_idx on public.memory_capsules (author_id);
create index memory_capsules_recipient_id_idx on public.memory_capsules (recipient_id);
