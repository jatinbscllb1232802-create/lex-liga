/* Lex Liga – sound + live notifications (ON by default) */
(function () {
  var SOUND_KEY = 'lexSoundOn';
  var NOTIFY_KEY = 'lexNotifyOn';
  var lastScores = {};
  var knownLive = {};

  if (localStorage.getItem(SOUND_KEY) === null) localStorage.setItem(SOUND_KEY, '1');
  if (localStorage.getItem(NOTIFY_KEY) === null) localStorage.setItem(NOTIFY_KEY, '1');

  function soundOn() {
    return localStorage.getItem(SOUND_KEY) !== '0';
  }
  function notifyOn() {
    return localStorage.getItem(NOTIFY_KEY) !== '0';
  }

  function beep() {
    if (!soundOn()) return;
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function tryRequestNotify() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default' && notifyOn()) {
      Notification.requestPermission();
    }
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
        var perm = ('Notification' in window) ? Notification.permission : 'denied';
        bn.textContent = notifyOn() && perm === 'granted' ? '🔔 On' : (notifyOn() ? '🔔 Allow' : '🔔 Off');
      }
    }
    sync();
    tryRequestNotify();

    document.getElementById('btnSound').onclick = function () {
      localStorage.setItem(SOUND_KEY, soundOn() ? '0' : '1');
      sync();
      if (soundOn()) beep();
    };
    document.getElementById('btnNotify').onclick = function () {
      if (!('Notification' in window)) {
        alert('Notifications not supported on this browser');
        return;
      }
      if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Enable them in browser settings for this site.');
        return;
      }
      if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(function (p) {
          if (p === 'granted') {
            localStorage.setItem(NOTIFY_KEY, '1');
            try {
              new Notification('Lex Liga', { body: 'Alerts are on — you will be notified when matches go live.' });
            } catch (e) {}
          }
          sync();
        });
        return;
      }
      localStorage.setItem(NOTIFY_KEY, notifyOn() ? '0' : '1');
      sync();
    };
  }

  window.lexWatchScores = function (items) {
    ensureControls();
    (items || []).forEach(function (it) {
      var prev = lastScores[it.id];
      if (prev !== undefined && prev !== it.scoreKey) beep();
      lastScores[it.id] = it.scoreKey;

      if (it.isLive && !knownLive[it.id]) {
        knownLive[it.id] = true;
        if (notifyOn() && 'Notification' in window && Notification.permission === 'granted') {
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
