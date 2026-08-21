import { DataService, State } from "../../js/state.js";
import { showToast, confirmModal, escapeHTML } from "../../js/components/modals.js";

let catalogueItems = [];
let editingItemId = null;
let pendingDeleteId = null;
let activeCategoryFilter = 'all';
let imageEditItemId = null;
let pendingAvailabilityId = null;
let searchTimeout = null;

export async function init() {
  try {
    const initialData = await DataService.getCatalogue(State.currentBusiness);
    catalogueItems = initialData.map((item, index) => ({
      ...item,
      id: item.id || Date.now() + index + Math.random(), // improved ID uniqueness
      trackStock: item.trackStock !== undefined ? item.trackStock : true,
      offeringAvailable: item.offeringAvailable !== undefined ? item.offeringAvailable : true,
      imageUrl: item.imageUrl || null,
      description: item.description || 'A delicious menu item.',
      status: item.status || (item.trackStock && item.stock === 0 ? 'out' : item.trackStock && item.stock < 5 ? 'low' : 'active')
    }));
  } catch (error) {
    console.error("Failed to load catalogue:", error);
    showToast("Error loading catalogue. Please try again.");
    catalogueItems = [];
  }

  setTimeout(() => {
    const container = document.getElementById('catalogueList');
    if (!container) return;
    updateSummary();
    renderCategoryPills();
    renderCatalogue();
    bindEvents();
  }, 50);
}

// ---- Dynamic category pills ----
function renderCategoryPills() {
  const categories = [...new Set(catalogueItems.map(item => item.category).filter(Boolean))];
  const container = document.querySelector('#view-catalogue .filter-group:last-child');
  if (!container) return;
  const defaultPill = `<span class="filter-pill category-pill active" data-category="all">All Categories</span>`;
  if (categories.length === 0) {
    container.innerHTML = defaultPill;
  } else {
    container.innerHTML = defaultPill + categories.map(cat => `<span class="filter-pill category-pill" data-category="${cat}">${cat}</span>`).join('');
  }
  document.querySelectorAll('#view-catalogue .category-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#view-catalogue .category-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      activeCategoryFilter = this.dataset.category;
      renderCatalogue(document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all');
    });
  });
}

