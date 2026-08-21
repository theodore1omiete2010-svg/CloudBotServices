import { showToast, confirmModal, escapeHTML } from "../../js/components/modals.js";

let faqs = [];
let editingId = null;
let pendingDeleteId = null;
let currentCategory = 'all';

const defaultFaqs = [
  { id: 1, question: 'Do you deliver to Lekki?', answer: 'Yes. We deliver across Lekki and selected nearby areas.', category: 'Delivery' },
  { id: 2, question: 'What payment methods do you accept?', answer: 'Customers can pay through the supported payment link.', category: 'Payments' },
  { id: 3, question: 'How long does delivery take?', answer: 'Typical delivery time depends on location and traffic.', category: 'Delivery' },
  { id: 4, question: 'Can I cancel my order?', answer: 'Yes, you can cancel within 5 minutes of placing the order.', category: 'Orders' },
];

export function init() {
  const stored = localStorage.getItem('cbs_faqs');
  if (stored) {
    try { faqs = JSON.parse(stored); } catch { faqs = defaultFaqs; }
  } else {
    faqs = defaultFaqs;
  }
  faqs = faqs.map((f, i) => ({ ...f, id: f.id || Date.now() + i }));
  bindEvents();
  render();
}

function bindEvents() {
  document.getElementById('faqSearch')?.addEventListener('input', render);

  document.querySelectorAll('#faqCategoryPills .filter-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('#faqCategoryPills .filter-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentCategory = this.dataset.category;
      render();
    });
  });

  document.getElementById('addFaqBtn')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('faqModalTitle').textContent = 'Add FAQ';
    document.getElementById('saveFaqModalBtn').textContent = 'Save FAQ';
    document.getElementById('faqQuestion').value = '';
    document.getElementById('faqAnswer').value = '';
    document.getElementById('faqCategory').value = '';
    document.getElementById('faqModal').style.display = 'flex';
  });

  document.getElementById('closeFaqModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('cancelFaqModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('faqModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('saveFaqModalBtn')?.addEventListener('click', handleSave);

  document.getElementById('clearFaqFilter')?.addEventListener('click', () => {
    document.getElementById('faqSearch').value = '';
    document.querySelector('#faqCategoryPills .filter-pill[data-category="all"]')?.click();
  });

  document.getElementById('resetFaqEmpty')?.addEventListener('click', () => {
    document.getElementById('clearFaqFilter')?.click();
  });

  document.getElementById('cancelDeleteFaqBtn')?.addEventListener('click', () => {
    document.getElementById('deleteFaqModal').style.display = 'none';
    pendingDeleteId = null;
  });
  document.getElementById('deleteFaqModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('deleteFaqModal').style.display = 'none';
      pendingDeleteId = null;
    }
  });
  document.getElementById('confirmDeleteFaqBtn')?.addEventListener('click', async () => {
    if (pendingDeleteId !== null) {
      const faq = faqs.find(f => f.id === pendingDeleteId);
      if (faq) {
        const confirmed = await confirmModal(`Are you sure you want to permanently delete "${faq.question}"?`, "Delete FAQ?");
        if (confirmed) {
          faqs = faqs.filter(f => f.id !== pendingDeleteId);
          saveToStorage();
          render();
          showToast('FAQ deleted.');
        }
      }
      document.getElementById('deleteFaqModal').style.display = 'none';
      pendingDeleteId = null;
    }
  });

  document.getElementById('faqList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.mini-button');
    if (!btn) return;
    const card = btn.closest('.faq-card');
    if (!card) return;
    const id = parseInt(card.dataset.id);
    const faq = faqs.find(f => f.id === id);
    if (!faq) return;

    if (btn.dataset.action === 'edit') {
      editingId = id;
      document.getElementById('faqModalTitle').textContent = 'Edit FAQ';
      document.getElementById('saveFaqModalBtn').textContent = 'Update FAQ';
      document.getElementById('faqQuestion').value = faq.question;
      document.getElementById('faqAnswer').value = faq.answer;
      document.getElementById('faqCategory').value = faq.category;
      document.getElementById('faqModal').style.display = 'flex';
    } else if (btn.dataset.action === 'delete') {
      pendingDeleteId = id;
      document.getElementById('deleteFaqName').textContent = `"${faq.question}"`;
      document.getElementById('deleteFaqModal').style.display = 'flex';
    }
  });
}

function closeModal() {
  document.getElementById('faqModal').style.display = 'none';
  editingId = null;
}

function handleSave() {
  const question = document.getElementById('faqQuestion').value.trim();
  const answer = document.getElementById('faqAnswer').value.trim();
  const category = document.getElementById('faqCategory').value.trim();

  if (!question || !answer || !category) {
    showToast('Please fill in all fields.');
    return;
  }

  if (editingId !== null) {
    const index = faqs.findIndex(f => f.id === editingId);
    if (index !== -1) {
      faqs[index] = { ...faqs[index], question, answer, category };
      showToast('FAQ updated.');
    }
  } else {
    const newFaq = { id: Date.now(), question, answer, category };
    faqs.unshift(newFaq);
    showToast('FAQ created.');
  }

  saveToStorage();
  render();
  closeModal();
}

function saveToStorage() {
  localStorage.setItem('cbs_faqs', JSON.stringify(faqs));
}

function render() {
  const container = document.getElementById('faqList');
  if (!container) return;

  const search = (document.getElementById('faqSearch')?.value || '').toLowerCase().trim();

  let filtered = faqs;
  if (currentCategory !== 'all') {
    filtered = filtered.filter(f => f.category.toLowerCase() === currentCategory.toLowerCase());
  }
  if (search) {
    filtered = filtered.filter(f =>
      f.question.toLowerCase().includes(search) ||
      f.answer.toLowerCase().includes(search)
    );
  }

  const total = faqs.length;
  const categories = [...new Set(faqs.map(f => f.category))];
  document.getElementById('faqTotal').textContent = total;
  document.getElementById('faqCategories').textContent = categories.length;
  if (categories.length) {
    const counts = categories.map(cat => ({ cat, count: faqs.filter(f => f.category === cat).length }));
    const top = counts.reduce((a, b) => a.count > b.count ? a : b);
    document.getElementById('faqTopCategory').textContent = top.cat;
  } else {
    document.getElementById('faqTopCategory').textContent = '—';
  }
  const lastUpdated = faqs.length ? new Date(Math.max(...faqs.map(f => f.id))).toLocaleDateString() : '—';
  document.getElementById('faqLastUpdated').textContent = lastUpdated;

  if (filtered.length === 0) {
    container.innerHTML = '';
    document.getElementById('faqEmpty').style.display = 'flex';
    return;
  }
  document.getElementById('faqEmpty').style.display = 'none';

  container.innerHTML = filtered.map(f => `
    <div class="faq-card" data-id="${f.id}">
      <div class="faq-question">${escapeHTML(f.question)}</div>
      <div class="faq-answer">${escapeHTML(f.answer)}</div>
      <div class="faq-footer">
        <span class="tag">${escapeHTML(f.category)}</span>
        <div class="faq-actions">
          <button class="mini-button" data-action="edit">Edit</button>
          <button class="mini-button danger" data-action="delete">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}