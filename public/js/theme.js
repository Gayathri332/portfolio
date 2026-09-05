// -----------------------------------------------------------
// Light / dark theme toggle, shared across every page.
// The actual [data-theme] attribute is applied as early as
// possible by a tiny inline script in each page's <head> (to
// avoid a flash of the wrong theme) — this file just wires up
// the visible switch and keeps it in sync.
// -----------------------------------------------------------
(function () {
  const KEY = 'gd-theme';
  const root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function reflectSwitches(theme) {
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      const isLight = theme === 'light';
      btn.classList.toggle('is-light', isLight);
      btn.setAttribute('aria-checked', String(isLight));
    });
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    reflectSwitches(theme);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Match whatever the blocking inline head script already set
    // (or fall back to the current attribute / dark default).
    reflectSwitches(current());

    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        apply(current() === 'light' ? 'dark' : 'light');
      });
    });
  });
})();