function bindEvents() {
  // Filters
  document.querySelectorAll('#view-catalogue .filter-pill:not(.category-pill)').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#view-catalogue .filter-pill:not(.category-pill)').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      renderCatalogue(this.dataset.filter);
    });
  });
  document.querySelectorAll('#view-catalogue .category-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#view-catalogue .category-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      activeCategoryFilter = this.dataset.category;
      renderCatalogue(document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all');
    });
  });

  // Debounced search
  document.getElementById('catalogueSearch')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const activeFilter = document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all';
      renderCatalogue(activeFilter);
    }, 300);
  });

  document.getElementById('clearCatalogueFilter')?.addEventListener('click', () => {
    document.getElementById('catalogueSearch').value = '';
    document.querySelector('.filter-pill[data-filter="all"]:not(.category-pill)')?.click();
    document.querySelector('.category-pill[data-category="all"]')?.click();
  });
  document.getElementById('resetCatalogueEmpty')?.addEventListener('click', () => {
    document.getElementById('clearCatalogueFilter')?.click();
  });

  // Modal Controls
  document.getElementById('newItemTrackStock')?.addEventListener('change', function() {
    document.getElementById('newItemStock').disabled = !this.checked;
    document.getElementById('stockCountGroup').style.opacity = this.checked ? '1' : '0.4';
    if (!this.checked) document.getElementById('newItemStock').value = '';
  });

  document.getElementById('addCatalogueBtn')?.addEventListener('click', () => {
    editingItemId = null;
    document.getElementById('catalogueModalTitle').textContent = 'Add Catalogue Item';
    document.getElementById('saveAddCatalogueModalBtn').textContent = 'Save Item';
    openAddCatalogueModal();
  });
  document.getElementById('closeAddCatalogueModalBtn')?.addEventListener('click', closeAddCatalogueModal);
  document.getElementById('cancelAddCatalogueModalBtn')?.addEventListener('click', closeAddCatalogueModal);
  document.getElementById('addCatalogueItemModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddCatalogueModal();
  });
  document.getElementById('saveAddCatalogueModalBtn')?.addEventListener('click', handleCatalogueSubmit);

  // Card Delegation
  document.getElementById('catalogueList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    const imgWrapper = e.target.closest('.catalogue-image-wrapper');
    const card = e.target.closest('.catalogue-card');
    const id = parseInt(card?.dataset?.id);
    if (!id) return;

    if (imgWrapper || (btn && btn.classList.contains('image-add-btn'))) {
      openImageModal(id);
      return;
    }
    if (!btn) return;

    if (btn.classList.contains('btn-catalogue-edit')) {
      const item = catalogueItems.find(i => i.id === id);
      if (item) {
        editingItemId = id;
        document.getElementById('catalogueModalTitle').textContent = 'Edit Catalogue Item';
        document.getElementById('saveAddCatalogueModalBtn').textContent = 'Update Item';
        document.getElementById('newItemName').value = item.name;
        document.getElementById('newItemCategory').value = item.category;
        document.getElementById('newItemPrice').value = item.price;
        document.getElementById('newItemDescription').value = item.description || '';
        const trackStock = item.trackStock !== false;
        document.getElementById('newItemTrackStock').checked = trackStock;
        document.getElementById('newItemStock').disabled = !trackStock;
        document.getElementById('stockCountGroup').style.opacity = trackStock ? '1' : '0.4';
        document.getElementById('newItemStock').value = trackStock ? (item.stock ?? 0) : '';
        document.getElementById('newItemOfferingAvailable').checked = item.offeringAvailable !== false;
        openAddCatalogueModal();
      }
    } else if (btn.classList.contains('btn-catalogue-delete')) {
      pendingDeleteId = id;
      const item = catalogueItems.find(i => i.id === id);
      document.getElementById('deleteItemName').textContent = `"${item.name}"`;
      document.getElementById('deleteConfirmModal').style.display = 'flex';
    } else if (btn.classList.contains('btn-catalogue-order')) {
      const item = catalogueItems.find(i => i.id === id);
      if (!item) return;
      if (item.offeringAvailable === false) {
        showToast(`Sorry, "${item.name}" is currently unavailable for ordering.`);
        return;
      }
      localStorage.setItem('cbs_prefill_order_item', item.name);
      window.location.hash = '#orders';
      showToast(`Redirecting to Orders for ${item.name}...`);
    }
  });

  // Stock Controls (+/- and Click-to-Edit)
  document.getElementById('catalogueList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.stock-btn');
    const valueSpan = e.target.closest('.stock-value');
    
    if (btn) {
      const id = parseInt(btn.dataset.id);
      const item = catalogueItems.find(i => i.id === id);
      if (!item || !item.trackStock) return;
      
      const delta = btn.classList.contains('inc') ? 1 : -1;
      const newStock = (item.stock || 0) + delta;
      if (newStock < 0) return;
      
      item.stock = newStock;
      if (newStock === 0) item.status = 'out';
      else if (newStock < 5) item.status = 'low';
      else item.status = 'active';
      
      updateSummary();
      renderCatalogue(document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all');
      // optional auto-save: saveCatalogue();
      return;
    }

    if (valueSpan && !valueSpan.classList.contains('editing')) {
      const id = parseInt(valueSpan.dataset.id);
      const item = catalogueItems.find(i => i.id === id);
      if (!item || !item.trackStock) return;
      
      const currentVal = item.stock;
      valueSpan.classList.add('editing');
      
      const input = document.createElement('input');
      input.type = 'number';
      input.value = currentVal;
      input.className = 'stock-edit-input';
      input.min = 0;
      
      const saveVal = () => {
        const newVal = parseInt(input.value);
        if (!isNaN(newVal) && newVal >= 0) {
          item.stock = newVal;
          if (newVal === 0) item.status = 'out';
          else if (newVal < 5) item.status = 'low';
          else item.status = 'active';
          updateSummary();
          renderCatalogue(document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all');
          // optional auto-save: saveCatalogue();
        } else {
          renderCatalogue(document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all');
        }
      };
      
      input.addEventListener('blur', saveVal);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { input.blur(); }
        if (e.key === 'Escape') { renderCatalogue(document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all'); }
      });
      
      valueSpan.replaceWith(input);
      input.focus();
      input.select();
    }
  });

  // Card Toggles
  document.getElementById('catalogueList')?.addEventListener('change', (e) => {
    const toggle = e.target.closest('.switch-wrapper input');
    if (!toggle) return;
    const card = toggle.closest('.catalogue-card');
    const id = parseInt(card?.dataset?.id);
    if (!id) return;
    const item = catalogueItems.find(i => i.id === id);
    if (!item) return;

    if (toggle.closest('.availability-row')) {
      const newState = toggle.checked;
      pendingAvailabilityId = id;
      document.getElementById('availItemName').textContent = item.name;
      document.getElementById('availNewState').textContent = newState ? 'Available' : 'Unavailable';
      document.getElementById('availabilityConfirmModal').style.display = 'flex';
      toggle.checked = !newState;
      return;
    }

    if (toggle.closest('.stock-row')) {
      const isChecked = toggle.checked;
      item.trackStock = isChecked;
      if (!isChecked) {
        item.stock = null;
        item.status = 'active';
      } else {
        if (item.stock === null) item.stock = 5; 
        if (item.stock === 0) item.status = 'out';
        else if (item.stock < 5) item.status = 'low';
        else item.status = 'active';
      }
      const stockFilter = document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all';
      updateSummary();
      renderCatalogue(stockFilter);
      showToast(isChecked ? `Stock tracking enabled for ${item.name}` : `Stock tracking disabled for ${item.name}`);
      // optional auto-save: saveCatalogue();
    }
  });

  // Availability Confirmation
  document.getElementById('cancelAvailBtn')?.addEventListener('click', () => {
    document.getElementById('availabilityConfirmModal').style.display = 'none';
    pendingAvailabilityId = null;
  });
  document.getElementById('availabilityConfirmModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('availabilityConfirmModal').style.display = 'none';
      pendingAvailabilityId = null;
    }
  });
  document.getElementById('confirmAvailBtn')?.addEventListener('click', () => {
    if (pendingAvailabilityId !== null) {
      const item = catalogueItems.find(i => i.id === pendingAvailabilityId);
      if (item) {
        item.offeringAvailable = !item.offeringAvailable;
        const stockFilter = document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all';
        renderCatalogue(stockFilter);
        updateSummary();
        showToast(`"${item.name}" is now ${item.offeringAvailable ? 'Available' : 'Unavailable'}.`);
        // optional auto-save: saveCatalogue();
      }
      document.getElementById('availabilityConfirmModal').style.display = 'none';
      pendingAvailabilityId = null;
    }
  });

  // Delete Confirmation – FIXED: no double confirmModal
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
    document.getElementById('deleteConfirmModal').style.display = 'none';
    pendingDeleteId = null;
  });
  document.getElementById('deleteConfirmModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('deleteConfirmModal').style.display = 'none';
      pendingDeleteId = null;
    }
  });
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
    if (pendingDeleteId !== null) {
      const item = catalogueItems.find(i => i.id === pendingDeleteId);
      if (item) {
        catalogueItems = catalogueItems.filter(i => i.id !== pendingDeleteId);
        updateSummary();
        renderCatalogue(document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all');
        showToast('Item deleted successfully.');
        // optional auto-save: saveCatalogue();
      }
      document.getElementById('deleteConfirmModal').style.display = 'none';
      pendingDeleteId = null;
    }
  });

  // Image Management
  document.getElementById('closeImgModalBtn')?.addEventListener('click', closeImageModal);
  document.getElementById('imageManagementModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeImageModal();
  });
  document.getElementById('changeImgBtn')?.addEventListener('click', () => {
    document.getElementById('changeImageInput').click();
  });
  document.getElementById('changeImageInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const item = catalogueItems.find(i => i.id === imageEditItemId);
        if (item) {
          item.imageUrl = ev.target.result;
          const stockFilter = document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all';
          renderCatalogue(stockFilter);
          closeImageModal();
          showToast('Image updated successfully!');
          // optional auto-save: saveCatalogue();
        }
      };
      reader.readAsDataURL(file);
    }
  });
  document.getElementById('removeImgBtn')?.addEventListener('click', () => {
    const item = catalogueItems.find(i => i.id === imageEditItemId);
    if (item) {
      item.imageUrl = null;
      const stockFilter = document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all';
      renderCatalogue(stockFilter);
      closeImageModal();
      showToast('Image removed.');
      // optional auto-save: saveCatalogue();
    }
  });

  // Import
  document.getElementById('catalogueImportBtn')?.addEventListener('click', () => {
    showToast("Catalogue import is reserved for the API integration stage.");
  });
}

