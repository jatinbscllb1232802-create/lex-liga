// Lex Liga Admin - with easy Goal Scorer

const sb = window.supabaseClient || window.supabase || supabase;

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
let allGoals = [];

function getTeamName(id) {
  const t = allTeams.find(t => t.id === id);
  return t ? t.name : 'TBD';
}

async function loadAdminData() {
  const container = document.getElementById('adminMatches');
  container.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Loading matches...</p>';

  if (!sb || typeof sb.from !== 'function') {
    container.innerHTML = '<p class="text-red-400 text-sm text-center">Supabase not ready. Please hard-refresh.</p>';
    return;
  }

  try {
    const { data: teams, error: te } = await sb.from('teams').select('*').order('name');
    if (te) throw te;
    allTeams = teams || [];

    // Fill dropdowns for Add Match
    const homeSelect = document.getElementById('newHome');
    const awaySelect = document.getElementById('newAway');
    if (homeSelect && awaySelect) {
      const opts = allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      homeSelect.innerHTML = opts;
      awaySelect.innerHTML = opts;
    }

    const { data: matches, error } = await sb.from('matches').select('*').order('kickoff_time', { ascending: true });
    if (error) throw error;

    const { data: goals } = await sb.from('goals').select('*');
    allGoals = goals || [];

    if (!matches || matches.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet.<br>Add one below.</p>';
      return;
    }

    container.innerHTML = matches.map(m => renderAdminCard(m)).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-red-400 text-sm text-center">Error: ${err.message || err}</p>`;
  }
}

function renderAdminCard(m) {
  const home = getTeamName(m.home_team_id);
  const away = getTeamName(m.away_team_id);
  const isLive = m.status === 'live' || m.status === 'half_time';
  const isFinished = m.status === 'finished' || m.status === 'walkover';

  // Goals for this match
  const matchGoals = allGoals.filter(g => g.match_id === m.id);
  const goalsList = matchGoals.length
    ? `<div class="mt-3 text-sm text-slate-300 space-y-1">
        ${matchGoals.map(g => `
          <div class="flex justify-between items-center bg-slate-700/50 rounded-lg px-3 py-1.5">
            <span>${g.player_name} <span class="text-slate-400">(${getTeamName(g.team_id)})</span></span>
            <span class="text-slate-400">${g.minute ? g.minute + "'" : ''}</span>
          </div>
        `).join('')}
       </div>`
    : '';

  return `
    <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700" data-id="${m.id}">
      
      <!-- Teams + Score -->
      <div class="text-center mb-5">
        <div class="text-xs text-slate-400 mb-2">${m.group_name || ''}</div>
        <div class="font-bold text-lg mb-1">${home}</div>
        <div class="text-4xl font-extrabold my-2 tracking-tight">
          <span id="home-${m.id}">${m.home_score ?? 0}</span>
          <span class="text-slate-500 mx-2">–</span>
          <span id="away-${m.id}">${m.away_score ?? 0}</span>
        </div>
        <div class="font-bold text-lg">${away}</div>
      </div>

      <!-- BIG SCORE BUTTONS -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="space-y-2">
          <button onclick="changeScore('${m.id}', 'home', 1)" 
            class="w-full big-btn bg-green-500 hover:bg-green-400 text-slate-900 rounded-xl active:scale-95 transition">
            +1 ${home.split(' ')[0]}
          </button>
          <button onclick="changeScore('${m.id}', 'home', -1)" 
            class="w-full big-btn bg-slate-700 hover:bg-slate-600 rounded-xl active:scale-95 transition">
            –1
          </button>
        </div>
        <div class="space-y-2">
          <button onclick="changeScore('${m.id}', 'away', 1)" 
            class="w-full big-btn bg-green-500 hover:bg-green-400 text-slate-900 rounded-xl active:scale-95 transition">
            +1 ${away.split(' ')[0]}
          </button>
          <button onclick="changeScore('${m.id}', 'away', -1)" 
            class="w-full big-btn bg-slate-700 hover:bg-slate-600 rounded-xl active:scale-95 transition">
            –1
          </button>
        </div>
      </div>

      <!-- STATUS -->
      <div class="grid grid-cols-3 gap-2 mb-5">
        <button onclick="updateStatus('${m.id}', 'not_started')" 
          class="status-btn rounded-xl ${m.status === 'not_started' ? 'bg-blue-600 text-white' : 'bg-slate-700'}">
          Upcoming
        </button>
        <button onclick="updateStatus('${m.id}', 'live')" 
          class="status-btn rounded-xl ${isLive ? 'bg-red-600 text-white' : 'bg-slate-700'}">
          LIVE
        </button>
        <button onclick="updateStatus('${m.id}', 'finished')" 
          class="status-btn rounded-xl ${isFinished ? 'bg-slate-500 text-white' : 'bg-slate-700'}">
          Finished
        </button>
      </div>

      <!-- ========== ADD GOAL SECTION ========== -->
      <div class="bg-slate-900/60 rounded-xl p-4 mb-4">
        <p class="text-sm font-semibold mb-3 text-center">Add Goal Scorer</p>
        
        <label class="text-xs text-slate-400 block mb-1">Which team?</label>
        <select id="scorerTeam-${m.id}" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 mb-3 text-sm">
          <option value="${m.home_team_id}">${home}</option>
          <option value="${m.away_team_id}">${away}</option>
        </select>

        <label class="text-xs text-slate-400 block mb-1">Player Name</label>
        <input id="scorerName-${m.id}" type="text" placeholder="e.g. Aarav Sharma" 
          class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 mb-3 text-sm" />

        <label class="text-xs text-slate-400 block mb-1">Minute (optional)</label>
        <input id="scorerMinute-${m.id}" type="number" placeholder="e.g. 23" min="1" max="50"
          class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 mb-3 text-sm" />

        <button onclick="addGoal('${m.id}')" 
          class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm">
          + Add Goal
        </button>

        ${goalsList}
      </div>

      <!-- Extra actions -->
      <div class="flex justify-between text-sm pt-1">
        <button onclick="resetScore('${m.id}')" class="text-slate-400 underline">Reset Score</button>
        <button onclick="deleteMatch('${m.id}')" class="text-red-400 underline">Delete</button>
      </div>
    </div>
  `;
}

