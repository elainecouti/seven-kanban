/* Seven Midas Kanban — App Init */

async function loadBoard() {
  await loadChecklistCounts();
  cards = await fetchCards();
  applyFilters();
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
  document.getElementById('filterClient').addEventListener('change', applyFilters);
  document.getElementById('filterCategory').addEventListener('change', applyFilters);
  document.getElementById('filterMember').addEventListener('change', applyFilters);
  document.getElementById('filterSearch').addEventListener('input', debounce(applyFilters, 300));

  // Detail overlay click
  document.getElementById('detailOverlay').addEventListener('click', closeDetail);

  // New card button — dropdown with "Nova" and "Template"
  document.getElementById('btnNew').addEventListener('click', openNewCardModal);
  document.getElementById('btnTemplate').addEventListener('click', openTemplatePicker);

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
  });
}

function debounce(fn, ms) {
  var t;
  return function() { clearTimeout(t); t = setTimeout(fn, ms); };
}

document.addEventListener('DOMContentLoaded', init);
