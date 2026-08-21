import { DataService, State } from "../../js/state.js";
import { showToast, escapeHTML } from "../../js/components/modals.js";

let currentFilter = "all";

export function init(){ bind(); render(); }
let bound=false;

function bind(){
  if(bound) return;
  bound = true;

  document.getElementById("customerSearch")?.addEventListener("input", render);

  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", function() {
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      this.classList.add("active");
      currentFilter = this.dataset.filter;
      render();
    });
  });

  document.getElementById("addCustomerBtn")?.addEventListener("click", () => {
    showToast("Add customer form will open.");
  });

  document.getElementById("clearCustomerFilter")?.addEventListener("click", () => {
    const search = document.getElementById("customerSearch");
    if (search) search.value = "";
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    const allPill = document.querySelector('.filter-pill[data-filter="all"]');
    if (allPill) allPill.classList.add("active");
    currentFilter = "all";
    render();
  });

  document.getElementById("resetCustomersEmpty")?.addEventListener("click", () => {
    const search = document.getElementById("customerSearch");
    if (search) search.value = "";
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    const allPill = document.querySelector('.filter-pill[data-filter="all"]');
    if (allPill) allPill.classList.add("active");
    currentFilter = "all";
    render();
  });
}

export function render(){
  const container = document.getElementById("customersContainer");
  if (!container) return;

  const search = (document.getElementById("customerSearch")?.value || "").toLowerCase().trim();
  const filter = currentFilter;

  const all = DataService.getCustomers(State.currentBusiness);
  const filtered = all.filter(c =>
    (!search || [c.name, c.phone, c.email].some(v => String(v).toLowerCase().includes(search))) &&
    (filter === "all" || c.status === filter)
  );

  document.getElementById("customerTotal").textContent = all.length;
  document.getElementById("customerActive").textContent = all.filter(c => c.status === "active").length;
  document.getElementById("customerNew").textContent = Math.max(1, Math.ceil(all.length * .35));
  document.getElementById("customerFollowup").textContent = all.filter(c => c.status === "followup").length;

  container.innerHTML = filtered.map(c => `
    <div class="customer-card" data-customer="${escapeHTML(c.name)}">
      <div class="customer-card-header">
        <div class="customer-avatar">${escapeHTML(c.initials)}</div>
        <div>
          <div class="customer-name">${escapeHTML(c.name)}</div>
          <div class="customer-sub">Customer</div>
        </div>
      </div>
      <div class="customer-card-body">
        <div class="customer-card-row">
          <span class="label">Phone</span>
          <span class="value">${escapeHTML(c.phone)}</span>
        </div>
        <div class="customer-card-row">
          <span class="label">Email</span>
          <span class="value">${escapeHTML(c.email)}</span>
        </div>
        <div class="customer-card-row">
          <span class="label">Orders</span>
          <span class="value">${c.orders}</span>
        </div>
        <div class="customer-card-row">
          <span class="label">Last Contact</span>
          <span class="value">${escapeHTML(c.last)}</span>
        </div>
        <div class="customer-card-row">
          <span class="label">Status</span>
          <span class="value">
            <span class="status-pill ${c.status === "active" ? "active" : c.status === "followup" ? "low" : "inactive"}">
              ${c.status === "active" ? "● Active" : c.status === "followup" ? "● Follow-up" : "● Inactive"}
            </span>
          </span>
        </div>
      </div>
      <div class="customer-card-footer">
        <div class="customer-actions">
          <button class="mini-button" data-customer-view="${escapeHTML(c.name)}">View</button>
          <button class="mini-button" data-customer-message="${escapeHTML(c.name)}">Message</button>
        </div>
      </div>
    </div>
  `).join("");

  document.getElementById("customersEmpty").style.display = filtered.length ? "none" : "block";

  container.querySelectorAll("[data-customer-view]").forEach(b =>
    b.addEventListener("click", () => showToast(`Customer profile: ${b.dataset.customerView}`))
  );
  container.querySelectorAll("[data-customer-message]").forEach(b =>
    b.addEventListener("click", () => showToast(`Messaging ${b.dataset.customerMessage} will connect to Conversations.`))
  );
}