// Lex Liga Badminton Admin
// Best of 3 games · each game to 21 · win by 2 · max 30

const sb = window.supabaseClient || window.supabase || supabase;

async function loadBadmintonAdmin() {
  const container = document.getElementById('adminBadmintonMatches');
  if (!container) return;
  container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">Loading...</p>';

  if (!sb || typeof sb.from !== 'function') {
    container.innerHTML = '<p class="text-red-400 text-sm text-center">Supabase not ready. Hard-refresh the page.</p>';
    return;
  }

  try {
    const { data, error } = await sb
      .from('badminton_matches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet.<br>Add one below or run the dummy SQL.</p>';
      return;
    }

    container.innerHTML = data.map(m => renderBadmintonCard(m)).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-red-400 text-sm text-center px-2">Error: ${err.message || err}<br><br>Run the Badminton SQL in Supabase (see BADMINTON_SQL.md).</p>`;
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
  const isUpcoming = m.status === 'not_started';

  const setBadges = [1, 2, 3].map(g => {
    const a = m[`g${g}_p1`];
    const b = m[`g${g}_p2`];
    if (a == null && b == null) return '';
    const done = g < cg || isFinished;
    return `<span class="text-xs px-2 py-1 rounded ${done ? 'bg-slate-600' : 'bg-green-600/40 border border-green-500/40'}">G${g}: ${a ?? 0}–${b ?? 0}</span>`;
  }).join('');

  return `
    <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700" data-id="${m.id}">
      <div class="text-center mb-4">
        <div class="text-xs text-slate-400 mb-1">${m.category || 'Match'}</div>
        <div class="font-bold text-lg">${m.player1}</div>
        <div class="text-4xl font-extrabold my-2 tracking-tight">${p1g} – ${p2g}</div>
        <div class="font-bold text-lg">${m.player2}</div>
        <div class="text-sm text-slate-400 mt-2">Games ${m.games_p1 || 0} – ${m.games_p2 || 0} · Current: Game ${cg}</div>
        <div class="flex flex-wrap justify-center gap-2 mt-2">${setBadges}</div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-3">
        <button type="button" onclick="bmPoint('${m.id}', 1)"
          class="w-full big-btn bg-green-500 hover:bg-green-400 text-slate-900 rounded-xl">+1 ${esc(m.player1).split(' ')[0]}</button>
        <button type="button" onclick="bmPoint('${m.id}', 2)"
          class="w-full big-btn bg-green-500 hover:bg-green-400 text-slate-900 rounded-xl">+1 ${esc(m.player2).split(' ')[0]}</button>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button type="button" onclick="bmPoint('${m.id}', 1, -1)" class="py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1</button>
        <button type="button" onclick="bmPoint('${m.id}', 2, -1)" class="py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1</button>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-3">
        <button type="button" onclick="bmStatus('${m.id}', 'not_started')"
          class="status-btn rounded-xl ${isUpcoming ? 'bg-blue-600 text-white' : 'bg-slate-700'}">Upcoming</button>
        <button type="button" onclick="bmStatus('${m.id}', 'live')"
          class="status-btn rounded-xl ${isLive ? 'bg-red-600 text-white' : 'bg-slate-700'}">LIVE</button>
        <button type="button" onclick="bmStatus('${m.id}', 'finished')"
          class="status-btn rounded-xl ${isFinished ? 'bg-slate-500 text-white' : 'bg-slate-700'}">Finished</button>
      </div>

      <button type="button" onclick="bmEndGame('${m.id}')"
        class="w-full py-3 mb-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-bold">
        End Game ${cg} → Next
      </button>
      <button type="button" onclick="bmDelete('${m.id}')" class="text-xs text-red-400 underline w-full text-center">Delete match</button>
    </div>
  `;
}

function esc(s) {
  return String(s || '').replace(/'/g, "\\'").replace(/"/g, '');
}

window.bmPoint = async function (id, side, delta = 1) {
  try {
    const { data: m, error } = await sb.from('badminton_matches').select('*').eq('id', id).single();
    if (error || !m) { alert(error?.message || 'Match not found'); return; }

    const cg = m.current_game || 1;
    const key = side === 1 ? `g${cg}_p1` : `g${cg}_p2`;
    let val = (m[key] ?? 0) + delta;
    if (val < 0) val = 0;

    const update = { [key]: val, updated_at: new Date().toISOString() };
    if (m.status === 'not_started') update.status = 'live';

    const { error: upErr } = await sb.from('badminton_matches').update(update).eq('id', id);
    if (upErr) alert(upErr.message);
    loadBadmintonAdmin();
  } catch (e) {
    alert(e.message || e);
  }
};

window.bmEndGame = async function (id) {
  try {
    const { data: m, error } = await sb.from('badminton_matches').select('*').eq('id', id).single();
    if (error || !m) return;

    const cg = m.current_game || 1;
    const p1 = m[`g${cg}_p1`] ?? 0;
    const p2 = m[`g${cg}_p2`] ?? 0;

    if (p1 === 0 && p2 === 0) {
      if (!confirm('Both scores are 0. End this game anyway?')) return;
    }

    let games_p1 = m.games_p1 || 0;
    let games_p2 = m.games_p2 || 0;
    if (p1 > p2) games_p1++;
    else if (p2 > p1) games_p2++;
    else {
      alert('Scores are tied — one side must lead to end the game.');
      return;
    }

    let nextGame = cg + 1;
    let status = m.status || 'live';
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
  } catch (e) {
    alert(e.message || e);
  }
};

window.bmStatus = async function (id, status) {
  const { error } = await sb.from('badminton_matches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) alert(error.message);
  loadBadmintonAdmin();
};

window.bmDelete = async function (id) {
  if (!confirm('Delete this match?')) return;
  const { error } = await sb.from('badminton_matches').delete().eq('id', id);
  if (error) alert(error.message);
  loadBadmintonAdmin();
};

window.addBadmintonMatch = async function () {
  const p1El = document.getElementById('bmP1');
  const p2El = document.getElementById('bmP2');
  const catEl = document.getElementById('bmCategory');
  const p1 = (p1El?.value || '').trim();
  const p2 = (p2El?.value || '').trim();
  const cat = (catEl?.value || '').trim();

  if (!p1 || !p2) {
    alert('Enter both player / pair names');
    return;
  }

  if (!sb || typeof sb.from !== 'function') {
    alert('Supabase not ready. Hard-refresh the page.');
    return;
  }

  const { error } = await sb.from('badminton_matches').insert({
    player1: p1,
    player2: p2,
    category: cat || null,
    status: 'not_started',
    current_game: 1,
    games_p1: 0,
    games_p2: 0,
    g1_p1: 0,
    g1_p2: 0,
    g2_p1: 0,
    g2_p2: 0,
    g3_p1: 0,
    g3_p2: 0
  });

  if (error) {
    alert('Could not add match:\n' + error.message + '\n\nMake sure you ran the Badminton SQL in Supabase.');
    return;
  }

  if (p1El) p1El.value = '';
  if (p2El) p2El.value = '';
  if (catEl) catEl.value = '';
  alert('Match added!');
  loadBadmintonAdmin();
};

// Bind add button (works even if panel was hidden at load)
document.getElementById('addBadmintonMatchBtn')?.addEventListener('click', function (e) {
  e.preventDefault();
  window.addBadmintonMatch();
});
