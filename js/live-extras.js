/* Lex Liga – louder score sound + live notifications */
(function () {
  var SOUND_KEY = 'lexSoundOn';
  var NOTIFY_KEY = 'lexNotifyOn';
  var lastScores = {};
  var knownLive = {};
  var audioCtx = null;

  if (localStorage.getItem(SOUND_KEY) === null) localStorage.setItem(SOUND_KEY, '1');
  if (localStorage.getItem(NOTIFY_KEY) === null) localStorage.setItem(NOTIFY_KEY, '1');

  function soundOn() {
    return localStorage.getItem(SOUND_KEY) !== '0';
  }
  function notifyOn() {
    return localStorage.getItem(NOTIFY_KEY) !== '0';
  }

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  // Louder two-tone chime
  function beep() {
    if (!soundOn()) return;
    try {
      var ctx = getCtx();
      function tone(freq, start, dur, vol) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(start);
        o.stop(start + dur + 0.02);
      }
      var t0 = ctx.currentTime;
      tone(880, t0, 0.18, 0.22);
      tone(1175, t0 + 0.16, 0.22, 0.2);
    } catch (e) {
      console.warn('beep failed', e);
    }
  }

  function sendNotify(title, body) {
    if (!notifyOn()) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      var n = new Notification(title, {
        body: body,
        icon: 'assets/lexliga_logo_transparent.png',
        badge: 'assets/lexliga_logo_transparent.png',
        tag: 'lex-liga-live',
        renotify: true
      });
      setTimeout(function () {
        try {
          n.close();
        } catch (e) {}
      }, 8000);
    } catch (e) {
      console.warn('notify failed', e);
    }
  }

  function requestNotifyPermission() {
    if (!('Notification' in window)) return Promise.resolve('denied');
    if (Notification.permission === 'granted') return Promise.resolve('granted');
    if (Notification.permission === 'denied') return Promise.resolve('denied');
    return Notification.requestPermission();
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
        var perm = 'Notification' in window ? Notification.permission : 'denied';
        if (!notifyOn()) bn.textContent = '🔔 Off';
        else if (perm === 'granted') bn.textContent = '🔔 On';
        else if (perm === 'denied') bn.textContent = '🔔 Blocked';
        else bn.textContent = '🔔 Allow';
      }
    }
    sync();

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
        alert('Notifications are blocked for this site. Open browser settings → Site settings → Notifications and allow this site.');
        return;
      }
      if (Notification.permission !== 'granted') {
        requestNotifyPermission().then(function (p) {
          if (p === 'granted') {
            localStorage.setItem(NOTIFY_KEY, '1');
            sendNotify('Lex Liga', 'Alerts on — you will get a notice when scores update.');
          }
          sync();
        });
        return;
      }
      localStorage.setItem(NOTIFY_KEY, notifyOn() ? '0' : '1');
      sync();
      if (notifyOn()) sendNotify('Lex Liga', 'Alerts enabled');
    };

    // Unlock audio + request notify after first user tap anywhere
    function unlock() {
      try {
        getCtx();
      } catch (e) {}
      if (notifyOn() && 'Notification' in window && Notification.permission === 'default') {
        requestNotifyPermission().then(sync);
      }
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    }
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  /** items = [{id, label, scoreKey, isLive}] */
  window.lexWatchScores = function (items) {
    ensureControls();
    (items || []).forEach(function (it) {
      var prev = lastScores[it.id];
      var scoreChanged = prev !== undefined && prev !== it.scoreKey;

      if (scoreChanged) {
        beep();
        sendNotify('Lex Liga — Score update', it.label || 'Score changed');
      }
      lastScores[it.id] = it.scoreKey;

      if (it.isLive && !knownLive[it.id]) {
        knownLive[it.id] = true;
        sendNotify('Lex Liga — LIVE', it.label || 'A match just went live');
        beep();
      }
      if (!it.isLive) delete knownLive[it.id];
    });
  };

  // Test helper in console: lexTestAlert()
  window.lexTestAlert = function () {
    ensureControls();
    beep();
    sendNotify('Lex Liga test', 'If you see this, notifications work.');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureControls);
  } else {
    ensureControls();
  }
})();
