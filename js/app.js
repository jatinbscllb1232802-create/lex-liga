/* =========================================================
   LEX LIGA FUTSAL
   Public Page Logic
========================================================= */

const sb =
  window.supabaseClient ||
  window.supabase ||
  (typeof supabase !== 'undefined' ? supabase : null);

let lastFetchTime = null;

let allTeams = [];
let allMatches = [];
let allGoals = [];
let allCards = [];


/* =========================================================
   THEME
========================================================= */

function initTheme() {
  const saved =
    localStorage.getItem('theme');

  const btn =
    document.getElementById('themeToggle');

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

      const isDark =
        document.documentElement.classList.contains('dark');

      if (isDark) {

        document.documentElement.classList.remove('dark');
        document.body.classList.add('light');

        localStorage.setItem(
          'theme',
          'light'
        );

        btn.textContent = '🌙';

      } else {

        document.documentElement.classList.add('dark');
        document.body.classList.remove('light');

        localStorage.setItem(
          'theme',
          'dark'
        );

        btn.textContent = '☀️';
      }
    });
  }
}


/* =========================================================
   HELPERS
========================================================= */

function getTeamName(id) {

  const team =
    allTeams.find(
      t => String(t.id) === String(id)
    );

  return team
    ? team.name
    : 'TBD';
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

    half_time: 'HALF TIME',

    finished: 'FULL TIME',

    not_started: 'UPCOMING',

    walkover: 'WALKOVER',

    cancelled: 'CANCELLED'
  };

  return (
    map[status] ||
    String(status || 'UNKNOWN').replace(/_/g, ' ')
  );
}


function statusBadge(status) {

  return `
    <span class="status-${escapeHtml(status || 'unknown')}">
      ${escapeHtml(statusLabel(status))}
    </span>
  `;
}


function formatMinute(minute) {

  if (
    minute === null ||
    minute === undefined ||
    minute === ''
  ) {
    return '';
  }

  return `${escapeHtml(minute)}'`;
}


function sortByMinute(a, b) {

  const ma =
    Number(a.minute);

  const mb =
    Number(b.minute);

  if (!Number.isFinite(ma) && !Number.isFinite(mb)) {
    return 0;
  }

  if (!Number.isFinite(ma)) {
    return 1;
  }

  if (!Number.isFinite(mb)) {
    return -1;
  }

  return ma - mb;
}


/* =========================================================
   MATCH DATA
========================================================= */

function getMatchGoals(match) {

  return allGoals
    .filter(
      goal =>
        String(goal.match_id) === String(match.id)
    )
    .sort(sortByMinute);
}


function getMatchCards(match) {

  return allCards
    .filter(
      card =>
        String(card.match_id) === String(match.id)
    )
    .sort(sortByMinute);
}


function teamGoals(match, teamId) {

  return getMatchGoals(match)
    .filter(
      goal =>
        String(goal.team_id) === String(teamId)
    );
}


/* =========================================================
   MATCH CARD
========================================================= */

