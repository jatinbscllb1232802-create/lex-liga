// Lex Liga Badminton Admin – scoring only (login is in admin-login.js)

const sb = window.supabaseClient || window.supabase || supabase;

async function loadBadmintonAdmin() {
  const container = document.getElementById('adminBadmintonMatches');
  if (!container) return;
  container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">Loading...</p>';

  if (!sb || typeof sb.from !== 'function') {
    container.innerHTML = '<p class="text-red-400 text-sm">Supabase not ready</p>';
    return;
  }

  try {
    const { data, error } = await sb.from('badminton_matches').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet. Add one below.</p>';
      return;
    }

    container.innerHTML = data.map(m => renderBadmintonCard(m)).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-400 text-sm">Error: ${err.message}. Did you run the badminton SQL?</p>`;
  }
}

window.loadBadmintonAdmin = loadBadmintonAdmin;

document.getElementById('refreshBadminton')?.addEventListener('click', loadBadmintonAdmin);

function renderBadmintonCard(m) {
  const cg = m.current_game || 1;
  const p1g = m[`g${cg}_p1`] ?? 0;
  const p2g = m[`g${cg}_p2`] ?? 0;
  const isLive = m.status === 'live';
  const isFinished = m.status === 'finished';

  const gamesLine = `Games: ${m.games_p1 || 0} – ${m.games_p2 || 0}`;
  const setScores = [1, 2, 3].map(g => {
    const a = m[`g${g}_p1`];
    const b = m[`g${g}_p2`];
    if (a == null && b == null) return null;
    return `${a ?? 0}–${b ?? 0}`;
  }).filter(Boolean).join(' | ');

  return `
    <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700" data-id="${m.id}">
      <div class="text-center mb-3">
        <div class="text-xs text-slate-400 mb-1">${m.category || 'Match'} · ${gamesLine}</div>
        <div class="font-bold text-lg">${m.player1}</div>
        <div class="text-3xl font-extrabold my-2">${p1g} – ${p2g}</div>
        <div class="font-bold text-lg">${m.player2}</div>
        <div class="text-xs text-slate-400 mt-1">Game ${cg}${setScores ? ' · ' + setScores : ''}</div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-3">
        <button onclick="bmPoint('${m.id}', 1)" class="w-full big-btn bg-green-500 text-slate-900 rounded-xl">+1 ${m.player1.split(' ')[0]}</button>
        <button onclick="bmPoint('${m.id}', 2)" class="w-full big-btn bg-green-500 text-slate-900 rounded-xl">+1 ${m.player2.split(' ')[0]}</button>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button onclick="bmPoint('${m.id}', 1, -1)" class="py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1</button>
        <button onclick="bmPoint('${m.id}', 2, -1)" class="py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1</button>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-3">
        <button onclick="bmStatus('${m.id}', 'not_started')" class="status-btn rounded-xl ${m.status === 'not_started' ? 'bg-blue-600' : 'bg-slate-700'}">Upcoming</button>
        <button onclick="bmStatus('${m.id}', 'live')" class="status-btn rounded-xl ${isLive ? 'bg-red-600' : 'bg-slate-700'}">LIVE</button>
        <button onclick="bmStatus('${m.id}', 'finished')" class="status-btn rounded-xl ${isFinished ? 'bg-slate-500' : 'bg-slate-700'}">Finished</button>
      </div>

      <button onclick="bmEndGame('${m.id}')" class="w-full py-3 mb-2 bg-amber-600/80 hover:bg-amber-500 rounded-xl text-sm font-bold">End Current Game → Next</button>
      <button onclick="bmDelete('${m.id}')" class="text-xs text-red-400 underline">Delete match</button>
    </div>
  `;
}

window.bmPoint = async function(id, side, delta = 1) {
  const { data: m } = await sb.from('badminton_matches').select('*').eq('id', id).single();
  if (!m) return;
  const cg = m.current_game || 1;
  const key = side === 1 ? `g${cg}_p1` : `g${cg}_p2`;
  let val = (m[key] ?? 0) + delta;
  if (val < 0) val = 0;

  const update = { [key]: val, updated_at: new Date().toISOString() };
  if (m.status === 'not_started') update.status = 'live';

  await sb.from('badminton_matches').update(update).eq('id', id);
  loadBadmintonAdmin();
};

window.bmEndGame = async function(id) {
  const { data: m } = await sb.from('badminton_matches').select('*').eq('id', id).single();
  if (!m) return;

  const cg = m.current_game || 1;
  const p1 = m[`g${cg}_p1`] ?? 0;
  const p2 = m[`g${cg}_p2`] ?? 0;

  let games_p1 = m.games_p1 || 0;
  let games_p2 = m.games_p2 || 0;
  if (p1 > p2) games_p1++;
  else if (p2 > p1) games_p2++;

  let nextGame = cg + 1;
  let status = m.status;
  if (games_p1 >= 2 || games_p2 >= 2) {
    status = 'finished';
    nextGame = cg;
  } else if (nextGame > 3) {
    status = 'finished';
    nextGame = 3;
  }

  await sb.from('badminton_matches').update({
    games_p1, games_p2, current_game: nextGame, status,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  loadBadmintonAdmin();
};

window.bmStatus = async function(id, status) {
  await sb.from('badminton_matches').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  loadBadmintonAdmin();
};

window.bmDelete = async function(id) {
  if (!confirm('Delete this match?')) return;
  await sb.from('badminton_matches').delete().eq('id', id);
  loadBadmintonAdmin();
};

document.getElementById('addBadmintonMatchBtn')?.addEventListener('click', async () => {
  const p1 = document.getElementById('bmP1').value.trim();
  const p2 = document.getElementById('bmP2').value.trim();
  const cat = document.getElementById('bmCategory').value.trim();
  if (!p1 || !p2) { alert('Enter both names'); return; }

  const { error } = await sb.from('badminton_matches').insert({
    player1: p1, player2: p2, category: cat || null,
    status: 'not_started', current_game: 1, games_p1: 0, games_p2: 0,
    g1_p1: 0, g1_p2: 0, g2_p1: 0, g2_p2: 0, g3_p1: 0, g3_p2: 0
  });

  if (error) alert('Error: ' + error.message + '\n\nRun the badminton SQL in Supabase first.');
  else {
    document.getElementById('bmP1').value = '';
    document.getElementById('bmP2').value = '';
    document.getElementById('bmCategory').value = '';
    loadBadmintonAdmin();
  }
});
