(function initializeThemeFromSystem() {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      document.documentElement.setAttribute('data-theme', media.matches ? 'dark' : 'light');
    })();

(function initializeCloudBotServices() {
      const initialize = async function() {
        await (async function() {
          "use strict";

      // ----- TOAST SYSTEM (replaces alert) -----
      function createToastContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
          container = document.createElement('div');
          container.id = 'toastContainer';
          container.setAttribute('aria-live', 'polite');
          container.setAttribute('aria-atomic', 'true');
          container.style.cssText = `
            position: fixed; bottom: 90px; right: 24px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px;
            max-width: 380px; width: 100%;
            pointer-events: none;
          `;
          document.body.appendChild(container);
        }
        return container;
      }

      function showToast(message, type = 'info', duration = 4500) {
        const container = createToastContainer();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'alert');
        toast.style.cssText = `
          pointer-events: auto;
          background: var(--surface, #fff);
          color: var(--ink, #0E1B2C);
          border: 1px solid var(--line, rgba(14,27,44,.10));
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 0.9rem;
          font-weight: 500;
          box-shadow: 0 12px 30px rgba(14,27,44,.15);
          transform: translateX(120%);
          transition: transform .35s cubic-bezier(0.22, 1, 0.36, 1), opacity .3s ease;
          opacity: 0;
          border-left: 4px solid ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#2E64F0'};
        `;
        toast.textContent = message;
        container.appendChild(toast);

        // Trigger entrance
        requestAnimationFrame(() => {
          toast.style.transform = 'translateX(0)';
          toast.style.opacity = '1';
        });

        // Auto-remove
        const timer = setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(120%)';
          setTimeout(() => {
            if (toast.parentNode) toast.remove();
          }, 400);
        }, duration);

        // Click to dismiss early
        toast.addEventListener('click', () => {
          clearTimeout(timer);
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(120%)';
          setTimeout(() => {
            if (toast.parentNode) toast.remove();
          }, 400);
        });

        return toast;
      }

      // ----- HELPERS -----
      async function fetchWithRetry(fn, retries = 3, delay = 1000) {
        let lastError;
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (e) {
            lastError = e;
            if (i < retries - 1) {
              await new Promise(r => setTimeout(r, delay * (i + 1)));
            }
          }
        }
        throw lastError;
      }

      // ----- BACKEND API CLIENT -----
      function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta && meta.getAttribute('content')) return meta.getAttribute('content');
        // Fallback: read from cookie if present (typical for many frameworks)
        const cookies = document.cookie.split('; ');
        for (let cookie of cookies) {
          const [name, value] = cookie.split('=');
          if (name === 'csrf_token' || name === 'XSRF-TOKEN') return decodeURIComponent(value || '');
        }
        return '';
      }

      async function apiRequest(url, data, options = {}) {
        const method = (options.method || (data == null ? 'GET' : 'POST')).toUpperCase();
        const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 10000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const headers = new Headers(options.headers || {});
        headers.set('Accept', 'application/json');

        if (data != null && method !== 'GET' && method !== 'HEAD') {
          headers.set('Content-Type', 'application/json');
        }

        const csrfToken = getCsrfToken();
        if (csrfToken && method !== 'GET' && method !== 'HEAD') {
          headers.set('X-CSRF-Token', csrfToken);
        }

        const requestInit = {
          method,
          headers,
          credentials: 'same-origin',
          cache: options.cache || 'no-store',
          signal: controller.signal
        };

        if (data != null && method !== 'GET' && method !== 'HEAD') {
          requestInit.body = JSON.stringify(data);
        }

        try {
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get('content-type') || '';
          const payload = contentType.includes('application/json')
            ? await response.json()
            : await response.text();

          if (!response.ok) {
            const detail = typeof payload === 'string' ? payload : (payload && (payload.message || payload.error));
            const error = new Error(detail || `API request failed with HTTP ${response.status}`);
            error.status = response.status;
            error.payload = payload;
            throw error;
          }

          return payload;
        } finally {
          clearTimeout(timeoutId);
        }
      }

      // ----- THEME -----
      const html = document.documentElement;
      const themeBtn = document.getElementById('themeToggleFloating');
      const themeLabel = document.getElementById('themeLabel');
      const sun = themeBtn.querySelector('.ftt-sun');
      const moon = themeBtn.querySelector('.ftt-moon');

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
      let themeManuallySet = false;
      const systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
      setTheme(systemThemeMedia.matches ? 'dark' : 'light');
      if (systemThemeMedia.addEventListener) {
        systemThemeMedia.addEventListener('change', function(event) {
          if (!themeManuallySet) setTheme(event.matches ? 'dark' : 'light');
        });
      }
      themeBtn.addEventListener('click', function() {
        themeManuallySet = true;
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(next);
      });
      themeBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); themeBtn.click(); }
      });

      // ----- YEAR -----
      document.getElementById('currentYear').textContent = new Date().getFullYear();

      // ----- PROGRESS BAR -----
      const progressBar = document.getElementById('progressBar');
      window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY;
        const docHeight = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
        progressBar.style.width = progress + '%';
      });

      // ----- BACK TO TOP BUTTON (updated with .visible class) -----
      const backToTopBtn = document.getElementById('backToTopBtn');
      if (backToTopBtn) {
        window.addEventListener('scroll', function() {
          if (window.scrollY > 400) {
            backToTopBtn.classList.add('visible');
          } else {
            backToTopBtn.classList.remove('visible');
          }
        });
        backToTopBtn.addEventListener('click', function() {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      // ----- STICKY CTA -----
      const stickyCta = document.getElementById('stickyCta');
      const stickyCtaFooter = document.querySelector('footer');
      window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero').offsetHeight;
        const pastHero = currentScrollY > heroHeight - 100;
        const nearFooter = stickyCtaFooter
          ? stickyCtaFooter.getBoundingClientRect().top <= window.innerHeight
          : false;
        if (pastHero && !nearFooter) {
          stickyCta.classList.add('visible');
        } else {
          stickyCta.classList.remove('visible');
        }
      });

      // ----- CURRENCY / PRICING -----
      const defaultCurrency = { currency: 'USD', symbol: '$', rate: 1, locale: 'en-US' };
      let detectedCurrency = defaultCurrency;
      const pricingEndpoint = '/api/pricing';

      function getCurrencySymbol(code, locale) {
        try {
          const parts = new Intl.NumberFormat(locale || undefined, {
            style: 'currency',
            currency: code,
            currencyDisplay: 'narrowSymbol'
          }).formatToParts(0);
          const symbolPart = parts.find(part => part.type === 'currency');
          if (symbolPart && symbolPart.value) return symbolPart.value;
        } catch (e) {}
        return code || '$';
      }

      function formatAmount(amount, symbol) {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount)) return symbol + '—';
        if (numericAmount >= 1000) return symbol + Math.round(numericAmount).toLocaleString();
        if (numericAmount >= 1) return symbol + numericAmount.toFixed(2);
        return symbol + numericAmount.toFixed(4);
      }

      function applyCurrency(info) {
        const safeCurrency = info && info.currency ? String(info.currency).toUpperCase() : 'USD';
        const safeLocale = info && info.locale ? String(info.locale) : (navigator.language || 'en-US');
        const safeRate = safeCurrency === 'USD' ? 1 : Number(info && info.rate);

        if (!Number.isFinite(safeRate) || safeRate <= 0) {
          detectedCurrency = defaultCurrency;
          setBilling('monthly', defaultCurrency.symbol, defaultCurrency.rate);
          updatePaygPrices(defaultCurrency.symbol, defaultCurrency.rate);
          return;
        }

        detectedCurrency = {
          currency: safeCurrency,
          symbol: info.symbol || getCurrencySymbol(safeCurrency, safeLocale),
          rate: safeRate,
          locale: safeLocale
        };
        setBilling(selectedBillingPeriod, detectedCurrency.symbol, detectedCurrency.rate);
        updatePaygPrices(detectedCurrency.symbol, detectedCurrency.rate);
      }

      function updatePaygPrices(symbol, rate) {
        const safeRate = Number(rate);
        const effectiveRate = Number.isFinite(safeRate) && safeRate > 0 ? safeRate : 1;
        const paygEl = document.getElementById('paygPrice');
if (paygEl) paygEl.textContent = formatAmount(0.02 * effectiveRate, symbol) + ' per conversation';
        document.querySelectorAll('.payg-expand-content .rate').forEach(function(el) {
el.textContent = formatAmount(0.02 * effectiveRate, symbol) + ' per conversation';
        });
        document.querySelectorAll('.payg-expand-content .examples').forEach(function(el) {
          const rate = 0.01 * effectiveRate;
          el.textContent = '100 conv. = ' + formatAmount(rate * 100, symbol) + '  ·  1,000 conv. = ' + formatAmount(rate * 1000, symbol);
        });
      }

      async function detectCurrency() {
        const locale = navigator.language || 'en-US';
        const url = new URL(pricingEndpoint, window.location.origin);
        url.searchParams.set('locale', locale);

        try {
          const response = await apiRequest(url.toString(), null, {
            method: 'GET',
            timeoutMs: 5000,
            cache: 'no-store'
          });
          const code = String(response && response.currency || 'USD').toUpperCase();
          const rate = Number(response && response.rate);
          applyCurrency({
            currency: code,
            symbol: response && response.symbol ? response.symbol : getCurrencySymbol(code, response && response.locale || locale),
            rate: code === 'USD' ? 1 : rate,
            locale: response && response.locale ? response.locale : locale
          });
        } catch (error) {
          console.warn('Pricing API unavailable; displaying USD pricing.', error);
          applyCurrency(defaultCurrency);
        }
      }

      // ----- AUTH UI -----
      let currentAuthState = 'guest';
      function renderAuthUI(state) {
        currentAuthState = state;
        const authActions = document.getElementById('authActions');
        const heroCta = document.getElementById('heroCta');
        const finalCta = document.getElementById('finalCta');
        const pricingButtons = document.querySelectorAll('[data-plan]');
        if (!authActions || !heroCta || !finalCta) return;
        if (state === 'guest') {
          authActions.innerHTML = '<div class="auth-buttons"><a href="login.html" class="btn btn-ghost">Log in</a><a href="signup.html" class="btn btn-primary">Sign up</a></div>';
          heroCta.textContent = 'Start your 3-day free trial';
          heroCta.href = 'signup.html';
          finalCta.textContent = 'Start free trial';
          finalCta.href = 'signup.html';
          pricingButtons.forEach(function(btn) {
            btn.textContent = btn.getAttribute('data-guest-label') || 'Choose ' + btn.getAttribute('data-plan');
            btn.href = 'signup.html';
          });
        } else if (state === 'registered') {
          authActions.innerHTML = '<a href="business-registration-page.html" class="btn btn-primary">Register Your Business</a>';
          heroCta.textContent = 'Register your business';
          heroCta.href = 'business-registration-page.html';
          finalCta.textContent = 'Register your business';
          finalCta.href = 'business-registration-page.html';
          pricingButtons.forEach(function(btn) {
            btn.textContent = btn.getAttribute('data-registered-label') || 'Choose ' + btn.getAttribute('data-plan');
            btn.href = 'business-registration-page.html';
          });
        } else if (state === 'active') {
          authActions.innerHTML = '<div class="user-menu"><button class="user-chip" id="userChip" aria-expanded="false" aria-haspopup="true"><span class="avatar">CB</span>Dashboard<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button><div id="userDropdown" class="user-dropdown" hidden><a href="dashboard.html#account" class="user-dropdown-link">Account settings</a><a href="dashboard.html#billing" class="user-dropdown-link">Billing &amp; plan</a><div class="user-dropdown-divider"></div><button id="logoutBtn" class="user-dropdown-btn">Log out</button></div></div>';
          heroCta.textContent = 'Go to dashboard';
          heroCta.href = 'dashboard.html';
          finalCta.textContent = 'Go to dashboard';
          finalCta.href = 'dashboard.html';
          pricingButtons.forEach(function(btn) {
            btn.textContent = 'Manage Plan';
            btn.href = 'dashboard.html';
          });
          setTimeout(function() {
            const userChip = document.getElementById('userChip');
            const userDropdown = document.getElementById('userDropdown');
            if (userChip && userDropdown) {
              function trapFocus(e) {
                if (e.key !== 'Tab' || userDropdown.hidden) return;
                const focusable = userDropdown.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
              userChip.addEventListener('click', function(e) {
                e.stopPropagation();
                const expanded = userChip.getAttribute('aria-expanded') === 'true';
                userChip.setAttribute('aria-expanded', !expanded);
                userDropdown.hidden = expanded;
                userDropdown.classList.toggle('show', !expanded);
                if (!expanded) {
                  setTimeout(() => {
                    const focusable = userDropdown.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
                    if (focusable.length) focusable[0].focus();
                    document.addEventListener('keydown', trapFocus);
                  }, 10);
                } else {
                  document.removeEventListener('keydown', trapFocus);
                }
              });
              document.addEventListener('click', function(e) {
                if (!userChip.contains(e.target) && !userDropdown.contains(e.target)) {
                  userChip.setAttribute('aria-expanded', 'false');
                  userDropdown.hidden = true;
                  userDropdown.classList.remove('show');
                  document.removeEventListener('keydown', trapFocus);
                }
              });
              document.getElementById('logoutBtn').addEventListener('click', async function() {
                const button = this;
                button.disabled = true;
                try {
                  await apiRequest('/api/logout', {}, { method: 'POST', timeoutMs: 8000 });
                  showToast('Logged out successfully', 'success');
                } catch (error) {
                  console.error('Logout failed:', error);
                  showToast('Logout failed. Please try again.', 'error');
                } finally {
                  button.disabled = false;
                  await refreshAuthUI();
                }
              });
            }
          }, 0);
        }
      }

      // ----- SIGNUP / CHECKOUT API HANDLERS -----
      const pendingApiElements = new WeakSet();

      function getPlanFromElement(el) {
        if (el.dataset.plan) return el.dataset.plan.toLowerCase();
        const href = el.getAttribute('href') || '';
        try {
          const url = new URL(href, window.location.origin);
          return (url.searchParams.get('plan') || 'trial').toLowerCase();
        } catch (e) {
          return 'trial';
        }
      }

      async function handlePlanSelection(event) {
        const el = event.currentTarget;
        const isCheckout = el.hasAttribute('data-api-checkout');

        if (!isCheckout && currentAuthState !== 'guest') return;
        if (pendingApiElements.has(el)) {
          event.preventDefault();
          return;
        }

        const endpoint = isCheckout
          ? el.getAttribute('data-api-checkout')
          : el.getAttribute('data-api-signup');
        if (!endpoint) return;

        event.preventDefault();
        pendingApiElements.add(el);

        const plan = getPlanFromElement(el);
        const originalText = el.textContent;
        el.textContent = 'Processing…';
        el.setAttribute('aria-busy', 'true');
        el.setAttribute('aria-disabled', 'true');

        try {
          const response = await apiRequest(endpoint, { plan }, { method: 'POST', timeoutMs: 10000 });

          if (response && response.redirect) {
            window.location.assign(response.redirect);
            return;
          }

          const fallbackPage = isCheckout ? 'checkout.html' : 'signup.html';
          const safeUrl = new URL(fallbackPage, window.location.origin);
          safeUrl.searchParams.set('plan', plan);
          window.location.assign(safeUrl.href);
        } catch (error) {
          console.error('API request failed:', error);
          const message = error && error.payload && typeof error.payload === 'object' && error.payload.message
            ? error.payload.message
            : 'Something went wrong while processing your request. Please try again.';
          showToast(message, 'error');
        } finally {
          pendingApiElements.delete(el);
          el.textContent = originalText;
          el.removeAttribute('aria-busy');
          el.removeAttribute('aria-disabled');
        }
      }

      function initApiIntegration() {
        document.querySelectorAll('[data-api-signup], [data-api-checkout]').forEach(function(btn) {
          btn.addEventListener('click', handlePlanSelection);
        });
      }

      async function refreshAuthUI(retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const session = await apiRequest('/api/session', null, { method: 'GET', timeoutMs: 5000, cache: 'no-store' });
            const state = session && (session.state || (session.user && session.user.state));
            renderAuthUI(['guest', 'registered', 'active'].includes(state) ? state : (session && session.authenticated ? 'active' : 'guest'));
            return;
          } catch (error) {
            if (attempt === retries) {
              console.warn('Session API unavailable after retries; rendering signed-out navigation.', error);
              renderAuthUI('guest');
            } else {
              await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
            }
          }
        }
      }

      initApiIntegration();

      // ----- BILLING -----
      const billMonthly = document.getElementById('billMonthly');
      const billYearly = document.getElementById('billYearly');
      const priceCards = document.querySelectorAll('.price-card[data-monthly]');
      let selectedBillingPeriod = 'monthly';

      function setBilling(period, symbol, rate) {
        selectedBillingPeriod = period === 'yearly' ? 'yearly' : 'monthly';
        if (!billMonthly || !billYearly) return;
        const isYearly = selectedBillingPeriod === 'yearly';
        const safeRate = Number.isFinite(Number(rate)) && Number(rate) > 0 ? Number(rate) : 1;
        const safeSymbol = symbol || '$';
        billMonthly.classList.toggle('is-active', !isYearly);
        billYearly.classList.toggle('is-active', isYearly);
        billMonthly.setAttribute('aria-selected', String(!isYearly));
        billYearly.setAttribute('aria-selected', String(isYearly));
        priceCards.forEach(function(card) {
          const monthlyUSD = Number(card.dataset.monthly);
          const monthly = monthlyUSD * safeRate;
          const oldFigure = card.querySelector('.amount-old');
          const figure = card.querySelector('.amount-figure');
          const suffix = card.querySelector('.amount-suffix');
          const note = card.querySelector('.amount-note');
          if (isYearly) {
            const yearlyTotal = monthly * 12;
            const savings = yearlyTotal * 0.2;
            const finalYearly = yearlyTotal - savings;
            const effectiveMonthly = finalYearly / 12;
            oldFigure.textContent = formatAmount(monthly, safeSymbol);
            oldFigure.hidden = false;
            figure.textContent = formatAmount(effectiveMonthly, safeSymbol);
            suffix.textContent = '/month';
            note.textContent = 'Billed ' + formatAmount(finalYearly, safeSymbol) + '/year · Save ' + formatAmount(savings, safeSymbol);
          } else {
            oldFigure.hidden = true;
            figure.textContent = formatAmount(monthly, safeSymbol);
            suffix.textContent = '/month';
            note.innerHTML = '&nbsp;';
          }
        });
      }

      billMonthly?.addEventListener('click', function() { setBilling('monthly', detectedCurrency.symbol, detectedCurrency.rate); });
      billYearly?.addEventListener('click', function() { setBilling('yearly', detectedCurrency.symbol, detectedCurrency.rate); });

      // ===== BUSINESS BENEFITS CAROUSEL =====
      const testimonialsData = [
        { title: 'Respond faster', icon: '⚡', desc: 'Automate routine customer questions and replies so your business can respond quickly without manually handling every conversation.' },
        { title: 'Automate repetitive conversations', icon: '🤖', desc: 'Use configurable rules and AI-assisted automation for FAQs, customer requests, order flows, and other repetitive interactions.' },
        { title: 'Keep customers moving', icon: '🛒', desc: 'Guide customers through conversations, orders, payment links, and other supported workflows without unnecessary back-and-forth.' },
        { title: 'Stay in control', icon: '🎛️', desc: 'Monitor your automation, review activity, and hand conversations to a real person whenever human assistance is needed.' }
      ];

      const tTrack = document.getElementById('testimonialTrack');
      const tDots = document.getElementById('testimonialDots');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      const tPlayToggle = document.getElementById('testimonialPlayToggle');
      const tPlaySvg = document.getElementById('testimonialPlaySvg');
      const tProgressFill = document.getElementById('testimonialProgressFill');
      const tProgressLabel = document.getElementById('testimonialProgressLabel');
      const tViewAllBtn = document.getElementById('testimonialViewAllBtn');
      const tViewAllIcon = document.getElementById('testimonialViewAllIcon');
      const tAllGrid = document.getElementById('testimonialAllGrid');

      let tCurrent = 0;
      const totalSlides = testimonialsData.length;
      let autoSlideInterval = null;
      let isPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function buildTestimonialSlide(t, i) {
        const slide = document.createElement('div');
        slide.className = 'testimonial-slide benefit-slide';
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-label', 'Benefit ' + (i + 1) + ' of ' + totalSlides);
        slide.setAttribute('aria-current', i === tCurrent ? 'step' : 'false');
        slide.innerHTML = `
          <div class="benefit-icon" aria-hidden="true">${t.icon}</div>
          <h3 class="benefit-title">${t.title}</h3>
          <p class="benefit-description">${t.desc}</p>
        `;
        return slide;
      }

      function buildTestimonialAllCard(t, i) {
        const card = document.createElement('div');
        card.className = 'testimonial-all-card benefit-all-card';
        card.innerHTML = `
          <div class="benefit-icon" aria-hidden="true">${t.icon}</div>
          <div class="all-quote"><strong>${t.title}</strong></div>
          <div class="all-attribution">${t.desc}</div>
        `;
        return card;
      }

      function renderTestimonials() {
        tTrack.innerHTML = '';
        testimonialsData.forEach((t, i) => {
          const slide = buildTestimonialSlide(t, i);
          tTrack.appendChild(slide);
        });
        tDots.innerHTML = '';
        testimonialsData.forEach((_, i) => {
          const dot = document.createElement('button');
          dot.setAttribute('aria-label', 'Go to benefit ' + (i + 1));
          dot.setAttribute('aria-current', i === tCurrent ? 'step' : 'false');
          dot.addEventListener('click', () => goToSlide(i));
          tDots.appendChild(dot);
        });
        tAllGrid.innerHTML = '';
        testimonialsData.forEach((t, i) => {
          const card = buildTestimonialAllCard(t, i);
          tAllGrid.appendChild(card);
        });
        updateTestimonialUI();
      }

      function updateTestimonialUI() {
        const slides = tTrack.querySelectorAll('.testimonial-slide');
        slides.forEach((s, i) => {
          s.setAttribute('aria-current', i === tCurrent ? 'step' : 'false');
        });
        const dots = tDots.querySelectorAll('button');
        dots.forEach((d, i) => {
          d.classList.toggle('is-active', i === tCurrent);
          d.setAttribute('aria-current', i === tCurrent ? 'step' : 'false');
        });
        const progress = ((tCurrent + 1) / totalSlides) * 100;
        tProgressFill.style.width = progress + '%';
        tProgressLabel.textContent = 'Benefit ' + (tCurrent + 1) + ' of ' + totalSlides;
        if (isPaused) {
          tPlaySvg.innerHTML = '<polygon points="5,3 19,12 5,21" />';
        } else {
          tPlaySvg.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        }
        tPlayToggle.setAttribute('aria-label', isPaused ? 'Resume auto-play' : 'Pause auto-play');
        tPlayToggle.title = isPaused ? 'Resume auto-advance' : 'Pause auto-advance';
      }

      function goToSlide(i) {
        tCurrent = i;
        tTrack.style.transform = 'translateX(-' + (tCurrent * 100) + '%)';
        updateTestimonialUI();
        resetBenefitAuto();
      }

      function nextSlide() { goToSlide((tCurrent + 1) % totalSlides); }
      function prevSlide() { goToSlide((tCurrent - 1 + totalSlides) % totalSlides); }

      function startBenefitAuto() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        if (!isPaused) {
          autoSlideInterval = setInterval(nextSlide, 5000);
        }
      }

      function resetBenefitAuto() {
        if (autoSlideInterval) {
          clearInterval(autoSlideInterval);
          startBenefitAuto();
        }
      }

      function toggleBenefitPlay() {
        isPaused = !isPaused;
        if (isPaused) {
          clearInterval(autoSlideInterval);
        } else {
          startBenefitAuto();
        }
        updateTestimonialUI();
      }

      prevBtn.addEventListener('click', prevSlide);
      nextBtn.addEventListener('click', nextSlide);
      tPlayToggle.addEventListener('click', toggleBenefitPlay);

      document.addEventListener('keydown', function(e) {
        const carousel = document.getElementById('testimonialCarousel');
        if (document.activeElement && carousel.contains(document.activeElement)) {
          if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
          else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggleBenefitPlay(); }
        }
      });

      const tCarousel = document.getElementById('testimonialCarousel');
      tCarousel.addEventListener('mouseenter', () => { if (!isPaused) { clearInterval(autoSlideInterval); } });
      tCarousel.addEventListener('mouseleave', () => { if (!isPaused) startBenefitAuto(); });
      tCarousel.addEventListener('focusin', () => { if (!isPaused) clearInterval(autoSlideInterval); });
      tCarousel.addEventListener('focusout', (e) => {
        if (!tCarousel.contains(e.relatedTarget) && !isPaused) startBenefitAuto();
      });

      // Pause when tab is hidden (improves performance)
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          if (autoSlideInterval) clearInterval(autoSlideInterval);
        } else {
          if (!isPaused) startBenefitAuto();
        }
      });

      tViewAllBtn.addEventListener('click', function() {
        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !expanded);
        tAllGrid.hidden = expanded;
        tViewAllIcon.textContent = expanded ? '▼' : '▲';
        if (!expanded) {
          tAllGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      let touchStartX = 0;
      let touchEndX = 0;
      tCarousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
      tCarousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) nextSlide(); else prevSlide();
        }
      }, { passive: true });

      const howCarousel = document.getElementById('howCarousel');

      function syncCarouselCardHeights() {
        howCarousel.style.height = '';
      }

      renderTestimonials();
      goToSlide(0);
      syncCarouselCardHeights();

      if (window.ResizeObserver) {
        const carouselHeightObserver = new ResizeObserver(syncCarouselCardHeights);
        carouselHeightObserver.observe(tCarousel);
      } else {
        window.addEventListener('resize', syncCarouselCardHeights);
      }

      startBenefitAuto();

      // ===== ENHANCED HOW IT WORKS =====
      const howSteps = [
        { icon: '✍️', title: 'Sign up', desc: 'Create your CloudBotServices account with your email and password. No credit card is required to get started.', takeaway: '✅ Your account is ready', time: '~1 minute', ctaLabel: 'Sign up', ctaHref: 'signup.html' },
        { icon: '🎁', title: 'Start your free trial', desc: 'Choose the 3-day free trial during signup and get access to the core toolkit before committing to a paid plan.', takeaway: '✅ 3 days to test the full experience', time: '~1 minute', ctaLabel: 'Start free trial', ctaHref: 'signup.html?plan=trial' },
        { icon: '🏢', title: 'Register your business', desc: 'Complete your business profile so your bot has the information it needs to answer customers accurately and represent your brand.', takeaway: '✅ Give your bot the right business context', time: '~3 minutes', ctaLabel: 'Business registration', ctaHref: 'business-registration-page.html' },
        { icon: '📊', title: 'Open your dashboard', desc: 'Use the dashboard as your control center for your bot, conversations, orders, settings, billing, and available analytics.', takeaway: '✅ Everything in one place', time: 'Instant', ctaLabel: 'Go to dashboard', ctaHref: 'dashboard.html' },
        { icon: '🔗', title: 'Connect your customer platforms', desc: 'Connect the channels your customers already use. Start with WhatsApp, Telegram, or Bubble-Webchat, then add future channels as they become available.', takeaway: '✅ Meet customers where they already are', time: '~2 minutes', ctaLabel: 'See supported platforms', ctaHref: '#platforms' },
        { icon: '▶️', title: 'Watch your bot in action', desc: 'Test the bot, review conversations, confirm your automated replies, and make adjustments before sending real customers through the experience.', takeaway: '✅ Test before you go live', time: '~2 minutes', ctaLabel: 'See the product demo', ctaHref: '#product-demo' },
        { icon: '💳', title: 'Choose a plan after your trial', desc: 'When the 3-day trial ends, choose the plan that fits your usage. Nothing should be charged automatically just because the trial ended; the account can pause until a paid plan is selected.', takeaway: '✅ Upgrade when you are ready', time: 'After trial', ctaLabel: 'View pricing', ctaHref: '#pricing' }
      ];

      const howTrack = document.getElementById('howTrack');
      const howDots = document.getElementById('howDots');
      const howPrev = document.getElementById('howPrev');
      const howNext = document.getElementById('howNext');
      const howPlayToggle = document.getElementById('howPlayToggle');
      const howPlaySvg = document.getElementById('howPlaySvg');
      const howProgressFill = document.getElementById('howProgressFill');
      const howProgressLabel = document.getElementById('howProgressLabel');
      const howViewAllBtn = document.getElementById('howViewAllBtn');
      const howViewAllIcon = document.getElementById('howViewAllIcon');
      const howAllSteps = document.getElementById('howAllSteps');
      const howAllGrid = document.getElementById('howAllGrid');

      let howCurrent = 0;
      const howTotal = howSteps.length;
      let howAutoInterval = null;
      let howPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function buildHowSlide(step, i) {
        const slide = document.createElement('div');
        slide.className = 'how-slide';
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-label', 'Step ' + (i + 1) + ' of ' + howTotal);
        slide.setAttribute('aria-current', i === howCurrent ? 'step' : 'false');
        slide.innerHTML = `
          <div class="step-badge">${i + 1}</div>
          <span class="step-icon" aria-hidden="true">${step.icon}</span>
          <div class="step-number">Step ${i + 1}</div>
          <h3>${step.title}</h3>
          <p>${step.desc}</p>
          ${step.takeaway ? `<div class="how-takeaway">${step.takeaway}</div>` : ''}
          <div class="how-time">⏱️ ${step.time}</div>
          ${step.ctaLabel && step.ctaHref ? `<a class="btn btn-ghost how-cta" href="${step.ctaHref}">${step.ctaLabel}</a>` : ''}
        `;
        return slide;
      }

      function buildHowAllCard(step, i) {
        const card = document.createElement('div');
        card.className = 'how-all-card';
        card.innerHTML = `
          <div class="how-all-number">Step ${i + 1}</div>
          <div class="how-all-icon" aria-hidden="true">${step.icon}</div>
          <h4>${step.title}</h4>
          <p>${step.desc}</p>
          ${step.takeaway ? `<div class="how-all-takeaway">${step.takeaway}</div>` : ''}
          <div class="how-all-time">⏱️ ${step.time}</div>
          ${step.ctaLabel && step.ctaHref ? `<a class="btn btn-ghost how-all-cta" href="${step.ctaHref}">${step.ctaLabel}</a>` : ''}
        `;
        return card;
      }

      function renderHow() {
        howTrack.innerHTML = '';
        howSteps.forEach((step, i) => {
          const slide = buildHowSlide(step, i);
          howTrack.appendChild(slide);
        });
        howDots.innerHTML = '';
        howSteps.forEach((_, i) => {
          const dot = document.createElement('button');
          dot.setAttribute('aria-label', 'Go to step ' + (i + 1));
          dot.setAttribute('aria-current', i === howCurrent ? 'step' : 'false');
          dot.addEventListener('click', () => goToHowSlide(i));
          howDots.appendChild(dot);
        });
        howAllGrid.innerHTML = '';
        howSteps.forEach((step, i) => {
          const card = buildHowAllCard(step, i);
          howAllGrid.appendChild(card);
        });
        updateHowUI();
      }

      function updateHowUI() {
        const slides = howTrack.querySelectorAll('.how-slide');
        slides.forEach((s, i) => {
          s.setAttribute('aria-current', i === howCurrent ? 'step' : 'false');
        });
        const dots = howDots.querySelectorAll('button');
        dots.forEach((d, i) => {
          d.classList.toggle('is-active', i === howCurrent);
          d.setAttribute('aria-current', i === howCurrent ? 'step' : 'false');
        });
        const progress = ((howCurrent + 1) / howTotal) * 100;
        howProgressFill.style.width = progress + '%';
        howProgressLabel.textContent = 'Step ' + (howCurrent + 1) + ' of ' + howTotal;
        if (howPaused) {
          howPlaySvg.innerHTML = '<polygon points="5,3 19,12 5,21" />';
        } else {
          howPlaySvg.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        }
        howPlayToggle.setAttribute('aria-label', howPaused ? 'Resume auto-play' : 'Pause auto-play');
        howPlayToggle.title = howPaused ? 'Resume auto-advance' : 'Pause auto-advance';
      }

      function goToHowSlide(i) {
        howCurrent = i;
        howTrack.style.transform = 'translateX(-' + (howCurrent * 100) + '%)';
        updateHowUI();
        resetHowAuto();
      }

      function nextHowSlide() { goToHowSlide((howCurrent + 1) % howTotal); }
      function prevHowSlide() { goToHowSlide((howCurrent - 1 + howTotal) % howTotal); }

      function startHowAuto() {
        if (howAutoInterval) clearInterval(howAutoInterval);
        if (!howPaused) {
          howAutoInterval = setInterval(nextHowSlide, 6000);
        }
      }

      function resetHowAuto() {
        if (howAutoInterval) {
          clearInterval(howAutoInterval);
          startHowAuto();
        }
      }

      function toggleHowPlay() {
        howPaused = !howPaused;
        if (howPaused) {
          clearInterval(howAutoInterval);
        } else {
          startHowAuto();
        }
        updateHowUI();
      }

      howPrev.addEventListener('click', prevHowSlide);
      howNext.addEventListener('click', nextHowSlide);
      howPlayToggle.addEventListener('click', toggleHowPlay);

      document.addEventListener('keydown', function(e) {
        const carousel = document.getElementById('howCarousel');
        if (document.activeElement && carousel.contains(document.activeElement)) {
          if (e.key === 'ArrowLeft') { e.preventDefault(); prevHowSlide(); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); nextHowSlide(); }
          else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggleHowPlay(); }
        }
      });

      howCarousel.addEventListener('mouseenter', () => { if (!howPaused) clearInterval(howAutoInterval); });
      howCarousel.addEventListener('mouseleave', () => { if (!howPaused) startHowAuto(); });
      howCarousel.addEventListener('focusin', () => { if (!howPaused) clearInterval(howAutoInterval); });
      howCarousel.addEventListener('focusout', (e) => {
        if (!howCarousel.contains(e.relatedTarget) && !howPaused) startHowAuto();
      });

      // Pause when tab is hidden
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          if (howAutoInterval) clearInterval(howAutoInterval);
        } else {
          if (!howPaused) startHowAuto();
        }
      });

      howViewAllBtn.addEventListener('click', function() {
        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !expanded);
        howAllSteps.hidden = expanded;
        howViewAllIcon.textContent = expanded ? '▼' : '▲';
        if (!expanded) {
          howAllSteps.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      let howTouchStartX = 0;
      let howTouchEndX = 0;
      howCarousel.addEventListener('touchstart', (e) => { howTouchStartX = e.changedTouches[0].screenX; }, { passive: true });
      howCarousel.addEventListener('touchend', (e) => {
        howTouchEndX = e.changedTouches[0].screenX;
        const diff = howTouchStartX - howTouchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) nextHowSlide(); else prevHowSlide();
        }
      }, { passive: true });

      renderHow();
      goToHowSlide(0);
      syncCarouselCardHeights();
      startHowAuto();

