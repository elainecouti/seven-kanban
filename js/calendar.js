/* Seven Midas Kanban — Calendar View */

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let calendarViewMode = 'month'; // 'month', 'week', 'day'
let calendarWeekStart = null; // Date object for week view
let calendarDayDate = null; // Date object for day view

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

/* ── Helpers ── */
function _dateStr(dt) {
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}
function _addDaysUtil(dt, n) { var r = new Date(dt); r.setDate(r.getDate() + n); return r; }
function _getMonday(dt) {
  var d = new Date(dt); d.setHours(0,0,0,0);
  var day = d.getDay(); var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); return d;
}
function _buildCardsByDate(source) {
  var map = {};
  source.forEach(function(c) {
    if (!c.due_date) return;
    if (!map[c.due_date]) map[c.due_date] = [];
    map[c.due_date].push(c);
  });
  return map;
}
function _renderCardPill(card) {
  var pri = getPriorityInfo(card.priority);
  var overdue = card.column_key !== 'done' && isOverdue(card.due_date);
  return '<div class="cal-card' + (overdue ? ' cal-card-overdue' : '') + '" data-id="' + card.id + '">' +
    '<span class="cal-card-dot" style="background:' + pri.color + '"></span>' +
    '<span class="cal-card-title">' + escapeHtml(card.title) + '</span>' +
  '</div>';
}
function _renderCardRow(card, today) {
  var pri = getPriorityInfo(card.priority);
  var overdue = card.column_key !== 'done' && card.due_date && card.due_date < _dateStr(today);
  var statusLabel = card.column_key === 'doing' ? 'em andamento' : card.column_key === 'review' ? 'revisao' : card.column_key === 'done' ? 'concluido' : 'a fazer';
  var statusClass = card.column_key === 'done' ? ' agenda-status-done' : overdue ? ' agenda-status-overdue' : '';
  return '<div class="agenda-item" data-id="' + card.id + '">' +
    '<span class="cal-card-dot" style="background:' + pri.color + '"></span>' +
    '<span class="agenda-title">' + escapeHtml(card.title) + '</span>' +
    '<span class="agenda-status' + statusClass + '">' + statusLabel + '</span>' +
    (card.assignee ? '<span class="agenda-assignee">' + escapeHtml(card.assignee.split(' ')[0]) + '</span>' : '') +
  '</div>';
}

/* ── View mode tabs HTML ── */
function _renderViewTabs() {
  return '<div class="cal-view-tabs">' +
    '<button class="cal-view-tab' + (calendarViewMode === 'month' ? ' active' : '') + '" data-view="month">Mes</button>' +
    '<button class="cal-view-tab' + (calendarViewMode === 'week' ? ' active' : '') + '" data-view="week">Semana</button>' +
    '<button class="cal-view-tab' + (calendarViewMode === 'day' ? ' active' : '') + '" data-view="day">Dia</button>' +
  '</div>';
}

/* ── Main render dispatcher ── */
function renderCalendar() {
  var container = document.getElementById('calendarView');
  if (!container) return;

  if (calendarViewMode === 'week') {
    _renderWeekView(container);
  } else if (calendarViewMode === 'day') {
    _renderDayView(container);
  } else {
    _renderMonthView(container);
  }

  // Bind view tab clicks
  container.querySelectorAll('.cal-view-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var newMode = btn.dataset.view;
      if (newMode === calendarViewMode) return;
      var today = new Date(); today.setHours(0,0,0,0);
      if (newMode === 'week') {
        calendarWeekStart = _getMonday(new Date(calendarYear, calendarMonth, today.getMonth() === calendarMonth && today.getFullYear() === calendarYear ? today.getDate() : 1));
      }
      if (newMode === 'day') {
        calendarDayDate = (today.getMonth() === calendarMonth && today.getFullYear() === calendarYear) ? today : new Date(calendarYear, calendarMonth, 1);
      }
      calendarViewMode = newMode;
      renderCalendar();
    });
  });

  // Card click (calendar + agenda)
  container.querySelectorAll('.cal-card, .agenda-item').forEach(function(el) {
    el.addEventListener('click', function() {
      openCardDetail(el.dataset.id);
    });
  });
}

/* ══════════════════════════════════════
   MONTH VIEW (original)
   ══════════════════════════════════════ */
