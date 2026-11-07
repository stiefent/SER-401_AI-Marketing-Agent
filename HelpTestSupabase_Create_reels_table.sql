create table public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  platform text,
  title text,
  description text,
  author text,
  duration_sec integer,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create index reels_user_id_created_at_idx
  on public.reels (user_id, created_at desc);

alter table public.reels enable row level security;

grant select, insert, delete on public.reels to authenticated;

create policy "Users can view their own reels"
  on public.reels
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own reels"
  on public.reels
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own reels"
  on public.reels
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