// ----- FADE SECTIONS -----
const fadeSections = document.querySelectorAll('.fade-section');
function makeAllVisible() {
  fadeSections.forEach(el => el.classList.add('is-visible'));
}

if ('IntersectionObserver' in window) {
  const fadeObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  fadeSections.forEach(function(el) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-visible');
    } else {
      fadeObserver.observe(el);
    }
  });
  // Fallback: after 2 seconds, show any still-hidden sections
  setTimeout(function() {
    fadeSections.forEach(el => {
      if (!el.classList.contains('is-visible')) {
        el.classList.add('is-visible');
      }
    });
  }, 2000);
} else {
  makeAllVisible();
}

      // ----- PRICING FEATURE TOGGLE -----
      document.querySelectorAll('.show-all-btn').forEach(function(btn) {
        const targetId = btn.getAttribute('data-target');
        const list = document.getElementById(targetId);
        const hiddenItems = list.querySelectorAll('.hidden-feature');
        let isExpanded = false;
        btn.addEventListener('click', function() {
          isExpanded = !isExpanded;
          hiddenItems.forEach(function(item) {
            item.classList.toggle('show', isExpanded);
          });
          btn.classList.toggle('is-expanded', isExpanded);
          btn.innerHTML = isExpanded ?
            'Show less <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' :
            'See all features <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
          if (isExpanded) {
            const firstHidden = list.querySelector('.hidden-feature.show');
            if (firstHidden) {
              firstHidden.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        });
      });

      // ----- LINKS ACCORDION (DYNAMIC HEIGHT, MOBILE ONLY) -----
      const accordionMedia = window.matchMedia('(max-width: 520px)');
      const accordionColumns = Array.from(document.querySelectorAll('[data-accordion]'));

      function syncLinkAccordions() {
        accordionColumns.forEach(function(col) {
          const btn = col.querySelector('.links-accordion-btn');
          const wrapper = col.querySelector('.links-wrapper');
          if (!btn || !wrapper) return;
          if (!accordionMedia.matches) {
            btn.setAttribute('aria-expanded', 'false');
            wrapper.classList.remove('is-open');
            wrapper.style.maxHeight = '';
          } else {
            wrapper.style.maxHeight = wrapper.classList.contains('is-open') ? wrapper.scrollHeight + 'px' : '0px';
          }
        });
      }

      accordionColumns.forEach(function(col) {
        const btn = col.querySelector('.links-accordion-btn');
        const wrapper = col.querySelector('.links-wrapper');
        if (!btn || !wrapper) return;

        function setHeight() {
          if (accordionMedia.matches) {
            wrapper.style.maxHeight = wrapper.classList.contains('is-open') ? wrapper.scrollHeight + 'px' : '0px';
          } else {
            wrapper.style.maxHeight = '';
          }
        }

        btn.addEventListener('click', function() {
          if (!accordionMedia.matches) return;
          const isOpen = btn.getAttribute('aria-expanded') === 'true';
          document.querySelectorAll('[data-accordion]').forEach(function(other) {
            if (other !== col) {
              const otherBtn = other.querySelector('.links-accordion-btn');
              const otherWrapper = other.querySelector('.links-wrapper');
              if (otherBtn && otherWrapper) {
                otherBtn.setAttribute('aria-expanded', 'false');
                otherWrapper.classList.remove('is-open');
                otherWrapper.style.maxHeight = '0px';
              }
            }
          });
          btn.setAttribute('aria-expanded', String(!isOpen));
          wrapper.classList.toggle('is-open', !isOpen);
          setHeight();
        });

        window.addEventListener('resize', setHeight);
      });

      accordionMedia.addEventListener('change', syncLinkAccordions);
      syncLinkAccordions();

      // ----- PAYG EXPAND (DYNAMIC HEIGHT) -----
      (function() {
        const toggleBtn = document.getElementById('paygToggleBtn');
        const expandWrap = document.getElementById('paygExpandWrap');
        const toggleLabel = document.getElementById('paygToggleLabel');
        const arrowIcon = document.getElementById('paygArrowIcon');
        const paygCard = document.getElementById('paygCard');
        let expanded = false;

        function updatePaygHeight() {
          expandWrap.style.maxHeight = expanded ? expandWrap.scrollHeight + 'px' : '0px';
        }

        function updatePaygUI(expand) {
          expanded = expand;
          expandWrap.classList.toggle('open', expanded);
          paygCard.classList.toggle('payg-expanded', expanded);
          toggleBtn.setAttribute('aria-expanded', String(expanded));
          toggleLabel.textContent = expanded ? 'Hide details' : 'See pay‑as‑you‑go pricing';
          arrowIcon.classList.toggle('open', expanded);
          arrowIcon.textContent = expanded ? '↑' : '→';
          requestAnimationFrame(updatePaygHeight);
        }

        toggleBtn.addEventListener('click', function(e) {
          e.preventDefault();
          updatePaygUI(!expanded);
        });
        toggleBtn.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && expanded) {
            updatePaygUI(false);
            toggleBtn.focus();
          }
        });
        window.addEventListener('resize', updatePaygHeight);
        updatePaygUI(false);
      })();

      // ----- FINAL INITIALIZATION (with retries) -----
      await Promise.allSettled([
        refreshAuthUI(),
        detectCurrency()
      ]);

        })(); // end CBS initialization IIFE
      };

      // Startup
      Promise.resolve()
        .then(() => initialize())
        .catch((error) => {
          console.error('CloudBotServices initialization failed:', error);
        })
        .finally(async () => {
          const loader = document.getElementById('pageLoader');
          const finishLoading = () => {
            document.body.classList.remove('page-loading');
            if (loader) {
              loader.classList.add('is-hidden');
              window.setTimeout(() => loader.remove(), 450);
            }
          };

          try {
            await Promise.allSettled([
              document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
            ]);
          } finally {
            finishLoading();
          }
        });

      // Clear intervals on page unload
      window.addEventListener('beforeunload', function() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        if (howAutoInterval) clearInterval(howAutoInterval);
      });

    })();