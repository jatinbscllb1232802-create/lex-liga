/* Lex Liga – scrolling announcement bar */
(function () {
  function ensureBar() {
    if (document.getElementById('announceBar')) return document.getElementById('announceBar');
    var bar = document.createElement('div');
    bar.id = 'announceBar';
    bar.className = 'announce-bar';
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
    var bar = ensureBar();
    var t1 = document.getElementById('announceText');
    var t2 = document.getElementById('announceText2');
    var sb = window.supabaseClient;
    if (!sb || typeof sb.from !== 'function') return;

    try {
      var res = await sb.from('announcements').select('message,active').eq('id', 1).maybeSingle();
      var row = res.data;
      if (row && row.active && row.message && String(row.message).trim()) {
        var msg = '  •  ' + String(row.message).trim() + '  •  ';
        t1.textContent = msg;
        t2.textContent = msg;
        bar.style.display = 'block';
        document.body.classList.add('has-announce');
      } else {
        bar.style.display = 'none';
        document.body.classList.remove('has-announce');
      }
    } catch (e) {
      console.warn('announce', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAnnounce);
  } else {
    loadAnnounce();
  }
  setInterval(loadAnnounce, 30000);
})();