function openAddCatalogueModal() { document.getElementById('addCatalogueItemModal').style.display = 'flex'; }
function closeAddCatalogueModal() {
  document.getElementById('addCatalogueItemModal').style.display = 'none';
  if (editingItemId === null) {
    document.getElementById('newItemName').value = '';
    document.getElementById('newItemCategory').value = '';
    document.getElementById('newItemPrice').value = '';
    document.getElementById('newItemDescription').value = '';
    document.getElementById('newItemStock').value = '';
    document.getElementById('newItemOfferingAvailable').checked = true;
  }
  editingItemId = null;
}

function openImageModal(id) {
  imageEditItemId = id;
  const item = catalogueItems.find(i => i.id === id);
  if (!item) return;
  const img = document.getElementById('imgPreview');
  const placeholder = document.getElementById('imgPlaceholder');
  const changeBtn = document.getElementById('changeImgBtn');
  if (item.imageUrl) {
    img.src = item.imageUrl; img.style.display = 'block'; placeholder.style.display = 'none';
    changeBtn.textContent = 'Change Image';
  } else {
    img.style.display = 'none'; placeholder.style.display = 'block';
    changeBtn.textContent = 'Add Image';
  }
  document.getElementById('imageManagementModal').style.display = 'flex';
}
function closeImageModal() {
  document.getElementById('imageManagementModal').style.display = 'none';
  imageEditItemId = null;
  document.getElementById('changeImageInput').value = '';
}

