# Announcements table (run once in Supabase SQL editor)

Supports **history + delete** in admin.

```sql
-- Drop old single-row constraint if you already created the first version
drop table if exists public.announcements cascade;

create table public.announcements (
  id bigserial primary key,
  message text not null default '',
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.announcements (message, active)
values ('Welcome to Lex Liga 2026!', true);

alter table public.announcements enable row level security;

drop policy if exists "announcements_read" on public.announcements;
create policy "announcements_read" on public.announcements
  for select using (true);

drop policy if exists "announcements_write" on public.announcements;
create policy "announcements_write" on public.announcements
  for all using (true) with check (true);
```

Admin: open **admin.html** → choose **📢 Announce** → password `lexliga2026`
