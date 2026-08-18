(function scheduleNonCriticalInit() {
      const initialize = function() {
        (function() {
          "use strict";

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
      setTheme(html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
      themeBtn.addEventListener('click', function() {
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
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = progress + '%';
      });

      // ----- STICKY CTA -----
      const stickyCta = document.getElementById('stickyCta');
      let lastScrollY = 0;
      window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero').offsetHeight;
        if (currentScrollY > heroHeight - 100) {
          stickyCta.classList.add('visible');
        } else {
          stickyCta.classList.remove('visible');
        }
        lastScrollY = currentScrollY;
      });

      // ----- CURRENCY DETECTION -----
      const defaultCurrency = { currency: 'USD', symbol: '$', rate: 1, locale: 'en-US' };
      const currencySymbols = {
        USD: '$', EUR: '€', GBP: '£', NGN: '₦', CAD: 'C$', AUD: 'A$', JPY: '¥', INR: '₹',
        BRL: 'R$', ZAR: 'R', GHS: '₵', KES: 'KSh', UGX: 'USh', TZS: 'TSh', XOF: 'CFA', XAF: 'FCFA',
        CHF: 'CHF', CNY: '¥', HKD: 'HK$', SGD: 'S$', AED: 'د.إ', SAR: '﷼', QAR: '﷼', NGN: '₦'
      };
      const countryCurrencies = { NG: 'NGN', US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD', IE: 'EUR', DE: 'EUR',
        FR: 'EUR', ES: 'EUR', IT: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', CH: 'CHF', IN: 'INR', JP: 'JPY',
        CN: 'CNY', HK: 'HKD', SG: 'SGD', AE: 'AED', SA: 'SAR', QA: 'QAR', BR: 'BRL', ZA: 'ZAR', GH: 'GHS', KE: 'KES',
        UG: 'UGX', TZ: 'TZS', SN: 'XOF', CI: 'XOF', CM: 'XAF' };
      let detectedCurrency = defaultCurrency;
      let selectedBillingPeriod = 'monthly';

      function getCurrencySymbol(code, locale) {
        if (currencySymbols[code]) return currencySymbols[code];
        try {
          const parts = new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
          const symbolPart = parts.find(part => part.type === 'currency');
          if (symbolPart && symbolPart.value) return symbolPart.value;
        } catch (e) {}
        return code || '$';
      }

      function getBrowserCurrency() {
        try {
          const locale = navigator.language || 'en-US';
          const regionMatch = locale.match(/[-_]([A-Z]{2})$/i);
          const region = regionMatch ? regionMatch[1].toUpperCase() : '';
          const code = countryCurrencies[region] || 'USD';
          return { currency: code, symbol: getCurrencySymbol(code, locale), rate: 1, locale };
        } catch (e) {
          return defaultCurrency;
        }
      }

      function formatAmount(amount, symbol) {
        if (amount >= 1000) return symbol + Math.round(amount).toLocaleString();
        if (amount >= 1) return symbol + amount.toFixed(2);
        return symbol + amount.toFixed(4);
      }

      function applyCurrency(info) {
        const safeRate = Number(info && info.rate);
        detectedCurrency = {
          currency: (info && info.currency) || 'USD',
          symbol: (info && info.symbol) || '$',
          rate: Number.isFinite(safeRate) && safeRate > 0 ? safeRate : 1,
          locale: (info && info.locale) || navigator.language || 'en-US'
        };
        setBilling(selectedBillingPeriod, detectedCurrency.symbol, detectedCurrency.rate);
        const paygEl = document.getElementById('paygPrice');
        if (paygEl) paygEl.textContent = formatAmount(0.01 * detectedCurrency.rate, detectedCurrency.symbol) + ' per conversation';
        document.querySelectorAll('.payg-expand-content .rate').forEach(function(el) {
          el.textContent = formatAmount(0.01 * detectedCurrency.rate, detectedCurrency.symbol) + ' per conversation';
        });
        document.querySelectorAll('.payg-expand-content .examples').forEach(function(el) {
          const rate = 0.01 * detectedCurrency.rate;
          el.textContent = '100 conv. = ' + formatAmount(rate * 100, detectedCurrency.symbol) + '  ·  1,000 conv. = ' + formatAmount(rate * 1000, detectedCurrency.symbol);
        });
      }

      async function loadPricingFromBackend() {
        const browserCurrency = getBrowserCurrency();
        const fallback = { ...browserCurrency, rate: 1 };
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            const locale = encodeURIComponent(browserCurrency.locale || 'en-US');
            const response = await fetch('/api/pricing?locale=' + locale, {
              method: 'GET',
              credentials: 'same-origin',
              cache: 'no-store',
              headers: { Accept: 'application/json' },
              signal: controller.signal
            });
            if (!response.ok) throw new Error('Pricing API HTTP ' + response.status);
            const data = await response.json();
            const code = String(data.currency || browserCurrency.currency || 'USD').toUpperCase();
            const localeValue = data.locale || browserCurrency.locale;
            const symbol = data.symbol || getCurrencySymbol(code, localeValue);
            const rate = Number(data.rate);
            if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid pricing rate');
            applyCurrency({ currency: code, symbol, rate, locale: localeValue });
          } finally {
            clearTimeout(timeout);
          }
        } catch (error) {
          console.warn('Pricing API unavailable; using USD-safe fallback.', error);
          applyCurrency({ ...fallback, currency: 'USD', symbol: '$', rate: 1 });
        }
      }

      // ----- AUTH UI -----
      let currentAuthState = 'guest';
      async function getAuthState() {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            const response = await fetch('/api/session', { credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
            if (!response.ok) return 'guest';
            const data = await response.json();
            if (data && data.authenticated === true) return data.state || (data.user && data.user.state) || 'active';
            return 'guest';
          } finally { clearTimeout(timeout); }
        } catch (e) { return 'guest'; }
      }

      function renderAuthUI(state) {
        const authActions = document.getElementById('authActions');
        const heroCta = document.getElementById('heroCta');
        const finalCta = document.getElementById('finalCta');
        const pricingButtons = document.querySelectorAll('[data-plan]');
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
          authActions.innerHTML = '<div class="user-menu"><button class="user-chip" id="userChip" aria-expanded="false" aria-haspopup="true"><span class="avatar">CB</span>Dashboard<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button><div id="userDropdown" class="user-dropdown" hidden><a href="#" class="user-dropdown-link">Account settings</a><a href="#" class="user-dropdown-link">Billing & plan</a><div class="user-dropdown-divider"></div><button id="logoutBtn" class="user-dropdown-btn">Log out</button></div></div>';
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
              document.getElementById('logoutBtn').addEventListener('click', function() {
                fetch('/api/logout', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' } })
                  .catch(function(error) { console.warn('Logout request failed:', error); })
                  .finally(function() { currentAuthState = 'guest'; renderAuthUI('guest'); });
              });
            }
          }, 0);
        }
      }
      getAuthState().then(function(state) { currentAuthState = state; renderAuthUI(state); });

      // ----- BILLING -----
      const billMonthly = document.getElementById('billMonthly');
      const billYearly = document.getElementById('billYearly');
      const priceCards = document.querySelectorAll('.price-card[data-monthly]');

      function setBilling(period, symbol, rate) {
        selectedBillingPeriod = period === 'yearly' ? 'yearly' : 'monthly';
        const isYearly = period === 'yearly';
        billMonthly.classList.toggle('is-active', !isYearly);
        billYearly.classList.toggle('is-active', isYearly);
        billMonthly.setAttribute('aria-selected', String(!isYearly));
        billYearly.setAttribute('aria-selected', String(isYearly));
        priceCards.forEach(function(card) {
          const monthlyUSD = Number(card.dataset.monthly);
          const monthly = monthlyUSD * rate;
          const oldFigure = card.querySelector('.amount-old');
          const figure = card.querySelector('.amount-figure');
          const suffix = card.querySelector('.amount-suffix');
          const note = card.querySelector('.amount-note');
          if (isYearly) {
            const yearlyTotal = monthly * 12;
            const savings = yearlyTotal * 0.2;
            const finalYearly = yearlyTotal - savings;
            const effectiveMonthly = finalYearly / 12;
            oldFigure.textContent = formatAmount(monthly, symbol);
            oldFigure.hidden = false;
            figure.textContent = formatAmount(effectiveMonthly, symbol);
            suffix.textContent = '/month';
            note.textContent = 'Billed ' + formatAmount(finalYearly, symbol) + '/year · Save ' + formatAmount(savings, symbol);
          } else {
            oldFigure.hidden = true;
            figure.textContent = formatAmount(monthly, symbol);
            suffix.textContent = '/month';
            note.innerHTML = '&nbsp;';
          }
        });
      }

      billMonthly.addEventListener('click', function() { setBilling('monthly', detectedCurrency.symbol, detectedCurrency.rate); });
      billYearly.addEventListener('click', function() { setBilling('yearly', detectedCurrency.symbol, detectedCurrency.rate); });

      // Render pricing immediately with a safe USD fallback, then enhance it from the backend.
      applyCurrency(defaultCurrency);
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadPricingFromBackend, { timeout: 2500 });
      } else {
        setTimeout(loadPricingFromBackend, 0);
      }

      // ===== BUSINESS BENEFITS CAROUSEL (CENTERED DOTS, VIEW ALL BOTTOM-RIGHT) =====
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
      let isPaused = false;

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

      // Keep the tutorial card exactly the same height as the business-benefit card.
      // The business-benefit card is the source of truth so the two carousel cards
      // stay aligned even when a testimonial wraps differently.
      function syncCarouselCardHeights() {
        const testimonialHeight = tCarousel.getBoundingClientRect().height;
        if (testimonialHeight > 0) {
          howCarousel.style.height = testimonialHeight + 'px';
        }
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

      // ===== ENHANCED HOW IT WORKS (COMPACT, CENTERED DOTS, VIEW ALL BOTTOM-RIGHT) =====
      const howSteps = [
        { icon: '🔌', title: 'Connect your channels', desc: 'Connect WhatsApp, Facebook, Instagram, Telegram, or add a web chat bubble to your website in one click — no coding required.', takeaway: '✅ Customers can reach you anywhere', time: '~2 minutes', cta: false },
        { icon: '🤖', title: 'Build your bot', desc: 'Set up automated replies for FAQs, order taking, and payment links using our simple drag‑and‑drop builder.', takeaway: '✅ No code, just choices', time: '~5 minutes', cta: false },
        { icon: '🚀', title: 'Go live', desc: 'Activate your bot — it starts responding to customers instantly, 24/7, so you never miss a conversation.', takeaway: '✅ Never miss a lead', time: '~1 minute', cta: false },
        { icon: '📊', title: 'Monitor & optimize', desc: 'View analytics, see what questions customers ask, and fine‑tune your bot to improve conversions over time.', takeaway: '✅ Data-driven improvements', time: 'Ongoing' }
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
      let howPaused = false;

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
      } else {
        fadeSections.forEach(function(el) { el.classList.add('is-visible'); });
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

      // Cookie preference is intentionally backend-managed; no client-side persistence is used.
      const cookieConsent = document.getElementById('cookieConsent');
      const acceptBtn = document.getElementById('acceptCookies');
      const declineBtn = document.getElementById('declineCookies');
      if (cookieConsent) cookieConsent.classList.remove('show');
      if (acceptBtn) acceptBtn.addEventListener('click', function() { cookieConsent.classList.add('hidden'); });
      if (declineBtn) declineBtn.addEventListener('click', function() { cookieConsent.classList.add('hidden'); });

        })(); // end CBS initialization IIFE
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(initialize, { timeout: 2000 });
      } else {
        setTimeout(initialize, 0);
      }
    })(); // end scheduler