function renderMatchCard(match) {

  const home =
    getTeamName(match.home_team_id);

  const away =
    getTeamName(match.away_team_id);

  const homeScore =
    Number(match.home_score) || 0;

  const awayScore =
    Number(match.away_score) || 0;

  const homeGoals =
    teamGoals(
      match,
      match.home_team_id
    );

  const awayGoals =
    teamGoals(
      match,
      match.away_team_id
    );

  const matchCards =
    getMatchCards(match);


  /* -------------------------------------------------------
     Winner
  -------------------------------------------------------- */

  let resultHtml = '';

  if (
    match.status === 'finished' ||
    match.status === 'walkover'
  ) {

    if (homeScore > awayScore) {

      resultHtml = `
        <div class="match-winner">
          Winner: ${escapeHtml(home)}
        </div>
      `;

    } else if (awayScore > homeScore) {

      resultHtml = `
        <div class="match-winner">
          Winner: ${escapeHtml(away)}
        </div>
      `;

    } else {

      resultHtml = `
        <div class="match-draw">
          Draw
        </div>
      `;
    }
  }


  /* -------------------------------------------------------
     Scorers
  -------------------------------------------------------- */

  function renderScorers(goals) {

    if (!goals.length) {
      return '';
    }

    return `
      <div class="match-scorers">

        ${goals
          .map(
            goal => `
              <div class="scorer-line">

                <span class="scorer-ball">
                  ⚽
                </span>

                <span>
                  ${escapeHtml(goal.player_name || 'Unknown')}
                </span>

                ${
                  goal.minute !== null &&
                  goal.minute !== undefined &&
                  goal.minute !== ''
                    ? `
                      <span>
                        ${formatMinute(goal.minute)}
                      </span>
                    `
                    : ''
                }

              </div>
            `
          )
          .join('')}

      </div>
    `;
  }


  const homeScorersHtml =
    renderScorers(homeGoals);

  const awayScorersHtml =
    renderScorers(awayGoals);


  /* -------------------------------------------------------
     Cards
  -------------------------------------------------------- */

  let cardsHtml = '';

  if (matchCards.length) {

    cardsHtml = `
      <div class="match-cards">

        ${matchCards
          .map(card => {

            const isYellow =
              card.card_type === 'yellow';

            return `
              <span
                class="
                  card-pill
                  ${isYellow ? 'card-yellow' : 'card-red'}
                "
              >

                ${isYellow ? '🟨' : '🟥'}

                <span>
                  ${escapeHtml(card.player_name || 'Player')}
                </span>

                ${
                  card.minute !== null &&
                  card.minute !== undefined &&
                  card.minute !== ''
                    ? `
                      <span>
                        ${formatMinute(card.minute)}
                      </span>
                    `
                    : ''
                }

              </span>
            `;
          })
          .join('')}

      </div>
    `;
  }


  /* -------------------------------------------------------
     Group
  -------------------------------------------------------- */

  const groupHtml =
    match.group_name
      ? `
        <span class="match-group">
          ${escapeHtml(match.group_name)}
        </span>
      `
      : `
        <span class="match-group">
          Match
        </span>
      `;


  /* -------------------------------------------------------
     Card
  -------------------------------------------------------- */

  return `
    <article class="match-card p-4 sm:p-5">

      <div class="match-topline">

        ${statusBadge(match.status)}

        ${groupHtml}

      </div>


      <div class="match-main">

        <div class="team-side team-side-home">

          <div class="team-name">
            ${escapeHtml(home)}
          </div>

          ${homeScorersHtml}

        </div>


        <div class="score-wrap">

          <div class="score">

            <span>
              ${homeScore}
            </span>

            <span class="score-separator">
              –
            </span>

            <span>
              ${awayScore}
            </span>

          </div>

        </div>


        <div class="team-side team-side-away">

          <div class="team-name">
            ${escapeHtml(away)}
          </div>

          ${awayScorersHtml}

        </div>

      </div>


      ${resultHtml}

      ${cardsHtml}


      <div class="match-actions">

        <span class="match-status-note">

          ${
            match.status === 'live'
              ? 'Live update'
              : match.status === 'half_time'
                ? 'Half-time update'
                : match.status === 'finished'
                  ? 'Final result'
                  : match.status === 'not_started'
                    ? 'Match scheduled'
                    : statusLabel(match.status)
          }

        </span>

        <button
          type="button"
          onclick="shareMatch('${escapeHtml(match.id)}')"
          class="share-button"
        >
          ↗ Share
        </button>

      </div>

    </article>
  `;
}


/* =========================================================
   DETAILED SHARE
========================================================= */

