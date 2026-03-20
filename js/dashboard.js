/* Seven Midas Kanban — Dashboard View */

async function renderDashboard() {
  var container = document.getElementById('dashboardView');
  if (!container) return;

  var source = filteredCards || cards;
  var today = new Date();
  today.setHours(0,0,0,0);

  // Counts by status
  var counts = { todo: 0, doing: 0, review: 0, done: 0 };
  var overdueCount = 0;
  var clientCounts = {};
  var catCounts = {};

  source.forEach(function(c) {
    if (counts[c.column_key] !== undefined) counts[c.column_key]++;
    if (c.column_key !== 'done' && c.due_date) {
      var due = new Date(c.due_date + 'T12:00:00');
      if (due < today) overdueCount++;
    }
    // Client
    var client = getClient(c.client_id);
    var clientName = client ? client.name : 'Sem cliente';
    clientCounts[clientName] = (clientCounts[clientName] || 0) + 1;
    // Category
    var cat = getCategoryInfo(c.category);
    catCounts[cat.label] = (catCounts[cat.label] || 0) + 1;
  });

  // Sort clients by count
  var clientEntries = Object.entries(clientCounts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 10);
  var maxClient = clientEntries.length > 0 ? clientEntries[0][1] : 1;

  // Category entries
  var catEntries = Object.entries(catCounts).sort(function(a, b) { return b[1] - a[1]; });
  var totalCat = catEntries.reduce(function(s, e) { return s + e[1]; }, 0) || 1;

  // Category colors
  var catColors = ['#6c5ce7','#00b894','#fdcb6e','#e17055','#0984e3','#d63031','#e84393','#00cec9','#636e72'];

  var html = '<div class="dash-container">';

  // Status cards row
  html += '<div class="dash-status-row">';
  html += '<div class="dash-stat-card"><div class="dash-stat-num">' + counts.todo + '</div><div class="dash-stat-label">A Fazer</div></div>';
  html += '<div class="dash-stat-card"><div class="dash-stat-num" style="color:#0984e3">' + counts.doing + '</div><div class="dash-stat-label">Em Andamento</div></div>';
  html += '<div class="dash-stat-card"><div class="dash-stat-num" style="color:#fdcb6e">' + counts.review + '</div><div class="dash-stat-label">Revisao</div></div>';
  html += '<div class="dash-stat-card"><div class="dash-stat-num" style="color:#00b894">' + counts.done + '</div><div class="dash-stat-label">Concluido</div></div>';
  html += '<div class="dash-stat-card dash-stat-overdue"><div class="dash-stat-num" style="color:#e74c3c">' + overdueCount + '</div><div class="dash-stat-label">Atrasadas</div></div>';
  html += '</div>';

  // Charts row
  html += '<div class="dash-charts-row">';

  // Client bar chart
  html += '<div class="dash-chart-card">';
  html += '<div class="dash-chart-title">Cards por Cliente</div>';
  clientEntries.forEach(function(entry) {
    var pct = Math.round((entry[1] / maxClient) * 100);
    html += '<div class="dash-bar-row">' +
      '<span class="dash-bar-label">' + escapeHtml(entry[0]) + '</span>' +
      '<div class="dash-bar-track"><div class="dash-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="dash-bar-val">' + entry[1] + '</span>' +
    '</div>';
  });
  html += '</div>';

  // Category display
  html += '<div class="dash-chart-card">';
  html += '<div class="dash-chart-title">Cards por Categoria</div>';
  html += '<div class="dash-cat-grid">';
  catEntries.forEach(function(entry, i) {
    var pct = Math.round((entry[1] / totalCat) * 100);
    var color = catColors[i % catColors.length];
    html += '<div class="dash-cat-item">' +
      '<div class="dash-cat-bar" style="background:' + color + ';height:' + Math.max(pct * 1.2, 8) + 'px"></div>' +
      '<div class="dash-cat-label">' + escapeHtml(entry[0]) + '</div>' +
      '<div class="dash-cat-val">' + entry[1] + ' (' + pct + '%)</div>' +
    '</div>';
  });
  html += '</div></div>';

  html += '</div>'; // charts-row end

  // Recent comments
  html += '<div class="dash-chart-card dash-comments-card">';
  html += '<div class="dash-chart-title">Atividade Recente</div>';
  html += '<div id="dashRecentComments"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>';
  html += '</div>';

  html += '</div>'; // dash-container end

  container.innerHTML = html;

  // Load recent comments
  loadRecentComments();
}

async function loadRecentComments() {
  var el = document.getElementById('dashRecentComments');
  if (!el) return;
  try {
    var { data } = await sb.from('comments')
      .select('*, author:team_members(name, avatar_color), card:cards(title)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (!data || data.length === 0) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Nenhum comentario ainda.</div>';
      return;
    }
    var html = '';
    data.forEach(function(c) {
      var a = c.author || {};
      var time = new Date(c.created_at);
      var timeStr = time.toLocaleDateString('pt-BR') + ' ' + time.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
      var cardTitle = c.card ? c.card.title : 'Card removido';
      html += '<div class="dash-comment">' +
        '<div class="dash-comment-header">' +
          '<span class="avatar-sm" style="background:' + (a.avatar_color || '#999') + '">' + (a.name || '?').charAt(0) + '</span>' +
          '<strong>' + escapeHtml(a.name || 'Desconhecido') + '</strong>' +
          '<span class="dash-comment-card">em ' + escapeHtml(cardTitle) + '</span>' +
          '<span class="cm-time">' + timeStr + '</span>' +
        '</div>' +
        '<div class="dash-comment-text">' + escapeHtml(c.text) + '</div>' +
      '</div>';
    });
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="color:#e74c3c;font-size:13px">Erro ao carregar comentarios.</div>';
  }
}

function showDashboardView() {
  document.querySelector('.board').style.display = 'none';
  document.querySelector('.tabs').style.display = 'none';
  document.getElementById('calendarView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'block';
  document.getElementById('btnDashboard').classList.add('active');
  document.getElementById('btnCalendar').classList.remove('active');
  renderDashboard();
}
