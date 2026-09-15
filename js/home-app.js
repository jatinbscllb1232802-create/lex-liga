// Lex Liga Home – Event Centre (dark only)
const sb = window.supabaseClient || window.supabase || supabase;

function forceDark() {
  document.documentElement.classList.add('dark');
  document.body.classList.remove('light');
  localStorage.setItem('theme', 'dark');
}

async function loadHome() {
  if (!sb || typeof sb.from !== 'function') {
    setText('homeLive', '<p class="empty-state">Supabase not ready. Refresh the page.</p>');
    return;
  }

  let futsalLive = [], futsalAll = [], bmLive = [], bmAll = [], teams = [];

  try {
    const [matchesRes, teamsRes, bmRes] = await Promise.all([
      sb.from('matches').select('*'),
      sb.from('teams').select('*'),
      sb.from('badminton_matches').select('*')
    ]);
    teams = teamsRes.data || [];
    futsalAll = matchesRes.data || [];
    bmAll = bmRes.data || [];
    futsalLive = futsalAll.filter(m => m.status === 'live' || m.status === 'half_time');
    bmLive = bmAll.filter(m => m.status === 'live');
  } catch (err) {
    console.error(err);
  }

  const liveHtml = [];
  futsalLive.forEach(m => liveHtml.push(renderFutsalLive(m, teams)));
  bmLive.forEach(m => liveHtml.push(renderBmLive(m)));

  const liveEl = document.getElementById('homeLive');
  if (liveEl) {
    liveEl.innerHTML = liveHtml.length
      ? liveHtml.join('')
      : '<p class="empty-state">No live matches right now. Check back during match times.</p>';
  }

  const liveCount = futsalLive.length + bmLive.length;
  const futsalFinished = futsalAll.filter(m => m.status === 'finished' || m.status === 'walkover').length;
  const bmFinished = bmAll.filter(m => m.status === 'finished').length;

  setText('statLive', String(liveCount));
  setText('statFutsal', String(futsalAll.length));
  setText('statBadminton', String(bmAll.length));
  setText('statDone', String(futsalFinished + bmFinished));
  setText('badgeFutsalLive', futsalLive.length ? futsalLive.length + ' LIVE' : 'View');
  setText('badgeBmLive', bmLive.length ? bmLive.length + ' LIVE' : 'View');

  const up = document.getElementById('lastUpdated');
  if (up) up.textContent = 'Updated ' + new Date().toLocaleTimeString();
}

function teamName(teams, id) {
  const t = teams.find(x => x.id === id);
  return t ? t.name : 'TBD';
}

function renderFutsalLive(m, teams) {
  const home = teamName(teams, m.home_team_id);
  const away = teamName(teams, m.away_team_id);
  return `
    <a href="futsal.html" class="home-live-card home-live-futsal">
      <div class="home-live-sport">⚽ Futsal · LIVE</div>
      <div class="home-live-scoreline">
        <span class="home-live-team">${home}</span>
        <span class="home-live-score">${m.home_score ?? 0} – ${m.away_score ?? 0}</span>
        <span class="home-live-team">${away}</span>
      </div>
      <div class="home-live-meta">${m.group_name || 'Match'} · Open Futsal →</div>
    </a>`;
}

function renderBmLive(m) {
  const cg = m.current_game || 1;
  const p1 = m['g' + cg + '_p1'] ?? 0;
  const p2 = m['g' + cg + '_p2'] ?? 0;
  return `
    <a href="badminton.html" class="home-live-card home-live-badminton">
      <div class="home-live-sport">🏸 Badminton · LIVE</div>
      <div class="home-live-scoreline">
        <span class="home-live-team">${m.player1}</span>
        <span class="home-live-score">${p1} – ${p2}</span>
        <span class="home-live-team">${m.player2}</span>
      </div>
      <div class="home-live-meta">${m.category || 'Match'} · Games ${m.games_p1 || 0}–${m.games_p2 || 0} · Open Badminton →</div>
    </a>`;
}

function setText(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  forceDark();
  loadHome();
  setInterval(loadHome, 15000);
  document.getElementById('refreshBtn')?.addEventListener('click', loadHome);
});
