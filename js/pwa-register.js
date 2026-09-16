/* Service worker + Add to Home Screen prompt */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }

  var DISMISS_KEY = 'lexPwaDismiss';
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  // iOS / browsers without beforeinstallprompt – show manual tip once
  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  function showBanner() {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    if (document.getElementById('pwaBanner')) return;

    var bar = document.createElement('div');
    bar.id = 'pwaBanner';
    bar.className = 'pwa-install-banner show';
    var tip = isIos()
      ? 'Add Lex Liga to your Home Screen: tap Share → Add to Home Screen'
      : 'Install Lex Liga for quick live scores — like an app on your phone';
    bar.innerHTML =
      '<p>' + tip + '</p>' +
      (isIos()
        ? '<button type="button" class="pwa-install-no" id="pwaNo">Got it</button>'
        : '<button type="button" class="pwa-install-no" id="pwaNo">Not now</button>' +
          '<button type="button" class="pwa-install-yes" id="pwaYes">Install</button>');
    document.body.appendChild(bar);

    document.getElementById('pwaNo').onclick = function () {
      localStorage.setItem(DISMISS_KEY, '1');
      bar.remove();
    };
    var yes = document.getElementById('pwaYes');
    if (yes) {
      yes.onclick = function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () {
          deferredPrompt = null;
          localStorage.setItem(DISMISS_KEY, '1');
          bar.remove();
        });
      };
    }
  }

  // Delay iOS tip so it does not block first paint
  setTimeout(function () {
    if (isIos() && !isStandalone()) showBanner();
  }, 2500);
})();