function handleCatalogueSubmit() {
  const name = document.getElementById('newItemName').value.trim();
  const category = document.getElementById('newItemCategory').value.trim();
  const priceRaw = document.getElementById('newItemPrice').value.trim();
  const description = document.getElementById('newItemDescription').value.trim() || 'A delicious menu item.';
  const trackStock = document.getElementById('newItemTrackStock').checked;
  const offeringAvailable = document.getElementById('newItemOfferingAvailable').checked;

  if (!name || !category || !priceRaw) {
    showToast('Please fill in Name, Category, and Price.');
    return;
  }
  const price = parseInt(priceRaw);
  if (isNaN(price) || price <= 0) {
    showToast('Please enter a valid positive number for the price.');
    return;
  }

  let stock = null;
  let status = 'active';
  if (trackStock) {
    const stockRaw = document.getElementById('newItemStock').value.trim();
    if (!stockRaw) {
      showToast('Please enter a stock quantity or uncheck "Track stock quantity".');
      return;
    }
    stock = parseInt(stockRaw);
    if (isNaN(stock) || stock < 0) {
      showToast('Please enter a valid number for stock (0 or higher).');
      return;
    }
    if (stock === 0) status = 'out';
    else if (stock < 5) status = 'low';
  }

  if (editingItemId !== null) {
    const index = catalogueItems.findIndex(i => i.id === editingItemId);
    if (index !== -1) {
      catalogueItems[index].name = name; catalogueItems[index].category = category;
      catalogueItems[index].price = price; catalogueItems[index].description = description;
      catalogueItems[index].trackStock = trackStock; catalogueItems[index].stock = stock;
      catalogueItems[index].status = status; catalogueItems[index].offeringAvailable = offeringAvailable;
      showToast(`Updated "${name}".`);
    }
  } else {
    const newItem = { 
      id: Date.now() + Math.random(), // more unique
      name, category, price, stock, status, trackStock, offeringAvailable, imageUrl: null, description 
    };
    catalogueItems.unshift(newItem);
    showToast(`Added "${name}" to catalogue.`);
  }

  updateSummary();
  const stockFilter = document.querySelector('.filter-pill.active:not(.category-pill)')?.dataset.filter || 'all';
  renderCatalogue(stockFilter);
  closeAddCatalogueModal();
  // optional auto-save: saveCatalogue();
}

