/* Seven Midas Kanban — Calendar View */

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

function renderCalendar() {
  var container = document.getElementById('calendarView');
  if (!container) return;

  var monthNames = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];

  var firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  var daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  var today = new Date();
  today.setHours(0,0,0,0);

  // Build cards index by date
  var cardsByDate = {};
  var source = filteredCards || cards;
  source.forEach(function(c) {
    if (!c.due_date) return;
    var key = c.due_date; // YYYY-MM-DD
    if (!cardsByDate[key]) cardsByDate[key] = [];
    cardsByDate[key].push(c);
  });

  var html = '<div class="cal-header-nav">' +
    '<button class="cal-nav-btn" id="calPrev">&lsaquo;</button>' +
    '<span class="cal-month-label">' + monthNames[calendarMonth] + ' ' + calendarYear + '</span>' +
    '<button class="cal-nav-btn" id="calNext">&rsaquo;</button>' +
  '</div>';

  html += '<div class="cal-grid">';

  // Day headers
  dayNames.forEach(function(d) {
    html += '<div class="cal-day-header">' + d + '</div>';
  });

  // Empty cells before first day
  for (var i = 0; i < firstDay; i++) {
    html += '<div class="cal-cell cal-cell-empty"></div>';
  }

  // Day cells
  for (var day = 1; day <= daysInMonth; day++) {
    var dateStr = calendarYear + '-' + String(calendarMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var cellDate = new Date(calendarYear, calendarMonth, day);
    var isToday = cellDate.getTime() === today.getTime();
    var dayCards = cardsByDate[dateStr] || [];

    html += '<div class="cal-cell' + (isToday ? ' cal-today' : '') + '">';
    html += '<div class="cal-day-num">' + day + '</div>';

    dayCards.forEach(function(card) {
      var pri = getPriorityInfo(card.priority);
      var overdue = card.column_key !== 'done' && isOverdue(card.due_date);
      html += '<div class="cal-card' + (overdue ? ' cal-card-overdue' : '') + '" data-id="' + card.id + '">' +
        '<span class="cal-card-dot" style="background:' + pri.color + '"></span>' +
        '<span class="cal-card-title">' + escapeHtml(card.title) + '</span>' +
      '</div>';
    });

    html += '</div>';
  }

  html += '</div>';

  // Cards without due date
  var noDue = source.filter(function(c) { return !c.due_date; });
  if (noDue.length > 0) {
    html += '<div class="cal-no-date">';
    html += '<div class="cal-no-date-header">Sem prazo (' + noDue.length + ')</div>';
    html += '<div class="cal-no-date-list">';
    noDue.forEach(function(card) {
      var pri = getPriorityInfo(card.priority);
      html += '<div class="cal-card" data-id="' + card.id + '">' +
        '<span class="cal-card-dot" style="background:' + pri.color + '"></span>' +
        '<span class="cal-card-title">' + escapeHtml(card.title) + '</span>' +
      '</div>';
    });
    html += '</div></div>';
  }

  container.innerHTML = html;

  // Bind events
  document.getElementById('calPrev').addEventListener('click', function() {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', function() {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });

  // Card click
  container.querySelectorAll('.cal-card').forEach(function(el) {
    el.addEventListener('click', function() {
      openCardDetail(el.dataset.id);
    });
  });
}

function showCalendarView() {
  document.querySelector('.board').style.display = 'none';
  document.querySelector('.tabs').style.display = 'none';
  var dashboard = document.getElementById('dashboardView');
  if (dashboard) dashboard.style.display = 'none';
  document.getElementById('calendarView').style.display = 'block';
  document.getElementById('btnCalendar').classList.add('active');
  document.getElementById('btnDashboard').classList.remove('active');
  renderCalendar();
}

function showBoardView() {
  document.getElementById('calendarView').style.display = 'none';
  var dashboard = document.getElementById('dashboardView');
  if (dashboard) dashboard.style.display = 'none';
  var clientsPanel = document.getElementById('clientsPanelView');
  if (clientsPanel) clientsPanel.style.display = 'none';
  document.getElementById('btnCalendar').classList.remove('active');
  document.getElementById('btnDashboard').classList.remove('active');
  var btnClients = document.getElementById('btnClientsPanel');
  if (btnClients) btnClients.classList.remove('active');
  document.querySelector('.board').style.display = '';
  // Restore tabs on mobile
  if (window.innerWidth <= 768) {
    document.querySelector('.tabs').style.display = '';
  }
}
