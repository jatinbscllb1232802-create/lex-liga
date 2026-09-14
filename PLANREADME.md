# Lex Liga Futsal – Complete Project Plan & Current Status

**Repository:** https://github.com/jatinbscllb1232802-create/lex-liga  
**Live Site:** https://jatinbscllb1232802-create.github.io/lex-liga/  
**Admin:** https://jatinbscllb1232802-create.github.io/lex-liga/admin.html  
**Admin Password:** `lexliga2026`

This file is kept up-to-date so any AI or developer can continue the work.

---

## 1. Project Overview

- **Name:** Lex Liga Futsal
- **Type:** Temporary college Futsal tournament live scoring website
- **Pages:**
  1. Home / Live Scores (`index.html`)
  2. Fixtures & Standings (`fixtures.html`) – now has Live Now section at the top
  3. Admin (`admin.html`) – password protected
- **Cost:** 100% free
- **Hosting:** GitHub Pages
- **Database:** Supabase (free tier)
- **Design:** Dark sports theme, mobile-first, modern cards

---

## 2. Current Features (as of latest update)

### Public Website
- Live matches shown at the **top** of both Home and Fixtures pages
- Match status badges (LIVE / FT / Upcoming etc.)
- Auto-refresh every 25 seconds + “Last updated” time
- Goal scorers listed under each match (with minute)
- Top Scorers (Golden Boot) table
- Automatic standings calculation by group
- Share button for any match
- Rules & Format + Awards sections
- Dark mode default + light mode toggle

### Admin Page (simplified & phone-friendly)
- Password gate (`lexliga2026`)
- Big **+1** buttons → open dialog asking for **Player Name + Minute** → automatically increases score **and** records the goal (connected)
- Separate **–1** buttons for score corrections
- Clear status buttons: Upcoming / LIVE / Finished
- **Yellow Card** and **Red Card** buttons (stored separately from goals)
- Goals list and Cards list shown clearly under each match
- **Reset Score + Goals** → resets score to 0-0 **and deletes all goals/cards** of that match
- Add New Match form at the bottom
- Delete match option

---

## 3. Database Tables (Supabase)

**teams** – id, name, group_name  
**matches** – id, home_team_id, away_team_id, home_score, away_score, status, kickoff_time, group_name, notes, timestamps  
**goals** – id, match_id, team_id, player_name, minute  
**cards** – id, match_id, player_name, card_type ('yellow'|'red'), minute  

(RLS is enabled with public read + public write for simplicity during the event)

---

## 4. Important SQL still needed (if not run yet)

If the Cards feature shows an error, run this in Supabase SQL Editor:

```sql
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  player_name text not null,
  card_type text check (card_type in ('yellow', 'red')),
  minute int,
  created_at timestamptz default now()
);

alter table cards enable row level security;
create policy "Public read cards" on cards for select using (true);
create policy "Public insert cards" on cards for insert with check (true);
create policy "Public delete cards" on cards for delete using (true);
```

---

## 5. How Admin Scoring Works (current logic)

1. Tap big green **+1** for a team  
2. Dialog asks for Player Name → then Minute  
3. System does **both**:
   - Increases the team score by 1
   - Inserts a record in the `goals` table
4. Goal appears under the match on both Admin and public pages

Yellow / Red cards are stored in a separate `cards` table and displayed with 🟨 / 🟥 icons (never mixed with goals).

Reset Score clears both the numeric score **and** all related goals + cards.

---

## 6. File Structure

```
/
├── index.html              → Home / Live Scores
├── fixtures.html           → Live Now + Standings + All Matches + Rules
├── admin.html              → Protected Admin
├── css/styles.css
├── js/
│   ├── supabase-config.js  → URL + publishable key + admin password
│   ├── app.js              → Public pages logic
│   └── admin.js            → Admin logic
├── PLANREADME.md           → This file
└── README.md
```

---

## 7. Credentials (already in code)

- Supabase URL: `https://gqoxwbhjocyhbgyrugsr.supabase.co`
- Publishable key: `sb_publishable_ul73oOHRtNgcn3nX032M2w_af6XfqlU`
- Admin password: `lexliga2026` (change in `js/supabase-config.js` if needed)

---

## 8. Known Behaviours / Tips

- Live matches only appear in the “Live Now” section when their status is set to **LIVE** in Admin.
- After changing anything in Admin, the public pages update within ~25 seconds (or instantly on Refresh).
- Demo teams and matches are already seeded. Real teams can be added via Admin or directly in Supabase.

---

## 9. Status as of 2026-09-15 ~02:05 IST

- [x] Repo + GitHub Pages live
- [x] Supabase connected with demo data
- [x] Public pages working (Home + Fixtures)
- [x] Live matches now shown at the **top** of both pages
- [x] Admin simplified with big buttons
- [x] Goal scoring connected to score update
- [x] Yellow / Red cards (separate)
- [x] Reset also clears goals
- [x] PLANREADME fully updated

**Next possible improvements (optional):**
- Prettier custom modal instead of browser `prompt()`
- Real player lists per team
- Better card display on public pages
- Change admin password

---

**Last updated:** 15 September 2026 (Grok)
