


  try {
    var savedTheme = localStorage.getItem('cbs-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch (e) {}

document.addEventListener('DOMContentLoaded', function () {

(function() {
  'use strict';

  // DOM refs
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeToggleFloating');
  const themeLabel = document.getElementById('themeLabel');
  const sunIcon = themeBtn.querySelector('.ftt-sun');
  const moonIcon = themeBtn.querySelector('.ftt-moon');

  const planSwitcher = document.getElementById('planSwitcher');
  const billingToggle = document.getElementById('billingToggle');
  const planNameEl = document.getElementById('planName');
  const priceAnim = document.getElementById('priceAnim');
  const featuresList = document.getElementById('planFeatures');
  const successPlan = document.getElementById('successPlan');
  const stepConnector2 = document.getElementById('stepConnector2');

  const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
  const cardRadioCard = document.getElementById('cardRadioCard');
  const bankRadioCard = document.getElementById('bankRadioCard');
  const ussdRadioCard = document.getElementById('ussdRadioCard');
  const salesMessage = document.getElementById('salesMessage');

  const cardFields = document.getElementById('cardFields');
  const bankFields = document.getElementById('bankFields');
  const ussdFields = document.getElementById('ussdFields');
  const allPaymentSections = document.querySelectorAll('.payment-section');
  const form = document.getElementById('checkoutForm');
  const payBtn = document.getElementById('payBtn');
  const successOverlay = document.getElementById('successOverlay');
  const goToDashboard = document.getElementById('goToDashboard');
  const changePlanLink = document.getElementById('changePlanLink');

  const hiddenPlan = document.getElementById('hiddenPlan');
  const hiddenPeriod = document.getElementById('hiddenPeriod');
  const hiddenMethod = document.getElementById('hiddenMethod');

  // State
  const state = {
    plan: 'growth',
    period: 'monthly',
    method: 'card'
  };

  // ---------- Plan Data ----------
  const plans = {
    starter: { name: 'Starter', price: 19, features: ['1 bot', '1,000 conversations/month', '50 offerings', 'Payment links', 'Basic analytics', 'Email support'] },
    growth: { name: 'Growth', price: 49, features: ['Up to 3 bots', '5,000 conversations/month', '250 offerings', 'Advanced automation', 'Full analytics dashboard', 'Priority email support', 'Custom branding'] },
    business: { name: 'Business', price: 99, features: ['Up to 10 bots', '20,000 conversations/month', 'Unlimited offerings', 'Advanced automation', 'Full analytics', 'Priority support (chat & email)', 'Custom branding', 'Team roles', 'Bulk messaging', 'Dedicated account manager'] },
    payg: { name: 'Pay As You Go', price: 0.02, features: ['$0.02 per conversation', 'No monthly commitment', 'Cancel anytime', 'Full toolkit included', '100 conv. = $2.00', '1,000 conv. = $20.00', 'Flexible usage'], isPayg: true },
    enterprise: { name: 'Enterprise', price: null, features: ['Unlimited bots', 'Dedicated support', 'Custom integrations', 'Team collaboration', 'Advanced security', 'Priority onboarding', 'Tailored pricing'], isEnterprise: true }
  };

  // ---------- Theme ----------
  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    themeLabel.textContent = isDark ? 'Dark' : 'Light';
    sunIcon.style.opacity = isDark ? '0' : '1';
    moonIcon.style.opacity = isDark ? '1' : '0';
    themeBtn.setAttribute('aria-label', `Toggle theme, currently ${theme}`);
    themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    try { localStorage.setItem('cbs-theme', theme); } catch (e) { /* ignore */ }
  }

  const saved = (function() { try { return localStorage.getItem('cbs-theme'); } catch(e) { return null; } })();
  setTheme(saved === 'dark' ? 'dark' : 'light');

  themeBtn.addEventListener('click', function() {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
  themeBtn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); themeBtn.click(); }
  });

  // ---------- Helpers ----------
  function animatePriceChange(newHTML) {
    priceAnim.style.transform = 'translateY(-20px)';
    priceAnim.style.opacity = '0';
    setTimeout(() => {
      priceAnim.innerHTML = newHTML;
      priceAnim.style.transform = 'translateY(20px)';
      setTimeout(() => {
        priceAnim.style.transform = 'translateY(0)';
        priceAnim.style.opacity = '1';
      }, 30);
    }, 350);
  }

  function luhnCheck(value) {
    let sum = 0, alternate = false;
    for (let i = value.length - 1; i >= 0; i--) {
      let n = parseInt(value.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }

  function isValidExpiry(exp) {
    const parts = exp.split('/');
    if (parts.length !== 2) return false;
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    if (year < 0 || year > 99) return false;
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    return true;
  }

  // ---------- CORRECTED: Update Payment UI based on plan ----------
  function updatePaymentUIVisibility() {
    const plan = plans[state.plan];

    // 1. PAYG: Only Card
    if (plan.isPayg) {
      bankRadioCard.classList.add('hidden');
      ussdRadioCard.classList.add('hidden');
      cardRadioCard.classList.remove('hidden');
      salesMessage.classList.remove('visible');

      document.getElementById('pmCard').checked = true;
      state.method = 'card';
      hiddenMethod.value = 'card';
      showPaymentSection(cardFields);
      setRequiredFields('card');

      payBtn.style.display = 'flex';
      document.querySelector('.secure-note').style.display = 'flex';
      return;
    }

    // 2. Enterprise: No payment options, sales message
    if (plan.isEnterprise) {
      cardRadioCard.classList.add('hidden');
      bankRadioCard.classList.add('hidden');
      ussdRadioCard.classList.add('hidden');
      salesMessage.classList.add('visible');

      allPaymentSections.forEach(sec => {
        sec.classList.remove('expanded');
        sec.classList.add('collapsed');
        sec.style.maxHeight = '0';
      });

      payBtn.style.display = 'none';
      document.querySelector('.secure-note').style.display = 'none';
      return;
    }

    // 3. Normal plans: Show all radios, restore button, show correct section
    cardRadioCard.classList.remove('hidden');
    bankRadioCard.classList.remove('hidden');
    ussdRadioCard.classList.remove('hidden');
    salesMessage.classList.remove('visible');

    payBtn.style.display = 'flex';
    document.querySelector('.secure-note').style.display = 'flex';

    // Expand the correct section based on current method
    if (state.method === 'card') showPaymentSection(cardFields);
    else if (state.method === 'bank') showPaymentSection(bankFields);
    else if (state.method === 'ussd') showPaymentSection(ussdFields);
    setRequiredFields(state.method);
    hiddenMethod.value = state.method;

    // Ensure the correct radio is checked
    const radioId = `pm${state.method.charAt(0).toUpperCase() + state.method.slice(1)}`;
    const radio = document.getElementById(radioId);
    if (radio) radio.checked = true;
  }

  // ---------- Update UI ----------
  function updatePlanDisplay() {
    const plan = plans[state.plan];
    planNameEl.textContent = plan.name;

    // Billing toggle
    if (plan.isPayg || plan.isEnterprise) {
      billingToggle.style.display = 'none';
    } else {
      billingToggle.style.display = 'flex';
      document.querySelectorAll('#billingToggle .billing-tab').forEach(tab => {
        tab.classList.toggle('is-active', tab.dataset.period === state.period);
      });
    }

    // Price
    if (plan.isPayg) {
      animatePriceChange('<span class="plan-price">$0.02 <span>/ conversation</span></span>');
    } else if (plan.isEnterprise) {
      animatePriceChange('<span class="plan-price" style="font-size:1.5rem;">Let\'s talk</span><p style="font-size:0.9rem;color:var(--sub);margin-top:4px;">Custom pricing for your team</p>');
    } else {
      const price = state.period === 'yearly' ? (plan.price * 12 * 0.8 / 12).toFixed(2) : plan.price;
      let html = `$${price}<span>/month</span>`;
      if (state.period === 'yearly') {
        html += ` <span class="yearly-note">Billed $${(plan.price * 12 * 0.8).toFixed(0)}/year</span>`;
      }
      animatePriceChange(html);
    }

    successPlan.textContent = plan.name;
    hiddenPlan.value = state.plan;
    hiddenPeriod.value = state.period;

    // Features
    featuresList.innerHTML = plan.features.map(f => `<li>${f}</li>`).join('');
    const items = featuresList.querySelectorAll('li');
    items.forEach((item, i) => {
      setTimeout(() => item.classList.add('animate-in'), i * 60);
    });

    // Update payment visibility
    updatePaymentUIVisibility();

    // Update button text
    if (plan.isPayg) {
      payBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Pay as you go`;
    } else if (!plan.isEnterprise) {
      payBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Pay & Subscribe`;
    }
  }

  // ---------- Plan switcher ----------
  planSwitcher.querySelectorAll('.plan-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      planSwitcher.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('is-active'));
      this.classList.add('is-active');
      state.plan = this.dataset.plan;
      updatePlanDisplay();
      document.getElementById('planCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // ---------- Billing toggle ----------
  billingToggle.querySelectorAll('.billing-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const plan = plans[state.plan];
      if (plan.isPayg || plan.isEnterprise) return;
      billingToggle.querySelectorAll('.billing-tab').forEach(t => t.classList.remove('is-active'));
      this.classList.add('is-active');
      state.period = this.dataset.period;
      updatePlanDisplay();
    });
  });

  // ---------- Payment method switcher ----------
  function setRequiredFields(method) {
    const cardReq = method === 'card';
    document.getElementById('cardName').required = cardReq;
    document.getElementById('cardNumber').required = cardReq;
    document.getElementById('expiry').required = cardReq;
    document.getElementById('cvc').required = cardReq;

    const bankReq = method === 'bank';
    document.getElementById('bankName').required = bankReq;
    document.getElementById('accountNumber').required = bankReq;

    const ussdReq = method === 'ussd';
    document.getElementById('ussdBank').required = ussdReq;
  }

  function showPaymentSection(section) {
    allPaymentSections.forEach(sec => {
      if (sec === section) {
        sec.classList.remove('collapsed');
        sec.classList.add('expanded');
        setTimeout(() => { sec.style.maxHeight = 'none'; }, 500);
      } else {
        sec.classList.remove('expanded');
        sec.classList.add('collapsed');
        sec.style.maxHeight = '0';
      }
    });
  }

  paymentMethods.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        state.method = this.value;
        hiddenMethod.value = state.method;
        if (state.method === 'card') showPaymentSection(cardFields);
        else if (state.method === 'bank') showPaymentSection(bankFields);
        else if (state.method === 'ussd') showPaymentSection(ussdFields);
        setRequiredFields(state.method);
        document.querySelectorAll('.error').forEach(el => el.style.display = 'none');
      }
    });
  });

  // Initialise
  showPaymentSection(cardFields);
  setRequiredFields('card');

  // ---------- Card formatting ----------
  document.getElementById('cardNumber').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim();
  });
  document.getElementById('expiry').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '').replace(/(.{2})/, '$1/').slice(0, 5);
  });
  document.getElementById('cvc').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
  });

  // ---------- Confetti ----------
  function spawnConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#2E64F0', '#4C7EFF', '#1E8F63', '#F2F6FC', '#5B8DFF', '#3FBE8C'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      piece.style.width = (Math.random() * 8 + 6) + 'px';
      piece.style.height = (Math.random() * 8 + 6) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(piece);
      setTimeout(() => { if (piece.parentNode) piece.parentNode.removeChild(piece); }, 1800);
    }
  }

  // ---------- Form submission ----------
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Enterprise: do nothing (sales message handles it)
    if (plans[state.plan].isEnterprise) {
      return;
    }

    const method = state.method;
    let valid = true;

    document.querySelectorAll('.error').forEach(el => el.style.display = 'none');

    if (method === 'card') {
      const cardName = document.getElementById('cardName');
      if (!cardName.value.trim()) {
        document.getElementById('cardNameError').style.display = 'block';
        valid = false;
      }
      const cn = document.getElementById('cardNumber').value.replace(/\s/g, '');
      if (cn.length < 13 || cn.length > 19 || !luhnCheck(cn)) {
        document.getElementById('cardNumberError').style.display = 'block';
        valid = false;
      }
      const exp = document.getElementById('expiry').value;
      if (!isValidExpiry(exp)) {
        document.getElementById('expiryError').style.display = 'block';
        valid = false;
      }
      const cvc = document.getElementById('cvc').value;
      if (cvc.length < 3 || cvc.length > 4 || !/^\d+$/.test(cvc)) {
        document.getElementById('cvcError').style.display = 'block';
        valid = false;
      }
    } else if (method === 'bank') {
      const bank = document.getElementById('bankName');
      if (!bank.value) {
        document.getElementById('bankNameError').style.display = 'block';
        valid = false;
      }
      const acc = document.getElementById('accountNumber').value.replace(/\s/g, '');
      if (!/^\d{10}$/.test(acc)) {
        document.getElementById('accountNumberError').style.display = 'block';
        valid = false;
      }
    } else if (method === 'ussd') {
      const ussdBank = document.getElementById('ussdBank');
      if (!ussdBank.value) {
        document.getElementById('ussdBankError').style.display = 'block';
        valid = false;
      }
    }

    if (!valid) {
      const firstError = document.querySelector('.error[style*="display: block"]');
      if (firstError) {
        const field = firstError.closest('.field')?.querySelector('input, select');
        if (field) field.focus();
      }
      return;
    }

    payBtn.disabled = true;
    const originalHTML = payBtn.innerHTML;
    payBtn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;"></span> Processing…';

    setTimeout(() => {
      payBtn.disabled = false;
      payBtn.innerHTML = originalHTML;
      successOverlay.classList.add('is-visible');
      successOverlay.setAttribute('aria-hidden', 'false');
      stepConnector2.classList.add('done');
      spawnConfetti();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      goToDashboard.focus();
    }, 2200);
  });

  // ---------- Overlay dismiss ----------
  function dismissOverlay() {
    successOverlay.classList.remove('is-visible');
    successOverlay.setAttribute('aria-hidden', 'true');
    payBtn.focus();
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') dismissOverlay();
  });
  successOverlay.addEventListener('click', function(e) {
    if (e.target === successOverlay) dismissOverlay();
  });

  // ---------- Change plan link ----------
  changePlanLink.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('planCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
    const firstTab = planSwitcher.querySelector('.plan-tab');
    if (firstTab) firstTab.focus();
  });

  // ---------- Scroll entrance animation ----------
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.card').forEach(card => observer.observe(card));

  // Initial display
  updatePlanDisplay();
})();
});
