// Lex Liga Admin Login – single clean handler
// Must load AFTER supabase-config.js and BEFORE admin.js / admin-badminton.js logic needs panels

(function () {
  const loginScreen = document.getElementById('loginScreen');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const pickFutsal = document.getElementById('pickFutsal');
  const pickBadminton = document.getElementById('pickBadminton');

  if (!loginScreen || !loginBtn || !passwordInput) return;

  const PASSWORDS = {
    futsal: (window.ADMIN_PASSWORDS && window.ADMIN_PASSWORDS.futsal) || 'lexliga2026',
    badminton: (window.ADMIN_PASSWORDS && window.ADMIN_PASSWORDS.badminton) || 'badminton2026'
  };

  let selectedSport = 'futsal';

  function setSport(sport) {
    selectedSport = sport;
    if (pickFutsal && pickBadminton) {
      pickFutsal.classList.toggle('active', sport === 'futsal');
      pickBadminton.classList.toggle('active', sport === 'badminton');
    }
  }

  pickFutsal?.addEventListener('click', () => setSport('futsal'));
  pickBadminton?.addEventListener('click', () => setSport('badminton'));

  function showPanel(sport) {
    loginScreen.classList.add('hidden');
    document.getElementById('adminPanelFutsal')?.classList.add('hidden');
    document.getElementById('adminPanelBadminton')?.classList.add('hidden');

    if (sport === 'badminton') {
      document.getElementById('adminPanelBadminton')?.classList.remove('hidden');
      if (typeof window.loadBadmintonAdmin === 'function') {
        window.loadBadmintonAdmin();
      }
    } else {
      document.getElementById('adminPanelFutsal')?.classList.remove('hidden');
      if (typeof window.loadAdminData === 'function') {
        window.loadAdminData();
      }
    }
  }

  function tryLogin() {
    const pwd = (passwordInput.value || '').trim();
    const expected = PASSWORDS[selectedSport];

    if (pwd === expected) {
      sessionStorage.setItem('lexAdmin', 'true');
      sessionStorage.setItem('lexAdminSport', selectedSport);
      loginError?.classList.add('hidden');
      showPanel(selectedSport);
    } else {
      loginError?.classList.remove('hidden');
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  // Remove any previous listeners by cloning (avoids double-bind from other scripts)
  const newBtn = loginBtn.cloneNode(true);
  loginBtn.parentNode.replaceChild(newBtn, loginBtn);
  newBtn.addEventListener('click', tryLogin);

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryLogin();
  });

  // Restore session
  if (sessionStorage.getItem('lexAdmin') === 'true') {
    const sport = sessionStorage.getItem('lexAdminSport') || 'futsal';
    setSport(sport);
    // Wait a tick so admin.js / admin-badminton.js define load functions
    setTimeout(() => showPanel(sport), 50);
  }

  // Logout buttons
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('lexAdmin');
    sessionStorage.removeItem('lexAdminSport');
    location.reload();
  });
  document.getElementById('logoutBtnBadminton')?.addEventListener('click', () => {
    sessionStorage.removeItem('lexAdmin');
    sessionStorage.removeItem('lexAdminSport');
    location.reload();
  });

  // Expose for debugging
  window.__lexAdminLogin = { setSport, tryLogin, PASSWORDS };
})();