function buildMatchShareText(match) {

  const home =
    getTeamName(match.home_team_id);

  const away =
    getTeamName(match.away_team_id);

  const homeScore =
    Number(match.home_score) || 0;

  const awayScore =
    Number(match.away_score) || 0;

  const homeGoals =
    teamGoals(
      match,
      match.home_team_id
    );

  const awayGoals =
    teamGoals(
      match,
      match.away_team_id
    );

  const matchCards =
    getMatchCards(match);


  const lines = [];


  /* Header */

  lines.push('⚽ LEX LIGA FUTSAL');

  lines.push(
    'Futsal Championship 2026'
  );

  lines.push('');

  lines.push(
    `${home}  ${homeScore} – ${awayScore}  ${away}`
  );

  lines.push(
    `Status: ${statusLabel(match.status)}`
  );

  if (match.group_name) {

    lines.push(
      `Group: ${match.group_name}`
    );
  }


  if (match.kickoff_time) {

    const date =
      new Date(match.kickoff_time);

    if (!Number.isNaN(date.getTime())) {

      lines.push(
        `Kick-off: ${date.toLocaleString()}`
      );
    }
  }


  lines.push('');


  /* Goals */

  lines.push('⚽ GOALS');

  if (
    homeGoals.length ||
    awayGoals.length
  ) {

    if (homeGoals.length) {

      lines.push(
        `${home}:`
      );

      homeGoals.forEach(goal => {

        lines.push(
          `• ${goal.player_name || 'Unknown'}${
            goal.minute !== null &&
            goal.minute !== undefined &&
            goal.minute !== ''
              ? ` — ${goal.minute}'`
              : ''
          }`
        );
      });
    }


    if (awayGoals.length) {

      lines.push(
        `${away}:`
      );

      awayGoals.forEach(goal => {

        lines.push(
          `• ${goal.player_name || 'Unknown'}${
            goal.minute !== null &&
            goal.minute !== undefined &&
            goal.minute !== ''
              ? ` — ${goal.minute}'`
              : ''
          }`
        );
      });
    }

  } else {

    lines.push(
      '• No goals recorded'
    );
  }


  lines.push('');
  lines.push('🟨🟥 CARDS');


  /* Cards */

  if (matchCards.length) {

    matchCards.forEach(card => {

      const symbol =
        card.card_type === 'yellow'
          ? '🟨'
          : '🟥';

      lines.push(
        `• ${symbol} ${card.player_name || 'Unknown'}${
          card.minute !== null &&
          card.minute !== undefined &&
          card.minute !== ''
            ? ` — ${card.minute}'`
            : ''
        }`
      );
    });

  } else {

    lines.push(
      '• No cards recorded'
    );
  }


  lines.push('');


  /* Result */

  if (
    match.status === 'finished' ||
    match.status === 'walkover'
  ) {

    if (homeScore > awayScore) {

      lines.push(
        `🏆 Winner: ${home}`
      );

    } else if (awayScore > homeScore) {

      lines.push(
        `🏆 Winner: ${away}`
      );

    } else {

      lines.push(
        '🤝 Result: Draw'
      );
    }

    lines.push('');
  }


  /* Link */

  lines.push(
    'Live updates: Lex Liga Futsal'
  );

  lines.push(
    'https://jatinbscllb1232802-create.github.io/lex-liga/'
  );


  return lines.join('\n');
}


window.shareMatch =
  async function(matchId) {

    const match =
      allMatches.find(
        m =>
          String(m.id) ===
          String(matchId)
      );

    if (!match) {

      alert(
        'Match information is unavailable. Please refresh the page.'
      );

      return;
    }


    const text =
      buildMatchShareText(match);


    const shareData = {

      title:
        'Lex Liga Futsal',

      text

    };


    try {

      if (
        navigator.share
      ) {

        await navigator.share(
          shareData
        );

        return;
      }


      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {

        await navigator.clipboard.writeText(
          text
        );

        alert(
          'Detailed match update copied!'
        );

        return;
      }


      const textarea =
        document.createElement('textarea');

      textarea.value =
        text;

      textarea.style.position =
        'fixed';

      textarea.style.opacity =
        '0';

      document.body.appendChild(
        textarea
      );

      textarea.focus();

      textarea.select();

      document.execCommand(
        'copy'
      );

      textarea.remove();

      alert(
        'Detailed match update copied!'
      );

    } catch (error) {

      if (
        error &&
        error.name === 'AbortError'
      ) {

        return;
      }

      console.error(
        'Share failed:',
        error
      );

      alert(
        'Unable to share this match right now.'
      );
    }
  };


/* =========================================================
   STANDINGS
========================================================= */

function calculateStandings() {

  const table = {};


  allTeams.forEach(team => {

    table[team.id] = {

      id:
        team.id,

      name:
        team.name,

      group:
        team.group_name,

      played:
        0,

      won:
        0,

      drawn:
        0,

      lost:
        0,

      gf:
        0,

      ga:
        0,

      gd:
        0,

      pts:
        0
    };
  });


  allMatches

    .filter(
      match =>
        match.status === 'finished' ||
        match.status === 'walkover'
    )

    .forEach(match => {

      const home =
        table[match.home_team_id];

      const away =
        table[match.away_team_id];


      if (!home || !away) {
        return;
      }


      const homeScore =
        Number(match.home_score) || 0;

      const awayScore =
        Number(match.away_score) || 0;


      home.played++;
      away.played++;


      home.gf +=
        homeScore;

      home.ga +=
        awayScore;


      away.gf +=
        awayScore;

      away.ga +=
        homeScore;


      if (
        homeScore >
        awayScore
      ) {

        home.won++;

        home.pts += 3;

        away.lost++;

      } else if (
        homeScore <
        awayScore
      ) {

        away.won++;

        away.pts += 3;

        home.lost++;

      } else {

        home.drawn++;

        away.drawn++;

        home.pts++;

        away.pts++;
      }


      home.gd =
        home.gf -
        home.ga;

      away.gd =
        away.gf -
        away.ga;
    });


  return Object.values(
    table
  ).sort(
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

function renderStandingsTable(
  standings,
  groupName
) {

  const rows =
    standings
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

        <span class="standings-group-name">
          ${escapeHtml(groupName || 'Overall')}
        </span>

        <span class="standings-group-label">
          PTS • GD • GF
        </span>

      </div>


      <div class="standings-scroll">

        <table class="standings-table">

          <thead>

            <tr>

              <th>#</th>

              <th>
                Team
              </th>

              <th>
                P
              </th>

              <th>
                W
              </th>

              <th>
                D
              </th>

              <th>
                L
              </th>

              <th>
                GD
              </th>

              <th>
                Pts
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              rows ||
              `
                <tr>

                  <td
                    colspan="8"
                    class="text-center py-5 text-slate-500"
                  >
                    No standings data yet
                  </td>

                </tr>
              `
            }

          </tbody>

        </table>

      </div>

    </div>
  `;
}


/* =========================================================
   TOP SCORERS
========================================================= */

function renderTopScorers() {

  const scorers = {};


  allGoals.forEach(goal => {

    const name =
      goal.player_name ||
      'Unknown player';

    const key =
      name.trim().toLowerCase();


    if (!scorers[key]) {

      scorers[key] = {

        name,

        goals:
          0,

        team:
          getTeamName(
            goal.team_id
          )
      };
    }


    scorers[key].goals++;
  });


  const sorted =
    Object.values(
      scorers
    )
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        a.name.localeCompare(b.name)
    )
    .slice(
      0,
      10
    );


  const target =
    document.getElementById(
      'topScorers'
    );


  if (!target) {
    return;
  }


  if (!sorted.length) {

    target.innerHTML = `
      <p class="empty-state m-4">
        No goals recorded yet.
      </p>
    `;

    return;
  }


  target.innerHTML = `

    <div class="standings-scroll">

      <table class="scorers-table">

        <thead>

          <tr>

            <th>
              #
            </th>

            <th>
              Player
            </th>

            <th>
              Team
            </th>

            <th>
              Goals
            </th>

          </tr>

        </thead>


        <tbody>

          ${sorted
            .map(
              (player, index) => `

                <tr
                  class="${
                    index < 3
                      ? 'scorer-top-three'
                      : ''
                  }"
                >

                  <td class="scorer-rank">
                    ${index + 1}
                  </td>

                  <td class="scorer-player">
                    ${escapeHtml(player.name)}
                  </td>

                  <td class="scorer-team">
                    ${escapeHtml(player.team)}
                  </td>

                  <td class="scorer-goals">
                    ${player.goals}
                  </td>

                </tr>

              `
            )
            .join('')}

        </tbody>

      </table>

    </div>
  `;
}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

function renderAchievements() {

  const target =
    document.getElementById(
      'achievementsGrid'
    );


  if (!target) {
    return;
  }


  const standings =
    calculateStandings();


  const scorerMap = {};


  allGoals.forEach(goal => {

    const key =
      String(
        goal.player_name ||
        'Unknown'
      )
      .trim()
      .toLowerCase();


    if (!scorerMap[key]) {

      scorerMap[key] = {

        name:
          goal.player_name ||
          'Unknown',

        team:
          getTeamName(
            goal.team_id
          ),

        goals:
          0
      };
    }

    scorerMap[key].goals++;
  });


  const scorerList =
    Object.values(
      scorerMap
    ).sort(
      (a, b) =>
        b.goals - a.goals ||
        a.name.localeCompare(b.name)
    );


  const leader =
    scorerList[0];


  const liveCount =
    allMatches.filter(
      match =>
        match.status === 'live' ||
        match.status === 'half_time'
    ).length;


  const finishedCount =
    allMatches.filter(
      match =>
        match.status === 'finished' ||
        match.status === 'walkover'
    ).length;


  const goalCount =
    allGoals.length;


  const totalTeams =
    allTeams.length;


  const groups =
    [
      ...new Set(
        allTeams
          .map(
            team =>
              team.group_name
          )
          .filter(Boolean)
      )
    ];


  const groupLeaders =
    groups
      .map(groupName => {

        const team =
          standings.find(
            item =>
              item.group ===
              groupName
          );

        return team
          ? `${escapeHtml(groupName)}: ${escapeHtml(team.name)}`
          : null;

      })
      .filter(Boolean);


  let milestoneText =
    'Competition has begun.';

  if (goalCount === 0) {

    milestoneText =
      'The first goal of the tournament is waiting to be scored.';

  } else if (goalCount === 1) {

    milestoneText =
      'The tournament has its first recorded goal.';

  } else if (
    goalCount >= 10
  ) {

    milestoneText =
      `${goalCount} goals have already been recorded.`;

  } else {

    milestoneText =
      `${goalCount} goals have been recorded so far.`;
  }


  target.innerHTML = `

    <div class="achievement-card rounded-2xl p-5">

      <div class="achievement-icon">
        ⚽
      </div>

      <div>

        <p class="font-bold text-primary">
          Golden Boot
        </p>

        <p class="achievement-muted mt-1">

          ${
            leader
              ? `${escapeHtml(leader.name)} leads with ${leader.goals} goal${leader.goals === 1 ? '' : 's'} for ${escapeHtml(leader.team)}.`
              : 'No goals have been recorded yet.'
          }

        </p>

      </div>

    </div>


    <div class="achievement-card rounded-2xl p-5">

      <div class="achievement-icon">
        🏆
      </div>

      <div>

        <p class="font-bold text-primary">
          Group Leaders
        </p>

        <p class="achievement-muted mt-1">

          ${
            groupLeaders.length
              ? groupLeaders.join(' • ')
              : 'Group standings will appear as results are recorded.'
          }

        </p>

      </div>

    </div>


    <div class="achievement-card rounded-2xl p-5">

      <div class="achievement-icon">
        🔥
      </div>

      <div>

        <p class="font-bold text-primary">
          Tournament Milestones
        </p>

        <p class="achievement-muted mt-1">
          ${milestoneText}
          ${
            finishedCount > 0
              ? ` ${finishedCount} completed match${finishedCount === 1 ? '' : 'es'} so far.`
              : ''
          }
        </p>

      </div>

    </div>


    <div class="achievement-card rounded-2xl p-5">

      <div class="achievement-icon">
        ⭐
      </div>

      <div>

        <p class="font-bold text-primary">
          Standout Performances
        </p>

        <p class="achievement-muted mt-1">

          ${
            leader
              ? `${escapeHtml(leader.name)} is currently leading the scoring charts.`
              : liveCount > 0
                ? `${liveCount} match${liveCount === 1 ? '' : 'es'} currently live.`
                : 'Standout performances will emerge as the tournament progresses.'
          }

        </p>

      </div>

    </div>
  `;
}


/* =========================================================
   TOURNAMENT SNAPSHOT
========================================================= */

function renderSnapshot() {

  const matchesEl =
    document.getElementById(
      'snapshotMatches'
    );

  const liveEl =
    document.getElementById(
      'snapshotLive'
    );

  const goalsEl =
    document.getElementById(
      'snapshotGoals'
    );

  const teamsEl =
    document.getElementById(
      'snapshotTeams'
    );


  const liveCount =
    allMatches.filter(
      match =>
        match.status === 'live' ||
        match.status === 'half_time'
    ).length;


  if (matchesEl) {

    matchesEl.textContent =
      String(
        allMatches.length
      );
  }


  if (liveEl) {

    liveEl.textContent =
      String(
        liveCount
      );
  }


  if (goalsEl) {

    goalsEl.textContent =
      String(
        allGoals.length
      );
  }


  if (teamsEl) {

    teamsEl.textContent =
      String(
        allTeams.length
      );
  }
}


/* =========================================================
   RENDER LIVE / RESULTS / FIXTURES
========================================================= */

function renderMatchContainers() {

  const liveMatches =
    allMatches.filter(
      match =>
        match.status === 'live' ||
        match.status === 'half_time'
    );


  const liveContainer =
    document.getElementById(
      'liveMatches'
    );


  if (liveContainer) {

    liveContainer.innerHTML =
      liveMatches.length

        ? liveMatches
            .map(
              renderMatchCard
            )
            .join('')

        : `
          <p class="empty-state">
            No live matches right now.
          </p>
        `;
  }


  const fixturesLiveContainer =
    document.getElementById(
      'liveMatchesFixtures'
    );


  if (fixturesLiveContainer) {

    fixturesLiveContainer.innerHTML =
      liveMatches.length

        ? liveMatches
            .map(
              renderMatchCard
            )
            .join('')

        : `
          <p class="empty-state">
            No live matches right now.
          </p>
        `;
  }


  const recentContainer =
    document.getElementById(
      'recentResults'
    );


  if (recentContainer) {

    const finished =
      allMatches
        .filter(
          match =>
            match.status === 'finished' ||
            match.status === 'walkover'
        )
        .sort(
          (a, b) => {

            const ad =
              new Date(
                a.updated_at ||
                a.kickoff_time ||
                0
              ).getTime();

            const bd =
              new Date(
                b.updated_at ||
                b.kickoff_time ||
                0
              ).getTime();

            return bd - ad;
          }
        )
        .slice(
          0,
          6
        );


    recentContainer.innerHTML =
      finished.length

        ? finished
            .map(
              renderMatchCard
            )
            .join('')

        : `
          <p class="empty-state">
            No completed matches yet.
          </p>
        `;
  }


  const allFixturesEl =
    document.getElementById(
      'allFixtures'
    );


  if (allFixturesEl) {

    const sortedMatches =
      [...allMatches].sort(
        (a, b) => {

          const aLive =
            a.status === 'live' ||
            a.status === 'half_time';

          const bLive =
            b.status === 'live' ||
            b.status === 'half_time';


          if (
            aLive &&
            !bLive
          ) {
            return -1;
          }


          if (
            !aLive &&
            bLive
          ) {
            return 1;
          }


          return (
            new Date(
              a.kickoff_time ||
              0
            ) -
            new Date(
              b.kickoff_time ||
              0
            )
          );
        }
      );


    allFixturesEl.innerHTML =
      sortedMatches.length

        ? sortedMatches
            .map(
              renderMatchCard
            )
            .join('')

        : `
          <p class="empty-state">
            No fixtures available yet.
          </p>
        `;
  }
}


/* =========================================================
   RENDER STANDINGS
========================================================= */

function renderStandingsAreas() {

  const standings =
    calculateStandings();


  const groups =
    [
      ...new Set(
        allTeams
          .map(
            team =>
              team.group_name
          )
          .filter(Boolean)
      )
    ];


  function buildGroups() {

    if (!groups.length) {

      return renderStandingsTable(
        standings,
        'Overall'
      );
    }


    return groups
      .map(
        groupName => {

          const groupStandings =
            standings.filter(
              team =>
                team.group ===
                groupName
            );


          return renderStandingsTable(
            groupStandings,
            groupName
          );
        }
      )
      .join('');
  }


  const html =
    buildGroups();


  const quick =
    document.getElementById(
      'quickStandings'
    );


  if (quick) {

    quick.innerHTML =
      html;
  }


  const full =
    document.getElementById(
      'fullStandings'
    );


  if (full) {

    full.innerHTML =
      html;
  }
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {

  if (
    !sb ||
    typeof sb.from !== 'function'
  ) {

    const message =
      'Supabase client is not ready. Please hard-refresh the page.';

    console.error(
      message
    );

    showError(
      message
    );

    return;
  }


  try {

    /* Teams */

    const {
      data: teams,
      error: teamsError
    } =
      await sb
        .from('teams')
        .select('*')
        .order(
          'name',
          {
            ascending: true
          }
        );


    if (teamsError) {
      throw teamsError;
    }


    allTeams =
      teams || [];


    /* Matches */

    const {
      data: matches,
      error: matchesError
    } =
      await sb
        .from('matches')
        .select('*')
        .order(
          'kickoff_time',
          {
            ascending: true,
            nullsFirst: false
          }
        );


    if (matchesError) {
      throw matchesError;
    }


    allMatches =
      matches || [];


    /* Goals */

    const {
      data: goals,
      error: goalsError
    } =
      await sb
        .from('goals')
        .select('*');


    if (goalsError) {
      throw goalsError;
    }


    allGoals =
      goals || [];


    /* Cards */

    try {

      const {
        data: cards
      } =
        await sb
          .from('cards')
          .select('*');


      allCards =
        cards || [];

    } catch (cardError) {

      console.warn(
        'Cards table unavailable:',
        cardError
      );

      allCards =
        [];
    }


    lastFetchTime =
      new Date();


    const updatedEl =
      document.getElementById(
        'lastUpdated'
      );


    if (updatedEl) {

      updatedEl.textContent =
        `Updated ${lastFetchTime.toLocaleTimeString()}`;
    }


    renderMatchContainers();

    renderStandingsAreas();

    renderTopScorers();

    renderAchievements();

    renderSnapshot();


  } catch (error) {

    console.error(
      'Load error:',
      error
    );


    const message =
      error?.message ||
      error?.details ||
      'Unable to load tournament data.';


    showError(
      message
    );
  }
}


/* =========================================================
   ERROR STATE
========================================================= */

function showError(message) {

  const ids = [

    'liveMatches',

    'liveMatchesFixtures',

    'recentResults',

    'quickStandings',

    'fullStandings',

    'allFixtures',

    'topScorers',

    'achievementsGrid'
  ];


  ids.forEach(id => {

    const el =
      document.getElementById(
        id
      );


    if (el) {

      el.innerHTML = `
        <p class="text-red-400 text-sm p-4">
          Error loading tournament data:
          ${escapeHtml(message)}
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


  setInterval(
    loadData,
    25000
  );


  const refreshBtn =
    document.getElementById(
      'refreshBtn'
    );


  if (refreshBtn) {

    refreshBtn.addEventListener(
      'click',
      loadData
    );
  }
}


/* =========================================================
   INITIALISE
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
