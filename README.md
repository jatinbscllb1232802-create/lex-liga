# Lex Liga Futsal

Temporary live scoring & fixtures website for the college Futsal tournament **Lex Liga**.

The public navigation also includes a Badminton tournament landing page and is structured to add more Lex Liga sports later.

## Live Website

After enabling GitHub Pages it will be available at:

**https://jatinbscllb1232802-create.github.io/lex-liga/**

### How to enable GitHub Pages (one-time)
1. Go to the repository → **Settings** → **Pages**
2. Under "Source" choose **Deploy from a branch**
3. Select branch `main` and folder `/ (root)`
4. Click Save
5. Wait 1–2 minutes, then open the link above

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home / Live | `/` or `index.html` | Live matches, recent results, quick standings, top scorers |
| Fixtures | `fixtures.html` | Full standings, all matches, rules & awards |
| Admin | `admin.html` | Password-protected score control panel |

## Admin Access

- Open: `https://jatinbscllb1232802-create.github.io/lex-liga/admin.html`
- **Password:** `lexliga2026`

(You can change it later in `js/supabase-config.js`)

## Features included

- Live scores with auto-refresh (every 25 seconds)
- Big +1 / –1 buttons in Admin
- Goal scorers tracking
- Automatic standings calculation
- Top Scorers (Golden Boot)
- Dark mode (default) + light mode toggle
- Mobile-friendly design
- Share score button
- Demo data already loaded in Supabase

## Full Plan

See **[PLANREADME.md](./PLANREADME.md)** for the complete architecture.

## Tech Stack

- Pure HTML + Tailwind CSS + Vanilla JS
- Supabase (free tier) for live database
- Hosted free on GitHub Pages

---

Made for Lex Liga Futsal – College Event
