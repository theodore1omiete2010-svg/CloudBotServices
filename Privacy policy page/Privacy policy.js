(function () {
  'use strict';

  var html = document.documentElement;
  var themeBtn = document.getElementById('themeToggleFloating');
  var themeLabel = document.getElementById('themeLabel');
  var sun = themeBtn ? themeBtn.querySelector('.ftt-sun') : null;
  var moon = themeBtn ? themeBtn.querySelector('.ftt-moon') : null;
  var media = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  function getSavedTheme() {
    try {
      var saved = localStorage.getItem('cbs-theme');

      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {
      // localStorage may be unavailable or blocked.
    }

    return null;
  }

  function setTheme(theme, persist) {
    var isDark = theme === 'dark';

    html.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light'
    );

    if (themeLabel) {
      themeLabel.textContent = isDark ? 'Dark' : 'Light';
    }

    if (themeBtn) {
      themeBtn.setAttribute(
        'aria-pressed',
        String(isDark)
      );

      themeBtn.setAttribute(
        'aria-label',
        isDark
          ? 'Switch to light theme'
          : 'Switch to dark theme'
      );
    }

    if (sun) {
      sun.style.opacity = isDark ? '0' : '1';
    }

    if (moon) {
      moon.style.opacity = isDark ? '1' : '0';
    }

    if (persist) {
      try {
        localStorage.setItem(
          'cbs-theme',
          isDark ? 'dark' : 'light'
        );
      } catch (e) {
        // Continue normally if storage is unavailable.
      }
    }
  }

  /*
   * Theme priority:
   * 1. User's saved preference
   * 2. Operating system preference
   * 3. Light mode fallback
   */
  var initialTheme =
    getSavedTheme() ||
    (media && media.matches ? 'dark' : 'light');

  setTheme(initialTheme, false);

  /*
   * Native button click handling.
   * No custom Enter/Space keydown handler is needed because
   * the browser already provides keyboard support for <button>.
   */
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var currentTheme =
        html.getAttribute('data-theme') === 'dark'
          ? 'dark'
          : 'light';

      var nextTheme =
        currentTheme === 'dark'
          ? 'light'
          : 'dark';

      setTheme(nextTheme, true);
    });
  }

  /*
   * Follow the operating system theme only when
   * the user has not manually selected a preference.
   */
  if (media) {
    var handleSystemChange = function () {
      if (!getSavedTheme()) {
        setTheme(
          media.matches ? 'dark' : 'light',
          false
        );
      }
    };

    if (media.addEventListener) {
      media.addEventListener(
        'change',
        handleSystemChange
      );
    } else if (media.addListener) {
      // Fallback for older browsers.
      media.addListener(handleSystemChange);
    }
  }
})();