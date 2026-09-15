/* Lex Liga Futsal app loader – forces dark mode */
(async function () {
  const url = 'https://cdn.jsdelivr.net/gh/jatinbscllb1232802-create/lex-liga@c91c04c40b98850163d56ba91bc83ee336518ae5/js/app.js';
  try {
    const res = await fetch(url);
    const code = await res.text();
    const fixed = code.replace(
      /function initTheme\(\)\s*\{[\s\S]*?\n\}/,
      `function initTheme() {
  document.documentElement.classList.add('dark');
  document.body.classList.remove('light');
  localStorage.setItem('theme', 'dark');
}`
    );
    (0, eval)(fixed);
  } catch (e) {
    console.error('Failed to load app.js', e);
  }
})();
