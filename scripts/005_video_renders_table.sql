-- Suggested schema for video rendering jobs
create table if not exists public.video_renders (
  id uuid primary key,
  user_id uuid null references auth.users (id),
  status text not null check (status in ('pending','processing','done','error')),
  composition_id text not null,
  input_props jsonb not null,
  url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_renders_status_idx on public.video_renders (status);
create index if not exists video_renders_user_idx on public.video_renders (user_id);

-- RLS policies (adjust as needed)
alter table public.video_renders enable row level security;

-- Allow service role full access (implicit). Basic example policies for users (if user_id added later)
-- For now, allow anonymous select of finished jobs only (optional) - comment out if not desired
-- create policy "select done only" on public.video_renders for select using ( status = 'done');
