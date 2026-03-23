/* Seven Midas Kanban — Calendar View */

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

/* Feriados nacionais brasileiros (fixos + moveis calculados) */
function getHolidays(year) {
  var fixed = [
    { m: 1, d: 1, name: 'Ano Novo' },
    { m: 4, d: 21, name: 'Tiradentes' },
    { m: 5, d: 1, name: 'Dia do Trabalho' },
    { m: 9, d: 7, name: 'Independencia' },
    { m: 10, d: 12, name: 'N. Sra. Aparecida' },
    { m: 11, d: 2, name: 'Finados' },
    { m: 11, d: 15, name: 'Proclamacao da Republica' },
    { m: 11, d: 20, name: 'Consciencia Negra' },
    { m: 12, d: 25, name: 'Natal' },
  ];
  // Pascoa (algoritmo de Meeus)
  var a = year % 19, b = Math.floor(year / 100), c = year % 100;
  var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  var i = Math.floor(c / 4), k = c % 4;
  var l = (32 + 2 * e + 2 * i - h - k) % 7;
  var m = Math.floor((a + 11 * h + 22 * l) / 451);
  var mes = Math.floor((h + l - 7 * m + 114) / 31);
  var dia = ((h + l - 7 * m + 114) % 31) + 1;
  var pascoa = new Date(year, mes - 1, dia);

  function addDays(dt, n) { var r = new Date(dt); r.setDate(r.getDate() + n); return r; }

  var moveis = [
    { dt: addDays(pascoa, -47), name: 'Carnaval' },
    { dt: addDays(pascoa, -46), name: 'Carnaval' },
    { dt: addDays(pascoa, -2), name: 'Sexta-feira Santa' },
    { dt: pascoa, name: 'Pascoa' },
    { dt: addDays(pascoa, 60), name: 'Corpus Christi' },
  ];

  var map = {};
  fixed.forEach(function(f) {
    var key = year + '-' + String(f.m).padStart(2, '0') + '-' + String(f.d).padStart(2, '0');
    map[key] = f.name;
  });
  moveis.forEach(function(mv) {
    var key = mv.dt.getFullYear() + '-' + String(mv.dt.getMonth() + 1).padStart(2, '0') + '-' + String(mv.dt.getDate()).padStart(2, '0');
    map[key] = mv.name;
  });
  return map;
}

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

  // Feriados do ano
  var holidays = getHolidays(calendarYear);

  // Day cells
  for (var day = 1; day <= daysInMonth; day++) {
    var dateStr = calendarYear + '-' + String(calendarMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var cellDate = new Date(calendarYear, calendarMonth, day);
    var isToday = cellDate.getTime() === today.getTime();
    var holiday = holidays[dateStr] || null;
    var dayCards = cardsByDate[dateStr] || [];

    html += '<div class="cal-cell' + (isToday ? ' cal-today' : '') + (holiday ? ' cal-holiday' : '') + '">';
    html += '<div class="cal-day-num">' + day + (holiday ? '<span class="cal-holiday-name">' + holiday + '</span>' : '') + '</div>';

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

  // ── AGENDA: Hoje + Proximos 7 dias + Atrasadas ──
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  var overdueTasks = source.filter(function(c) {
    return c.due_date && c.due_date < todayStr && c.column_key !== 'done';
  }).sort(function(a, b) { return a.due_date.localeCompare(b.due_date); });

  var todayTasks = source.filter(function(c) {
    return c.due_date === todayStr && c.column_key !== 'done';
  });

  var next7 = [];
  for (var nd = 1; nd <= 7; nd++) {
    var futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + nd);
    var futStr = futureDate.getFullYear() + '-' + String(futureDate.getMonth() + 1).padStart(2, '0') + '-' + String(futureDate.getDate()).padStart(2, '0');
    var futureTasks = source.filter(function(c) { return c.due_date === futStr && c.column_key !== 'done'; });
    if (futureTasks.length > 0) {
      var dayName = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][futureDate.getDay()];
      next7.push({ date: futStr, dayName: dayName, dayNum: futureDate.getDate(), tasks: futureTasks });
    }
  }

  html += '<div class="agenda-wrap">';

  // Atrasadas
  if (overdueTasks.length > 0) {
    html += '<div class="agenda-section agenda-overdue">';
    html += '<div class="agenda-header"><span class="agenda-dot" style="background:#ef4444"></span> Atrasadas <span class="agenda-count agenda-count-red">' + overdueTasks.length + '</span></div>';
    overdueTasks.forEach(function(card) {
      var pri = getPriorityInfo(card.priority);
      var diasAtraso = Math.floor((today - new Date(card.due_date + 'T00:00:00')) / 86400000);
      html += '<div class="agenda-item" data-id="' + card.id + '">' +
        '<span class="cal-card-dot" style="background:' + pri.color + '"></span>' +
        '<span class="agenda-title">' + escapeHtml(card.title) + '</span>' +
        '<span class="agenda-delay">-' + diasAtraso + 'd</span>' +
        (card.assignee ? '<span class="agenda-assignee">' + escapeHtml(card.assignee.split(' ')[0]) + '</span>' : '') +
      '</div>';
    });
    html += '</div>';
  }

  // Hoje
  html += '<div class="agenda-section">';
  html += '<div class="agenda-header"><span class="agenda-dot" style="background:#7c3aed"></span> Hoje' + (todayTasks.length > 0 ? ' <span class="agenda-count">' + todayTasks.length + '</span>' : ' <span class="agenda-empty">nenhuma tarefa</span>') + '</div>';
  todayTasks.forEach(function(card) {
    var pri = getPriorityInfo(card.priority);
    var statusLabel = card.column_key === 'doing' ? 'em andamento' : card.column_key === 'review' ? 'revisao' : 'a fazer';
    html += '<div class="agenda-item" data-id="' + card.id + '">' +
      '<span class="cal-card-dot" style="background:' + pri.color + '"></span>' +
      '<span class="agenda-title">' + escapeHtml(card.title) + '</span>' +
      '<span class="agenda-status">' + statusLabel + '</span>' +
      (card.assignee ? '<span class="agenda-assignee">' + escapeHtml(card.assignee.split(' ')[0]) + '</span>' : '') +
    '</div>';
  });
  html += '</div>';

  // Proximos 7 dias
  if (next7.length > 0) {
    html += '<div class="agenda-section">';
    html += '<div class="agenda-header"><span class="agenda-dot" style="background:#f59e0b"></span> Proximos 7 dias</div>';
    next7.forEach(function(group) {
      html += '<div class="agenda-day-label">' + group.dayName + ', ' + group.dayNum + '</div>';
      group.tasks.forEach(function(card) {
        var pri = getPriorityInfo(card.priority);
        html += '<div class="agenda-item" data-id="' + card.id + '">' +
          '<span class="cal-card-dot" style="background:' + pri.color + '"></span>' +
          '<span class="agenda-title">' + escapeHtml(card.title) + '</span>' +
          (card.assignee ? '<span class="agenda-assignee">' + escapeHtml(card.assignee.split(' ')[0]) + '</span>' : '') +
        '</div>';
      });
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

  // Card click (calendar + agenda)
  container.querySelectorAll('.cal-card, .agenda-item').forEach(function(el) {
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
  var intelView = document.getElementById('intelView');
  if (intelView) intelView.style.display = 'none';
  document.getElementById('btnCalendar').classList.remove('active');
  document.getElementById('btnDashboard').classList.remove('active');
  var btnClients = document.getElementById('btnClientsPanel');
  if (btnClients) btnClients.classList.remove('active');
  var btnIntel = document.getElementById('btnIntel');
  if (btnIntel) btnIntel.classList.remove('active');
  document.querySelector('.board').style.display = '';
  // Restore tabs on mobile
  if (window.innerWidth <= 768) {
    document.querySelector('.tabs').style.display = '';
  }
}
