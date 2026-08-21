import { showToast, escapeHTML } from "../../js/components/modals.js";

const conversationsData = [
  {
    id: '1', customer: 'Ngozi E.',
    messages: [
      { type: 'user', text: 'Hi! Do you have any vegetarian options?', timestamp: Date.now() - 60000 },
      { type: 'bot', text: 'Yes, we offer a delicious veggie jollof rice!', timestamp: Date.now() - 30000 }
    ],
    time_ago: 'Just now',
    status: { isClosed: false, handledBy: 'bot', isSuccessful: true, needsAttention: false }
  },
  {
    id: '2', customer: 'Chidi A.',
    messages: [
      { type: 'user', text: 'Is my order ready?', timestamp: Date.now() - 600000 },
      { type: 'bot', text: 'I am checking the kitchen for you...', timestamp: Date.now() - 590000 }
    ],
    time_ago: '10 min ago',
    status: { isClosed: false, handledBy: 'human', isSuccessful: true, needsAttention: false }
  },
  {
    id: '3', customer: 'Amara B.',
    messages: [
      { type: 'user', text: 'Do you deliver on Sundays?', timestamp: Date.now() - 1500000 }
    ],
    time_ago: '25 min ago',
    status: { isClosed: true, handledBy: 'bot', isSuccessful: false, needsAttention: false }
  },
  {
    id: '4', customer: 'Tunde C.',
    messages: [
      { type: 'user', text: 'Can I change my delivery address?', timestamp: Date.now() - 2400000 },
      { type: 'bot', text: 'Please visit your account settings.', timestamp: Date.now() - 2350000 }
    ],
    time_ago: '40 min ago',
    status: { isClosed: true, handledBy: 'human', isSuccessful: true, needsAttention: false }
  },
  {
    id: '5', customer: 'Ngozi D.',
    messages: [
      { type: 'user', text: 'I want to order 2 plates of jollof rice', timestamp: Date.now() - 3300000 }
    ],
    time_ago: '55 min ago',
    status: { isClosed: false, handledBy: 'bot', isSuccessful: true, needsAttention: true }
  }
];

function getStatusConfig(status) {
  const { isClosed, handledBy, isSuccessful, needsAttention } = status;
  
  if (needsAttention) {
    return { text: 'Needs attention', pill: 'pill-red', dot: 'dot-red', pulse: true };
  }

  const handlerStr = handledBy === 'bot' ? 'Bot' : 'Human';
  
  if (isClosed) {
    if (!isSuccessful) {
      return { text: `Unresolved · ${handlerStr} handled`, pill: 'pill-orange', dot: 'dot-orange', pulse: false };
    }
    return { text: `Closed · ${handlerStr} handled`, pill: 'pill-grey', dot: 'dot-grey', pulse: false };
  } else {
    return { text: `Active · ${handlerStr} handling`, pill: 'pill-green', dot: 'dot-green', pulse: true };
  }
}

function getLatestMessages(messages) {
  const latestUser = messages.filter(m => m.type === 'user').sort((a, b) => b.timestamp - a.timestamp)[0];
  const latestBot = messages.filter(m => m.type === 'bot').sort((a, b) => b.timestamp - a.timestamp)[0];
  
  let displayMessages = [];
  if (latestUser) displayMessages.push(latestUser);
  if (latestBot) displayMessages.push(latestBot);
  displayMessages.sort((a, b) => a.timestamp - b.timestamp);
  return displayMessages;
}

function renderConversation(conv) {
  const status = getStatusConfig(conv.status);
  const sortedMessages = getLatestMessages(conv.messages);
  
  let messageRows = sortedMessages.map((msg) => {
    const label = msg.type === 'user' ? 'Message' : 'Bot reply';
    return `<div class="kv-row"><span class="label">${label}</span><span class="value">${escapeHTML(msg.text)}</span></div>`;
  }).join('');

  let actionButtons = `<button class="btn-action btn-view" data-id="${conv.id}">View</button>`;
  if (!conv.status.isClosed) {
    if (conv.status.handledBy === 'bot') {
      actionButtons += `<button class="btn-action btn-takeover" data-id="${conv.id}">Takeover from bot</button>`;
    } else {
      actionButtons += `<button class="btn-action btn-handover" data-id="${conv.id}">Handover to bot</button>`;
    }
  }

  return `
    <div class="conversation-card" data-id="${conv.id}" data-status="${conv.status.isClosed ? 'closed' : 'active'}" data-handler="${conv.status.handledBy}">
      <div class="kv-row"><span class="label">Customer</span><span class="value">${escapeHTML(conv.customer)}</span></div>
      ${messageRows}
      <div class="kv-row"><span class="label">Time</span><span class="value">${escapeHTML(conv.time_ago)}</span></div>
      <div class="kv-row">
        <span class="label">Status</span>
        <div class="status-pill ${status.pill}">
          <span class="dot ${status.dot} ${status.pulse ? 'ping' : ''}"></span>
          <span>${escapeHTML(status.text)}</span>
        </div>
      </div>
      <div class="action-row">${actionButtons}</div>
    </div>
  `;
}

export function init() {
  const listContainer = document.getElementById('conversationList');
  
  function refreshList(filter = 'All') {
    let filteredData = conversationsData;
    if (filter === 'Needs attention') {
      filteredData = conversationsData.filter(c => c.status.needsAttention === true);
    } else if (filter === 'Bot handled') {
      filteredData = conversationsData.filter(c => c.status.isClosed === true && c.status.handledBy === 'bot');
    } else if (filter === 'Human handled') {
      filteredData = conversationsData.filter(c => c.status.isClosed === true && c.status.handledBy === 'human');
    }
    listContainer.innerHTML = filteredData.map(renderConversation).join('');
  }

  refreshList();

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      refreshList(this.textContent.trim());
    });
  });

  listContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const card = btn.closest('.conversation-card');
    
    if (btn.classList.contains('btn-view')) {
      showToast(`Opening conversation ${id}...`);
    } else if (btn.classList.contains('btn-takeover')) {
      showToast(`Taking over from bot for conversation ${id}`);
      setTimeout(() => {
        showToast('Success: You are now handling this chat.');
        btn.className = 'btn-action btn-handover';
        btn.textContent = 'Handover to bot';
        const pill = card.querySelector('.status-pill');
        pill.className = 'status-pill pill-green';
        pill.innerHTML = `<span class="dot dot-green ping"></span><span>Active · Human handling</span>`;
      }, 1500);
    } else if (btn.classList.contains('btn-handover')) {
      showToast(`Handing over to bot for conversation ${id}`);
      setTimeout(() => {
        showToast('Success: Bot has resumed handling.');
        btn.className = 'btn-action btn-takeover';
        btn.textContent = 'Takeover from bot';
        const pill = card.querySelector('.status-pill');
        pill.className = 'status-pill pill-green';
        pill.innerHTML = `<span class="dot dot-green ping"></span><span>Active · Bot handling</span>`;
      }, 1500);
    }
  });

  document.querySelectorAll("#view-conversations [data-action]").forEach((btn) => {
    btn.addEventListener("click", () =>
      showToast(`${btn.dataset.action.replace(/-/g, " ")} action is ready.`)
    );
  });
}