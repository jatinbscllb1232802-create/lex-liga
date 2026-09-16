# Announcements table (run once in Supabase SQL editor)

```sql
create table if not exists public.announcements (
  id int primary key default 1 check (id = 1),
  message text not null default '',
  active boolean not null default true,
  updated_at timestamptz default now()
);

insert into public.announcements (id, message, active)
values (1, 'Welcome to Lex Liga 2026 — follow live scores here!', true)
on conflict (id) do nothing;

alter table public.announcements enable row level security;

-- Public read
drop policy if exists "announcements_read" on public.announcements;
create policy "announcements_read" on public.announcements
  for select using (true);

-- Public update/insert (same model as your score admin — protect URL with password page)
drop policy if exists "announcements_write" on public.announcements;
create policy "announcements_write" on public.announcements
  for all using (true) with check (true);
```

Then open: **admin-announce.html** (password `lexliga2026`)
