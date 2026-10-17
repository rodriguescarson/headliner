-- Per-user settings. One row per auth user, created on first save. Users read and write only their own row.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  notify_verdict_email boolean not null default false,
  notify_product_email boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id and deleted_at is null);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Shares remember who made them (null for anonymous), so export and deletion can find them.
alter table public.shared_checks add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists shared_checks_user_id_idx on public.shared_checks (user_id) where user_id is not null;
