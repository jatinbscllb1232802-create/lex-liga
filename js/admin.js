// Lex Liga Admin logic (simplified)

const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

if (sessionStorage.getItem('lexAdmin') === 'true') {
  showAdmin();
}

loginBtn.addEventListener('click', tryLogin);
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tryLogin();
});

function tryLogin() {
  if (passwordInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem('lexAdmin', 'true');
    showAdmin();
  } else {
    loginError.classList.remove('hidden');
    passwordInput.value = '';
  }
}

function showAdmin() {
  loginScreen.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  loadAdminData();
}

logoutBtn?.addEventListener('click', () => {
  sessionStorage.removeItem('lexAdmin');
  location.reload();
});

document.getElementById('refreshAdmin')?.addEventListener('click', loadAdminData);

let allTeams = [];

function getTeamName(id) {
  const t = allTeams.find(t => t.id === id);
  return t ? t.name : 'TBD';
}

async function loadAdminData() {
  const container = document.getElementById('adminMatches');
  container.innerHTML = '<p class="text-slate-400 text-sm">Loading...</p>';

  try {
    const { data: teams, error: te } = await supabase.from('teams').select('*').order('name');
    if (te) throw te;
    allTeams = teams || [];

    // Fill dropdowns
    const homeSelect = document.getElementById('newHome');
    const awaySelect = document.getElementById('newAway');
    if (homeSelect && awaySelect) {
      const opts = allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      homeSelect.innerHTML = opts;
      awaySelect.innerHTML = opts;
    }

    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true });

    if (error) throw error;

    if (!matches || matches.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm">No matches yet. Add one below.</p>';
      return;
    }

    container.innerHTML = matches.map(m => renderAdminCard(m)).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-400">Error: ${err.message || err}</p>`;
    console.error(err);
  }
}

function renderAdminCard(m) {
  const home = getTeamName(m.home_team_id);
  const away = getTeamName(m.away_team_id);

  return `
    <div class="bg-slate-800 rounded-xl p-4 border border-slate-700" data-id="${m.id}">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs text-slate-400">${m.group_name || ''}</span>
        <select onchange="updateStatus('${m.id}', this.value)" 
          class="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs">
          <option value="not_started" ${m.status === 'not_started' ? 'selected' : ''}>Not started</option>
          <option value="live" ${m.status === 'live' ? 'selected' : ''}>Live</option>
          <option value="half_time" ${m.status === 'half_time' ? 'selected' : ''}>Half-time</option>
          <option value="finished" ${m.status === 'finished' ? 'selected' : ''}>Finished</option>
          <option value="walkover" ${m.status === 'walkover' ? 'selected' : ''}>Walkover</option>
          <option value="cancelled" ${m.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>

      <div class="flex items-center justify-between gap-2 mb-4">
        <div class="flex-1 text-right font-semibold text-sm truncate">${home}</div>
        
        <div class="flex items-center gap-2">
          <button onclick="changeScore('${m.id}', 'home', -1)" class="score-btn bg-slate-700 hover:bg-slate-600">−</button>
          <span class="score text-2xl w-8 text-center" id="home-${m.id}">${m.home_score ?? 0}</span>
          <button onclick="changeScore('${m.id}', 'home', 1)" class="score-btn bg-primary text-slate-900 hover:bg-green-400">+</button>
        </div>

        <span class="text-slate-500">–</span>

        <div class="flex items-center gap-2">
          <button onclick="changeScore('${m.id}', 'away', -1)" class="score-btn bg-slate-700 hover:bg-slate-600">−</button>
          <span class="score text-2xl w-8 text-center" id="away-${m.id}">${m.away_score ?? 0}</span>
          <button onclick="changeScore('${m.id}', 'away', 1)" class="score-btn bg-primary text-slate-900 hover:bg-green-400">+</button>
        </div>

        <div class="flex-1 font-semibold text-sm truncate">${away}</div>
      </div>

      <div class="flex gap-2 mb-3">
        <select id="scorerTeam-${m.id}" class="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs flex-1">
          <option value="${m.home_team_id}">${home}</option>
          <option value="${m.away_team_id}">${away}</option>
        </select>
        <input id="scorerName-${m.id}" type="text" placeholder="Player name" 
          class="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs flex-1" />
        <button onclick="addGoal('${m.id}')" class="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-xs font-medium">
          + Goal
        </button>
      </div>

      <div class="flex gap-2">
        <button onclick="resetScore('${m.id}')" class="text-xs text-slate-400 hover:text-white underline">Reset score</button>
        <button onclick="deleteMatch('${m.id}')" class="text-xs text-red-400 hover:text-red-300 underline ml-auto">Delete</button>
      </div>
    </div>
  `;
}

window.changeScore = async function(matchId, side, delta) {
  const el = document.getElementById(`${side}-${matchId}`);
  let current = parseInt(el.textContent) || 0;
  current = Math.max(0, current + delta);
  el.textContent = current;

  const update = side === 'home' ? { home_score: current } : { away_score: current };
  update.updated_at = new Date().toISOString();

  const { error } = await supabase.from('matches').update(update).eq('id', matchId);
  if (error) {
    alert('Error saving score: ' + error.message);
    loadAdminData();
  }
};

window.updateStatus = async function(matchId, status) {
  const { error } = await supabase
    .from('matches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', matchId);
  if (error) alert('Error: ' + error.message);
};

window.addGoal = async function(matchId) {
  const teamId = document.getElementById(`scorerTeam-${matchId}`).value;
  const name = document.getElementById(`scorerName-${matchId}`).value.trim();
  if (!name) {
    alert('Enter player name');
    return;
  }

  const { error } = await supabase.from('goals').insert({
    match_id: matchId,
    team_id: teamId,
    player_name: name
  });

  if (error) {
    alert('Error adding goal: ' + error.message);
  } else {
    document.getElementById(`scorerName-${matchId}`).value = '';
    loadAdminData();
  }
};

window.resetScore = async function(matchId) {
  if (!confirm('Reset both scores to 0?')) return;
  const { error } = await supabase
    .from('matches')
    .update({ home_score: 0, away_score: 0, updated_at: new Date().toISOString() })
    .eq('id', matchId);
  if (error) alert(error.message);
  else loadAdminData();
};

window.deleteMatch = async function(matchId) {
  if (!confirm('Delete this match permanently?')) return;
  const { error } = await supabase.from('matches').delete().eq('id', matchId);
  if (error) alert(error.message);
  else loadAdminData();
};

document.getElementById('addMatchBtn')?.addEventListener('click', async () => {
  const home = document.getElementById('newHome').value;
  const away = document.getElementById('newAway').value;
  const group = document.getElementById('newGroup').value.trim();
  const status = document.getElementById('newStatus').value;

  if (home === away) {
    alert('Home and Away teams must be different');
    return;
  }

  const { error } = await supabase.from('matches').insert({
    home_team_id: home,
    away_team_id: away,
    group_name: group || null,
    status,
    home_score: 0,
    away_score: 0,
    kickoff_time: new Date().toISOString()
  });

  if (error) alert('Error: ' + error.message);
  else {
    document.getElementById('newGroup').value = '';
    loadAdminData();
  }
});
