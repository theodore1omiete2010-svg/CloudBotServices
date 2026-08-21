import { showToast, confirmModal, escapeHTML } from "../../js/components/modals.js";

let broadcastsData = [
  { id: 1, title: "Weekend Offer", recipients: "1,248", channel: "WhatsApp", date: "Sent today", status: "sent" },
  { id: 2, title: "New Menu Announcement", recipients: "842", channel: "Email", date: "Scheduled for Friday", status: "scheduled" },
  { id: 3, title: "Holiday Special", recipients: "144", channel: "Web Chat", date: "Not sent", status: "draft" }
];

export function init() {
  setTimeout(() => {
    const container = document.getElementById('broadcastList');
    if (!container) return;
    renderBroadcasts();
    bindEvents();
  }, 50);
}

function bindEvents() {
  document.querySelectorAll('#view-broadcasts .filter-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#view-broadcasts .filter-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      renderBroadcasts(this.dataset.filter);
    });
  });

  document.getElementById('broadcastSearch')?.addEventListener('input', () => {
    const activeFilter = document.querySelector('#view-broadcasts .filter-pill.active')?.dataset.filter || 'all';
    renderBroadcasts(activeFilter);
  });

  document.getElementById('createBroadcastBtn')?.addEventListener('click', () => {
    showToast("New Broadcast modal is ready.");
  });

  document.getElementById('broadcastList')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const item = broadcastsData.find(i => i.id === id);

    if (btn.classList.contains('btn-bc-view')) {
      showToast(`Viewing: ${item.title}`);
    } else if (btn.classList.contains('btn-bc-edit')) {
      showToast(`Editing: ${item.title}`);
    } else if (btn.classList.contains('btn-bc-delete')) {
      const confirmed = await confirmModal(`Delete "${item.title}"?`, "Delete Broadcast");
      if (confirmed) {
        broadcastsData = broadcastsData.filter(i => i.id !== id);
        const activeFilter = document.querySelector('#view-broadcasts .filter-pill.active')?.dataset.filter || 'all';
        renderBroadcasts(activeFilter);
        showToast(`Deleted: ${item.title}`);
      }
    }
  });
}

function renderBroadcasts(filter = 'all') {
  const container = document.getElementById('broadcastList');
  if (!container) return;

  const searchVal = (document.getElementById('broadcastSearch')?.value || '').toLowerCase().trim();
  
  let filtered = broadcastsData;
  if (filter !== 'all') filtered = filtered.filter(b => b.status === filter);
  if (searchVal) filtered = filtered.filter(b => b.title.toLowerCase().includes(searchVal));

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No broadcasts found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(b => `
    <div class="broadcast-card" data-id="${b.id}">
      <div class="bc-title">${escapeHTML(b.title)}</div>
      <div class="bc-meta">${escapeHTML(b.recipients)} recipients · ${escapeHTML(b.channel)} · ${escapeHTML(b.date)}</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="status-pill ${escapeHTML(b.status)}">● ${escapeHTML(b.status.charAt(0).toUpperCase() + b.status.slice(1))}</span>
      </div>
      <div class="bc-actions">
        <button class="btn-bc-view" data-id="${b.id}">View</button>
        <button class="btn-bc-edit" data-id="${b.id}">Edit</button>
        <button class="btn-bc-delete" data-id="${b.id}">Delete</button>
      </div>
    </div>
  `).join('');
}