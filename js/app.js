// Lex Liga Futsal - Public pages logic

const sb = window.supabaseClient || window.supabase || supabase;

let lastFetchTime = null;
let allTeams = [];
let allMatches = [];
let allGoals = [];
let allCards = [];


/* =========================================================
   THEME
========================================================= */

function initTheme() {
  const saved = localStorage.getItem('theme');
  const btn = document.getElementById('themeToggle');

  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('light');

    if (btn) {
      btn.textContent = '🌙';
    }
  } else {
    document.documentElement.classList.add('dark');
    document.body.classList.remove('light');

    if (btn) {
      btn.textContent = '☀️';
    }
  }

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


/* =========================================================
   HELPERS
========================================================= */

function getTeamName(id) {
  const team = allTeams.find(t => t.id === id);
  return team ? team.name : 'TBD';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function statusLabel(status) {
  const map = {
    live: 'LIVE',
    half_time: 'HT',
    finished: 'FT',
    not_started: 'Upcoming',
    walkover: 'WO',
    cancelled: 'Cancelled'
  };

  return map[status] || status || 'Unknown';
}

function statusBadge(status) {
  return `
    <span class="status-${escapeHtml(status)} text-xs font-bold px-2 py-0.5 rounded text-white">
      ${escapeHtml(statusLabel(status))}
    </span>
  `;
}


/* =========================================================
   MATCH CARD
========================================================= */

function renderMatchCard(match) {
  const home = getTeamName(match.home_team_id);
  const away = getTeamName(match.away_team_id);

  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;

  let winnerHtml = '';

  if (match.status === 'finished' || match.status === 'walkover') {

    if (homeScore > awayScore) {
      winnerHtml = `
        <div class="winner-text">
          Winner: ${escapeHtml(home)}
        </div>
      `;
    } else if (awayScore > homeScore) {
      winnerHtml = `
        <div class="winner-text">
          Winner: ${escapeHtml(away)}
        </div>
      `;
    } else {
      winnerHtml = `
        <div class="draw-text">
          Draw
        </div>
      `;
    }
  }

  // Goals belonging to each team
  const homeGoals = allGoals
    .filter(
      g =>
        g.match_id === match.id &&
        g.team_id === match.home_team_id
    )
    .sort((a, b) => {
      return (Number(a.minute) || 999) - (Number(b.minute) || 999);
    });

  const awayGoals = allGoals
    .filter(
      g =>
        g.match_id === match.id &&
        g.team_id === match.away_team_id
    )
    .sort((a, b) => {
      return (Number(a.minute) || 999) - (Number(b.minute) || 999);
    });

  // Cards
  const matchCards = allCards
    .filter(c => c.match_id === match.id)
    .sort((a, b) => {
      return (Number(a.minute) || 999) - (Number(b.minute) || 999);
    });

  const homeScorersHtml = homeGoals.length
    ? homeGoals
        .map(
          g => `
            <div class="text-xs text-slate-400">
              ⚽ ${escapeHtml(g.player_name)}
              ${g.minute ? ` ${escapeHtml(g.minute)}'` : ''}
            </div>
          `
        )
        .join('')
    : '';

  const awayScorersHtml = awayGoals.length
    ? awayGoals
        .map(
          g => `
            <div class="text-xs text-slate-400">
              ⚽ ${escapeHtml(g.player_name)}
              ${g.minute ? ` ${escapeHtml(g.minute)}'` : ''}
            </div>
          `
        )
        .join('')
    : '';

  const cardsHtml = matchCards.length
    ? `
      <div class="mt-3 flex flex-wrap gap-2 justify-center">
        ${matchCards
          .map(
            c => `
              <span
                class="text-xs px-2 py-0.5 rounded ${
                  c.card_type === 'yellow'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }"
              >
                ${c.card_type === 'yellow' ? '🟨' : '🟥'}
                ${escapeHtml(c.player_name)}
                ${c.minute ? ` ${escapeHtml(c.minute)}'` : ''}
              </span>
            `
          )
          .join('')}
      </div>
    `
    : '';

  return `
    <div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700">

      <div class="flex items-center justify-between mb-3">
        ${statusBadge(match.status)}

        <span class="text-xs text-slate-400">
          ${escapeHtml(match.group_name || '')}
        </span>
      </div>

      <!-- Score row -->
      <div class="flex items-start justify-between gap-2">

        <!-- Home -->
        <div class="flex-1 text-right">
          <div class="font-semibold text-sm sm:text-base truncate">
            ${escapeHtml(home)}
          </div>

          <div class="mt-1 space-y-0.5">
            ${homeScorersHtml}
          </div>
        </div>

        <!-- Score -->
        <div
          class="score text-2xl sm:text-3xl px-3 min-w-[70px] text-center font-extrabold pt-0.5"
        >
          ${homeScore} – ${awayScore}
        </div>

        <!-- Away -->
        <div class="flex-1 text-left">
          <div class="font-semibold text-sm sm:text-base truncate">
            ${escapeHtml(away)}
          </div>

          <div class="mt-1 space-y-0.5">
            ${awayScorersHtml}
          </div>
        </div>

      </div>

      <!-- Winner -->
      ${winnerHtml}

      <!-- Cards -->
      ${cardsHtml}

      <!-- Share -->
      <div class="mt-4 flex justify-end">
        <button
          onclick="shareMatch('${escapeHtml(match.id)}')"
          class="share-button text-xs text-primary hover:underline font-semibold"
        >
          Share match
        </button>
      </div>

    </div>
  `;
}


/* =========================================================
   DETAILED SHARE
========================================================= */

function buildMatchShareText(match) {
  const home = getTeamName(match.home_team_id);
  const away = getTeamName(match.away_team_id);

  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;

  const homeGoals = allGoals
    .filter(
      g =>
        g.match_id === match.id &&
        g.team_id === match.home_team_id
    )
    .sort((a, b) => {
      return (Number(a.minute) || 999) - (Number(b.minute) || 999);
    });

  const awayGoals = allGoals
    .filter(
      g =>
        g.match_id === match.id &&
        g.team_id === match.away_team_id
    )
    .sort((a, b) => {
      return (Number(a.minute) || 999) - (Number(b.minute) || 999);
    });

  const matchCards = allCards
    .filter(c => c.match_id === match.id)
    .sort((a, b) => {
      return (Number(a.minute) || 999) - (Number(b.minute) || 999);
    });

  const lines = [];

  lines.push('⚽ LEX LIGA FUTSAL');
  lines.push('');

  lines.push(
    `${home}  ${homeScore} – ${awayScore}  ${away}`
  );

  lines.push(
    `Status: ${statusLabel(match.status)}`
  );

  if (match.group_name) {
    lines.push(`Group: ${match.group_name}`);
  }

  lines.push('');

  /* Goals */

  if (homeGoals.length || awayGoals.length) {
    lines.push('⚽ GOALS');

    if (homeGoals.length) {
      lines.push(`${home}:`);

      homeGoals.forEach(goal => {
        lines.push(
          `• ${goal.player_name}${goal.minute ? ` — ${goal.minute}'` : ''}`
        );
      });
    }

    if (awayGoals.length) {
      lines.push(`${away}:`);

      awayGoals.forEach(goal => {
        lines.push(
          `• ${goal.player_name}${goal.minute ? ` — ${goal.minute}'` : ''}`
        );
      });
    }

    lines.push('');
  } else {
    lines.push('⚽ GOALS');
    lines.push('• No goals recorded');
    lines.push('');
  }

  /* Cards */

  const yellowCards = matchCards.filter(
    c => c.card_type === 'yellow'
  );

  const redCards = matchCards.filter(
    c => c.card_type === 'red'
  );

  if (yellowCards.length || redCards.length) {
    lines.push('🟨🟥 CARDS');

    yellowCards.forEach(card => {
      lines.push(
        `• 🟨 ${card.player_name}${card.minute ? ` — ${card.minute}'` : ''}`
      );
    });

    redCards.forEach(card => {
      lines.push(
        `• 🟥 ${card.player_name}${card.minute ? ` — ${card.minute}'` : ''}`
      );
    });

    lines.push('');
  } else {
    lines.push('🟨🟥 CARDS');
    lines.push('• No cards recorded');
    lines.push('');
  }

  /* Result */

  if (
    match.status === 'finished' ||
    match.status === 'walkover'
  ) {
    if (homeScore > awayScore) {
      lines.push(`🏆 Winner: ${home}`);
    } else if (awayScore > homeScore) {
      lines.push(`🏆 Winner: ${away}`);
    } else {
      lines.push('🤝 Result: Draw');
    }

    lines.push('');
  }

  lines.push('Live updates: Lex Liga Futsal');

  return lines.join('\n');
}


window.shareMatch = async function(matchId) {
  const match = allMatches.find(
    m => String(m.id) === String(matchId)
  );

  if (!match) {
    alert('Match information is unavailable. Please refresh the page.');
    return;
  }

  const text = buildMatchShareText(match);

  const shareData = {
    title: 'Lex Liga Futsal',
    text
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('Detailed match update copied!');
      return;
    }

    // Older-browser fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;

    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand('copy');
    textarea.remove();

    alert('Detailed match update copied!');
  } catch (error) {
    // User cancelling the native share sheet should not show an error.
    if (error && error.name === 'AbortError') {
      return;
    }

    console.error('Share failed:', error);

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert('Detailed match update copied!');
      }
    } catch (clipboardError) {
      console.error('Clipboard fallback failed:', clipboardError);
      alert('Unable to share this match right now.');
    }
  }
};


/* =========================================================
   STANDINGS
========================================================= */

function calculateStandings() {
  const table = {};

  allTeams.forEach(team => {
    table[team.id] = {
      id: team.id,
      name: team.name,
      group: team.group_name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    };
  });

  allMatches
    .filter(
      match =>
        match.status === 'finished' ||
        match.status === 'walkover'
    )
    .forEach(match => {

      const home = table[match.home_team_id];
      const away = table[match.away_team_id];

      if (!home || !away) {
        return;
      }

      const homeScore = Number(match.home_score) || 0;
      const awayScore = Number(match.away_score) || 0;

      home.played++;
      away.played++;

      home.gf += homeScore;
      home.ga += awayScore;

      away.gf += awayScore;
      away.ga += homeScore;

      if (homeScore > awayScore) {
        home.won++;
        home.pts += 3;
        away.lost++;
      } else if (homeScore < awayScore) {
        away.won++;
        away.pts += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;

        home.pts++;
        away.pts++;
      }

      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;
    });

  return Object.values(table).sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.name.localeCompare(b.name)
  );
}


