import { DataService, State } from "../../js/state.js";
import { navigate } from "../../js/router.js";
import { escapeHTML, showToast } from "../../js/components/modals.js";

let revenueChart = null;
let currentRange = 'week';
let feedFilter = 'all';

function formatCurrency(amount) {
  return `₦${amount.toLocaleString()}`;
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning 🌅';
  if (hour < 17) return 'Good Afternoon ☀️';
  return 'Good Evening 🌙';
}

function animateCounter(element, target, prefix = '', suffix = '', duration = 800) {
  if (!element) return;
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(progress * target);
    element.textContent = prefix + current + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = prefix + target + suffix;
    }
  };
  requestAnimationFrame(update);
}

function renderKPIs(business) {
  const customers = business.customers || 0;
  const conversations = business.conversations || 0;
  const orders = business.orders || 0;
  const revenue = business.revenue || 0;
  const automation = business.automationRate || 0;

  const trends = {
    customers: { val: 12.4, dir: 'up' },
    conversations: { val: 18.6, dir: 'up' },
    orders: { val: 8.2, dir: 'up' },
    revenue: { val: 15.7, dir: 'up' },
    automation: { val: 4.2, dir: 'up' }
  };

  const targets = {
    customers: 1500,
    conversations: 500,
    orders: 120,
    revenue: 600000,
    automation: 95
  };

  const kpis = [
    { id: 'customers', val: customers, prefix: '', suffix: '', target: targets.customers },
    { id: 'conversations', val: conversations, prefix: '', suffix: '', target: targets.conversations },
    { id: 'orders', val: orders, prefix: '', suffix: '', target: targets.orders },
    { id: 'revenue', val: revenue, prefix: '₦', suffix: '', target: targets.revenue },
    { id: 'automation', val: automation, prefix: '', suffix: '%', target: targets.automation }
  ];

  kpis.forEach(k => {
    const valEl = document.getElementById(`kpi${k.id.charAt(0).toUpperCase() + k.id.slice(1)}`);
    const trendEl = document.getElementById(`kpiTrend${k.id.charAt(0).toUpperCase() + k.id.slice(1)}`);
    const progressEl = valEl?.closest('.kpi-content')?.querySelector('.kpi-progress-bar');

    if (valEl) animateCounter(valEl, k.val, k.prefix, k.suffix);
    if (trendEl) {
      const t = trends[k.id];
      trendEl.textContent = `${t.dir === 'up' ? '↑' : '↓'} ${t.val}%`;
      trendEl.className = `kpi-trend ${t.dir}`;
    }
    if (progressEl) {
      const pct = Math.min((k.val / k.target) * 100, 100);
      progressEl.style.width = `${pct}%`;
    }
  });
}

function renderChart(business) {
  const canvas = document.getElementById('revenueChart');
  if (!canvas) return;
  if (revenueChart) { revenueChart.destroy(); revenueChart = null; }

  // If Chart is not defined, show fallback
  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-soft);font-size:14px;">⚠️ Chart library unavailable.</div>`;
    return;
  }

  const range = currentRange;
  const baseRevenue = business.revenue || 500000;
  const baseOrders = business.orders || 80;

  let labels, revenueData, ordersData;
  if (range === 'today') {
    labels = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
    revenueData = labels.map(() => Math.round(baseRevenue * (0.1 + Math.random() * 0.2)));
    ordersData = labels.map(() => Math.round(baseOrders * (0.05 + Math.random() * 0.15)));
  } else if (range === 'week') {
    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    revenueData = [0.12, 0.15, 0.10, 0.18, 0.22, 0.13, 0.10].map(p => Math.round(baseRevenue * p));
    ordersData = [0.10, 0.14, 0.09, 0.17, 0.20, 0.15, 0.15].map(p => Math.round(baseOrders * p));
  } else {
    labels = ['W1', 'W2', 'W3', 'W4'];
    revenueData = [0.18, 0.22, 0.25, 0.35].map(p => Math.round(baseRevenue * p));
    ordersData = [0.20, 0.24, 0.22, 0.34].map(p => Math.round(baseOrders * p));
  }

  revenueChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Orders',
          data: ordersData,
          backgroundColor: 'rgba(37, 99, 235, 0.6)',
          borderRadius: 4,
          yAxisID: 'y1',
          order: 2
        },
        {
          label: 'Revenue (₦)',
          data: revenueData,
          type: 'line',
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#16a34a',
          yAxisID: 'y',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, boxWidth: 6, font: { size: 10 } }
        }
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          ticks: { font: { size: 9 }, callback: v => '₦' + v/1000 + 'K' },
          grid: { color: 'rgba(128,128,128,.08)' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          ticks: { font: { size: 9 }, stepSize: 1 },
          grid: { drawOnChartArea: false }
        },
        x: { ticks: { font: { size: 9 } }, grid: { display: false } }
      }
    }
  });
}

