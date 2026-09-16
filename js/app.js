/* Lex Liga Futsal – load full app from pinned commit; dark mode only */
(function () {
  document.documentElement.classList.add('dark');
  if (document.body) document.body.classList.remove('light');
  try { localStorage.setItem('theme', 'dark'); } catch (e) {}

  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/jatinbscllb1232802-create/lex-liga@c91c04c40b98850163d56ba91bc83ee336518ae5/js/app.js';
  s.async = false;
  s.onload = function () {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.remove('light');
    var btn = document.getElementById('themeToggle');
    if (btn) btn.style.display = 'none';

    // If DOMContentLoaded already fired, run load manually
    function kick() {
      try {
        if (typeof initTheme === 'function') initTheme();
        if (typeof loadData === 'function') loadData();
        if (typeof startAutoRefresh === 'function') startAutoRefresh();
        var rb = document.getElementById('refreshBtn');
        if (rb && typeof loadData === 'function') {
          rb.onclick = function () { loadData(); };
        }
      } catch (err) {
        console.error('Futsal kick failed', err);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', kick);
    } else {
      // slight delay so CDN script finishes defining functions
      setTimeout(kick, 50);
    }
  };
  s.onerror = function () {
    console.error('Failed to load futsal app.js from CDN');
    var el = document.getElementById('liveMatches');
    if (el) {
      el.innerHTML = '<p class="empty-state" style="color:#f87171">Could not load scoring script. Hard-refresh the page.</p>';
    }
  };
  document.head.appendChild(s);
})();
