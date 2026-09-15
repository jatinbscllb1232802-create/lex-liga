// Lex Liga Badminton Admin
// Best of 3 · to 21 · win by 2 · max 30

function getSb() {
  return window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}

async function loadBadmintonAdmin() {
  const container = document.getElementById('adminBadmintonMatches');
  if (!container) {
    console.error('adminBadmintonMatches not found');
    return;
  }

  container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">Loading matches...</p>';

  const sb = getSb();
  if (!sb || typeof sb.from !== 'function') {
    container.innerHTML = '<p class="text-red-400 text-sm text-center px-3">Supabase client not ready.<br>Hard-refresh this page (Ctrl+Shift+R).</p>';
    return;
  }

  try {
    const res = await sb.from('badminton_matches').select('*').order('created_at', { ascending: false });
    const data = res.data;
    const error = res.error;

    if (error) {
      container.innerHTML = `<p class="text-red-400 text-sm text-center px-3">Error: ${error.message}<br><br>Check Supabase table <b>badminton_matches</b>.</p>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet.<br>Add one below.</p>';
      return;
    }

    container.innerHTML = data.map(function (m) { return renderBadmintonCard(m); }).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-red-400 text-sm text-center px-3">Error: ${err.message || err}</p>`;
  }
}

window.loadBadmintonAdmin = loadBadmintonAdmin;

function renderBadmintonCard(m) {
  const cg = m.current_game || 1;
  const p1g = m['g' + cg + '_p1'] != null ? m['g' + cg + '_p1'] : 0;
  const p2g = m['g' + cg + '_p2'] != null ? m['g' + cg + '_p2'] : 0;
  const isLive = m.status === 'live';
  const isFinished = m.status === 'finished';
  const isUpcoming = m.status === 'not_started';

  let setBadges = '';
  for (let g = 1; g <= 3; g++) {
    const a = m['g' + g + '_p1'];
    const b = m['g' + g + '_p2'];
    if (a == null && b == null) continue;
    const active = g === cg && !isFinished;
    setBadges += '<span class="text-xs px-2 py-1 rounded ' +
      (active ? 'bg-green-600/40 border border-green-500/40' : 'bg-slate-600') +
      '">G' + g + ': ' + (a || 0) + '–' + (b || 0) + '</span>';
  }

  const p1short = String(m.player1 || 'P1').split(' ')[0];
  const p2short = String(m.player2 || 'P2').split(' ')[0];

  return (
    '<div class="bg-slate-800 rounded-2xl p-5 border border-slate-700" data-id="' + m.id + '">' +
      '<div class="text-center mb-4">' +
        '<div class="text-xs text-slate-400 mb-1">' + (m.category || 'Match') + '</div>' +
        '<div class="font-bold text-lg">' + m.player1 + '</div>' +
        '<div class="text-4xl font-extrabold my-2">' + p1g + ' – ' + p2g + '</div>' +
        '<div class="font-bold text-lg">' + m.player2 + '</div>' +
        '<div class="text-sm text-slate-400 mt-2">Games ' + (m.games_p1 || 0) + ' – ' + (m.games_p2 || 0) + ' · Game ' + cg + '</div>' +
        '<div class="flex flex-wrap justify-center gap-2 mt-2">' + setBadges + '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3 mb-3">' +
        '<button type="button" onclick="bmPoint(\'' + m.id + '\', 1)" class="w-full big-btn bg-green-500 text-slate-900 rounded-xl">+1 ' + p1short + '</button>' +
        '<button type="button" onclick="bmPoint(\'' + m.id + '\', 2)" class="w-full big-btn bg-green-500 text-slate-900 rounded-xl">+1 ' + p2short + '</button>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3 mb-4">' +
        '<button type="button" onclick="bmPoint(\'' + m.id + '\', 1, -1)" class="py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1</button>' +
        '<button type="button" onclick="bmPoint(\'' + m.id + '\', 2, -1)" class="py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1</button>' +
      '</div>' +
      '<div class="grid grid-cols-3 gap-2 mb-3">' +
        '<button type="button" onclick="bmStatus(\'' + m.id + '\', \'not_started\')" class="status-btn rounded-xl ' + (isUpcoming ? 'bg-blue-600 text-white' : 'bg-slate-700') + '">Upcoming</button>' +
        '<button type="button" onclick="bmStatus(\'' + m.id + '\', \'live\')" class="status-btn rounded-xl ' + (isLive ? 'bg-red-600 text-white' : 'bg-slate-700') + '">LIVE</button>' +
        '<button type="button" onclick="bmStatus(\'' + m.id + '\', \'finished\')" class="status-btn rounded-xl ' + (isFinished ? 'bg-slate-500 text-white' : 'bg-slate-700') + '">Finished</button>' +
      '</div>' +
      '<button type="button" onclick="bmEndGame(\'' + m.id + '\')" class="w-full py-3 mb-2 bg-amber-600 rounded-xl text-sm font-bold">End Game ' + cg + ' → Next</button>' +
      '<button type="button" onclick="bmDelete(\'' + m.id + '\')" class="text-xs text-red-400 underline w-full text-center">Delete match</button>' +
    '</div>'
  );
}

window.bmPoint = async function (id, side, delta) {
  if (delta === undefined) delta = 1;
  const sb = getSb();
  try {
    const { data: m, error } = await sb.from('badminton_matches').select('*').eq('id', id).single();
    if (error || !m) { alert(error ? error.message : 'Not found'); return; }
    const cg = m.current_game || 1;
    const key = side === 1 ? ('g' + cg + '_p1') : ('g' + cg + '_p2');
    let val = (m[key] != null ? m[key] : 0) + delta;
    if (val < 0) val = 0;
    const update = { updated_at: new Date().toISOString() };
    update[key] = val;
    if (m.status === 'not_started') update.status = 'live';
    const { error: upErr } = await sb.from('badminton_matches').update(update).eq('id', id);
    if (upErr) alert(upErr.message);
    loadBadmintonAdmin();
  } catch (e) { alert(e.message || e); }
};

window.bmEndGame = async function (id) {
  const sb = getSb();
  try {
    const { data: m, error } = await sb.from('badminton_matches').select('*').eq('id', id).single();
    if (error || !m) return;
    const cg = m.current_game || 1;
    const p1 = m['g' + cg + '_p1'] != null ? m['g' + cg + '_p1'] : 0;
    const p2 = m['g' + cg + '_p2'] != null ? m['g' + cg + '_p2'] : 0;
    if (p1 === p2) { alert('Scores tied — one side must lead.'); return; }
    let games_p1 = m.games_p1 || 0;
    let games_p2 = m.games_p2 || 0;
    if (p1 > p2) games_p1++; else games_p2++;
    let nextGame = cg + 1;
    let status = m.status || 'live';
    if (games_p1 >= 2 || games_p2 >= 2) { status = 'finished'; nextGame = cg; }
    else if (nextGame > 3) { status = 'finished'; nextGame = 3; }
    await sb.from('badminton_matches').update({
      games_p1: games_p1, games_p2: games_p2, current_game: nextGame, status: status,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    loadBadmintonAdmin();
  } catch (e) { alert(e.message || e); }
};

window.bmStatus = async function (id, status) {
  const sb = getSb();
  const { error } = await sb.from('badminton_matches').update({ status: status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) alert(error.message);
  loadBadmintonAdmin();
};

window.bmDelete = async function (id) {
  if (!confirm('Delete this match?')) return;
  const sb = getSb();
  const { error } = await sb.from('badminton_matches').delete().eq('id', id);
  if (error) alert(error.message);
  loadBadmintonAdmin();
};

window.addBadmintonMatch = async function () {
  const p1 = (document.getElementById('bmP1') && document.getElementById('bmP1').value || '').trim();
  const p2 = (document.getElementById('bmP2') && document.getElementById('bmP2').value || '').trim();
  const cat = (document.getElementById('bmCategory') && document.getElementById('bmCategory').value || '').trim();
  if (!p1 || !p2) { alert('Enter both names'); return; }
  const sb = getSb();
  if (!sb || typeof sb.from !== 'function') { alert('Supabase not ready'); return; }
  const { error } = await sb.from('badminton_matches').insert({
    player1: p1, player2: p2, category: cat || null,
    status: 'not_started', current_game: 1, games_p1: 0, games_p2: 0,
    g1_p1: 0, g1_p2: 0, g2_p1: 0, g2_p2: 0, g3_p1: 0, g3_p2: 0
  });
  if (error) { alert('Could not add:\n' + error.message); return; }
  document.getElementById('bmP1').value = '';
  document.getElementById('bmP2').value = '';
  document.getElementById('bmCategory').value = '';
  alert('Match added!');
  loadBadmintonAdmin();
};

document.getElementById('refreshBadminton') && document.getElementById('refreshBadminton').addEventListener('click', loadBadmintonAdmin);
document.getElementById('addBadmintonMatchBtn') && document.getElementById('addBadmintonMatchBtn').addEventListener('click', function (e) {
  e.preventDefault();
  window.addBadmintonMatch();
});