/* ===== BACKEND API INTEGRATION ===== */
(function initBackendIntegration() {
  'use strict';

  const pending = new WeakSet();

  async function apiRequest(url, data, options) {
    const opts = options || {};
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 10000);
    const headers = {
      Accept: 'application/json',
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {})
    };

    try {
      const response = await fetch(url, {
        method: opts.method || (data ? 'POST' : 'GET'),
        credentials: 'same-origin',
        cache: 'no-store',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : await response.text().catch(() => '');

      if (!response.ok) {
        const error = new Error('API request failed with HTTP ' + response.status);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }

      return payload;
    } finally {
      clearTimeout(timeout);
    }
  }

  function getPlan(el) {
    if (el.dataset.plan) return el.dataset.plan.toLowerCase();
    try {
      const url = new URL(el.getAttribute('href') || '', window.location.origin);
      return (url.searchParams.get('plan') || 'trial').toLowerCase();
    } catch (e) {
      return 'trial';
    }
  }

  async function handlePlan(event) {
    const el = event.currentTarget;
    if (pending.has(el)) {
      event.preventDefault();
      return;
    }

    const isCheckout = el.hasAttribute('data-api-checkout');
    const endpoint = isCheckout ? el.getAttribute('data-api-checkout') : el.getAttribute('data-api-signup');
    if (!endpoint) return;

    // Authenticated users should use the server-selected account flow.
    if (!isCheckout && typeof window.currentAuthState !== 'undefined' && window.currentAuthState !== 'guest') {
      return;
    }

    event.preventDefault();
    pending.add(el);
    const plan = getPlan(el);
    const originalText = el.textContent;
    el.textContent = 'Processing…';
    el.setAttribute('aria-busy', 'true');
    el.setAttribute('aria-disabled', 'true');

    try {
      const response = await apiRequest(endpoint, { plan }, { method: 'POST', timeoutMs: 10000 });
      if (response && typeof response.redirect === 'string') {
        const redirect = new URL(response.redirect, window.location.origin);
        if (redirect.origin !== window.location.origin) throw new Error('Unsafe redirect returned by backend.');
        window.location.assign(redirect.href);
        return;
      }

      const target = isCheckout ? 'checkout.html' : 'signup.html';
      const url = new URL(target, window.location.origin);
      url.searchParams.set('plan', plan);
      window.location.assign(url.href);
    } catch (error) {
      console.error('Backend request failed:', error);
      const payload = error && error.payload;
      const message = payload && typeof payload === 'object' && payload.message
        ? payload.message
        : 'We could not complete that request right now. Please try again.';
      window.alert(message);
    } finally {
      pending.delete(el);
      el.textContent = originalText;
      el.removeAttribute('aria-busy');
      el.removeAttribute('aria-disabled');
    }
  }

  function attach() {
    document.querySelectorAll('[data-api-signup], [data-api-checkout]').forEach(function (el) {
      el.addEventListener('click', handlePlan);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach, { once: true });
  } else {
    attach();
  }
})();