function renderCatalogue(stockFilter = 'all') {
  const container = document.getElementById('catalogueList');
  if (!container) return;

  const searchVal = (document.getElementById('catalogueSearch')?.value || '').toLowerCase().trim();
  let filtered = catalogueItems;
  if (stockFilter !== 'all') filtered = filtered.filter(item => item.status === stockFilter);
  if (activeCategoryFilter !== 'all') filtered = filtered.filter(item => item.category === activeCategoryFilter);
  if (searchVal) filtered = filtered.filter(item => item.name.toLowerCase().includes(searchVal) || item.category.toLowerCase().includes(searchVal));

  const emptyState = document.getElementById('catalogueEmpty');
  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  container.innerHTML = filtered.map(item => {
    let stockDisplay = 'Unlimited';
    let stockColor = 'grey';
    let checkedStock = item.trackStock !== false ? 'checked' : '';
    let isOutOfStock = false;
    let showControls = false;
    
    if (item.trackStock && item.stock !== null && item.stock !== undefined) {
      stockDisplay = item.stock;
      showControls = true;
      if (item.stock === 0) { stockColor = 'red'; isOutOfStock = true; }
      else if (item.stock < 5) stockColor = 'yellow';
      else stockColor = 'green';
    }

    const isAvailable = item.offeringAvailable !== false;

    // ---- BADGES ----
    let stockBadge = '';
    if (!item.trackStock) {
      stockBadge = `<span class="stock-badge unlimited">Unlimited</span>`;
    } else if (item.stock === 0) {
      stockBadge = `<span class="stock-badge out">Out of Stock</span>`;
    } else if (item.stock < 5) {
      stockBadge = `<span class="stock-badge low">Low Stock</span>`;
    } else {
      stockBadge = `<span class="stock-badge in">In Stock</span>`;
    }
    const availBadge = isAvailable
      ? `<span class="avail-badge available">Available</span>`
      : `<span class="avail-badge unavailable">Unavailable</span>`;

    // FIXED: escape image URL to prevent XSS
    const imageUrlSafe = item.imageUrl ? escapeHTML(item.imageUrl) : '';
    const imageHtml = item.imageUrl 
      ? `<img src="${imageUrlSafe}" alt="${escapeHTML(item.name)}" />` 
      : `<span style="color: var(--text-muted); font-size: 32px;">📦</span>`;

    return `
      <div class="catalogue-card ${isOutOfStock ? 'out-of-stock' : ''} ${!isAvailable ? 'unavailable' : ''}" data-id="${item.id}">
        <div class="badge-container" style="display:flex; gap:8px; position:absolute; top:10px; right:10px;">
          ${stockBadge}
          ${availBadge}
        </div>

        <div class="catalogue-image-wrapper">
          ${imageHtml}
          <button class="image-add-btn" type="button">+</button>
        </div>

        <div class="catalogue-title">${escapeHTML(item.name)}</div>
        <div class="catalogue-price">₦${item.price.toLocaleString()}</div>
        <div class="catalogue-desc">${escapeHTML(item.description)}</div>
        
        <div class="stock-row">
          <div class="stock-display">
            <span class="stock-label">Bot-managed stock</span>
            <div class="stock-controls">
              ${showControls ? `
                <button class="stock-btn dec" data-id="${item.id}">−</button>
                <span class="stock-value ${stockColor}" data-id="${item.id}" data-value="${stockDisplay}">${stockDisplay}</span>
                <button class="stock-btn inc" data-id="${item.id}">+</button>
              ` : `
                <span class="stock-value grey" style="cursor: default;">Unlimited</span>
              `}
            </div>

          </div>  
          <div class="stock-toggle-control">
            <label class="switch-wrapper">
              <input type="checkbox" ${checkedStock} />
              <span class="slider round"></span>
            </label>

            <span class="switch-hint">
              Set to “Unlimited” if the offering is a service or if it is a product with an unknown stock quantity.
            </span>
          </div>
        </div>

        <div class="availability-row">
          <div class="availability-display">
            <span class="availability-label">Offering availability</span>
            <span class="availability-status ${isAvailable ? 'available' : 'unavailable'}">${isAvailable ? 'Available' : 'Unavailable'}</span>
          </div>
          <label class="switch-wrapper availability-switch">
            <input type="checkbox" ${isAvailable ? 'checked' : ''} />
            <span class="slider round"></span>
          </label>
        </div>

        <div class="catalogue-actions">
          <button class="btn-catalogue-edit">Edit Item</button>
          <button class="btn-catalogue-delete">Delete Item</button>
          <button class="btn-catalogue-order" ${!isAvailable ? 'disabled' : ''}>+ Create Order</button>
        </div>
      </div>
    `;
  }).join('');
}

function updateSummary() {
  const activeItems = catalogueItems.filter(i => i.status === 'active' || !i.trackStock);
  document.getElementById('catalogueTotal').textContent = catalogueItems.length;
  document.getElementById('catalogueActive').textContent = activeItems.length;
  document.getElementById('catalogueLow').textContent = catalogueItems.filter(i => i.status === 'low').length;
  document.getElementById('catalogueOut').textContent = catalogueItems.filter(i => i.status === 'out').length;
}

// --- Placeholder for future persistence ---
// async function saveCatalogue() {
//   await DataService.saveCatalogue(State.currentBusiness, catalogueItems);
// }