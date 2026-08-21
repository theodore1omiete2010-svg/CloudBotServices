import { showToast, confirmModal, escapeHTML } from "../../js/components/modals.js";

let teamData = [
  { id: 1, name: "Business Owner", initials: "PR", email: "owner@business.local", role: "owner", status: "active" },
  { id: 2, name: "Admin Manager", initials: "AM", email: "admin@business.local", role: "admin", status: "active" },
  { id: 3, name: "Customer Support", initials: "CS", email: "support@business.local", role: "agent", status: "pending" }
];

export function init() {
  setTimeout(() => {
    const container = document.getElementById('teamList');
    if (!container) return;
    renderTeam();
    bindEvents();
  }, 50);
}

function bindEvents() {
  document.querySelectorAll('#view-team .filter-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#view-team .filter-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      renderTeam(this.dataset.filter);
    });
  });

  document.getElementById('teamSearch')?.addEventListener('input', () => {
    const activeFilter = document.querySelector('#view-team .filter-pill.active')?.dataset.filter || 'all';
    renderTeam(activeFilter);
  });

  document.getElementById('inviteTeamBtn')?.addEventListener('click', () => {
    showToast("Invite Member modal is ready.");
  });

  document.getElementById('teamList')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const item = teamData.find(i => i.id === id);

    if (btn.classList.contains('btn-team-edit')) {
      showToast(`Edit role for ${item.name}`);
    } else if (btn.classList.contains('btn-team-delete')) {
      const confirmed = await confirmModal(`Are you sure you want to remove ${item.name} from the team?`, "Remove Member");
      if (confirmed) {
        teamData = teamData.filter(i => i.id !== id);
        const activeFilter = document.querySelector('#view-team .filter-pill.active')?.dataset.filter || 'all';
        renderTeam(activeFilter);
        showToast(`${item.name} removed from team.`);
      }
    }
  });
}

function renderTeam(filter = 'all') {
  const container = document.getElementById('teamList');
  if (!container) return;

  const searchVal = (document.getElementById('teamSearch')?.value || '').toLowerCase().trim();
  
  let filtered = teamData;
  if (filter !== 'all') filtered = filtered.filter(m => m.role === filter);
  if (searchVal) filtered = filtered.filter(m => m.name.toLowerCase().includes(searchVal) || m.email.toLowerCase().includes(searchVal));

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No team members found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="team-card" data-id="${m.id}">
      <div class="team-avatar">${escapeHTML(m.initials)}</div>
      <div class="team-info">
        <div class="team-name-row">
          <span class="team-name">${escapeHTML(m.name)}</span>
          <span class="pill-${escapeHTML(m.role)}">${escapeHTML(m.role.charAt(0).toUpperCase() + m.role.slice(1))}</span>
          <span class="status-pill ${escapeHTML(m.status)}">● ${escapeHTML(m.status.charAt(0).toUpperCase() + m.status.slice(1))}</span>
        </div>
        <div class="team-email">${escapeHTML(m.email)}</div>
      </div>
      <div class="team-actions">
        <button class="btn-team-edit" data-id="${m.id}">Edit Role</button>
        <button class="btn-team-delete" data-id="${m.id}">Remove</button>
      </div>
    </div>
  `).join('');
}