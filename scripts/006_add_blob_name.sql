alter table if exists public.video_renders add column if not exists blob_name text;
create index if not exists video_renders_blob_name_idx on public.video_renders (blob_name);
