(function(){
  'use strict';

  var html = document.documentElement;
  var themeBtn = document.getElementById('themeToggleFloating');

  if (!themeBtn) {
    return;
  }

  var themeLabel = document.getElementById('themeLabel');
  var sun = themeBtn.querySelector('.ftt-sun');
  var moon = themeBtn.querySelector('.ftt-moon');
  var mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function getStoredTheme(){
    try {
      var stored = localStorage.getItem('cbs-theme');
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch (e) {
      return null;
    }
  }

  function getPreferredTheme(){
    return getStoredTheme() || (mediaQuery && mediaQuery.matches ? 'dark' : 'light');
  }

  function setTheme(theme, persist){
    var nextTheme = theme === 'dark' ? 'dark' : 'light';

    html.setAttribute('data-theme', nextTheme);

    if (themeLabel) {
      themeLabel.textContent = nextTheme === 'dark' ? 'Dark' : 'Light';
    }

    if (sun) {
      sun.style.opacity = nextTheme === 'dark' ? '0' : '1';
    }

    if (moon) {
      moon.style.opacity = nextTheme === 'dark' ? '1' : '0';
    }

    themeBtn.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');
    themeBtn.setAttribute(
      'aria-label',
      nextTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );

    if (persist) {
      try {
        localStorage.setItem('cbs-theme', nextTheme);
      } catch (e) {}
    }
  }

  setTheme(getPreferredTheme(), false);

  themeBtn.addEventListener('click', function(){
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
  });

  if (mediaQuery) {
    var handleSystemThemeChange = function(event){
      if (getStoredTheme() === null) {
        setTheme(event.matches ? 'dark' : 'light', false);
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleSystemThemeChange);
    }
  }
})();
