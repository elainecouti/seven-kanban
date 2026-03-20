/* Seven Midas Kanban — Board Rendering */

let cards = [];
let filteredCards = [];

function getClient(id) {
  return allClients.find(c => c.id === id);
}

function getMember(id) {
  return allMembers.find(m => m.id === id);
}

function getCategoryInfo(key) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
}

function getPriorityInfo(key) {
  return PRIORITIES.find(p => p.key === key) || PRIORITIES[2];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDate();
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return day + ' ' + months[d.getMonth()];
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  const due = new Date(dateStr + 'T12:00:00');
  return due < today;
}

function renderCard(card) {
  const client = getClient(card.client_id);
  const member = getMember(card.assignee_id);
  const cat = getCategoryInfo(card.category);
  const pri = getPriorityInfo(card.priority);
  const overdue = card.column_key !== 'done' && isOverdue(card.due_date);

  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = card.id;
  el.style.borderLeftColor = pri.color;

  el.innerHTML =
    '<div class="card-top">' +
      '<span class="card-title">' + escapeHtml(card.title) + '</span>' +
      '<button class="card-menu" onclick="event.stopPropagation();openCardDetail(\'' + card.id + '\')" title="Editar">&#8942;</button>' +
    '</div>' +
    '<div class="card-tags">' +
      (client ? '<span class="tag tag-client" style="background:' + client.color + '22;color:' + client.color + '">' + escapeHtml(client.name) + '</span>' : '') +
      '<span class="tag tag-cat">' + cat.icon + ' ' + cat.label + '</span>' +
    '</div>' +
    '<div class="card-bottom">' +
      (member ? '<span class="avatar" style="background:' + member.avatar_color + '" title="' + escapeHtml(member.name) + '">' + member.name.charAt(0) + '</span>' : '<span class="avatar avatar-empty">?</span>') +
      (card.due_date ? '<span class="card-due' + (overdue ? ' overdue' : '') + '">' + formatDate(card.due_date) + '</span>' : '') +
    '</div>';

  el.addEventListener('click', function(e) {
    if (!e.target.closest('.card-menu')) openCardDetail(card.id);
  });

  return el;
}

function renderBoard() {
  COLUMNS.forEach(function(col) {
    const container = document.getElementById('col-' + col.key);
    const countEl = document.getElementById('count-' + col.key);
    if (!container) return;

    const colCards = filteredCards.filter(c => c.column_key === col.key);
    countEl.textContent = colCards.length;

    // Keep sortable instance, just replace children
    container.innerHTML = '';
    colCards.sort((a, b) => a.position - b.position).forEach(function(card) {
      container.appendChild(renderCard(card));
    });
  });
}

function applyFilters() {
  const clientFilter = document.getElementById('filterClient').value;
  const catFilter = document.getElementById('filterCategory').value;
  const memberFilter = document.getElementById('filterMember').value;
  const search = document.getElementById('filterSearch').value.toLowerCase();

  filteredCards = cards.filter(function(c) {
    if (clientFilter && c.client_id !== clientFilter) return false;
    if (catFilter && c.category !== catFilter) return false;
    if (memberFilter && c.assignee_id !== memberFilter) return false;
    if (search && !c.title.toLowerCase().includes(search) && !(c.description || '').toLowerCase().includes(search)) return false;
    return true;
  });

  renderBoard();

  // Save filters
  localStorage.setItem('kanban_filters', JSON.stringify({
    client: clientFilter, category: catFilter, member: memberFilter, search: search
  }));
}

function restoreFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem('kanban_filters') || '{}');
    if (saved.client) document.getElementById('filterClient').value = saved.client;
    if (saved.category) document.getElementById('filterCategory').value = saved.category;
    if (saved.member) document.getElementById('filterMember').value = saved.member;
    if (saved.search) document.getElementById('filterSearch').value = saved.search;
  } catch(e) {}
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
