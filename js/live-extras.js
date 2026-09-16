/* Lex Liga – sound + live/score notifications (mobile via Service Worker) */
(function () {
  var SOUND_KEY = 'lexSoundOn';
  var NOTIFY_KEY = 'lexNotifyOn';
  var lastScores = {};
  var knownLive = {};
  var audioCtx = null;
  var ICON = new URL('assets/lexliga_logo_transparent.png', location.href).href;
  var HOME = new URL('index.html', location.href).href;

  if (localStorage.getItem(SOUND_KEY) === null) localStorage.setItem(SOUND_KEY, '1');
  if (localStorage.getItem(NOTIFY_KEY) === null) localStorage.setItem(NOTIFY_KEY, '1');

  // Remember live matches already announced this browser session (avoid spam on refresh)
  try {
    var saved = sessionStorage.getItem('lexKnownLive');
    if (saved) knownLive = JSON.parse(saved) || {};
  } catch (e) {}

  function persistKnownLive() {
    try {
      sessionStorage.setItem('lexKnownLive', JSON.stringify(knownLive));
    } catch (e) {}
  }

  function soundOn() {
    return localStorage.getItem(SOUND_KEY) !== '0';
  }
  function notifyOn() {
    return localStorage.getItem(NOTIFY_KEY) !== '0';
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
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

  /** Real alerts only — same path that worked on mobile (Service Worker) */
  function sendNotify(title, body, tag) {
    if (!notifyOn()) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    var payload = {
      type: 'NOTIFY',
      title: title,
      body: body || '',
      icon: ICON,
      tag: tag || 'lex-liga',
      url: HOME
    };

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage(payload);
        return;
      } catch (e) {
        console.warn('SW notify failed', e);
      }
    }

    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then(function (reg) {
          if (reg.showNotification) {
            return reg.showNotification(title, {
              body: body || '',
              icon: ICON,
              badge: ICON,
              tag: tag || 'lex-liga',
              renotify: true,
              vibrate: [120, 60, 120],
              data: { url: HOME }
            });
          }
        })
        .catch(function () {
          fallbackNotification(title, body, tag);
        });
      return;
    }

    fallbackNotification(title, body, tag);
  }

  function fallbackNotification(title, body, tag) {
    try {
      var n = new Notification(title, {
        body: body || '',
        icon: ICON,
        tag: tag || 'lex-liga',
        renotify: true
      });
      setTimeout(function () {
        try { n.close(); } catch (e) {}
      }, 10000);
    } catch (e) {
      console.warn('Notification failed', e);
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
      '<button type="button" id="btnNotify" class="lex-extra-btn" title="Live alerts">🔔 Alerts</button>';
    document.body.appendChild(box);

    function sync() {
      var bs = document.getElementById('btnSound');
      var bn = document.getElementById('btnNotify');
      if (bs) {
        bs.classList.toggle('is-on', soundOn());
        bs.textContent = soundOn() ? '🔊 On' : '🔇 Off';
      }
      if (bn) {
        var perm = 'Notification' in window ? Notification.permission : 'denied';
        bn.classList.toggle('is-on', notifyOn() && perm === 'granted');
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
        alert('This browser does not support notifications.');
        return;
      }
      if (isIos() && !isStandalone()) {
        alert(
          'On iPhone/iPad: Share → Add to Home Screen, open Lex Liga from the icon, then enable Alerts again.'
        );
      }
      if (Notification.permission === 'denied') {
        alert(
          'Notifications are blocked for this site. Enable them in browser settings for Lex Liga.'
        );
        return;
      }
      if (Notification.permission !== 'granted') {
        requestNotifyPermission().then(function (p) {
          if (p === 'granted') localStorage.setItem(NOTIFY_KEY, '1');
          else alert('Permission was not granted.');
          sync();
        });
        return;
      }
      localStorage.setItem(NOTIFY_KEY, notifyOn() ? '0' : '1');
      sync();
    };

    function unlock() {
      try { getCtx(); } catch (e) {}
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    }
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  /** items = [{id, label, scoreKey, isLive}] — uses SW path for mobile */
  window.lexWatchScores = function (items) {
    ensureControls();
    (items || []).forEach(function (it) {
      var prev = lastScores[it.id];
      var scoreChanged = prev !== undefined && prev !== it.scoreKey;

      if (scoreChanged) {
        beep();
        sendNotify(
          'Lex Liga — Score update',
          it.label || 'Score changed',
          'lex-score-' + it.id
        );
      }
      lastScores[it.id] = it.scoreKey;

      if (it.isLive && !knownLive[it.id]) {
        knownLive[it.id] = true;
        persistKnownLive();
        sendNotify(
          'Lex Liga — LIVE',
          it.label || 'A match just went live',
          'lex-live-' + it.id
        );
        beep();
      }
      if (!it.isLive && knownLive[it.id]) {
        delete knownLive[it.id];
        persistKnownLive();
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureControls);
  } else {
    ensureControls();
  }
})();
