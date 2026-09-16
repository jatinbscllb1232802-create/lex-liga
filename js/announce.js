/* Lex Liga – scrolling announcement bar (all public pages) */
(function () {
  function ensureStyles() {
    if (document.getElementById('lexExtrasCss')) return;
    var l = document.createElement('link');
    l.id = 'lexExtrasCss';
    l.rel = 'stylesheet';
    l.href = 'css/extras.css';
    document.head.appendChild(l);
  }

  function ensureBar() {
    if (document.getElementById('announceBar')) return document.getElementById('announceBar');
    var bar = document.createElement('div');
    bar.id = 'announceBar';
    bar.className = 'announce-bar';
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML =
      '<div class="announce-track" id="announceTrack">' +
      '<span class="announce-text" id="announceText"></span>' +
      '<span class="announce-text" id="announceText2" aria-hidden="true"></span>' +
      '</div>';
    bar.style.display = 'none';
    document.body.insertBefore(bar, document.body.firstChild);
    return bar;
  }

  async function loadAnnounce() {
    ensureStyles();
    var bar = ensureBar();
    var t1 = document.getElementById('announceText');
    var t2 = document.getElementById('announceText2');
    var sb = window.supabaseClient;
    if (!sb || typeof sb.from !== 'function') return;

    try {
      var res = await sb
        .from('announcements')
        .select('id,message,active,created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      var rows = res.data || [];
      var row = rows[0] || null;

      // Fallback single-row schema (id = 1)
      if (!row) {
        var single = await sb.from('announcements').select('message,active').eq('id', 1).maybeSingle();
        if (single.data && single.data.active && single.data.message) row = single.data;
      }

      if (row && row.message && String(row.message).trim()) {
        var msg = String(row.message).trim();
        var unit = '   •   ' + msg + '   •   ';
        while (unit.length < 100) unit += msg + '   •   ';
        t1.textContent = unit;
        t2.textContent = unit;
        bar.style.display = 'flex';
        document.body.classList.add('has-announce');
      } else {
        bar.style.display = 'none';
        document.body.classList.remove('has-announce');
      }
    } catch (e) {
      console.warn('announce', e);
    }
  }

  function start() {
    loadAnnounce();
    setInterval(loadAnnounce, 20000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
