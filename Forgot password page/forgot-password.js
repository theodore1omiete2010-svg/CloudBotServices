(function () {
  'use strict';

  var html = document.documentElement;

  // Apply a previously saved theme before the UI initializes.
  try {
    var savedTheme = localStorage.getItem('cbs-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      html.setAttribute('data-theme', savedTheme);
    }
  } catch (e) {}

  document.addEventListener('DOMContentLoaded', function () {
    // Floating theme toggle
    var themeBtn = document.getElementById('themeToggleFloating');
    var themeLabel = document.getElementById('themeLabel');
    var sun = themeBtn ? themeBtn.querySelector('.ftt-sun') : null;
    var moon = themeBtn ? themeBtn.querySelector('.ftt-moon') : null;

    function setTheme(theme) {
      html.setAttribute('data-theme', theme);
      if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
      if (sun) sun.style.opacity = theme === 'dark' ? '0' : '1';
      if (moon) moon.style.opacity = theme === 'dark' ? '1' : '0';
    }

    var savedTheme = null;
    try {
      savedTheme = localStorage.getItem('cbs-theme');
    } catch (e) {}
    setTheme(savedTheme === 'dark' ? 'dark' : 'light');

    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem('cbs-theme', next);
        } catch (e) {}
        setTheme(next);
      });
    }

    // ---- Forgot password form ----
    var form = document.getElementById('forgotForm');
    var identifier = document.getElementById('identifier');
    var identifierError = document.getElementById('identifierError');
    var successMsg = document.getElementById('successMsg');
    var requestError = document.getElementById('requestError');
    var submitButton = document.getElementById('submitReset');

    if (!form || !identifier || !identifierError || !successMsg || !requestError || !submitButton) {
      return;
    }

    var API_ENDPOINT = '/api/auth/forgot-password';
    var DEFAULT_ERROR = 'We could not process your request right now. Please try again.';
    var VALIDATION_ERROR = 'Please enter a valid email or phone number.';
    var REQUEST_TIMEOUT_MS = 15000;
    var isSubmitting = false;

    function showFieldError(message) {
      identifierError.textContent = message || VALIDATION_ERROR;
      identifierError.classList.add('is-visible');
      identifier.setAttribute('aria-invalid', 'true');
    }

    function clearFieldError() {
      identifierError.classList.remove('is-visible');
      identifier.setAttribute('aria-invalid', 'false');
    }

    function showRequestError(message) {
      requestError.textContent = message || DEFAULT_ERROR;
      requestError.classList.add('is-visible');
      requestError.focus();
    }

    function clearRequestState() {
      requestError.textContent = '';
      requestError.classList.remove('is-visible');
      successMsg.style.display = 'none';
    }

    function setSubmitting(state) {
      isSubmitting = state;
      submitButton.disabled = state;
      submitButton.setAttribute('aria-busy', state ? 'true' : 'false');
      submitButton.textContent = state ? 'Sending…' : 'Send reset code';
    }

    function isValidIdentifier(value) {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      var phonePattern = /^\+?[0-9\s().-]{6,24}$/;
      var normalizedPhone = value.replace(/[\s().-]/g, '');

      if (emailPattern.test(value)) return true;
      return phonePattern.test(value) && /^\+?[0-9]{6,20}$/.test(normalizedPhone);
    }

    identifier.addEventListener('input', function () {
      if (identifier.getAttribute('aria-invalid') === 'true') {
        clearFieldError();
      }
      if (requestError.classList.contains('is-visible')) {
        clearRequestState();
      }
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (isSubmitting) return;

      var value = identifier.value.trim();
      clearRequestState();
      clearFieldError();

      if (!isValidIdentifier(value)) {
        showFieldError(VALIDATION_ERROR);
        identifier.focus();
        return;
      }

      setSubmitting(true);

      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timeoutId = controller ? setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS) : null;

      try {
        var requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'same-origin',
          body: JSON.stringify({ identifier: value })
        };

        if (controller) requestOptions.signal = controller.signal;

        var response = await fetch(API_ENDPOINT, requestOptions);

        if (!response.ok) {
          throw new Error(DEFAULT_ERROR);
        }

        successMsg.style.display = 'block';
        form.style.display = 'none';
        successMsg.focus();
      } catch (error) {
        if (error && error.name === 'AbortError') {
          showRequestError('The request timed out. Please check your connection and try again.');
        } else {
          showRequestError(error && error.message ? error.message : DEFAULT_ERROR);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        setSubmitting(false);
      }
    });
  });
})();
