/* Lex Liga – sound on score change + live notifications */
(function () {
  var SOUND_KEY = 'lexSoundOn';
  var NOTIFY_KEY = 'lexNotifyOn';
  var lastScores = {};
  var knownLive = {};

  function soundOn() {
    return localStorage.getItem(SOUND_KEY) === '1';
  }
  function notifyOn() {
    return localStorage.getItem(NOTIFY_KEY) === '1';
  }

  function beep() {
    if (!soundOn()) return;
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  function ensureControls() {
    if (document.getElementById('lexExtrasControls')) return;
    var box = document.createElement('div');
    box.id = 'lexExtrasControls';
    box.className = 'lex-extras-controls';
    box.innerHTML =
      '<button type="button" id="btnSound" class="lex-extra-btn" title="Score sound">🔊 Sound</button>' +
      '<button type="button" id="btnNotify" class="lex-extra-btn" title="Live match alerts">🔔 Alerts</button>';
    document.body.appendChild(box);

    function sync() {
      var bs = document.getElementById('btnSound');
      var bn = document.getElementById('btnNotify');
      if (bs) {
        bs.classList.toggle('is-on', soundOn());
        bs.textContent = soundOn() ? '🔊 On' : '🔇 Off';
      }
      if (bn) {
        bn.classList.toggle('is-on', notifyOn());
        bn.textContent = notifyOn() ? '🔔 On' : '🔔 Off';
      }
    }
    sync();

    document.getElementById('btnSound').onclick = function () {
      localStorage.setItem(SOUND_KEY, soundOn() ? '0' : '1');
      sync();
      if (soundOn()) beep();
    };
    document.getElementById('btnNotify').onclick = function () {
      if (!notifyOn()) {
        if (!('Notification' in window)) {
          alert('Notifications not supported on this browser');
          return;
        }
        Notification.requestPermission().then(function (p) {
          if (p === 'granted') {
            localStorage.setItem(NOTIFY_KEY, '1');
            sync();
          }
        });
      } else {
        localStorage.setItem(NOTIFY_KEY, '0');
        sync();
      }
    };
  }

  /** Call from pages when match list updates: items = [{id, label, scoreKey, isLive}] */
  window.lexWatchScores = function (items) {
    ensureControls();
    (items || []).forEach(function (it) {
      var prev = lastScores[it.id];
      if (prev !== undefined && prev !== it.scoreKey) beep();
      lastScores[it.id] = it.scoreKey;

      if (it.isLive && !knownLive[it.id]) {
        knownLive[it.id] = true;
        if (notifyOn() && Notification.permission === 'granted') {
          try {
            new Notification('Lex Liga — Live', {
              body: it.label || 'A match just went live',
              icon: 'assets/lexliga_logo_transparent.png'
            });
          } catch (e) {}
        }
      }
      if (!it.isLive) delete knownLive[it.id];
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureControls);
  } else {
    ensureControls();
  }
})();