function renderBotStatus(business) {
  const handled = business.conversations ? Math.round(business.conversations * 0.85) : 293;
  const handoffs = business.conversations ? Math.round(business.conversations * 0.15) : 49;
  document.getElementById('botHandled').textContent = handled;
  document.getElementById('botHandoffs').textContent = handoffs;
  document.getElementById('botAvgResp').textContent = '1.2s';
  document.getElementById('botCsat').textContent = '94%';

  const dot = document.getElementById('botLiveDot');
  const btn = document.getElementById('botToggleBtn');
  if (State.botOnline) {
    dot.className = 'bot-live-dot';
    btn.textContent = 'Pause';
  } else {
    dot.className = 'bot-live-dot offline';
    btn.textContent = 'Resume';
  }
}

function renderFeed(business, filter = feedFilter) {
  const container = document.getElementById('feedList');
  if (!container) return;

  const customers = DataService.getCustomers(State.currentBusiness) || [];
  const catalogue = DataService.getCatalogue(State.currentBusiness) || [];

  const orders = customers.map((c, i) => ({
    id: `#${1000 + i}`,
    customer: c.name,
    total: Math.round((2000 + Math.random() * 8000) / 100) * 100,
    status: ['pending', 'paid', 'fulfilled'][Math.floor(Math.random() * 3)],
    time: getTimeAgo(Date.now() - (i * 60000 * (i + 1))),
    timestamp: Date.now() - (i * 60000 * (i + 1))
  }));

  const chats = customers.map((c, i) => ({
    customer: c.name,
    message: ['How much is the chicken?', 'Do you deliver?', 'I want to place an order', 'Is my order ready?'][i % 4],
    handledBy: i % 3 === 0 ? 'bot' : 'human',
    time: getTimeAgo(Date.now() - (i * 90000 * (i + 1))),
    timestamp: Date.now() - (i * 90000 * (i + 1))
  }));

  const alerts = [];
  const lowStock = catalogue.filter(item => item.status === 'low' || item.status === 'out');
  if (lowStock.length > 0) {
    alerts.push({ title: `${lowStock.length} items low/out of stock`, desc: 'Update your catalogue.', action: 'Fix', route: 'catalogue' });
  }
  if (customers.length > 3) {
    alerts.push({ title: `${Math.round(customers.length * 0.3)} conversations need attention`, desc: 'Customers need human assistance.', action: 'View', route: 'conversations' });
  }
  alerts.push({ title: 'WhatsApp disconnected', desc: 'Reconnect your WhatsApp channel.', action: 'Fix', route: 'settings' });

  let feedItems = [];

  if (filter === 'all' || filter === 'orders') {
    orders.slice(0, 5).forEach(o => {
      const emoji = o.status === 'paid' ? '✅' : o.status === 'fulfilled' ? '📦' : '⏳';
      feedItems.push({
        icon: '🛒',
        title: `${o.id} · ${o.customer}`,
        desc: `${emoji} ${o.status.charAt(0).toUpperCase() + o.status.slice(1)} · ${formatCurrency(o.total)}`,
        time: o.time,
        route: 'orders',
        action: 'View'
      });
    });
  }

  if (filter === 'all' || filter === 'chats') {
    chats.slice(0, 5).forEach(c => {
      const handler = c.handledBy === 'bot' ? '🤖 Bot' : '👤 Human';
      feedItems.push({
        icon: '💬',
        title: c.customer,
        desc: `"${c.message}" · ${handler}`,
        time: c.time,
        route: 'conversations',
        action: 'Reply'
      });
    });
  }

  if (filter === 'all' || filter === 'alerts') {
    alerts.slice(0, 4).forEach(a => {
      feedItems.push({
        icon: '⚠️',
        title: a.title,
        desc: a.desc,
        time: 'Now',
        route: a.route,
        action: a.action
      });
    });
  }

  feedItems.sort((a, b) => {
    const ta = a.time === 'Now' ? Date.now() : 0;
    const tb = b.time === 'Now' ? Date.now() : 0;
    return tb - ta;
  });

  if (feedItems.length === 0) {
    container.innerHTML = `<div class="feed-empty">✨ No items to show for this filter.</div>`;
    return;
  }

  container.innerHTML = feedItems.map(item => `
    <div class="feed-item clickable" data-route="${escapeHTML(item.route)}">
      <span class="fi-icon">${escapeHTML(item.icon)}</span>
      <div class="fi-content">
        <div class="fi-title">${escapeHTML(item.title)}</div>
        <div class="fi-desc">${escapeHTML(item.desc)}</div>
      </div>
      <span class="fi-time">${escapeHTML(item.time)}</span>
      <button class="fi-action" data-route="${escapeHTML(item.route)}">${escapeHTML(item.action)}</button>
    </div>
  `).join('');

  container.querySelectorAll('.feed-item.clickable').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.fi-action')) return;
      const route = el.dataset.route;
      if (route) navigate(route);
    });
  });
  container.querySelectorAll('.fi-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const route = btn.dataset.route;
      if (route) navigate(route);
    });
  });
}

