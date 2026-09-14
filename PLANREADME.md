# Lex Liga Futsal - Complete Project Plan

**Repository:** https://github.com/jatinbscllb1232802-create/lex-liga  
**Goal:** Free, temporary, good-looking 2-page website + protected Admin for college Futsal tournament (Lex Liga) with live scoring, fixtures, standings, top scorers, etc.

This file is written first so any AI (or human) can continue the work if context limits are reached.

---

## 1. Project Overview

- **Name:** Lex Liga Futsal
- **Type:** Temporary event website (college Futsal competition)
- **Pages:**
  1. Home / Live Scores
  2. Fixtures & Standings
  3. Admin (hidden + password protected)
- **Cost:** 100% free
- **Hosting:** GitHub Pages (this repo)
- **Backend / Database:** Supabase (free tier) – for live data, scores, fixtures, scorers
- **Design:** Modern, dark-mode by default, sports aesthetic, mobile-first, not plain

---

## 2. Final Feature List (Locked)

### Public Website
- Live scores with big clear match cards
- Match status colours (Live / Finished / Upcoming / Walkover / Cancelled)
- Auto-refresh every 20–30 seconds
- “Last updated” timestamp
- Goal scorers listed under each match
- Top Scorers (Golden Boot) live list
- Quick Standings snapshot on Home page
- Full Fixtures & complete points tables on second page
- Share button for individual matches
- Simple Rules / Format section
- Fair Play / Awards section
- Dark mode by default + light mode toggle
- Mobile-first design + “Add to Home Screen” (PWA-ready)

### Admin Page (Protected)
- Hidden URL (not in navigation)
- Password protection + backend verification (so frontend bypass is useless)
- Pre-made match cards/boxes
- Big +1 / –1 score buttons + number input
- Select goal scorers
- Status dropdown: Not started / Live / Half-time / Finished / Walkover / Cancelled
- Ability to Add / Edit fixtures
- Undo / Reset score button
- Match notes field
- Works well on phone

**Deliberately excluded (per user request):**
- Next match countdown
- Team logos
- Photo section
- QR code

---

## 3. Site Map

```
/
├── index.html                  → Home / Live Scores
├── fixtures.html               → Fixtures & Standings (+ Rules + Fair Play)
├── admin.html                  → Protected Admin (or /admin/)
├── css/
│   └── styles.css              → All styling (Tailwind via CDN or custom)
├── js/
│   ├── app.js                  → Public page logic (fetch, render, auto-refresh)
│   ├── admin.js                → Admin logic (auth, updates)
│   └── supabase-config.js      → Supabase client (keys will be public anon key only)
├── PLANREADME.md               → This file
└── README.md                   → Public project readme
```

---

## 4. Technical Stack (All Free)

| Layer          | Choice                          | Notes |
|----------------|----------------------------------|-------|
| Frontend       | HTML + CSS + Vanilla JS         | No heavy framework for simplicity & speed |
| Styling        | Tailwind CSS (CDN) + custom CSS | Fast, modern look |
| Hosting        | GitHub Pages                    | Free, automatic from main branch |
| Database       | Supabase (free tier)            | Realtime possible, Auth, Row Level Security |
| Auth for Admin | Simple shared password checked via Supabase Edge Function or direct secure update with secret | Or Supabase Auth with one admin user |
| Realtime       | Supabase Realtime or polling every 20-30s | Polling is simpler and sufficient |

---

## 5. Database Schema (Supabase)

### Tables

**teams**
- id (uuid, PK)
- name (text)
- group_name (text, nullable)  // e.g. "Group A"
- created_at

**matches**
- id (uuid, PK)
- home_team_id (fk → teams)
- away_team_id (fk → teams)
- home_score (int, default 0)
- away_score (int, default 0)
- status (text: 'not_started' | 'live' | 'half_time' | 'finished' | 'walkover' | 'cancelled')
- kickoff_time (timestamptz, nullable)
- group_name (text, nullable)
- notes (text, nullable)
- created_at, updated_at

**goals** (for scorers)
- id (uuid, PK)
- match_id (fk → matches)
- team_id (fk → teams)
- player_name (text)
- minute (int, nullable)
- created_at

**players** (optional, for dropdown)
- id, team_id, name

**settings** (optional single row)
- admin_password_hash or simple secret
- last_updated

**Standings** can be calculated on the fly from finished matches (or materialized view / function).

---

## 6. Security Plan for Admin

1. Admin page is not linked from public navigation (secret path or query).
2. Password required on load.
3. All write operations go through Supabase with Row Level Security (RLS) enabled.
4. Prefer: Supabase Edge Function that checks a secret/password before allowing updates.
5. Or: Use Supabase Auth – create one admin user, require login.
6. Public anon key is safe (only read permissions for public). Write permissions restricted.

Recommended simple approach for college event:
- Shared strong password.
- Edge Function or client-side + RLS policy that only allows updates if a valid “admin_token” (derived from password) is sent.

---

## 7. Implementation Steps (Order of Work)

### Phase 0 – Setup (Done / In Progress)
- [x] Create GitHub repo `lex-liga`
- [x] Add this PLANREADME.md first
- [ ] Create Supabase project (user must do this – free account)
- [ ] Note Supabase URL + anon key

### Phase 1 – Database
- Create tables (teams, matches, goals)
- Enable RLS
- Create policies: public read, authenticated/admin write
- Seed some sample teams & matches for testing

### Phase 2 – Public Frontend
- index.html (Home/Live)
- fixtures.html
- Basic responsive layout + dark theme
- Fetch data from Supabase
- Render live matches, results, standings, top scorers
- Auto-refresh + last updated
- Share buttons
- Rules & Fair Play sections

### Phase 3 – Admin
- admin.html
- Password gate
- List all matches as editable cards
- +1/–1, status, scorers, notes, reset
- Add/Edit fixture form
- Secure save to Supabase

### Phase 4 – Polish & Deploy
- PWA manifest + service worker (basic)
- Light/dark toggle
- Mobile testing
- Enable GitHub Pages
- Final README.md with instructions for user

### Phase 5 – Handover
- Clear instructions how to:
  - Create Supabase project
  - Insert real teams & fixtures
  - Change admin password
  - Update scores during event

---

## 8. What the User Still Needs to Provide / Do

1. Create free Supabase account → new project → give me the Project URL + anon public key (and optionally service role if needed for setup).
2. List of teams (and groups if any).
3. Approximate number of matches / schedule structure.
4. Preferred admin password (or I generate one).
5. Any college branding colours / name variations.

---

## 9. Current Status

- Repository created: https://github.com/jatinbscllb1232802-create/lex-liga
- This PLANREADME.md added as the first real file.
- Next actions: Wait for Supabase credentials + team list, then build frontend + database schema.

---

## 10. Notes for Future AI / Continuator

- Keep everything free.
- Prefer simplicity over over-engineering (vanilla JS is fine).
- Dark sports theme, clean cards, good typography.
- Admin must feel like “pre-made boxes + big buttons”.
- Security is important but realistic for a college event (shared password + RLS is enough).
- When adding files, use GitHub tools (create_or_update_file or push_files).
- Always update this PLANREADME.md with progress if major changes happen.

**Last updated:** 2026-09-15 (initial plan written by Grok)
