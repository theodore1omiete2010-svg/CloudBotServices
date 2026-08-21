import { DataService, State } from "../../js/state.js";
import { showToast, escapeHTML, confirmWithPassword } from "../../js/components/modals.js";

export function init() {
  bind();
  render();
}

let bound = false;

function bind() {
  if (bound) return;
  bound = true;

  document.getElementById("managementAddBusinessBtn")?.addEventListener("click", () => {
    showToast("Add business form will open.");
  });

  document.getElementById("managementSwitchBtn")?.addEventListener("click", () => {
    showToast("Switch business dialog will open.");
  });
}

export async function render() {
  const host = document.getElementById("businessList");
  if (!host) return;

  try {
    const businesses = await DataService.getBusinesses();
    const current = State.currentBusiness;

    host.innerHTML = Object.entries(businesses).map(([name, b]) => {
      const isCurrent = name === current;
      return `
        <div class="business-list-row" data-business="${escapeHTML(name)}">
          <div class="business-logo">${escapeHTML(b.initials)}</div>
          <div class="business-info">
            <div class="business-name">${escapeHTML(name)}</div>
            <div class="business-meta">${escapeHTML(b.category)} · ${b.customers.toLocaleString()} customers</div>
          </div>
          <div class="business-actions">
            ${isCurrent
              ? `<span class="status-pill active">● Current</span>`
              : `<button class="mini-button" data-switch-business="${escapeHTML(name)}">Switch</button>`
            }
            <button class="mini-button" data-edit-business="${escapeHTML(name)}">Edit</button>
            <button class="mini-button danger" data-remove-business="${escapeHTML(name)}">Remove</button>
          </div>
        </div>
      `;
    }).join("");

    // Re‑bind events
    host.querySelectorAll("[data-switch-business]").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.switchBusiness;
        State.currentBusiness = name;
        localStorage.setItem("cbs_current_business", State.currentBusiness);
        showToast(`Switched to ${name}`);
        window.dispatchEvent(new CustomEvent("cbs:business-changed"));
        render();
      });
    });

    host.querySelectorAll("[data-edit-business]").forEach(btn => {
      btn.addEventListener("click", () => {
        showToast(`Edit business: ${btn.dataset.editBusiness}`);
      });
    });

    host.querySelectorAll("[data-remove-business]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const name = btn.dataset.removeBusiness;
        if (name === State.currentBusiness) {
          showToast("Cannot remove the currently active business.");
          return;
        }
        const confirmed = await confirmWithPassword(
          `Are you sure you want to permanently remove "${name}"? This action cannot be undone.`,
          "Remove Business"
        );
        if (confirmed) {
          // TODO: call DataService.removeBusiness(name)
          showToast(`Removed business: ${name}`);
          render();
        }
      });
    });
  } catch (error) {
    console.error("Failed to load businesses:", error);
    showToast("Error loading business data. Please try again.");
    host.innerHTML = `<div class="empty-state">Failed to load businesses.</div>`;
  }
}