function renderPreviews() {
  const business = DataService.getBusiness(State.currentBusiness);
  const customers = DataService.getCustomers(State.currentBusiness) || [];
  const catalogue = DataService.getCatalogue(State.currentBusiness) || [];

  // --- 1. CUSTOMERS ---
  const total = customers.length;
  const active = customers.filter(c => c.status === 'active').length;
  const followup = customers.filter(c => c.status === 'followup').length;
  document.getElementById('pvCustomersTotal').textContent = total;
  document.getElementById('pvCustomersActive').textContent = active;
  document.getElementById('pvCustomersFollowup').textContent = followup;
  const custList = document.getElementById('pvCustomersList');
  if (customers.length === 0) {
    custList.innerHTML = '<div class="preview-empty">No customers yet</div>';
  } else {
    custList.innerHTML = customers.slice(0, 3).map(c => `
      <div class="pl-item">
        <span class="pl-name">${escapeHTML(c.name)}</span>
        <span class="pl-status ${escapeHTML(c.status)}">${escapeHTML(c.status)}</span>
      </div>
    `).join('');
  }

  // --- 2. ORDERS ---
  const totalOrders = business?.orders || 0;
  const pendingOrders = Math.max(0, Math.round(totalOrders * 0.2));
  const fulfilledOrders = Math.max(0, Math.round(totalOrders * 0.6));
  document.getElementById('pvOrdersTotal').textContent = totalOrders;
  document.getElementById('pvOrdersPending').textContent = pendingOrders;
  document.getElementById('pvOrdersFulfilled').textContent = fulfilledOrders;
  const ordersList = document.getElementById('pvOrdersList');
  const mockOrders = customers.slice(0, 3).map((c, i) => ({
    id: `#${1000 + i}`,
    customer: c.name,
    status: ['pending', 'paid', 'fulfilled'][i % 3]
  }));
  if (mockOrders.length === 0) {
    ordersList.innerHTML = '<div class="preview-empty">No orders yet</div>';
  } else {
    ordersList.innerHTML = mockOrders.map(o => `
      <div class="pl-item">
        <span class="pl-name">${escapeHTML(o.id)} · ${escapeHTML(o.customer)}</span>
        <span class="pl-status ${escapeHTML(o.status)}">${escapeHTML(o.status)}</span>
      </div>
    `).join('');
  }

  // --- 3. CATALOGUE ---
  const totalItems = catalogue.length;
  const low = catalogue.filter(i => i.status === 'low').length;
  const out = catalogue.filter(i => i.status === 'out').length;
  document.getElementById('pvCatalogueTotal').textContent = totalItems;
  document.getElementById('pvCatalogueLow').textContent = low;
  document.getElementById('pvCatalogueOut').textContent = out;
  const catList = document.getElementById('pvCatalogueList');
  const lowOutItems = catalogue.filter(i => i.status === 'low' || i.status === 'out');
  if (lowOutItems.length === 0) {
    catList.innerHTML = '<div class="preview-empty">✅ All items in stock</div>';
  } else {
    catList.innerHTML = lowOutItems.slice(0, 3).map(i => `
      <div class="pl-item">
        <span class="pl-name">${escapeHTML(i.name)}</span>
        <span class="pl-status ${escapeHTML(i.status)}">${i.status === 'low' ? 'Low' : 'Out'}</span>
      </div>
    `).join('');
  }

  // --- 4. PAYMENTS ---
  const revenue = business?.revenue || 0;
  document.getElementById('pvPaymentsCollected').textContent = formatCurrency(revenue);
  document.getElementById('pvPaymentsPending').textContent = 7;
  document.getElementById('pvPaymentsFailed').textContent = 2;
  const payList = document.getElementById('pvPaymentsList');
  payList.innerHTML = [
    { customer: 'Sarah J.', amount: '₦18,500', status: 'success' },
    { customer: 'David O.', amount: '₦12,000', status: 'pending' }
  ].map(tx => `
    <div class="pl-item">
      <span class="pl-name">${escapeHTML(tx.customer)}</span>
      <span class="pl-status ${escapeHTML(tx.status)}">${escapeHTML(tx.amount)}</span>
    </div>
  `).join('');

  // --- 5. CONVERSATIONS ---
  const convTotal = business?.conversations || 0;
  const convOpen = Math.max(0, Math.round(convTotal * 0.15));
  const convBot = Math.max(0, Math.round(convTotal * 0.75));
  document.getElementById('pvConversationsTotal').textContent = convTotal;
  document.getElementById('pvConversationsOpen').textContent = convOpen;
  document.getElementById('pvConversationsBot').textContent = convBot;
  const convList = document.getElementById('pvConversationsList');
  const convMock = customers.slice(0, 3).map((c) => ({
    name: c.name,
    status: ['Active · Bot', 'Active · Human', 'Needs attention'][Math.floor(Math.random() * 3)]
  }));
  if (convMock.length === 0) {
    convList.innerHTML = '<div class="preview-empty">No conversations</div>';
  } else {
    convList.innerHTML = convMock.map(c => `
      <div class="pl-item">
        <span class="pl-name">${escapeHTML(c.name)}</span>
        <span class="pl-status" style="background:var(--primary-soft);color:var(--primary);">${escapeHTML(c.status)}</span>
      </div>
    `).join('');
  }

  // --- 6. LEADS ---
  const leadsData = [
    { name: 'Olu A.', status: 'lost' },
    { name: 'Ifeanyi B.', status: 'contacted' },
    { name: 'Grace C.', status: 'converted' },
    { name: 'Peter D.', status: 'new' }
  ];
  document.getElementById('pvLeadsNew').textContent = leadsData.filter(l => l.status === 'new').length;
  document.getElementById('pvLeadsContacted').textContent = leadsData.filter(l => l.status === 'contacted').length;
  document.getElementById('pvLeadsConverted').textContent = leadsData.filter(l => l.status === 'converted').length;
  const leadList = document.getElementById('pvLeadsList');
  leadList.innerHTML = leadsData.slice(0, 2).map(l => `
    <div class="pl-item">
      <span class="pl-name">${escapeHTML(l.name)}</span>
      <span class="pl-status ${escapeHTML(l.status)}">${escapeHTML(l.status)}</span>
    </div>
  `).join('');

  // --- 7. BROADCASTS ---
  const broadcastsData = [
    { title: 'Weekend Offer', status: 'sent' },
    { title: 'New Menu', status: 'scheduled' },
    { title: 'Holiday Special', status: 'draft' }
  ];
  document.getElementById('pvBroadcastsSent').textContent = broadcastsData.filter(b => b.status === 'sent').length;
  document.getElementById('pvBroadcastsScheduled').textContent = broadcastsData.filter(b => b.status === 'scheduled').length;
  document.getElementById('pvBroadcastsDraft').textContent = broadcastsData.filter(b => b.status === 'draft').length;
  const bcList = document.getElementById('pvBroadcastsList');
  bcList.innerHTML = broadcastsData.slice(0, 2).map(b => `
    <div class="pl-item">
      <span class="pl-name">${escapeHTML(b.title)}</span>
      <span class="pl-status ${escapeHTML(b.status)}">${escapeHTML(b.status)}</span>
    </div>
  `).join('');

  // --- 8. ANALYTICS ---
  document.getElementById('pvAnalyticsRevenue').textContent = formatCurrency(revenue);
  document.getElementById('pvAnalyticsOrders').textContent = business?.orders || 0;
  document.getElementById('pvAnalyticsAutomation').textContent = `${business?.automationRate || 0}%`;
  document.getElementById('pvAnalyticsCustomers').textContent = total;

  // --- 9. FAQs ---
  const faqsData = [
    { question: 'Do you deliver to Lekki?', category: 'Delivery' },
    { question: 'What payment methods?', category: 'Payments' },
    { question: 'How long does delivery take?', category: 'Delivery' },
    { question: 'Can I cancel my order?', category: 'Orders' }
  ];
  const categories = [...new Set(faqsData.map(f => f.category))];
  document.getElementById('pvFaqsTotal').textContent = faqsData.length;
  document.getElementById('pvFaqsCategories').textContent = categories.length;
  const topCat = categories.reduce((a, c) => {
    const count = faqsData.filter(f => f.category === c).length;
    return count > a.count ? { cat: c, count } : a;
  }, { cat: '—', count: 0 });
  document.getElementById('pvFaqsTop').textContent = topCat.cat || '—';
  const faqList = document.getElementById('pvFaqsList');
  faqList.innerHTML = faqsData.slice(0, 3).map(f => `
    <div class="pl-item">
      <span class="pl-name">${escapeHTML(f.question)}</span>
      <span class="pl-status" style="background:var(--primary-soft);color:var(--primary);font-weight:600;">${escapeHTML(f.category)}</span>
    </div>
  `).join('');

  // --- 10. TEAM ---
  const teamData = [
    { name: 'Business Owner', role: 'owner', status: 'active' },
    { name: 'Admin Manager', role: 'admin', status: 'active' },
    { name: 'Customer Support', role: 'agent', status: 'pending' }
  ];
  document.getElementById('pvTeamTotal').textContent = teamData.length;
  document.getElementById('pvTeamOnline').textContent = teamData.filter(t => t.status === 'active').length;
  document.getElementById('pvTeamPending').textContent = teamData.filter(t => t.status === 'pending').length;
  const teamList = document.getElementById('pvTeamList');
  teamList.innerHTML = teamData.slice(0, 2).map(t => `
    <div class="pl-item">
      <span class="pl-name">${escapeHTML(t.name)}</span>
      <span class="pl-status ${escapeHTML(t.role)}">${escapeHTML(t.role)}</span>
    </div>
  `).join('');

  // --- 11. BUSINESS ---
  document.getElementById('pvBusinessName').textContent = escapeHTML(State.currentBusiness);
  document.getElementById('pvBusinessCategory').textContent = escapeHTML(business?.category || '—');
  const connected = Object.keys(DataService.businesses).length;
  document.getElementById('pvBusinessConnected').textContent = connected;
  const bizList = document.getElementById('pvBusinessList');
  const otherBiz = Object.keys(DataService.businesses).filter(name => name !== State.currentBusiness);
  if (otherBiz.length === 0) {
    bizList.innerHTML = '<div class="preview-empty">Only this business</div>';
  } else {
    bizList.innerHTML = otherBiz.slice(0, 2).map(name => `
      <div class="pl-item">
        <span class="pl-name">${escapeHTML(name)}</span>
        <span class="pl-status" style="background:var(--surface-2);color:var(--text-soft);">Switch</span>
      </div>
    `).join('');
  }

  // --- 12. NOTIFICATIONS ---
  const notifs = [
    { title: 'New order #1048', read: false },
    { title: 'Bot handled chat', read: false },
    { title: 'WhatsApp disconnected', read: true },
    { title: 'Lead converted', read: false }
  ];
  const totalNotif = notifs.length;
  const unread = notifs.filter(n => !n.read).length;
  const read = notifs.filter(n => n.read).length;
  document.getElementById('pvNotifTotal').textContent = totalNotif;
  document.getElementById('pvNotifUnread').textContent = unread;
  document.getElementById('pvNotifRead').textContent = read;
  const notifList = document.getElementById('pvNotifList');
  notifList.innerHTML = notifs.slice(0, 3).map(n => `
    <div class="pl-item">
      <span class="pl-name">${escapeHTML(n.title)}</span>
      <span class="pl-status" style="${n.read ? 'background:var(--surface-2);color:var(--text-soft);' : 'background:rgba(74,124,247,.12);color:var(--primary);'}">${n.read ? 'Read' : 'Unread'}</span>
    </div>
  `).join('');
}

