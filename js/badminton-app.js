// Lex Liga Badminton – public page

const sb = window.supabaseClient || window.supabase || supabase;

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('light');
  }
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light');
        localStorage.setItem('theme', 'light');
        btn.textContent = '🌙';
      } else {
        document.documentElement.classList.add('dark');
        document.body.classList.remove('light');
        localStorage.setItem('theme', 'dark');
        btn.textContent = '☀️';
      }
    });
  }
}

function statusBadge(status) {
  const map = { live: 'LIVE', finished: 'FT', not_started: 'Upcoming' };
  return `<span class="status-${status || 'not_started'} text-xs font-bold px-2 py-0.5 rounded text-white">${map[status] || status}</span>`;
}

function renderBmCard(m) {
  const cg = m.current_game || 1;
  const p1g = m[`g${cg}_p1`] ?? 0;
  const p2g = m[`g${cg}_p2`] ?? 0;
  const sets = [1, 2, 3].map(g => {
    const a = m[`g${g}_p1`], b = m[`g${g}_p2`];
    if (a == null && b == null) return null;
    return `<span class="text-xs px-2 py-0.5 rounded bg-slate-700/80">${a ?? 0}–${b ?? 0}</span>`;
  }).filter(Boolean).join(' ');

  let winner = '';
  if (m.status === 'finished') {
    if ((m.games_p1 || 0) > (m.games_p2 || 0)) winner = `<div class="text-center text-xs text-green-400 font-semibold mt-2">Winner: ${m.player1}</div>`;
    else if ((m.games_p2 || 0) > (m.games_p1 || 0)) winner = `<div class="text-center text-xs text-green-400 font-semibold mt-2">Winner: ${m.player2}</div>`;
  }

  return `
    <div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div class="flex items-center justify-between mb-3">
        ${statusBadge(m.status)}
        <span class="text-xs text-slate-400">${m.category || ''} · Games ${m.games_p1 || 0}–${m.games_p2 || 0}</span>
      </div>
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 text-right font-semibold text-sm">${m.player1}</div>
        <div class="score text-2xl px-3 font-extrabold min-w-[70px] text-center">${p1g} – ${p2g}</div>
        <div class="flex-1 text-left font-semibold text-sm">${m.player2}</div>
      </div>
      <div class="text-center text-xs text-slate-400 mt-2">Game ${cg}</div>
      <div class="flex justify-center gap-1 mt-2 flex-wrap">${sets}</div>
      ${winner}
    </div>
  `;
}

async function loadBadminton() {
  if (!sb || typeof sb.from !== 'function') return;

  try {
    const { data, error } = await sb.from('badminton_matches').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    const matches = data || [];

    const live = matches.filter(m => m.status === 'live');
    const finished = matches.filter(m => m.status === 'finished');
    const upcoming = matches.filter(m => m.status === 'not_started');

    const liveEl = document.getElementById('bmLive');
    if (liveEl) liveEl.innerHTML = live.length ? live.map(renderBmCard).join('') : '<p class="text-slate-400 text-sm">No live matches</p>';

    const recentEl = document.getElementById('bmRecent');
    if (recentEl) recentEl.innerHTML = finished.length ? finished.slice(0, 8).map(renderBmCard).join('') : '<p class="text-slate-400 text-sm">No results yet</p>';

    const allEl = document.getElementById('bmAll');
    if (allEl) allEl.innerHTML = matches.length ? matches.map(renderBmCard).join('') : '<p class="text-slate-400 text-sm">No fixtures yet</p>';

    const up = document.getElementById('lastUpdated');
    if (up) up.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error(err);
    ['bmLive', 'bmRecent', 'bmAll'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<p class="text-red-400 text-sm">${err.message}. Run badminton SQL in Supabase.</p>`;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadBadminton();
  setInterval(loadBadminton, 20000);
  document.getElementById('refreshBtn')?.addEventListener('click', loadBadminton);
});
