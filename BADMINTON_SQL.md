# Badminton setup – run ALL of this in Supabase SQL Editor

## 1. Create table + policies

```sql
create table if not exists badminton_matches (
  id uuid primary key default gen_random_uuid(),
  player1 text not null,
  player2 text not null,
  category text,
  status text default 'not_started',
  current_game int default 1,
  games_p1 int default 0,
  games_p2 int default 0,
  g1_p1 int default 0,
  g1_p2 int default 0,
  g2_p1 int default 0,
  g2_p2 int default 0,
  g3_p1 int default 0,
  g3_p2 int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table badminton_matches enable row level security;

drop policy if exists "Public read badminton" on badminton_matches;
drop policy if exists "Public insert badminton" on badminton_matches;
drop policy if exists "Public update badminton" on badminton_matches;
drop policy if exists "Public delete badminton" on badminton_matches;

create policy "Public read badminton" on badminton_matches for select using (true);
create policy "Public insert badminton" on badminton_matches for insert with check (true);
create policy "Public update badminton" on badminton_matches for update using (true);
create policy "Public delete badminton" on badminton_matches for delete using (true);
```

## 2. Dummy matches (optional – for testing)

```sql
insert into badminton_matches (player1, player2, category, status, current_game, games_p1, games_p2, g1_p1, g1_p2, g2_p1, g2_p2, g3_p1, g3_p2)
values
  ('Aarav Sharma', 'Rohan Patel', 'Men''s Singles', 'live', 2, 1, 0, 21, 18, 11, 9, 0, 0),
  ('Priya Mehta', 'Ananya Singh', 'Women''s Singles', 'not_started', 1, 0, 0, 0, 0, 0, 0, 0, 0),
  ('Vikram & Kabir', 'Dev & Arjun', 'Men''s Doubles', 'finished', 3, 2, 1, 21, 15, 19, 21, 21, 17),
  ('Sneha Kapoor', 'Isha Reddy', 'Women''s Singles', 'live', 1, 0, 0, 14, 12, 0, 0, 0, 0),
  ('NFSU A', 'Campus United', 'Mixed Doubles', 'not_started', 1, 0, 0, 0, 0, 0, 0, 0, 0);
```

## Admin

- URL: https://jatinbscllb1232802-create.github.io/lex-liga/admin.html
- Sport: **Badminton**
- Password: `badminton2026`

## How scoring works

1. **+1** adds a point in the **current game**
2. When a game is done (e.g. 21–18), tap **End Game → Next**
3. Games won update automatically (first to 2 games wins the match)
4. Set **LIVE** so it shows on the public badminton page
