import { showToast, confirmModal, escapeHTML } from "../../js/components/modals.js";

let ordersData = [
  { id: '#1000', customer: 'Alice O.', items: 'Jollof Rice x2', total: 1966, status: 'pending', time: '5 min ago', timestamp: Date.now() - 300000 },
  { id: '#1001', customer: 'Bola A.', items: 'Fried Rice', total: 2277, status: 'paid', time: '25 min ago', timestamp: Date.now() - 1500000 },
  { id: '#1002', customer: 'Emeka E.', items: 'Chicken Burger x2', total: 3442, status: 'fulfilled', time: '45 min ago', timestamp: Date.now() - 2700000 },
  { id: '#1003', customer: 'Chidi B.', items: 'Shawarma', total: 3397, status: 'pending', time: '1 hr ago', timestamp: Date.now() - 3600000 },
  { id: '#1004', customer: 'Kelechi N.', items: 'Grilled Fish x1', total: 4500, status: 'cancelled', time: '2 hr ago', timestamp: Date.now() - 7200000 }
];

function generateOrderId() {
  const lastId = ordersData.length > 0 ? parseInt(ordersData[0].id.replace('#', '')) : 1000;
  return `#${lastId + 1}`;
}

export function init() {
  setTimeout(() => {
    const container = document.getElementById('ordersList');
    if (!container) return;
    updateMetrics();
    renderOrders();
    bindEvents();
  }, 50);
}

function bindEvents() {
  document.querySelectorAll('#view-orders .filter-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#view-orders .filter-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      renderOrders(this.dataset.filter);
    });
  });

  document.getElementById('ordersSearch')?.addEventListener('input', () => {
    const activeFilter = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
    renderOrders(activeFilter);
  });
  
  document.getElementById('ordersList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.classList.contains('btn-action-view')) {
      showToast(`Viewing order ${btn.dataset.id}`);
    }
  });

  document.getElementById('openCreateOrderBtn')?.addEventListener('click', openCreateOrderModal);
  document.getElementById('closeCreateOrderBtn')?.addEventListener('click', closeCreateOrderModal);
  document.getElementById('cancelCreateOrderBtn')?.addEventListener('click', closeCreateOrderModal);
  document.getElementById('saveCreateOrderBtn')?.addEventListener('click', handleCreateOrderSubmit);
  document.getElementById('createOrderModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCreateOrderModal();
  });
}

function openCreateOrderModal() {
  document.getElementById('createOrderModal').style.display = 'flex';
  document.getElementById('newCustomerName').focus();
  const prefillItem = localStorage.getItem('cbs_prefill_order_item');
  if (prefillItem) {
    document.getElementById('newOrderItems').value = prefillItem;
    localStorage.removeItem('cbs_prefill_order_item');
  }
}

function closeCreateOrderModal() {
  document.getElementById('createOrderModal').style.display = 'none';
  document.getElementById('newCustomerName').value = '';
  document.getElementById('newOrderItems').value = '';
  document.getElementById('newOrderTotal').value = '';
}

function handleCreateOrderSubmit() {
  const name = document.getElementById('newCustomerName').value.trim();
  const items = document.getElementById('newOrderItems').value.trim();
  const totalRaw = document.getElementById('newOrderTotal').value.trim();
  
  if (!name || !items || !totalRaw) {
    showToast('Please fill in all fields (Customer, Items, and Total).');
    return;
  }

  const total = parseInt(totalRaw);
  if (isNaN(total) || total <= 0) {
    showToast('Please enter a valid positive number for the total.');
    return;
  }

  const channel = document.getElementById('newOrderChannel').value;
  const status = document.getElementById('newOrderStatus').value;

  const newOrder = {
    id: generateOrderId(),
    customer: name,
    items: items,
    total: total,
    status: status,
    time: 'Just now',
    timestamp: Date.now()
  };

  ordersData.unshift(newOrder);
  updateMetrics();
  renderOrders(document.querySelector('.filter-pill.active')?.dataset.filter || 'all');
  closeCreateOrderModal();
  showToast(`Order ${newOrder.id} created successfully.`);
}

function renderOrders(filter = 'all') {
  const container = document.getElementById('ordersList');
  if (!container) return;

  const searchVal = (document.getElementById('ordersSearch')?.value || '').toLowerCase().trim();
  
  let filtered = ordersData;
  if (filter !== 'all') filtered = filtered.filter(o => o.status === filter);
  if (searchVal) filtered = filtered.filter(o => 
    o.id.toLowerCase().includes(searchVal) || 
    o.customer.toLowerCase().includes(searchVal)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No orders found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(o => `
    <div class="order-card">
      <div class="kv-row"><span class="label">Order ID</span><span class="value">${escapeHTML(o.id)}</span></div>
      <div class="kv-row"><span class="label">Customer</span><span class="value">${escapeHTML(o.customer)}</span></div>
      <div class="kv-row"><span class="label">Items</span><span class="value">${escapeHTML(o.items)}</span></div>
      <div class="kv-row"><span class="label">Total</span><span class="value">₦${o.total.toLocaleString()}</span></div>
      <div class="kv-row"><span class="label">Status</span>
        <span class="status-pill ${escapeHTML(o.status)}">
          <span class="dot"></span>
          ${escapeHTML(o.status.charAt(0).toUpperCase() + o.status.slice(1))}
        </span>
      </div>
      <div class="kv-row"><span class="label">Time</span><span class="value">${escapeHTML(o.time)}</span></div>
      <div class="action-row">
        <button class="btn-action-view" data-id="${escapeHTML(o.id)}">View</button>
      </div>
    </div>
  `).join('');
}

function updateMetrics() {
  const today = ordersData.length;
  const pending = ordersData.filter(o => o.status === 'pending').length;
  const paidTotal = ordersData.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0);
  const fulfilled = ordersData.filter(o => o.status === 'fulfilled').length;
  const completionRate = today > 0 ? Math.round((fulfilled / today) * 100) : 0;

  document.getElementById('ordersToday').textContent = today;
  document.getElementById('ordersPending').textContent = pending;
  document.getElementById('ordersPaid').textContent = `₦${paidTotal.toLocaleString()}`;
  document.getElementById('ordersFulfilled').textContent = `${completionRate}%`;
}