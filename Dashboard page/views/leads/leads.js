import { showToast } from "../../js/components/modals.js";

// Mock Data (Matching your screenshot)
let leadsData = [
  { id: 1, name: "Olu A.", email: "olu@example.com", phone: "+234 8013997188", source: "WhatsApp", date: "2 min ago", status: "lost" },
  { id: 2, name: "Ifeanyi B.", email: "ifeanyi@example.com", phone: "+234 8015902570", source: "Web Chat", date: "2 hr ago", status: "contacted" },
  { id: 3, name: "Grace C.", email: "grace@example.com", phone: "+234 8013121697", source: "Instagram", date: "4 hr ago", status: "converted" },
  { id: 4, name: "Peter D.", email: "peter@example.com", phone: "+234 8091172838", source: "WhatsApp", date: "1 day ago", status: "new" }
];

export function init() {
  setTimeout(() => {
    const container = document.getElementById('leadList');
    if (!container) return;
    updateMetrics();
    renderLeads();
    bindEvents();
  }, 50);
}

function bindEvents() {
  document.querySelectorAll('#view-leads .filter-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#view-leads .filter-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      renderLeads(this.dataset.filter);
      updateMetrics();
    });
  });

  document.getElementById('leadSearch')?.addEventListener('input', () => {
    const activeFilter = document.querySelector('#view-leads .filter-pill.active')?.dataset.filter || 'all';
    renderLeads(activeFilter);
  });

  document.getElementById('addLeadBtn')?.addEventListener('click', () => {
    showToast("Add Lead modal is ready.");
  });

  document.getElementById('leadList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const item = leadsData.find(i => i.id === id);

    if (btn.classList.contains('btn-lead-view')) {
      showToast(`Viewing profile: ${item.name}`);
    } else if (btn.classList.contains('btn-lead-convert')) {
      if (confirm(`Mark ${item.name} as Converted?`)) {
        item.status = 'converted';
        const activeFilter = document.querySelector('#view-leads .filter-pill.active')?.dataset.filter || 'all';
        renderLeads(activeFilter);
        updateMetrics();
        showToast(`${item.name} successfully converted!`);
      }
    } else if (btn.classList.contains('btn-lead-lost')) {
      if (confirm(`Mark ${item.name} as Lost?`)) {
        item.status = 'lost';
        const activeFilter = document.querySelector('#view-leads .filter-pill.active')?.dataset.filter || 'all';
        renderLeads(activeFilter);
        updateMetrics();
        showToast(`${item.name} marked as lost.`);
      }
    }
  });
}

function renderLeads(filter = 'all') {
  const container = document.getElementById('leadList');
  if (!container) return;

  const searchVal = (document.getElementById('leadSearch')?.value || '').toLowerCase().trim();
  
  let filtered = leadsData;
  if (filter !== 'all') filtered = filtered.filter(l => l.status === filter);
  if (searchVal) filtered = filtered.filter(l => l.name.toLowerCase().includes(searchVal) || l.email.toLowerCase().includes(searchVal));

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No leads found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(l => `
    <div class="lead-card" data-id="${l.id}">
      <div class="kv-row"><span class="label">Name</span><span class="value">${l.name}</span></div>
      <div class="kv-row"><span class="label">Email</span><span class="value">${l.email}</span></div>
      <div class="kv-row"><span class="label">Phone</span><span class="value">${l.phone}</span></div>
      <div class="kv-row"><span class="label">Status</span><span class="pill-${l.status}">${l.status.charAt(0).toUpperCase() + l.status.slice(1)}</span></div>
      <div class="kv-row"><span class="label">Source</span><span class="value">${l.source}</span></div>
      <div class="kv-row"><span class="label">Date</span><span class="value">${l.date}</span></div>
      <div class="lead-actions">
        <button class="btn-lead-view" data-id="${l.id}">View</button>
        <button class="btn-lead-convert" data-id="${l.id}">Convert</button>
        <button class="btn-lead-lost" data-id="${l.id}">Lost</button>
      </div>
    </div>
  `).join('');
}

function updateMetrics() {
  document.getElementById('leadsNew').textContent = leadsData.filter(l => l.status === 'new').length;
  document.getElementById('leadsQualified').textContent = leadsData.filter(l => l.status === 'contacted').length + leadsData.filter(l => l.status === 'converted').length;
  document.getElementById('leadsConverted').textContent = leadsData.filter(l => l.status === 'converted').length;
}


