/* Lex Liga – mobile hamburger nav */
(function () {
  var LINKS = [
    { href: 'index.html', label: 'Home' },
    { href: 'futsal.html', label: '⚽ Futsal' },
    { href: 'badminton.html', label: '🏸 Badminton' },
    { href: 'bracket.html', label: 'Bracket' },
    { href: 'gallery.html', label: 'Photos' },
    { href: 'fixtures.html', label: 'Fixtures' }
  ];

  function currentFile() {
    var p = (location.pathname || '').split('/').pop() || 'index.html';
    if (!p || p === '') return 'index.html';
    return p;
  }

  function build() {
    var header = document.querySelector('.site-header');
    if (!header || document.getElementById('navBurger')) return;

    var nav = header.querySelector('.site-nav');
    if (!nav) return;

    var burger = document.createElement('button');
    burger.type = 'button';
    burger.id = 'navBurger';
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label', 'Open menu');
    burger.innerHTML = '☰';
    nav.appendChild(burger);

    var drawer = document.createElement('div');
    drawer.id = 'navDrawer';
    drawer.className = 'nav-drawer';
    drawer.innerHTML =
      '<div class="nav-drawer-panel">' +
      '<button type="button" class="nav-drawer-close" id="navDrawerClose" aria-label="Close">✕</button>' +
      LINKS.map(function (l) {
        var active = currentFile() === l.href ? ' is-active' : '';
        return '<a class="' + active + '" href="' + l.href + '">' + l.label + '</a>';
      }).join('') +
      '</div>';
    document.body.appendChild(drawer);

    function open() { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { drawer.classList.remove('open'); document.body.style.overflow = ''; }

    burger.addEventListener('click', open);
    document.getElementById('navDrawerClose').addEventListener('click', close);
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
