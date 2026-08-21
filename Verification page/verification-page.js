/**
 * verification-page.js – OTP Verification (Backend-Ready)
 * Supports: Password Reset & Signup flows
 * ------------------------------------------------------------
 */

(function () {
  'use strict';

  // ========== CONFIGURATION ==========
  var VERIFY_ENDPOINT = '/api/auth/verify-code';
  var RESEND_ENDPOINT = '/api/auth/resend-code';
  var CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.content || '';

  // ========== READ URL PARAMETERS ==========
  var challengeId = null;
  var field = null;
  var contactValue = null;
  var mode = null; // 'reset' or 'signup'

  try {
    var urlParams = new URLSearchParams(window.location.search);
    challengeId = urlParams.get('challengeId');
    field = urlParams.get('field') || 'email or phone';
    contactValue = urlParams.get('value') || 'your contact';
    mode = urlParams.get('mode') || 'reset'; // default to reset
  } catch (e) {
    // ignore
  }

  // ========== DOM REFS ==========
  var html = document.documentElement;
  var digitInputs = document.querySelectorAll('.digit-input');
  var verifyBtn = document.getElementById('verifyBtn');
  var statusMsg = document.getElementById('statusMsg');
  var resendBtn = document.getElementById('resendBtn');
  var countdownEl = document.getElementById('countdown');
  var contactInfo = document.getElementById('contactInfo');
  var authEyebrow = document.querySelector('.auth-eyebrow');
  var pageTitle = document.querySelector('h1');
  var pageSub = document.querySelector('.sub');

  // ========== UPDATE UI BASED ON MODE ==========
  function updateUIForMode() {
    if (mode === 'signup') {
      if (authEyebrow) authEyebrow.textContent = 'Verify your account';
      if (pageTitle) pageTitle.textContent = 'Verify your email or phone';
      if (pageSub) {
        pageSub.textContent = 'We sent a 6‑digit code to your ' + 
          (field === 'email' ? 'email' : 'phone number') + 
          '. Enter it below to complete your signup.';
      }
    } else {
      // Default: password reset flow
      if (authEyebrow) authEyebrow.textContent = 'Verify your identity';
      if (pageTitle) pageTitle.textContent = 'Enter verification code';
      if (pageSub) {
        pageSub.textContent = 'We sent a 6‑digit code to your ' + 
          (field === 'email' ? 'email' : 'phone number') + 
          '. Enter it below to continue.';
      }
    }
  }

  // ========== SET CONTACT INFO ==========
  if (contactInfo) {
    contactInfo.textContent = field === 'email' ? contactValue : 'phone number';
  }

  updateUIForMode();

  // ========== THEME TOGGLE (unchanged) ==========
  var themeBtn = document.getElementById('themeToggleFloating');
  var themeLabel = document.getElementById('themeLabel');
  var sun = themeBtn.querySelector('.ftt-sun');
  var moon = themeBtn.querySelector('.ftt-moon');

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

  // ========== STATUS MESSAGE HELPERS ==========
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

  // ========== COUNTDOWN TIMER ==========
  var countdown = 60;
  var countdownInterval = null;

  function startCountdown() {
    countdown = 60;
    resendBtn.disabled = true;
    updateCountdownDisplay();

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(function () {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Resend code';
      } else {
        updateCountdownDisplay();
      }
    }, 1000);
  }

  function updateCountdownDisplay() {
    var minutes = Math.floor(countdown / 60);
    var seconds = countdown % 60;
    countdownEl.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }

  // ========== DIGIT INPUT HANDLING ==========
  function getFullCode() {
    var code = '';
    digitInputs.forEach(function (input) {
      code += input.value;
    });
    return code;
  }

  function updateVerifyButton() {
    var allFilled = true;
    digitInputs.forEach(function (input) {
      if (!input.value.trim()) allFilled = false;
    });
    verifyBtn.disabled = !allFilled;
  }

  function clearDigits() {
    digitInputs.forEach(function (input) {
      input.value = '';
    });
    digitInputs[0].focus();
    updateVerifyButton();
  }

  // ========== AUTO‑ADVANCE ON INPUT ==========
  digitInputs.forEach(function (input, index) {
    input.addEventListener('input', function (e) {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (this.value && index < digitInputs.length - 1) {
        digitInputs[index + 1].focus();
      }
      if (statusMsg.style.display !== 'none') clearStatus();
      updateVerifyButton();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && index > 0) {
        digitInputs[index - 1].focus();
        digitInputs[index - 1].value = '';
        updateVerifyButton();
      }
      if (e.key === 'Enter' && getFullCode().length === 6) {
        verifyBtn.click();
      }
    });

    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasteData = (e.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/[^0-9]/g, '')
        .slice(0, 6);

      pasteData.split('').forEach(function (char, i) {
        if (digitInputs[i]) digitInputs[i].value = char;
      });

      var focusIndex = Math.min(pasteData.length, digitInputs.length - 1);
      digitInputs[focusIndex].focus();
      if (statusMsg.style.display !== 'none') clearStatus();
      updateVerifyButton();
    });
  });

  // ========== SET LOADING STATE ==========
  function setLoading(isLoading) {
    verifyBtn.disabled = isLoading || getFullCode().length !== 6;
    verifyBtn.textContent = isLoading ? 'Verifying…' : 'Verify';
    verifyBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }

  // ========== VERIFY CODE ==========
  verifyBtn.addEventListener('click', function () {
    if (verifyBtn.disabled) return;

    var code = getFullCode();

    if (code.length !== 6) {
      setStatus('Please enter all 6 digits.', 'error');
      return;
    }

    if (!challengeId) {
      setStatus('Verification session expired. Please request a new code.', 'error');
      return;
    }

    clearStatus();
    setLoading(true);

    var payload = {
      challengeId: challengeId,
      code: code,
      mode: mode, // 'reset' or 'signup'
      field: field,
      _csrf: CSRF_TOKEN
    };

    fetch(VERIFY_ENDPOINT, {
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
              return { success: true, message: 'Verification successful.' };
            }
            throw new Error('The server returned an invalid response.');
          }

          if (!response.ok) {
            throw new Error(data.message || data.error || 'Invalid or expired code.');
          }

          return data;
        });
      })
      .then(function (data) {
        setStatus(data.message || 'Verification successful!', 'success');

        var redirectUrl = data.redirectUrl;

        // If no redirectUrl, build based on mode
        if (!redirectUrl) {
          if (mode === 'signup') {
            // After signup verification, go to business registration or dashboard
            redirectUrl = data.nextStep || 'business-registration.html';
          } else {
            // Password reset flow: go to reset password page
            redirectUrl = data.resetToken 
              ? 'reset-password.html?token=' + encodeURIComponent(data.resetToken)
              : 'login.html';
          }
        }

        if (redirectUrl) {
          setTimeout(function () {
            window.location.href = redirectUrl;
          }, 1500);
        } else {
          setTimeout(function () {
            window.location.href = 'login.html';
          }, 2000);
        }
      })
      .catch(function (error) {
        setStatus(error.message || 'Verification failed. Please try again.', 'error');
        clearDigits();
        setLoading(false);
      });
  });

  // ========== RESEND CODE ==========
  resendBtn.addEventListener('click', function () {
    if (resendBtn.disabled) return;

    if (!challengeId) {
      setStatus('Verification session expired. Please request a new code.', 'error');
      return;
    }

    clearStatus();
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending…';

    var payload = {
      challengeId: challengeId,
      mode: mode,
      field: field,
      _csrf: CSRF_TOKEN
    };

    fetch(RESEND_ENDPOINT, {
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
              return { success: true, message: 'Code resent successfully.' };
            }
            throw new Error('The server returned an invalid response.');
          }

          if (!response.ok) {
            throw new Error(data.message || data.error || 'Unable to resend code.');
          }

          return data;
        });
      })
      .then(function (data) {
        setStatus(data.message || 'A new code has been sent.', 'success');
        clearDigits();
        startCountdown();
      })
      .catch(function (error) {
        setStatus(error.message || 'Unable to resend code. Please try again.', 'error');
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Resend code';
      });
  });

  // ========== INITIALIZE ==========
  if (!challengeId) {
    setStatus('Verification session missing. Please request a new code.', 'warning');
  }

  startCountdown();
  digitInputs[0].focus();
})();