/* =========================================================
   STANDINGS TABLE
========================================================= */

function renderStandingsTable(standings, groupName) {

  const rows = standings
    .map(
      (team, index) => `
        <tr class="standings-row">

          <td class="standings-number">
            ${index + 1}
          </td>

          <td class="standings-team">
            ${escapeHtml(team.name)}
          </td>

          <td class="standings-stat">
            ${team.played}
          </td>

          <td class="standings-stat">
            ${team.won}
          </td>

          <td class="standings-stat">
            ${team.drawn}
          </td>

          <td class="standings-stat">
            ${team.lost}
          </td>

          <td class="standings-stat">
            ${team.gd}
          </td>

          <td class="standings-points">
            ${team.pts}
          </td>

        </tr>
      `
    )
    .join('');

  return `
    <div class="standings-card">

      <div class="standings-group-header">
        ${escapeHtml(groupName || 'Overall')}
      </div>

      <div class="standings-scroll">
        <table class="standings-table">

          <thead>
            <tr>
              <th>#</th>
              <th class="text-left">Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>
      </div>

    </div>
  `;
}


/* =========================================================
   DATA LOADING
========================================================= */

async function loadData() {

  if (!sb || typeof sb.from !== 'function') {
    const msg =
      'Supabase client is not ready. Please hard-refresh the page.';

    console.error(msg);
    showError(msg);
    return;
  }

  try {

    /* Teams */

    const {
      data: teams,
      error: teamError
    } = await sb
      .from('teams')
      .select('*')
      .order('name');

    if (teamError) {
      throw teamError;
    }

    allTeams = teams || [];


    /* Matches */

    const {
      data: matches,
      error: matchError
    } = await sb
      .from('matches')
      .select('*')
      .order('kickoff_time', {
        ascending: true
      });

    if (matchError) {
      throw matchError;
    }

    allMatches = matches || [];


    /* Goals */

    const {
      data: goals,
      error: goalError
    } = await sb
      .from('goals')
      .select('*');

    if (goalError) {
      throw goalError;
    }

    allGoals = goals || [];


    /* Cards */

    try {

      const {
        data: cards
      } = await sb
        .from('cards')
        .select('*');

      allCards = cards || [];

    } catch (error) {

      console.warn(
        'Cards table unavailable:',
        error
      );

      allCards = [];
    }


    /* Last updated */

    lastFetchTime = new Date();

    const updatedEl =
      document.getElementById('lastUpdated');

    if (updatedEl) {
      updatedEl.textContent =
        `Updated ${lastFetchTime.toLocaleTimeString()}`;
    }


    /* Live matches */

    const liveMatches =
      allMatches.filter(
        match =>
          match.status === 'live' ||
          match.status === 'half_time'
      );


    const liveContainer =
      document.getElementById('liveMatches');

    if (liveContainer) {

      liveContainer.innerHTML =
        liveMatches.length
          ? liveMatches
              .map(match => renderMatchCard(match))
              .join('')
          : `
            <p class="text-slate-400 text-sm">
              No live matches right now
            </p>
          `;
    }


    const liveFixturesContainer =
      document.getElementById('liveMatchesFixtures');

    if (liveFixturesContainer) {

      liveFixturesContainer.innerHTML =
        liveMatches.length
          ? liveMatches
              .map(match => renderMatchCard(match))
              .join('')
          : `
            <p class="text-slate-400 text-sm">
              No live matches right now
            </p>
          `;
    }


    /* Recent results */

    const recentContainer =
      document.getElementById('recentResults');

    if (recentContainer) {

      const finished =
        allMatches
          .filter(
            match =>
              match.status === 'finished' ||
              match.status === 'walkover'
          )
          .sort(
            (a, b) =>
              new Date(
                b.updated_at ||
                b.kickoff_time ||
                0
              ) -
              new Date(
                a.updated_at ||
                a.kickoff_time ||
                0
              )
          )
          .slice(0, 6);

      recentContainer.innerHTML =
        finished.length
          ? finished
              .map(match => renderMatchCard(match))
              .join('')
          : `
            <p class="text-slate-400 text-sm">
              No results yet
            </p>
          `;
    }


    /* Quick standings */

    const quickEl =
      document.getElementById('quickStandings');

    if (quickEl) {

      const standings =
        calculateStandings();

      const groups =
        [
          ...new Set(
            allTeams
              .map(team => team.group_name)
              .filter(Boolean)
          )
        ];

      if (groups.length) {

        quickEl.innerHTML =
          groups
            .map(group => {

              const groupStandings =
                standings.filter(
                  team => team.group === group
                );

              return renderStandingsTable(
                groupStandings,
                group
              );
            })
            .join('');

      } else {

        quickEl.innerHTML =
          renderStandingsTable(
            standings,
            'Overall'
          );
      }
    }


    /* Top scorers */

    const scorersEl =
      document.getElementById('topScorers');

    if (scorersEl) {

      const goalCount = {};

      allGoals.forEach(goal => {

        const key = goal.player_name;

        if (!goalCount[key]) {

          goalCount[key] = {
            name: goal.player_name,
            goals: 0,
            team: getTeamName(goal.team_id)
          };
        }

        goalCount[key].goals++;
      });

      const sorted =
        Object.values(goalCount)
          .sort(
            (a, b) =>
              b.goals - a.goals ||
              a.name.localeCompare(b.name)
          )
          .slice(0, 10);

      if (sorted.length) {

        scorersEl.innerHTML = `
          <div class="standings-scroll">

            <table class="scorers-table w-full text-sm">

              <thead>
                <tr>
                  <th class="py-2.5 px-4 text-left">#</th>
                  <th class="py-2.5 px-2 text-left">Player</th>
                  <th class="py-2.5 px-2 text-left">Team</th>
                  <th class="py-2.5 px-4 text-right">Goals</th>
                </tr>
              </thead>

              <tbody>

                ${sorted
                  .map(
                    (scorer, index) => `
                      <tr>

                        <td class="py-2.5 px-4">
                          ${index + 1}
                        </td>

                        <td class="py-2.5 px-2 font-medium">
                          ${escapeHtml(scorer.name)}
                        </td>

                        <td class="py-2.5 px-2">
                          ${escapeHtml(scorer.team || '-')}
                        </td>

                        <td class="py-2.5 px-4 text-right font-bold text-primary">
                          ${scorer.goals}
                        </td>

                      </tr>
                    `
                  )
                  .join('')}

              </tbody>

            </table>

          </div>
        `;

      } else {

        scorersEl.innerHTML = `
          <p class="p-4 text-slate-400 text-sm">
            No goals recorded yet
          </p>
        `;
      }
    }


    /* Full standings */

    const fullStandingsEl =
      document.getElementById('fullStandings');

    if (fullStandingsEl) {

      const standings =
        calculateStandings();

      const groups =
        [
          ...new Set(
            allTeams
              .map(team => team.group_name)
              .filter(Boolean)
          )
        ];

      if (groups.length) {

        fullStandingsEl.innerHTML =
          groups
            .map(group => {

              const groupStandings =
                standings.filter(
                  team => team.group === group
                );

              return renderStandingsTable(
                groupStandings,
                group
              );
            })
            .join('');

      } else {

        fullStandingsEl.innerHTML =
          renderStandingsTable(
            standings,
            'Overall'
          );
      }
    }


    /* All fixtures */

    const allFixturesEl =
      document.getElementById('allFixtures');

    if (allFixturesEl) {

      allFixturesEl.innerHTML =
        allMatches.length
          ? allMatches
              .map(match => renderMatchCard(match))
              .join('')
          : `
            <p class="text-slate-400 text-sm">
              No fixtures yet
            </p>
          `;
    }

  } catch (error) {

    console.error(
      'Load error:',
      error
    );

    const msg =
      error.message ||
      error.details ||
      JSON.stringify(error) ||
      'Unknown error';

    showError(msg);
  }
}


/* =========================================================
   ERROR
========================================================= */

function showError(msg) {

  const elements = [
    'liveMatches',
    'liveMatchesFixtures',
    'recentResults',
    'quickStandings',
    'topScorers',
    'fullStandings',
    'allFixtures'
  ];

  elements.forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {

      element.innerHTML = `
        <p class="text-red-400 text-sm">
          Error: ${escapeHtml(msg)}
        </p>
      `;
    }
  });
}


/* =========================================================
   AUTO REFRESH
========================================================= */

function startAutoRefresh() {

  loadData();

  // Refresh every 25 seconds
  setInterval(
    loadData,
    25000
  );

  const btn =
    document.getElementById('refreshBtn');

  if (btn) {
    btn.addEventListener(
      'click',
      loadData
    );
  }
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initTheme();

    setTimeout(
      startAutoRefresh,
      100
    );
  }
);
