/* Seven Midas Kanban — App Init */

async function loadBoard() {
  cards = await fetchCards();
  applyFilters();
}

async function init() {
  // Show loading
  document.getElementById('loading').style.display = 'flex';

  // Check user
  const currentUser = localStorage.getItem('kanban_user');
  if (!currentUser) {
    document.getElementById('userPicker').style.display = 'flex';
    document.getElementById('loading').style.display = 'none';
  }

  // Load data
  await Promise.all([fetchClients(), fetchMembers()]);

  // Populate user picker
  const userList = document.getElementById('userList');
  allMembers.forEach(function(m) {
    const btn = document.createElement('button');
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
    const user = allMembers.find(m => m.id === currentUser);
    if (user) {
      document.getElementById('currentUser').textContent = user.name;
      document.getElementById('currentUserAvatar').style.background = user.avatar_color;
      document.getElementById('currentUserAvatar').textContent = user.name.charAt(0);
    }
    finishInit();
  }
}

async function finishInit() {
  // Populate filters
  populateFilters();
  restoreFilters();

  // Load cards
  await loadBoard();

  // Init drag & drop
  initSortable();

  // Hide loading
  document.getElementById('loading').style.display = 'none';

  // Realtime
  subscribeCards(function(payload) {
    // Reload on any change from other users
    loadBoard();
  });

  // Filter events
  document.getElementById('filterClient').addEventListener('change', applyFilters);
  document.getElementById('filterCategory').addEventListener('change', applyFilters);
  document.getElementById('filterMember').addEventListener('change', applyFilters);
  document.getElementById('filterSearch').addEventListener('input', debounce(applyFilters, 300));

  // Modal events
  document.getElementById('cardForm').addEventListener('submit', saveCard);
  document.getElementById('btnDelete').addEventListener('click', removeCard);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', closeModal);

  // New card
  document.getElementById('btnNew').addEventListener('click', openNewCardModal);

  // Mobile tab
  function activateMobileTab(colKey) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.column === colKey));
    document.querySelectorAll('.column').forEach(c => c.classList.toggle('mobile-active', c.dataset.column === colKey));
  }
  activateMobileTab('todo'); // default

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      activateMobileTab(btn.dataset.column);
    });
  });

  // Change user
  document.getElementById('changeUser').addEventListener('click', function() {
    document.getElementById('userPicker').style.display = 'flex';
  });

  // My tasks filter
  document.getElementById('btnMyTasks').addEventListener('click', function() {
    const userId = localStorage.getItem('kanban_user');
    const mf = document.getElementById('filterMember');
    if (mf.value === userId) {
      mf.value = '';
    } else {
      mf.value = userId;
    }
    this.classList.toggle('active');
    applyFilters();
  });
}

function debounce(fn, ms) {
  let t;
  return function() {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

// Start
document.addEventListener('DOMContentLoaded', init);
