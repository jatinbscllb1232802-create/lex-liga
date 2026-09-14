// Lex Liga Futsal - Public pages logic

const sb = window.supabaseClient || window.supabase || supabase;

let lastFetchTime = null;
let allTeams = [];
let allMatches = [];
let allGoals = [];
let allCards = [];

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

function getTeamName(id) {
  const t = allTeams.find(t => t.id === id);
  return t ? t.name : 'TBD';
}

function statusBadge(status) {
  const map = {
    live: 'LIVE',
    half_time: 'HT',
    finished: 'FT',
    not_started: 'Upcoming',
    walkover: 'WO',
    cancelled: 'Canc.'
  };
  const label = map[status] || status;
  return `<span class="status-${status} text-xs font-bold px-2 py-0.5 rounded text-white">${label}</span>`;
}

function renderMatchCard(match) {
  const home = getTeamName(match.home_team_id);
  const away = getTeamName(match.away_team_id);
  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;

  // Winner text
  let winnerHtml = '';
  if (match.status === 'finished' || match.status === 'walkover') {
    if (homeScore > awayScore) {
      winnerHtml = `<div class="text-center text-xs text-green-400 font-semibold mt-1">Winner: ${home}</div>`;
    } else if (awayScore > homeScore) {
      winnerHtml = `<div class="text-center text-xs text-green-400 font-semibold mt-1">Winner: ${away}</div>`;
    } else {
      winnerHtml = `<div class="text-center text-xs text-slate-400 font-semibold mt-1">Draw</div>`;
    }
  }

  // Split goals by team
  const homeGoals = allGoals.filter(g => g.match_id === match.id && g.team_id === match.home_team_id);
  const awayGoals = allGoals.filter(g => g.match_id === match.id && g.team_id === match.away_team_id);

  // Cards for this match
  const matchCards = allCards.filter(c => c.match_id === match.id);

  const homeScorersHtml = homeGoals.length
    ? homeGoals.map(g => `<div class="text-xs text-slate-400">⚽ ${g.player_name}${g.minute ? ` ${g.minute}'` : ''}</div>`).join('')
    : '';

  const awayScorersHtml = awayGoals.length
    ? awayGoals.map(g => `<div class="text-xs text-slate-400">⚽ ${g.player_name}${g.minute ? ` ${g.minute}'` : ''}</div>`).join('')
    : '';

  const cardsHtml = matchCards.length
    ? `<div class="mt-2 flex flex-wrap gap-2 justify-center">
        ${matchCards.map(c => `
          <span class="text-xs px-2 py-0.5 rounded ${c.card_type === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}">
            ${c.card_type === 'yellow' ? '🟨' : '🟥'} ${c.player_name}${c.minute ? ` ${c.minute}'` : ''}
          </span>
        `).join('')}
       </div>`
    : '';

  return `
    <div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div class="flex items-center justify-between mb-3">
        ${statusBadge(match.status)}
        <span class="text-xs text-slate-400">${match.group_name || ''}</span>
      </div>

      <!-- Score row -->
      <div class="flex items-start justify-between gap-2">
        <!-- Home side -->
        <div class="flex-1 text-right">
          <div class="font-semibold text-sm sm:text-base truncate">${home}</div>
          <div class="mt-1 space-y-0.5">${homeScorersHtml}</div>
        </div>

        <!-- Score -->
        <div class="score text-2xl sm:text-3xl px-3 min-w-[70px] text-center font-extrabold pt-0.5">
          ${homeScore} – ${awayScore}
        </div>

        <!-- Away side -->
        <div class="flex-1 text-left">
          <div class="font-semibold text-sm sm:text-base truncate">${away}</div>
          <div class="mt-1 space-y-0.5">${awayScorersHtml}</div>
        </div>
      </div>

      <!-- Winner -->
      ${winnerHtml}

      <!-- Cards -->
      ${cardsHtml}

      <div class="mt-3 flex justify-end">
        <button onclick="shareMatch('${home.replace(/'/g, "\\'")}', '${away.replace(/'/g, "\\'")}', ${homeScore}, ${awayScore}, '${match.status}')"
          class="text-xs text-primary hover:underline">Share</button>
      </div>
    </div>
  `;
}

window.shareMatch = function(home, away, hs, as, status) {
  const text = `${home} ${hs} – ${as} ${away} (${status.toUpperCase()}) | Lex Liga Futsal`;
  if (navigator.share) {
    navigator.share({ title: 'Lex Liga', text });
  } else {
    navigator.clipboard.writeText(text);
    alert('Score copied!');
  }
};

function calculateStandings() {
  const table = {};
  allTeams.forEach(t => {
    table[t.id] = { id: t.id, name: t.name, group: t.group_name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  });

  allMatches.filter(m => m.status === 'finished' || m.status === 'walkover').forEach(m => {
    const home = table[m.home_team_id];
    const away = table[m.away_team_id];
    if (!home || !away) return;

    home.played++; away.played++;
    home.gf += (m.home_score || 0); home.ga += (m.away_score || 0);
    away.gf += (m.away_score || 0); away.ga += (m.home_score || 0);

    if ((m.home_score || 0) > (m.away_score || 0)) {
      home.won++; home.pts += 3; away.lost++;
    } else if ((m.home_score || 0) < (m.away_score || 0)) {
      away.won++; away.pts += 3; home.lost++;
    } else {
      home.drawn++; away.drawn++; home.pts += 1; away.pts += 1;
    }
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
  });

  return Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

function renderStandingsTable(standings, groupName) {
  const rows = standings.map((t, i) => `
    <tr class="border-b border-slate-700/50">
      <td class="py-2 px-2 text-center text-slate-400">${i + 1}</td>
      <td class="py-2 px-2 font-medium">${t.name}</td>
      <td class="py-2 px-1 text-center">${t.played}</td>
      <td class="py-2 px-1 text-center">${t.won}</td>
      <td class="py-2 px-1 text-center">${t.drawn}</td>
      <td class="py-2 px-1 text-center">${t.lost}</td>
      <td class="py-2 px-1 text-center">${t.gd}</td>
      <td class="py-2 px-2 text-center font-bold text-primary">${t.pts}</td>
    </tr>
  `).join('');

  return `
    <div class="bg-slate-800 rounded-xl overflow-hidden">
      <div class="px-4 py-2 bg-slate-700/50 font-semibold text-sm">${groupName || 'Overall'}</div>
      <table class="w-full text-sm">
        <thead class="text-slate-400 text-xs">
          <tr>
            <th class="py-2 px-2">#</th>
            <th class="py-2 px-2 text-left">Team</th>
            <th class="py-2 px-1">P</th>
            <th class="py-2 px-1">W</th>
            <th class="py-2 px-1">D</th>
            <th class="py-2 px-1">L</th>
            <th class="py-2 px-1">GD</th>
            <th class="py-2 px-2">Pts</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function loadData() {
  if (!sb || typeof sb.from !== 'function') {
    const msg = 'Supabase client is not ready. Please hard-refresh the page.';
    console.error(msg);
    showError(msg);
    return;
  }

  try {
    const { data: teams, error: te } = await sb.from('teams').select('*').order('name');
    if (te) throw te;
    allTeams = teams || [];

    const { data: matches, error: me } = await sb.from('matches').select('*').order('kickoff_time', { ascending: true });
    if (me) throw me;
    allMatches = matches || [];

    const { data: goals, error: ge } = await sb.from('goals').select('*');
    if (ge) throw ge;
    allGoals = goals || [];

    try {
      const { data: cards } = await sb.from('cards').select('*');
      allCards = cards || [];
    } catch (e) {
      allCards = [];
    }

    lastFetchTime = new Date();
    const updatedEl = document.getElementById('lastUpdated');
    if (updatedEl) {
      updatedEl.textContent = `Updated ${lastFetchTime.toLocaleTimeString()}`;
    }

    const liveMatches = allMatches.filter(m => m.status === 'live' || m.status === 'half_time');

    const liveContainer = document.getElementById('liveMatches');
    if (liveContainer) {
      liveContainer.innerHTML = liveMatches.length
        ? liveMatches.map(m => renderMatchCard(m)).join('')
        : '<p class="text-slate-400 text-sm">No live matches right now</p>';
    }

    const liveFixturesContainer = document.getElementById('liveMatchesFixtures');
    if (liveFixturesContainer) {
      liveFixturesContainer.innerHTML = liveMatches.length
        ? liveMatches.map(m => renderMatchCard(m)).join('')
        : '<p class="text-slate-400 text-sm">No live matches right now</p>';
    }

    const recentContainer = document.getElementById('recentResults');
    if (recentContainer) {
      const finished = allMatches
        .filter(m => m.status === 'finished' || m.status === 'walkover')
        .sort((a, b) => new Date(b.updated_at || b.kickoff_time || 0) - new Date(a.updated_at || a.kickoff_time || 0))
        .slice(0, 6);
      recentContainer.innerHTML = finished.length
        ? finished.map(m => renderMatchCard(m)).join('')
        : '<p class="text-slate-400 text-sm">No results yet</p>';
    }

    const quickEl = document.getElementById('quickStandings');
    if (quickEl) {
      const standings = calculateStandings();
      const groups = [...new Set(allTeams.map(t => t.group_name).filter(Boolean))];
      if (groups.length) {
        quickEl.innerHTML = groups.map(g => {
          const groupStandings = standings.filter(s => s.group === g);
          return renderStandingsTable(groupStandings, g);
        }).join('');
      } else {
        quickEl.innerHTML = renderStandingsTable(standings, 'Overall');
      }
    }

    const scorersEl = document.getElementById('topScorers');
    if (scorersEl) {
      const goalCount = {};
      allGoals.forEach(g => {
        const key = g.player_name;
        if (!goalCount[key]) goalCount[key] = { name: g.player_name, goals: 0, team: getTeamName(g.team_id) };
        goalCount[key].goals++;
      });
      const sorted = Object.values(goalCount).sort((a, b) => b.goals - a.goals).slice(0, 10);
      if (sorted.length) {
        scorersEl.innerHTML = `
          <table class="w-full text-sm">
            <thead class="text-slate-400 text-xs bg-slate-700/40">
              <tr>
                <th class="py-2 px-4 text-left">#</th>
                <th class="py-2 px-2 text-left">Player</th>
                <th class="py-2 px-2 text-left">Team</th>
                <th class="py-2 px-4 text-right">Goals</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map((s, i) => `
                <tr class="border-t border-slate-700/50">
                  <td class="py-2.5 px-4 text-slate-400">${i + 1}</td>
                  <td class="py-2.5 px-2 font-medium">${s.name}</td>
                  <td class="py-2.5 px-2 text-slate-400">${s.team || '-'}</td>
                  <td class="py-2.5 px-4 text-right font-bold text-primary">${s.goals}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        scorersEl.innerHTML = '<p class="p-4 text-slate-400 text-sm">No goals recorded yet</p>';
      }
    }

    const fullStandingsEl = document.getElementById('fullStandings');
    if (fullStandingsEl) {
      const standings = calculateStandings();
      const groups = [...new Set(allTeams.map(t => t.group_name).filter(Boolean))];
      if (groups.length) {
        fullStandingsEl.innerHTML = groups.map(g => {
          const groupStandings = standings.filter(s => s.group === g);
          return renderStandingsTable(groupStandings, g);
        }).join('');
      } else {
        fullStandingsEl.innerHTML = renderStandingsTable(standings, 'Overall');
      }
    }

    const allFixturesEl = document.getElementById('allFixtures');
    if (allFixturesEl) {
      allFixturesEl.innerHTML = allMatches.length
        ? allMatches.map(m => renderMatchCard(m)).join('')
        : '<p class="text-slate-400 text-sm">No fixtures yet</p>';
    }

  } catch (err) {
    console.error('Load error:', err);
    const msg = err.message || err.details || JSON.stringify(err) || 'Unknown error';
    showError(msg);
  }
}

function showError(msg) {
  const els = ['liveMatches', 'liveMatchesFixtures', 'recentResults', 'quickStandings', 'topScorers', 'fullStandings', 'allFixtures'];
  els.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p class="text-red-400 text-sm">Error: ${msg}</p>`;
  });
}

function startAutoRefresh() {
  loadData();
  setInterval(loadData, 25000);
  const btn = document.getElementById('refreshBtn');
  if (btn) btn.addEventListener('click', loadData);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setTimeout(startAutoRefresh, 100);
});
