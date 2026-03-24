/* Seven Midas Kanban — Board Rendering */

let cards = [];
let filteredCards = [];
let cardChecklists = {}; // cache: cardId -> {total, checked}

function getClient(id) {
  return allClients.find(function(c) { return c.id === id; });
}

function getMember(id) {
  return allMembers.find(function(m) { return m.id === id; });
}

function getCategoryInfo(key) {
  return CATEGORIES.find(function(c) { return c.key === key; }) || CATEGORIES[CATEGORIES.length - 1];
}

function getPriorityInfo(key) {
  return PRIORITIES.find(function(p) { return p.key === key; }) || PRIORITIES[2];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr + 'T12:00:00');
  var day = d.getDate();
  var months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return day + ' ' + months[d.getMonth()];
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  var today = new Date();
  today.setHours(0,0,0,0);
  var due = new Date(dateStr + 'T12:00:00');
  return due < today;
}

function renderCard(card) {
  var client = getClient(card.client_id);
  var member = getMember(card.assignee_id);
  var cat = getCategoryInfo(card.category);
  var pri = getPriorityInfo(card.priority);
  var overdue = card.column_key !== 'done' && isOverdue(card.due_date);
  var cl = cardChecklists[card.id];

  var el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = card.id;
  el.style.borderLeftColor = pri.color;

  var progressHtml = '';
  if (cl && cl.total > 0) {
    var pct = Math.round((cl.checked / cl.total) * 100);
    var pctColor = pct === 100 ? '#00b894' : (pct > 50 ? '#6c5ce7' : '#ddd');
    progressHtml =
      '<div class="card-progress">' +
        '<div class="card-progress-bar"><div class="card-progress-fill" style="width:' + pct + '%;background:' + pctColor + '"></div></div>' +
        '<span class="card-progress-text">' + cl.checked + '/' + cl.total + '</span>' +
      '</div>';
  }

  el.innerHTML =
    '<div class="card-top">' +
      '<span class="card-title">' + escapeHtml(card.title) + '</span>' +
      '<button class="card-menu" onclick="event.stopPropagation();openCardDetail(\'' + card.id + '\')" title="Editar">&#8942;</button>' +
    '</div>' +
    progressHtml +
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
    var container = document.getElementById('col-' + col.key);
    var countEl = document.getElementById('count-' + col.key);
    if (!container) return;

    var colCards = filteredCards.filter(function(c) { return c.column_key === col.key; });
    countEl.textContent = colCards.length;

    container.innerHTML = '';
    colCards.sort(function(a, b) { return a.position - b.position; }).forEach(function(card) {
      container.appendChild(renderCard(card));
    });
  });
}

function applyFilters() {
  var clientFilter = document.getElementById('filterClient').value;
  var catFilter = document.getElementById('filterCategory').value;
  var memberFilter = document.getElementById('filterMember').value;
  var search = document.getElementById('filterSearch').value.toLowerCase();

  filteredCards = cards.filter(function(c) {
    if (clientFilter && c.client_id !== clientFilter) return false;
    if (catFilter && c.category !== catFilter) return false;
    if (memberFilter && c.assignee_id !== memberFilter) return false;
    if (search && !c.title.toLowerCase().includes(search) && !(c.description || '').toLowerCase().includes(search)) return false;
    return true;
  });

  renderBoard();

  localStorage.setItem('kanban_filters', JSON.stringify({
    client: clientFilter, category: catFilter, member: memberFilter, search: search
  }));
}

function restoreFilters() {
  try {
    var saved = JSON.parse(localStorage.getItem('kanban_filters') || '{}');
    if (saved.client) {
      var el = document.getElementById('filterClient');
      el.value = saved.client;
      // If saved value doesn't exist in dropdown, reset it
      if (el.value !== saved.client) { el.value = ''; saved.client = ''; }
    }
    if (saved.category) document.getElementById('filterCategory').value = saved.category;
    if (saved.member) {
      var el2 = document.getElementById('filterMember');
      el2.value = saved.member;
      if (el2.value !== saved.member) { el2.value = ''; saved.member = ''; }
    }
    if (saved.search) document.getElementById('filterSearch').value = saved.search;
  } catch(e) {}
}

// Load checklist counts for all cards
async function loadChecklistCounts() {
  var { data } = await sb.from('checklist_items').select('card_id, checked');
  if (!data) return;
  cardChecklists = {};
  data.forEach(function(item) {
    if (!cardChecklists[item.card_id]) cardChecklists[item.card_id] = { total: 0, checked: 0 };
    cardChecklists[item.card_id].total++;
    if (item.checked) cardChecklists[item.card_id].checked++;
  });
}

function escapeHtml(text) {
  var d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
