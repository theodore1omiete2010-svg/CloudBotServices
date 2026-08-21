/* Apply the saved theme as early as possible to reduce visual flashing. */
(function () {
  try {
    var savedTheme = localStorage.getItem('cbs-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch (e) {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  var html = document.documentElement;
  var themeBtn = document.getElementById('themeToggleFloating');
  var themeLabel = document.getElementById('themeLabel');
  var sun = document.querySelector('.ftt-sun');
  var moon = document.querySelector('.ftt-moon');
  var form = document.getElementById('loginForm');
  var email = document.getElementById('email');
  var emailError = document.getElementById('emailError');
  var password = document.getElementById('password');
  var passwordError = document.getElementById('passwordError');
  var backendError = document.getElementById('loginError');
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  var API_ENDPOINTS = {
    login: '/api/auth/login'
  };
  var LOGIN_TIMEOUT_MS = 15000;

  function setTheme(theme) {
    var isDark = theme === 'dark';
    html.setAttribute('data-theme', isDark ? 'dark' : 'light');

    if (themeLabel) {
      themeLabel.textContent = isDark ? 'Dark' : 'Light';
    }
    if (sun) {
      sun.style.opacity = isDark ? '0' : '1';
    }
    if (moon) {
      moon.style.opacity = isDark ? '1' : '0';
    }
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem('cbs-theme');
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem('cbs-theme', theme);
    } catch (e) {
      // Theme remains functional for the current session if storage is blocked.
    }
  }

  setTheme(getSavedTheme() === 'dark' ? 'dark' : 'light');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      setTheme(next);
    });
  }

  // Contact Us remains inert until its real destination is supplied.
  document.querySelectorAll('[data-contact-us-placeholder="true"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
    });
  });

  function clearBackendError() {
    if (backendError) {
      backendError.textContent = '';
      backendError.style.display = 'none';
    }
  }

  function showBackendError(message) {
    if (backendError) {
      backendError.textContent = message;
      backendError.style.display = 'block';
    }
  }

  function setFieldError(input, errorElement, hasError) {
    if (!input || !errorElement) {
      return;
    }
    input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    errorElement.style.display = hasError ? 'block' : 'none';
  }

  function setLoading(isLoading, originalLabel) {
    if (!submitBtn) {
      return;
    }
    submitBtn.disabled = isLoading;
    submitBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    submitBtn.textContent = isLoading ? 'Logging in...' : originalLabel;
  }

  function validateForm() {
    var valid = true;
    var firstInvalid = null;
    var trimmedEmail = email ? email.value.trim() : '';

    setFieldError(email, emailError, false);
    setFieldError(password, passwordError, false);

    if (!email || !emailPatternValid(trimmedEmail)) {
      setFieldError(email, emailError, true);
      valid = false;
      firstInvalid = firstInvalid || email;
    }

    if (!password || password.value.length === 0) {
      setFieldError(password, passwordError, true);
      valid = false;
      firstInvalid = firstInvalid || password;
    }

    if (!valid && firstInvalid) {
      firstInvalid.focus();
    }

    return valid;
  }

  function emailPatternValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function getErrorMessage(data) {
    if (!data || typeof data !== 'object') {
      return 'Unable to log in. Please check your details and try again.';
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }

    return 'Unable to log in. Please check your details and try again.';
  }

  function safeRedirect(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return 'dashboard.html';
    }

    var redirect = value.trim();

    // Only allow same-origin destinations. This prevents an API response from
    // turning the successful login flow into an open redirect.
    try {
      var url = new URL(redirect, window.location.origin);
      if (url.origin !== window.location.origin) {
        return 'dashboard.html';
      }
      return url.href;
    } catch (e) {
      return 'dashboard.html';
    }
  }

  async function readResponseData(response) {
    var contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return {};
    }

    try {
      return await response.json();
    } catch (e) {
      return {};
    }
  }

  async function handleLogin() {
    var controller = new AbortController();
    var timeoutId = window.setTimeout(function () {
      controller.abort();
    }, LOGIN_TIMEOUT_MS);

    try {
      var response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value
        })
      });

      var data = await readResponseData(response);

      if (!response.ok) {
        showBackendError(getErrorMessage(data));
        return false;
      }

      clearBackendError();
      window.location.assign(safeRedirect(data.redirect));
      return true;
    } catch (error) {
      if (error && error.name === 'AbortError') {
        showBackendError('The server took too long to respond. Please try again.');
      } else {
        showBackendError('Unable to connect to the server. Please try again.');
      }
      return false;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  document.querySelectorAll('.toggle-password').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var targetId = toggle.dataset.target;
      var input = targetId ? document.getElementById(targetId) : null;
      if (!input) {
        return;
      }

      var isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      toggle.classList.toggle('is-visible', !isVisible);
      toggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    });
  });

  if (email) {
    email.addEventListener('input', function () {
      setFieldError(email, emailError, false);
      clearBackendError();
    });
  }

  if (password) {
    password.addEventListener('input', function () {
      setFieldError(password, passwordError, false);
      clearBackendError();
    });
  }

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      clearBackendError();

      if (!validateForm()) {
        return;
      }

      var originalLabel = submitBtn ? submitBtn.textContent : 'Log in';
      setLoading(true, originalLabel);

      try {
        await handleLogin();
      } finally {
        // A successful login normally navigates away. If navigation does not
        // happen, restore the form so the user can retry.
        setLoading(false, originalLabel);
      }
    });
  }
});
