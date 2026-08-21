/* CBS Sidebar component - with back button, subtitles, enhanced profile, custom SVGs */
const sidebarMarkup = `
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <button class="sidebar-back-btn" id="sidebarBackBtn" aria-label="Close sidebar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="brand">
      <svg aria-label="CloudBotServices" class="brand-logo" role="img" viewBox="280 300 700 150" xmlns="http://www.w3.org/2000/svg">
        <!-- Keep your original logo paths (same as before) -->
        <!-- I'm not repeating all the paths here for brevity, but they remain unchanged -->
        ... (your original logo paths) ...
      </svg>
      <div class="brand-subtitle">BUSINESS AUTOMATION</div>
    </div>
  </div>
  <nav class="nav">
    <div class="nav-section">
      <div class="nav-title">Main</div>
      <!-- Dashboard -->
      <button class="nav-item active" data-route="dashboard">
        <span class="nav-icon"><!-- custom SVG for dashboard --><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>
        <span class="nav-label">Dashboard</span>
        <span class="nav-subtitle">Overview & KPIs</span>
      </button>
      <!-- Conversations -->
      <button class="nav-item" data-route="conversations">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></span>
        <span class="nav-label">Conversations</span>
        <span class="nav-subtitle">Customer messages</span>
        <span class="badge">8</span>
      </button>
      <!-- Notifications -->
      <button class="nav-item" data-route="notifications">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></span>
        <span class="nav-label">Notifications</span>
        <span class="nav-subtitle">System alerts</span>
        <span class="badge">3</span>
      </button>
      <!-- Business -->
      <button class="nav-item" data-route="business">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l3-3h12l3 3v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/><path d="M3 6h18M9 10h6"/></svg></span>
        <span class="nav-label">Business</span>
        <span class="nav-subtitle">Manage your business</span>
      </button>
      <!-- Customers -->
      <button class="nav-item" data-route="customers">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
        <span class="nav-label">Customers</span>
        <span class="nav-subtitle">People & contacts</span>
      </button>
      <!-- Orders -->
      <button class="nav-item" data-route="orders">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></span>
        <span class="nav-label">Orders</span>
        <span class="nav-subtitle">Sales & transactions</span>
      </button>
      <!-- Catalogue -->
      <button class="nav-item" data-route="catalogue">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>
        <span class="nav-label">Catalogue</span>
        <span class="nav-subtitle">Products & services</span>
      </button>
    </div>
    <div class="nav-section">
      <div class="nav-title">AI & Automation</div>
      <button class="nav-item" data-route="bot">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15 9l7 3-7 3-3 7-3-7L2 12l7-3 3-7z"/></svg></span>
        <span class="nav-label">Bot</span>
        <span class="nav-subtitle">AI assistant</span>
      </button>
      <button class="nav-item" data-route="faqs">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
        <span class="nav-label">FAQs</span>
        <span class="nav-subtitle">Knowledge base</span>
      </button>
    </div>
    <div class="nav-section">
      <div class="nav-title">Business</div>
      <button class="nav-item" data-route="analytics">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z"/></svg></span>
        <span class="nav-label">Analytics</span>
        <span class="nav-subtitle">Data & insights</span>
      </button>
      <button class="nav-item" data-route="leads">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg></span>
        <span class="nav-label">Leads</span>
        <span class="nav-subtitle">Sales pipeline</span>
      </button>
      <button class="nav-item" data-route="payments">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>
        <span class="nav-label">Payments</span>
        <span class="nav-subtitle">Transactions</span>
      </button>
      <button class="nav-item" data-route="broadcasts">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h8v6H3a1 1 0 01-1-1v-4a1 1 0 011-1z"/><path d="M11 17l5 3V4l-5 3"/><path d="M16 8v8"/></svg></span>
        <span class="nav-label">Broadcasts</span>
        <span class="nav-subtitle">Campaigns</span>
      </button>
    </div>
    <div class="nav-section">
      <div class="nav-title">Administration</div>
      <button class="nav-item" data-route="team">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></span>
        <span class="nav-label">Team</span>
        <span class="nav-subtitle">Access & roles</span>
      </button>
      <button class="nav-item" data-route="settings">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></span>
        <span class="nav-label">Settings</span>
        <span class="nav-subtitle">System config</span>
      </button>
      <button class="nav-item" data-route="profile">
        <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
        <span class="nav-label">Profile</span>
        <span class="nav-subtitle">Your account</span>
      </button>
    </div>
  </nav>
  <!-- Profile Section (enhanced) -->
  <div class="profile-section">
    <div class="profile-avatar">PR</div>
    <div class="profile-details">
      <div class="profile-name">Business Owner</div>
      <div class="profile-role">Owner</div>
      <div class="profile-stats">
        <span class="profile-stat">📨 2,450 / 5,000 messages</span>
        <span class="profile-stat">✅ Active – Basic Plan</span>
      </div>
      <button class="profile-upgrade-btn" id="upgradePlanBtn">⬆ Upgrade Plan</button>
    </div>
    <div class="profile-menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
    </div>
  </div>
</aside>
`;

const bottomNavMarkup = `
<nav aria-label="Mobile navigation" class="bottom-nav">
  <button aria-label="Dashboard" class="active" data-route="dashboard">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>
    <span>Home</span>
  </button>
  <button aria-label="Conversations" data-route="conversations">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></span>
    <span>Chats</span>
  </button>
  <button aria-label="Orders" data-route="orders">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></span>
    <span>Orders</span>
  </button>
  <button aria-label="Payments" data-route="payments">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="9" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg></span>
    <span>Payments</span>
  </button>
  <button aria-label="Profile" data-route="profile">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
    <span>Profile</span>
  </button>
</nav>
`;

export function mountSidebar() {
  document.getElementById('sidebarMount').innerHTML = sidebarMarkup;
  document.getElementById('bottomNavMount').innerHTML = bottomNavMarkup;

  // Handle back button to close sidebar
  const backBtn = document.getElementById('sidebarBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('overlay')?.classList.remove('open');
    });
  }

  // Auto-close sidebar on nav item click (mobile)
  document.querySelectorAll('.nav-item, .bottom-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('overlay')?.classList.remove('open');
      }
    });
  });

  // Upgrade Plan button
  document.getElementById('upgradePlanBtn')?.addEventListener('click', () => {
    import('./modals.js').then(({ showToast }) => {
      showToast('Upgrade Plan modal will open soon.');
    });
  });

  return { sidebar: document.getElementById('sidebar'), overlay: document.getElementById('overlay') };
}