// Lex Liga Badminton – public page (dark only)

const sb = window.supabaseClient || window.supabase || supabase;

function forceDark() {
  document.documentElement.classList.add('dark');
  document.body.classList.remove('light');
  localStorage.setItem('theme', 'dark');
}

function statusBadge(status) {
  const map = { live: 'LIVE', finished: 'FT', not_started: 'Upcoming' };
  return `<span class="status-${status || 'not_started'} text-xs font-bold px-2 py-0.5 rounded text-white">${map[status] || status}</span>`;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function buildBmShareText(m) {
  const cg = m.current_game || 1;
  const p1g = m[`g${cg}_p1`] ?? 0;
  const p2g = m[`g${cg}_p2`] ?? 0;
  const lines = [
    '🏸 Lex Liga Badminton',
    (m.category || 'Match') + (m.status === 'live' ? ' · LIVE' : m.status === 'finished' ? ' · FT' : ''),
    '',
    m.player1 + '  ' + p1g + ' – ' + p2g + '  ' + m.player2,
    'Games: ' + (m.games_p1 || 0) + ' – ' + (m.games_p2 || 0) + ' · Game ' + cg
  ];
  if (m.status === 'finished') {
    if ((m.games_p1 || 0) > (m.games_p2 || 0)) lines.push('Winner: ' + m.player1);
    else if ((m.games_p2 || 0) > (m.games_p1 || 0)) lines.push('Winner: ' + m.player2);
  }
  lines.push('', 'Follow live: https://jatinbscllb1232802-create.github.io/lex-liga/badminton.html');
  return lines.join('\n');
}

window.shareBmMatch = async function (id) {
  const m = (window.__bmMatches || []).find(x => String(x.id) === String(id));
  if (!m) return;
  const text = buildBmShareText(m);
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Lex Liga Badminton', text });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      alert('Score copied — paste anywhere to share');
    } else {
      prompt('Copy this score:', text);
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    try {
      await navigator.clipboard.writeText(text);
      alert('Score copied');
    } catch (e2) {
      alert('Unable to share right now');
    }
  }
};

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
    if ((m.games_p1 || 0) > (m.games_p2 || 0)) winner = `<div class="text-center text-xs text-green-400 font-semibold mt-2">Winner: ${escapeHtml(m.player1)}</div>`;
    else if ((m.games_p2 || 0) > (m.games_p1 || 0)) winner = `<div class="text-center text-xs text-green-400 font-semibold mt-2">Winner: ${escapeHtml(m.player2)}</div>`;
  }

  return `
    <div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div class="flex items-center justify-between mb-3">
        ${statusBadge(m.status)}
        <span class="text-xs text-slate-400">${escapeHtml(m.category || '')} · Games ${m.games_p1 || 0}–${m.games_p2 || 0}</span>
      </div>
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 text-right font-semibold text-sm">${escapeHtml(m.player1)}</div>
        <div class="score text-2xl px-3 font-extrabold min-w-[70px] text-center">${p1g} – ${p2g}</div>
        <div class="flex-1 text-left font-semibold text-sm">${escapeHtml(m.player2)}</div>
      </div>
      <div class="text-center text-xs text-slate-400 mt-2">Game ${cg}</div>
      <div class="flex justify-center gap-1 mt-2 flex-wrap">${sets}</div>
      ${winner}
      <button type="button" class="share-button" onclick="shareBmMatch('${m.id}')">↗ Share</button>
    </div>
  `;
}

async function loadBadminton() {
  if (!sb || typeof sb.from !== 'function') return;

  try {
    const { data, error } = await sb.from('badminton_matches').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    const matches = data || [];
    window.__bmMatches = matches;

    const live = matches.filter(m => m.status === 'live');
    const finished = matches.filter(m => m.status === 'finished');

    // Sound / alerts hook
    if (typeof window.lexWatchScores === 'function') {
      window.lexWatchScores(live.map(m => {
        const cg = m.current_game || 1;
        return {
          id: 'b-' + m.id,
          label: 'Badminton: ' + (m.player1 || '') + ' vs ' + (m.player2 || ''),
          scoreKey: String(m['g' + cg + '_p1']) + '-' + String(m['g' + cg + '_p2']) + '-' + cg,
          isLive: true
        };
      }));
    }

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
  forceDark();
  loadBadminton();
  setInterval(loadBadminton, 20000);
  document.getElementById('refreshBtn')?.addEventListener('click', loadBadminton);
});