function renderQuickActions() {
  document.querySelectorAll('.qa-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      if (route) navigate(route);
    });
  });
}

function bindPreviewViewAll() {
  document.querySelectorAll('.preview-viewall').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      if (route) navigate(route);
    });
  });
}

function startClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;
  setInterval(() => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, 1000);
}

function bindExport() {
  document.getElementById('exportDashboardBtn')?.addEventListener('click', () => {
    import('../../js/components/modals.js').then(({ showToast }) => {
      showToast('📤 Exporting dashboard data...');
    });
  });
}

function updateDashboard() {
  const business = DataService.getBusiness(State.currentBusiness);
  if (!business) return;

  document.getElementById('greetingTitle').textContent = getGreeting();
  renderKPIs(business);
  renderChart(business);
  renderBotStatus(business);
  renderFeed(business);
  renderPreviews();
}

export function init() {
  updateDashboard();
  startClock();
  renderQuickActions();
  bindPreviewViewAll();
  bindExport();

  document.getElementById('botToggleBtn')?.addEventListener('click', () => {
    State.botOnline = !State.botOnline;
    renderBotStatus(DataService.getBusiness(State.currentBusiness));
    window.dispatchEvent(new CustomEvent('cbs:bot-toggle', { detail: { isOnline: State.botOnline } }));
  });

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      currentRange = this.dataset.range;
      renderChart(DataService.getBusiness(State.currentBusiness));
    });
  });

  document.querySelectorAll('.feed-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      feedFilter = this.dataset.feed;
      renderFeed(DataService.getBusiness(State.currentBusiness));
    });
  });

  window.addEventListener('cbs:business-changed', () => {
    updateDashboard();
  });
}

export function updateBusiness() {
  updateDashboard();
}