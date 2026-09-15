# Badminton setup – run this in Supabase SQL Editor

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

create policy "Public read badminton" on badminton_matches for select using (true);
create policy "Public insert badminton" on badminton_matches for insert with check (true);
create policy "Public update badminton" on badminton_matches for update using (true);
create policy "Public delete badminton" on badminton_matches for delete using (true);
```

## Admin passwords

| Sport     | Password        |
|-----------|-----------------|
| Futsal    | `lexliga2026`   |
| Badminton | `badminton2026` |

## Intro video on Home

1. Upload your video to the repo as: `assets/lexliga-intro.mp4`
2. Tell me when uploaded – I will wire the full-screen intro with ✕ dismiss.

## Pages

- Badminton live: https://jatinbscllb1232802-create.github.io/lex-liga/badminton.html
- Admin: https://jatinbscllb1232802-create.github.io/lex-liga/admin.html  
  → choose **Badminton** → password `badminton2026`
