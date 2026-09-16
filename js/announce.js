/* Lex Liga – full-width scrolling announcement bar */
(function () {
  function ensureStyles() {
    if (document.getElementById('lexExtrasCss')) return;
    var l = document.createElement('link');
    l.id = 'lexExtrasCss';
    l.rel = 'stylesheet';
    l.href = 'css/extras.css?v=7';
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

  /** Make each half at least as wide as the viewport so the strip is always full */
  function padToViewport(el, baseText) {
    el.textContent = baseText;
    var guard = 0;
    // Wait one frame so layout can measure
    var minW = Math.max(window.innerWidth || 800, 600);
    while (el.offsetWidth < minW && guard < 20) {
      el.textContent += baseText;
      guard++;
    }
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
        .order('created_at', { ascending: true });

      var rows = (res.data || []).filter(function (r) {
        return r.message && String(r.message).trim();
      });

      if (!rows.length) {
        var single = await sb.from('announcements').select('message,active').eq('id', 1).maybeSingle();
        if (single.data && single.data.active && single.data.message) {
          rows = [single.data];
        }
      }

      if (!rows.length) {
        bar.style.display = 'none';
        document.body.classList.remove('has-announce');
        return;
      }

      var sequence = rows
        .map(function (r) { return String(r.message).trim(); })
        .join('   •   ');
      var unit = '   •   ' + sequence + '   •   ';

      bar.style.display = 'flex';
      document.body.classList.add('has-announce');

      // Fill each half to ≥ viewport width, then mirror for seamless loop
      padToViewport(t1, unit);
      t2.textContent = t1.textContent;

      var track = document.getElementById('announceTrack');
      if (track) {
        // Longer content → slightly longer duration so speed stays readable
        var secs = Math.max(18, Math.min(45, (t1.textContent.length / 12)));
        track.style.animationDuration = secs + 's';
      }
    } catch (e) {
      console.warn('announce', e);
    }
  }

  function start() {
    loadAnnounce();
    setInterval(loadAnnounce, 20000);
    window.addEventListener('resize', function () {
      // Re-pad on big resize so laptop width stays filled
      clearTimeout(window.__lexAnnResize);
      window.__lexAnnResize = setTimeout(loadAnnounce, 300);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
