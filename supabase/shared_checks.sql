-- Shared verdicts. One row per share link; the payload is the full check result as JSON.
-- Service role writes and reads; no anon policy, so the public page goes through the server.
create table if not exists public.shared_checks (
  id text primary key,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('live', 'sample')),
  offer_line text not null,
  payload jsonb not null,
  deleted_at timestamptz
);
alter table public.shared_checks enable row level security;
create index if not exists shared_checks_created_at_idx on public.shared_checks (created_at desc);
