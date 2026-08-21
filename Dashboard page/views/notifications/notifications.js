import { showToast, escapeHTML } from "../../js/components/modals.js";

const iconMap = {
  order: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1-2-2z"></path><polyline points="12 12 15 9 18 12"></polyline><line x1="12" y1="12" x2="12" y2="20"></line></svg>`,
  bot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>`,
  system: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
};

let notificationsData = [
  { id: 1, type: 'order', title: 'New order #1048 received', desc: 'Sarah Johnson placed an order for ₦18,500 via WhatsApp.', timestamp: Date.now() - 60000, read: false },
  { id: 2, type: 'bot', title: 'Bot handled conversation', desc: 'Chidi A.\'s question about order readiness was resolved automatically.', timestamp: Date.now() - 300000, read: false },
  { id: 3, type: 'system', title: 'WhatsApp channel disconnected', desc: 'Please reconfigure your WhatsApp Business API settings.', timestamp: Date.now() - 900000, read: true },
  { id: 4, type: 'user', title: 'Lead successfully converted', desc: 'Ifeanyi B. was converted to a customer via Web Chat.', timestamp: Date.now() - 3600000, read: false },
];

export function init() {
  setTimeout(() => {
    const container = document.getElementById('notificationList');
    if (!container) {
      console.error("🚨 APP ERROR: #notificationList container is missing!");
      return;
    }
    renderNotifications();
    bindEvents();
  }, 50);
}

function bindEvents() {
  document.querySelectorAll('#view-notifications .filter-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#view-notifications .filter-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      renderNotifications(this.dataset.filter);
    });
  });

  document.getElementById('notifSearch')?.addEventListener('input', () => {
    const activeFilter = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
    renderNotifications(activeFilter);
  });

  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    let changed = false;
    notificationsData.forEach(n => { if (!n.read) { n.read = true; changed = true; } });
    if (changed) {
      renderNotifications(document.querySelector('.filter-pill.active')?.dataset.filter || 'all');
      updateSidebarBadge();
    }
  });

  document.getElementById('notificationList')?.addEventListener('click', (e) => {
    const card = e.target.closest('.notification-card');
    if (!card) return;
    const id = parseInt(card.dataset.id);
    const item = notificationsData.find(n => n.id === id);
    if (item && !item.read) {
      item.read = true;
      renderNotifications(document.querySelector('.filter-pill.active')?.dataset.filter || 'all');
      updateSidebarBadge();
    }
  });
}

function renderNotifications(filter = 'all') {
  const container = document.getElementById('notificationList');
  if (!container) return;

  const searchVal = (document.getElementById('notifSearch')?.value || '').toLowerCase().trim();
  let filtered = notificationsData;
  if (filter === 'unread') filtered = filtered.filter(n => n.read === false);
  if (filter === 'read') filtered = filtered.filter(n => n.read === true);
  if (searchVal) {
    filtered = filtered.filter(n => n.title.toLowerCase().includes(searchVal) || n.desc.toLowerCase().includes(searchVal));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No notifications found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(n => `
    <div class="notification-card" data-id="${n.id}">
      <div class="notif-icon-box ${escapeHTML(n.type)}">${iconMap[n.type]}</div>
      <div class="notif-content">
        <div class="notif-title">${escapeHTML(n.title)}</div>
        <div class="notif-desc">${escapeHTML(n.desc)}</div>
      </div>
      <div class="notif-meta">
        <span class="notif-time">${escapeHTML(getTimeAgo(n.timestamp))}</span>
        <span class="notif-dot ${n.read ? 'read' : ''}"></span>
      </div>
    </div>
  `).join('');
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function updateSidebarBadge() {
  const unreadCount = notificationsData.filter(n => !n.read).length;
  const sidebarBadge = document.querySelector('.sidebar .nav-item[data-route="notifications"] .badge');
  if (sidebarBadge) {
    sidebarBadge.textContent = unreadCount;
    sidebarBadge.style.display = unreadCount === 0 ? 'none' : 'inline-block';
  }
}