function _renderMonthView(container) {
  var monthNames = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];

  var firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  var daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  var today = new Date(); today.setHours(0,0,0,0);

  var source = filteredCards || cards;
  var cardsByDate = _buildCardsByDate(source);

  var html = _renderViewTabs();

  html += '<div class="cal-header-nav">' +
    '<button class="cal-nav-btn" id="calPrev">&lsaquo;</button>' +
    '<span class="cal-month-label">' + monthNames[calendarMonth] + ' ' + calendarYear + '</span>' +
    '<button class="cal-nav-btn" id="calNext">&rsaquo;</button>' +
  '</div>';

  html += '<div class="cal-grid">';
  dayNames.forEach(function(d) { html += '<div class="cal-day-header">' + d + '</div>'; });

  for (var i = 0; i < firstDay; i++) { html += '<div class="cal-cell cal-cell-empty"></div>'; }

  var holidays = getHolidays(calendarYear);

  for (var day = 1; day <= daysInMonth; day++) {
    var dateStr = calendarYear + '-' + String(calendarMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var cellDate = new Date(calendarYear, calendarMonth, day);
    var isToday = cellDate.getTime() === today.getTime();
    var holiday = holidays[dateStr] || null;
    var dayCards = cardsByDate[dateStr] || [];

    html += '<div class="cal-cell' + (isToday ? ' cal-today' : '') + (holiday ? ' cal-holiday' : '') + '">';
    html += '<div class="cal-day-num">' + day + (holiday ? '<span class="cal-holiday-name">' + holiday + '</span>' : '') + '</div>';
    dayCards.forEach(function(card) { html += _renderCardPill(card); });
    html += '</div>';
  }
  html += '</div>';

  // Agenda
  html += _renderAgenda(source, today);

  // Cards without due date
  html += _renderNoDueDateCards(source);

  container.innerHTML = html;

  // Nav events
  document.getElementById('calPrev').addEventListener('click', function() {
    calendarMonth--; if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', function() {
    calendarMonth++; if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });
}

/* ══════════════════════════════════════
   WEEK VIEW
   ══════════════════════════════════════ */
function _renderWeekView(container) {
  var today = new Date(); today.setHours(0,0,0,0);
  if (!calendarWeekStart) calendarWeekStart = _getMonday(today);
  var weekEnd = _addDaysUtil(calendarWeekStart, 6);

  var source = filteredCards || cards;
  var cardsByDate = _buildCardsByDate(source);
  var holidays = getHolidays(calendarWeekStart.getFullYear());
  if (weekEnd.getFullYear() !== calendarWeekStart.getFullYear()) {
    var h2 = getHolidays(weekEnd.getFullYear());
    for (var k in h2) holidays[k] = h2[k];
  }

  var monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var dayNamesFull = ['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'];
  var dayNamesShort = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];

  // Header label
  var labelStart = calendarWeekStart.getDate() + ' ' + monthNames[calendarWeekStart.getMonth()];
  var labelEnd = weekEnd.getDate() + ' ' + monthNames[weekEnd.getMonth()];
  if (calendarWeekStart.getFullYear() !== weekEnd.getFullYear()) {
    labelStart += ' ' + calendarWeekStart.getFullYear();
  }
  labelEnd += ' ' + weekEnd.getFullYear();
  var navLabel = labelStart + ' — ' + labelEnd;

  var html = _renderViewTabs();

  html += '<div class="cal-header-nav">' +
    '<button class="cal-nav-btn" id="calPrev">&lsaquo;</button>' +
    '<button class="cal-nav-btn cal-nav-today" id="calToday">Hoje</button>' +
    '<span class="cal-month-label">' + navLabel + '</span>' +
    '<button class="cal-nav-btn" id="calNext">&rsaquo;</button>' +
  '</div>';

  html += '<div class="cal-week-grid">';

  // 7 day columns
  for (var d = 0; d < 7; d++) {
    var colDate = _addDaysUtil(calendarWeekStart, d);
    var dateStr = _dateStr(colDate);
    var isToday = colDate.getTime() === today.getTime();
    var holiday = holidays[dateStr] || null;
    var dayCards = cardsByDate[dateStr] || [];

    html += '<div class="cal-week-col' + (isToday ? ' cal-week-today' : '') + '">';
    html += '<div class="cal-week-day-header' + (isToday ? ' cal-week-day-today' : '') + '">';
    html += '<span class="cal-week-day-name">' + dayNamesShort[colDate.getDay()] + '</span>';
    html += '<span class="cal-week-day-num">' + colDate.getDate() + '</span>';
    if (holiday) html += '<span class="cal-holiday-name">' + holiday + '</span>';
    html += '</div>';

    html += '<div class="cal-week-cards">';
    if (dayCards.length === 0) {
      html += '<div class="cal-week-empty">—</div>';
    } else {
      dayCards.forEach(function(card) {
        html += _renderCardRow(card, today);
      });
    }
    html += '</div></div>';
  }

  html += '</div>';

  // Agenda below
  html += _renderAgenda(source, today);
  html += _renderNoDueDateCards(source);

  container.innerHTML = html;

  // Nav
  document.getElementById('calPrev').addEventListener('click', function() {
    calendarWeekStart = _addDaysUtil(calendarWeekStart, -7);
    calendarMonth = calendarWeekStart.getMonth(); calendarYear = calendarWeekStart.getFullYear();
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', function() {
    calendarWeekStart = _addDaysUtil(calendarWeekStart, 7);
    calendarMonth = calendarWeekStart.getMonth(); calendarYear = calendarWeekStart.getFullYear();
    renderCalendar();
  });
  document.getElementById('calToday').addEventListener('click', function() {
    calendarWeekStart = _getMonday(today);
    calendarMonth = today.getMonth(); calendarYear = today.getFullYear();
    renderCalendar();
  });
}

