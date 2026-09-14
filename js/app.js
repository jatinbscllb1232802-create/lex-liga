// Lex Liga Futsal - Public pages logic

let lastFetchTime = null;

// Theme toggle
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

// Format status badge
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

// Render a single match card
function renderMatchCard(match, showScorers = true) {
  const home = match.home_team?.name || 'TBD';
  const away = match.away_team?.name || 'TBD';
  const scorersHtml = showScorers && match.goals?.length
    ? `<div class="mt-2 text-xs text-slate-400 space-y-0.5">
        ${match.goals.map(g => `<div>${g.player_name} ${g.minute ? g.minute + "'" : ''} (${g.team?.name || ''})</div>`).join('')}
       </div>`
    : '';

  return `
    <div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div class="flex items-center justify-between mb-2">
        ${statusBadge(match.status)}
        <span class="text-xs text-slate-400">${match.group_name || ''}</span>
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="flex-1 text-right font-semibold truncate">${home}</div>
        <div class="score text-2xl px-3 min-w-[80px] text-center">
          ${match.home_score} – ${match.away_score}
        </div>
        <div class="flex-1 font-semibold truncate">${away}</div>
      </div>
      ${scorersHtml}
      <div class="mt-3 flex justify-end">
        <button onclick="shareMatch('${home}', '${away}', ${match.home_score}, ${match.away_score}, '${match.status}')"
          class="text-xs text-primary hover:underline">Share</button>
      </div>
    </div>
  `;
}

// Share match
window.shareMatch = function(home, away, hs, as, status) {
  const text = `${home} ${hs} – ${as} ${away} (${status.toUpperCase()}) | Lex Liga Futsal`;
  if (navigator.share) {
    navigator.share({ title: 'Lex Liga', text });
  } else {
    navigator.clipboard.writeText(text);
    alert('Score copied to clipboard!');
  }
};

// Calculate standings from finished matches
function calculateStandings(matches, teams) {
  const table = {};
  teams.forEach(t => {
    table[t.id] = { id: t.id, name: t.name, group: t.group_name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  });

  matches.filter(m => m.status === 'finished' || m.status === 'walkover').forEach(m => {
    const home = table[m.home_team_id];
    const away = table[m.away_team_id];
    if (!home || !away) return;

    home.played++; away.played++;
    home.gf += m.home_score; home.ga += m.away_score;
    away.gf += m.away_score; away.ga += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++; home.pts += 3;
      away.lost++;
    } else if (m.home_score < m.away_score) {
      away.won++; away.pts += 3;
      home.lost++;
    } else {
      home.drawn++; away.drawn++;
      home.pts += 1; away.pts += 1;
    }
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
  });

  return Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

// Render standings table
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

// Main data fetch
async function loadData() {
  try {
    // Teams
    const { data: teams, error: te } = await supabase.from('teams').select('*').order('name');
    if (te) throw te;

    // Matches with teams and goals
    const { data: matches, error: me } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(id, name),
        away_team:teams!away_team_id(id, name),
        goals(*, team:teams(id, name))
      `)
      .order('kickoff_time', { ascending: true });
    if (me) throw me;

    lastFetchTime = new Date();
    const updatedEl = document.getElementById('lastUpdated');
    if (updatedEl) {
      updatedEl.textContent = `Updated ${lastFetchTime.toLocaleTimeString()}`;
    }

    // ===== HOME PAGE =====
    const liveContainer = document.getElementById('liveMatches');
    if (liveContainer) {
      const live = matches.filter(m => m.status === 'live' || m.status === 'half_time');
      liveContainer.innerHTML = live.length
        ? live.map(m => renderMatchCard(m)).join('')
        : '<p class="text-slate-400 text-sm">No live matches right now</p>';
    }

    const recentContainer = document.getElementById('recentResults');
    if (recentContainer) {
      const finished = matches.filter(m => m.status === 'finished' || m.status === 'walkover')
        .sort((a, b) => new Date(b.updated_at || b.kickoff_time) - new Date(a.updated_at || a.kickoff_time))
        .slice(0, 6);
      recentContainer.innerHTML = finished.length
        ? finished.map(m => renderMatchCard(m)).join('')
        : '<p class="text-slate-400 text-sm">No results yet</p>';
    }

    // Quick standings (by group)
    const quickEl = document.getElementById('quickStandings');
    if (quickEl) {
      const standings = calculateStandings(matches, teams);
      const groups = [...new Set(teams.map(t => t.group_name).filter(Boolean))];
      if (groups.length) {
        quickEl.innerHTML = groups.map(g => {
          const groupStandings = standings.filter(s => s.group === g);
          return renderStandingsTable(groupStandings, g);
        }).join('');
      } else {
        quickEl.innerHTML = renderStandingsTable(standings, 'Overall');
      }
    }

    // Top scorers
    const scorersEl = document.getElementById('topScorers');
    if (scorersEl) {
      const goalCount = {};
      matches.forEach(m => {
        (m.goals || []).forEach(g => {
          const key = g.player_name;
          if (!goalCount[key]) goalCount[key] = { name: g.player_name, goals: 0, team: g.team?.name };
          goalCount[key].goals++;
        });
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

    // ===== FIXTURES PAGE =====
    const fullStandingsEl = document.getElementById('fullStandings');
    if (fullStandingsEl) {
      const standings = calculateStandings(matches, teams);
      const groups = [...new Set(teams.map(t => t.group_name).filter(Boolean))];
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
      allFixturesEl.innerHTML = matches.length
        ? matches.map(m => renderMatchCard(m, true)).join('')
        : '<p class="text-slate-400 text-sm">No fixtures yet</p>';
    }

  } catch (err) {
    console.error(err);
    const els = ['liveMatches', 'recentResults', 'quickStandings', 'topScorers', 'fullStandings', 'allFixtures'];
    els.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<p class="text-red-400 text-sm">Error loading data. Check console.</p>`;
    });
  }
}

// Auto refresh every 25 seconds
function startAutoRefresh() {
  loadData();
  setInterval(loadData, 25000);
  const btn = document.getElementById('refreshBtn');
  if (btn) btn.addEventListener('click', loadData);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  startAutoRefresh();
});
