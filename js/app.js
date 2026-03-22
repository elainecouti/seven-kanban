/* Seven Midas Kanban — App Init */

let overdueFilterActive = false;
let currentView = 'board'; // 'board', 'calendar', 'dashboard'

async function loadBoard() {
  await loadChecklistCounts();
  cards = await fetchCards();

  // Auto-archive: cards in "done" with completed_at older than 7 days
  await autoArchiveCompleted();

  applyFilters();

  // Re-render current view if not board
  if (currentView === 'calendar') renderCalendar();
  else if (currentView === 'dashboard') renderDashboard();
  else if (currentView === 'clients') renderClientsPanel();
}

async function autoArchiveCompleted() {
  var now = new Date();
  var sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  var toArchive = cards.filter(function(c) {
    if (c.column_key !== 'done' || !c.completed_at) return false;
    var completedAt = new Date(c.completed_at);
    return completedAt < sevenDaysAgo;
  });
  for (var i = 0; i < toArchive.length; i++) {
    try {
      await updateCard(toArchive[i].id, { archived: true });
      cards = cards.filter(function(c) { return c.id !== toArchive[i].id; });
    } catch(e) { /* ignore errors */ }
  }
}

async function init() {
  document.getElementById('loading').style.display = 'flex';

  var currentUser = localStorage.getItem('kanban_user');
  if (!currentUser) {
    document.getElementById('userPicker').style.display = 'flex';
    document.getElementById('loading').style.display = 'none';
  }

  await Promise.all([fetchClients(), fetchMembers(), fetchTemplates()]);

  // User picker
  var userList = document.getElementById('userList');
  allMembers.forEach(function(m) {
    var btn = document.createElement('button');
    btn.className = 'user-btn';
    btn.innerHTML = '<span class="avatar-lg" style="background:' + m.avatar_color + '">' + m.name.charAt(0) + '</span>' + m.name;
    btn.onclick = function() {
      localStorage.setItem('kanban_user', m.id);
      localStorage.setItem('kanban_user_name', m.name);
      document.getElementById('userPicker').style.display = 'none';
      document.getElementById('currentUser').textContent = m.name;
      document.getElementById('currentUserAvatar').style.background = m.avatar_color;
      document.getElementById('currentUserAvatar').textContent = m.name.charAt(0);
      finishInit();
    };
    userList.appendChild(btn);
  });

  if (currentUser) {
    var user = allMembers.find(function(m) { return m.id === currentUser; });
    if (user) {
      document.getElementById('currentUser').textContent = user.name;
      document.getElementById('currentUserAvatar').style.background = user.avatar_color;
      document.getElementById('currentUserAvatar').textContent = user.name.charAt(0);
    }
    finishInit();
  }
}

async function finishInit() {
  populateFilterDropdowns();
  restoreFilters();
  await loadBoard();
  initSortable();
  document.getElementById('loading').style.display = 'none';

  subscribeCards(function() { loadBoard(); });

  // Filter events
  document.getElementById('filterClient').addEventListener('change', function() {
    applyFilters();
    if (currentView === 'calendar') renderCalendar();
    else if (currentView === 'dashboard') renderDashboard();
  });
  document.getElementById('filterCategory').addEventListener('change', function() {
    applyFilters();
    if (currentView === 'calendar') renderCalendar();
    else if (currentView === 'dashboard') renderDashboard();
  });
  document.getElementById('filterMember').addEventListener('change', function() {
    applyFilters();
    if (currentView === 'calendar') renderCalendar();
    else if (currentView === 'dashboard') renderDashboard();
  });
  document.getElementById('filterSearch').addEventListener('input', debounce(function() {
    applyFilters();
    if (currentView === 'calendar') renderCalendar();
    else if (currentView === 'dashboard') renderDashboard();
  }, 300));

  // Detail overlay click
  document.getElementById('detailOverlay').addEventListener('click', closeDetail);

  // New card button
  document.getElementById('btnNew').addEventListener('click', openNewCardModal);
  document.getElementById('btnTemplate').addEventListener('click', openTemplatePicker);

  // Calendar toggle
  document.getElementById('btnCalendar').addEventListener('click', function() {
    if (currentView === 'calendar') {
      currentView = 'board';
      showBoardView();
    } else {
      currentView = 'calendar';
      showCalendarView();
    }
  });

  // Dashboard toggle
  document.getElementById('btnDashboard').addEventListener('click', function() {
    if (currentView === 'dashboard') {
      currentView = 'board';
      showBoardView();
    } else {
      currentView = 'dashboard';
      showDashboardView();
    }
  });

  // Clients Panel toggle
  document.getElementById('btnClientsPanel').addEventListener('click', function() {
    if (currentView === 'clients') {
      currentView = 'board';
      showBoardView();
    } else {
      currentView = 'clients';
      showClientsPanelView();
    }
  });

  // Mobile tabs
  function activateMobileTab(colKey) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.column === colKey); });
    document.querySelectorAll('.column').forEach(function(c) { c.classList.toggle('mobile-active', c.dataset.column === colKey); });
  }
  activateMobileTab('todo');
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { activateMobileTab(btn.dataset.column); });
  });

  // Change user
  document.getElementById('changeUser').addEventListener('click', function() {
    document.getElementById('userPicker').style.display = 'flex';
  });

  // My tasks
  document.getElementById('btnMyTasks').addEventListener('click', function() {
    var userId = localStorage.getItem('kanban_user');
    var mf = document.getElementById('filterMember');
    mf.value = mf.value === userId ? '' : userId;
    this.classList.toggle('active');
    applyFilters();
    if (currentView === 'calendar') renderCalendar();
    else if (currentView === 'dashboard') renderDashboard();
  });

  // Overdue filter
  document.getElementById('btnOverdue').addEventListener('click', function() {
    overdueFilterActive = !overdueFilterActive;
    this.classList.toggle('active', overdueFilterActive);
    applyFilters();
    if (currentView === 'calendar') renderCalendar();
    else if (currentView === 'dashboard') renderDashboard();
  });
}

// Override applyFilters to support overdue filter
var _originalApplyFilters = applyFilters;
applyFilters = function() {
  var clientFilter = document.getElementById('filterClient').value;
  var catFilter = document.getElementById('filterCategory').value;
  var memberFilter = document.getElementById('filterMember').value;
  var search = document.getElementById('filterSearch').value.toLowerCase();

  filteredCards = cards.filter(function(c) {
    if (clientFilter && c.client_id !== clientFilter) return false;
    if (catFilter && c.category !== catFilter) return false;
    if (memberFilter && c.assignee_id !== memberFilter) return false;
    if (search && !c.title.toLowerCase().includes(search) && !(c.description || '').toLowerCase().includes(search)) return false;
    if (overdueFilterActive) {
      if (c.column_key === 'done') return false;
      if (!c.due_date) return false;
      if (!isOverdue(c.due_date)) return false;
    }
    return true;
  });

  renderBoard();

  localStorage.setItem('kanban_filters', JSON.stringify({
    client: clientFilter, category: catFilter, member: memberFilter, search: search
  }));
};

function debounce(fn, ms) {
  var t;
  return function() { clearTimeout(t); t = setTimeout(fn, ms); };
}

document.addEventListener('DOMContentLoaded', init);