/* ══════════════════════════════════════
   DAY VIEW
   ══════════════════════════════════════ */
function _renderDayView(container) {
  var today = new Date(); today.setHours(0,0,0,0);
  if (!calendarDayDate) calendarDayDate = new Date(today);

  var source = filteredCards || cards;
  var dateStr = _dateStr(calendarDayDate);
  var dayCards = source.filter(function(c) { return c.due_date === dateStr; });
  var holidays = getHolidays(calendarDayDate.getFullYear());
  var holiday = holidays[dateStr] || null;
  var isToday = calendarDayDate.getTime() === today.getTime();

  var dayNamesFull = ['Domingo','Segunda-feira','Terca-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sabado'];
  var monthNames = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  var navLabel = dayNamesFull[calendarDayDate.getDay()] + ', ' + calendarDayDate.getDate() + ' de ' + monthNames[calendarDayDate.getMonth()] + ' ' + calendarDayDate.getFullYear();

  var html = _renderViewTabs();

  html += '<div class="cal-header-nav">' +
    '<button class="cal-nav-btn" id="calPrev">&lsaquo;</button>' +
    '<button class="cal-nav-btn cal-nav-today" id="calToday">Hoje</button>' +
    '<span class="cal-month-label">' + navLabel + '</span>' +
    '<button class="cal-nav-btn" id="calNext">&rsaquo;</button>' +
  '</div>';

  if (holiday) {
    html += '<div class="cal-day-holiday-banner">' + holiday + '</div>';
  }

  // Day content
  html += '<div class="cal-day-content">';

  // Split by status
  var todo = dayCards.filter(function(c) { return c.column_key === 'todo'; });
  var doing = dayCards.filter(function(c) { return c.column_key === 'doing'; });
  var review = dayCards.filter(function(c) { return c.column_key === 'review'; });
  var done = dayCards.filter(function(c) { return c.column_key === 'done'; });

  var sections = [
    { key: 'doing', label: 'Em andamento', cards: doing, color: '#7c3aed' },
    { key: 'todo', label: 'A fazer', cards: todo, color: '#f59e0b' },
    { key: 'review', label: 'Revisao', cards: review, color: '#3b82f6' },
    { key: 'done', label: 'Concluido', cards: done, color: '#10b981' },
  ];

  var totalCards = dayCards.length;
  var doneCount = done.length;

  // Summary bar
  html += '<div class="cal-day-summary">';
  html += '<div class="cal-day-summary-stat"><span class="cal-day-summary-num">' + totalCards + '</span><span class="cal-day-summary-label">tarefas</span></div>';
  html += '<div class="cal-day-summary-stat"><span class="cal-day-summary-num cal-day-num-doing">' + doing.length + '</span><span class="cal-day-summary-label">em andamento</span></div>';
  html += '<div class="cal-day-summary-stat"><span class="cal-day-summary-num cal-day-num-done">' + doneCount + '</span><span class="cal-day-summary-label">concluidas</span></div>';
  if (totalCards > 0) {
    var pct = Math.round((doneCount / totalCards) * 100);
    html += '<div class="cal-day-summary-stat"><span class="cal-day-summary-num">' + pct + '%</span><span class="cal-day-summary-label">progresso</span></div>';
  }
  html += '</div>';

  if (totalCards === 0) {
    html += '<div class="cal-day-empty">';
    html += '<div class="cal-day-empty-icon">📋</div>';
    html += '<div class="cal-day-empty-text">Nenhuma tarefa para ' + (isToday ? 'hoje' : 'este dia') + '</div>';
    html += '</div>';
  } else {
    sections.forEach(function(sec) {
      if (sec.cards.length === 0) return;
      html += '<div class="cal-day-section">';
      html += '<div class="cal-day-section-header">';
      html += '<span class="agenda-dot" style="background:' + sec.color + '"></span>';
      html += '<span class="cal-day-section-label">' + sec.label + '</span>';
      html += '<span class="agenda-count">' + sec.cards.length + '</span>';
      html += '</div>';
      sec.cards.forEach(function(card) {
        var pri = getPriorityInfo(card.priority);
        var overdue = card.column_key !== 'done' && isOverdue(card.due_date);
        html += '<div class="cal-day-card agenda-item' + (overdue ? ' cal-day-card-overdue' : '') + '" data-id="' + card.id + '">';
        html += '<span class="cal-card-dot" style="background:' + pri.color + '"></span>';
        html += '<div class="cal-day-card-info">';
        html += '<span class="cal-day-card-title">' + escapeHtml(card.title) + '</span>';
        var meta = [];
        if (card.assignee) meta.push(escapeHtml(card.assignee.split(' ')[0]));
        if (card.client_id) {
          var client = clients.find(function(cl) { return cl.id === card.client_id; });
          if (client) meta.push(escapeHtml(client.name));
        }
        if (meta.length > 0) {
          html += '<span class="cal-day-card-meta">' + meta.join(' · ') + '</span>';
        }
        html += '</div>';
        var priLabel = pri.label || '';
        if (priLabel) html += '<span class="cal-day-card-priority" style="background:' + pri.color + '20;color:' + pri.color + '">' + priLabel + '</span>';
        html += '</div>';
      });
      html += '</div>';
    });
  }

  html += '</div>';

  // Overdue warning (only on today)
  if (isToday) {
    var overdueAll = source.filter(function(c) { return c.due_date && c.due_date < dateStr && c.column_key !== 'done'; });
    if (overdueAll.length > 0) {
      html += '<div class="cal-day-overdue-section">';
      html += '<div class="cal-day-section-header"><span class="agenda-dot" style="background:#ef4444"></span><span class="cal-day-section-label">Atrasadas</span><span class="agenda-count agenda-count-red">' + overdueAll.length + '</span></div>';
      overdueAll.sort(function(a, b) { return a.due_date.localeCompare(b.due_date); }).forEach(function(card) {
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
  }

  container.innerHTML = html;

  // Nav
  document.getElementById('calPrev').addEventListener('click', function() {
    calendarDayDate = _addDaysUtil(calendarDayDate, -1);
    calendarMonth = calendarDayDate.getMonth(); calendarYear = calendarDayDate.getFullYear();
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', function() {
    calendarDayDate = _addDaysUtil(calendarDayDate, 1);
    calendarMonth = calendarDayDate.getMonth(); calendarYear = calendarDayDate.getFullYear();
    renderCalendar();
  });
  document.getElementById('calToday').addEventListener('click', function() {
    calendarDayDate = new Date(today);
    calendarMonth = today.getMonth(); calendarYear = today.getFullYear();
    renderCalendar();
  });
}

/* ══════════════════════════════════════
   SHARED: Agenda + No Due Date
   ══════════════════════════════════════ */
function _renderAgenda(source, today) {
  var todayStr = _dateStr(today);
  var html = '';

  var overdueTasks = source.filter(function(c) {
    return c.due_date && c.due_date < todayStr && c.column_key !== 'done';
  }).sort(function(a, b) { return a.due_date.localeCompare(b.due_date); });

  var todayTasks = source.filter(function(c) {
    return c.due_date === todayStr && c.column_key !== 'done';
  });

  var next7 = [];
  for (var nd = 1; nd <= 7; nd++) {
    var futureDate = _addDaysUtil(today, nd);
    var futStr = _dateStr(futureDate);
    var futureTasks = source.filter(function(c) { return c.due_date === futStr && c.column_key !== 'done'; });
    if (futureTasks.length > 0) {
      var dayName = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][futureDate.getDay()];
      next7.push({ date: futStr, dayName: dayName, dayNum: futureDate.getDate(), tasks: futureTasks });
    }
  }

  html += '<div class="agenda-wrap">';

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
  return html;
}

function _renderNoDueDateCards(source) {
  var noDue = source.filter(function(c) { return !c.due_date; });
  if (noDue.length === 0) return '';
  var html = '<div class="cal-no-date">';
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
  return html;
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