window.changeScore = async function(matchId, side, delta) {
  const el = document.getElementById(`${side}-${matchId}`);
  let current = parseInt(el.textContent) || 0;
  current = Math.max(0, current + delta);
  el.textContent = current;

  el.classList.add('text-green-400');
  setTimeout(() => el.classList.remove('text-green-400'), 300);

  const update = side === 'home' ? { home_score: current } : { away_score: current };
  update.updated_at = new Date().toISOString();

  const { error } = await sb.from('matches').update(update).eq('id', matchId);
  if (error) {
    alert('Could not save: ' + error.message);
    loadAdminData();
  }
};

window.updateStatus = async function(matchId, status) {
  const { error } = await sb.from('matches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', matchId);
  
  if (error) alert('Error: ' + error.message);
  else loadAdminData();
};

window.addGoal = async function(matchId) {
  const teamId = document.getElementById(`scorerTeam-${matchId}`).value;
  const name = document.getElementById(`scorerName-${matchId}`).value.trim();
  const minuteVal = document.getElementById(`scorerMinute-${matchId}`).value;
  const minute = minuteVal ? parseInt(minuteVal) : null;

  if (!name) {
    alert('Please enter player name');
    return;
  }

  const { error } = await sb.from('goals').insert({
    match_id: matchId,
    team_id: teamId,
    player_name: name,
    minute: minute
  });

  if (error) {
    alert('Error adding goal: ' + error.message);
  } else {
    // Clear inputs
    document.getElementById(`scorerName-${matchId}`).value = '';
    document.getElementById(`scorerMinute-${matchId}`).value = '';
    // Refresh to show the new goal in the list
    loadAdminData();
  }
};

window.resetScore = async function(matchId) {
  if (!confirm('Reset score to 0-0?')) return;
  const { error } = await sb.from('matches')
    .update({ home_score: 0, away_score: 0, updated_at: new Date().toISOString() })
    .eq('id', matchId);
  if (error) alert(error.message);
  else loadAdminData();
};

window.deleteMatch = async function(matchId) {
  if (!confirm('Delete this match?')) return;
  const { error } = await sb.from('matches').delete().eq('id', matchId);
  if (error) alert(error.message);
  else loadAdminData();
};

// Add new match
document.getElementById('addMatchBtn')?.addEventListener('click', async () => {
  const home = document.getElementById('newHome').value;
  const away = document.getElementById('newAway').value;
  const group = document.getElementById('newGroup').value.trim();

  if (home === away) {
    alert('Please choose two different teams');
    return;
  }

  const { error } = await sb.from('matches').insert({
    home_team_id: home,
    away_team_id: away,
    group_name: group || null,
    status: 'not_started',
    home_score: 0,
    away_score: 0,
    kickoff_time: new Date().toISOString()
  });

  if (error) {
    alert('Error: ' + error.message);
  } else {
    document.getElementById('newGroup').value = '';
    alert('Match added!');
    loadAdminData();
  }
});
