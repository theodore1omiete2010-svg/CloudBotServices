/**
 * script.js – Reset Password (Backend-Ready)
 * ------------------------------------------------------------
 * CONFIGURATION:
 *   - API_ENDPOINT: the URL where the new password is sent.
 *   - CSRF_TOKEN: read from a meta tag; your backend must inject
 *     the actual value.
 * ------------------------------------------------------------
 */

(function () {
  'use strict';

  // ========== CONFIGURATION ==========
  var API_ENDPOINT = '/api/auth/reset-password';
  var CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.content || '';
  var RESET_TOKEN = null;

  // ========== DOM REFS ==========
  var html = document.documentElement;
  var form = document.getElementById('resetForm');
  var password = document.getElementById('password');
  var confirmPassword = document.getElementById('confirmPassword');
  var passwordError = document.getElementById('passwordError');
  var confirmPasswordError = document.getElementById('confirmPasswordError');
  var statusMsg = document.getElementById('statusMsg');
  var submitBtn = document.getElementById('submitBtn');
  var themeBtn = document.getElementById('themeToggleFloating');
  var themeLabel = document.getElementById('themeLabel');
  var sun = themeBtn.querySelector('.ftt-sun');
  var moon = themeBtn.querySelector('.ftt-moon');

  // ========== READ RESET TOKEN FROM URL ==========
  try {
    var urlParams = new URLSearchParams(window.location.search);
    RESET_TOKEN = urlParams.get('token');
    // Remove token from URL after reading (for security)
    if (RESET_TOKEN) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (e) {
    // ignore
  }

  // ========== THEME TOGGLE ==========
  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      themeLabel.textContent = 'Dark';
      sun.style.opacity = '0';
      moon.style.opacity = '1';
    } else {
      themeLabel.textContent = 'Light';
      sun.style.opacity = '1';
      moon.style.opacity = '0';
    }
  }

  var savedTheme = (function () {
    try { return localStorage.getItem('cbs-theme'); } catch (e) { return null; }
  })();
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');

  themeBtn.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('cbs-theme', next); } catch (e) {}
    setTheme(next);
  });

  themeBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      themeBtn.click();
    }
  });

  // ========== PASSWORD TOGGLE ==========
  document.querySelectorAll('.toggle-password').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var input = document.getElementById(this.dataset.target);
      if (!input) return;
      var isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      this.classList.toggle('is-visible', !isVisible);
      this.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    });
  });

  // ========== STATUS MESSAGE HELPER (with all types) ==========
  function setStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = 'status-message';
    if (type === 'success') {
      statusMsg.classList.add('status-success');
    } else if (type === 'error') {
      statusMsg.classList.add('status-error');
    } else if (type === 'warning') {
      statusMsg.classList.add('status-warning');
    } else if (type === 'info') {
      statusMsg.classList.add('status-info');
    }
    statusMsg.style.display = 'block';
    statusMsg.focus();
  }

  function clearStatus() {
    statusMsg.textContent = '';
    statusMsg.className = 'status-message';
    statusMsg.style.display = 'none';
  }

  // ========== FIELD VALIDATION ==========
  function validatePassword() {
    var isValid = password.value.length >= 8;
    passwordError.style.display = isValid ? 'none' : 'block';
    return isValid;
  }

  function validateConfirm() {
    var isValid = confirmPassword.value === password.value && confirmPassword.value.length > 0;
    confirmPasswordError.style.display = isValid ? 'none' : 'block';
    return isValid;
  }

  // Real‑time validation on blur
  password.addEventListener('blur', validatePassword);
  confirmPassword.addEventListener('blur', validateConfirm);

  // Clear status when user starts typing again
  password.addEventListener('input', function () {
    if (statusMsg.style.display !== 'none') clearStatus();
  });
  confirmPassword.addEventListener('input', function () {
    if (statusMsg.style.display !== 'none') clearStatus();
  });

  // ========== SET LOADING STATE ==========
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Resetting…' : 'Reset password';
    submitBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }

  // ========== FORM SUBMISSION ==========
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearStatus();

    // 1. Frontend validation
    var isPasswordValid = validatePassword();
    var isConfirmValid = validateConfirm();

    if (!isPasswordValid || !isConfirmValid) {
      setStatus('Please fix the highlighted fields.', 'error');
      if (!isPasswordValid) password.focus();
      else if (!isConfirmValid) confirmPassword.focus();
      return;
    }

    // 2. Check if reset token exists (only on submit)
    if (!RESET_TOKEN) {
      setStatus('No reset token found. Please request a new password reset link.', 'error');
      return;
    }

    // 3. Submit to backend
    setLoading(true);

    var payload = {
      password: password.value,
      token: RESET_TOKEN,
      _csrf: CSRF_TOKEN
    };

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.text().then(function (text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (e) {
            if (response.ok) {
              return { success: true, message: 'Password reset successful.' };
            }
            throw new Error('The server returned an invalid response.');
          }

          if (!response.ok) {
            throw new Error(data.message || data.error || 'Unable to reset password. Please try again.');
          }

          return data;
        });
      })
      .then(function (data) {
        // Success
        setStatus(data.message || 'Password reset successful!', 'success');
        form.style.display = 'none';

        // Redirect after delay (use backend-provided redirect URL if available)
        var redirectUrl = data.redirectUrl || 'login.html';
        setTimeout(function () {
          window.location.href = redirectUrl;
        }, 2000);
      })
      .catch(function (error) {
        setStatus(error.message || 'Network error – please check your connection and try again.', 'error');
        console.error('Reset password error:', error);
      })
      .finally(function () {
        setLoading(false);
      });
  });

  // ========== NO AUTOMATIC ERROR ON PAGE LOAD ==========
  // The token is checked only when the user submits the form.
  // In the normal flow (from verification page), the token is always present.
  // If the user accesses the page directly without a token, they'll see an error on submit.
})();