/* Seven Midas Kanban — Painel de Clientes */

async function renderClientsPanel() {
  var container = document.getElementById('clientsPanelView');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Carregando painel de clientes...</div>';

  // Buscar intelligence_actions mais recentes (hoje)
  var today = new Date().toISOString().split('T')[0];
  var { data: actions } = await sb.from('intelligence_actions')
    .select('*')
    .gte('created_at', today + 'T00:00:00')
    .order('created_at', { ascending: false });

  if (!actions) actions = [];

  // Agrupar por unidade
  var byUnit = {};
  actions.forEach(function(a) {
    if (!byUnit[a.unidade]) byUnit[a.unidade] = { issues: [], slug: a.slug };
    byUnit[a.unidade].issues.push(a);
  });

  // Classificar clientes
  var perigo = [], atencao = [], saudavel = [];

  // Todos os clientes (mesmo sem issues)
  allClients.forEach(function(c) {
    var nome = c.name;
    var unitData = byUnit[nome];
    if (!unitData) {
      saudavel.push({ nome: nome, slug: c.slug, issues: [], gravidade: 'ok' });
      return;
    }

    var issues = unitData.issues;
    var hasCritico = issues.some(function(i) { return i.gravidade === 'critico'; });
    var hasUrgente = issues.some(function(i) { return i.gravidade === 'urgente'; });

    var entry = { nome: nome, slug: unitData.slug, issues: issues };

    if (hasCritico) {
      entry.gravidade = 'critico';
      perigo.push(entry);
    } else if (hasUrgente) {
      entry.gravidade = 'urgente';
      atencao.push(entry);
    } else {
      entry.gravidade = 'atencao';
      atencao.push(entry);
    }
  });

  // Clientes com issues mas sem registro em allClients
  Object.keys(byUnit).forEach(function(nome) {
    var found = allClients.some(function(c) { return c.name === nome; });
    if (!found && nome !== 'Sistema') {
      var issues = byUnit[nome].issues;
      var hasCritico = issues.some(function(i) { return i.gravidade === 'critico'; });
      var hasUrgente = issues.some(function(i) { return i.gravidade === 'urgente'; });
      var entry = { nome: nome, slug: byUnit[nome].slug, issues: issues };
      if (hasCritico) { entry.gravidade = 'critico'; perigo.push(entry); }
      else if (hasUrgente) { entry.gravidade = 'urgente'; atencao.push(entry); }
      else { entry.gravidade = 'atencao'; atencao.push(entry); }
    }
  });

  // Render
  var html = '<div class="cp-container">';

  // KPI cards
  var totalIssues = actions.filter(function(a) { return a.unidade !== 'Sistema'; }).length;
  var totalCritico = actions.filter(function(a) { return a.gravidade === 'critico'; }).length;
  var totalUrgente = actions.filter(function(a) { return a.gravidade === 'urgente'; }).length;
  html += '<div class="cp-kpis">';
  html += '<div class="cp-kpi"><div class="cp-kpi-num" style="color:#ff4d6a">' + perigo.length + '</div><div class="cp-kpi-label">Em Perigo</div></div>';
  html += '<div class="cp-kpi"><div class="cp-kpi-num" style="color:#ffaa2c">' + atencao.length + '</div><div class="cp-kpi-label">Atencao</div></div>';
  html += '<div class="cp-kpi"><div class="cp-kpi-num" style="color:#00d68f">' + saudavel.length + '</div><div class="cp-kpi-label">Saudaveis</div></div>';
  html += '<div class="cp-kpi"><div class="cp-kpi-num">' + totalIssues + '</div><div class="cp-kpi-label">Issues Hoje</div></div>';
  html += '</div>';

  // Perigo
  if (perigo.length > 0) {
    html += '<div class="cp-section"><div class="cp-section-title cp-danger">🔴 EM PERIGO — Acao imediata</div>';
    html += '<div class="cp-grid">';
    perigo.forEach(function(c) { html += renderClientCard(c, 'danger'); });
    html += '</div></div>';
  }

  // Atenção
  if (atencao.length > 0) {
    html += '<div class="cp-section"><div class="cp-section-title cp-warning">🟡 ATENCAO — Monitorar</div>';
    html += '<div class="cp-grid">';
    atencao.forEach(function(c) { html += renderClientCard(c, 'warning'); });
    html += '</div></div>';
  }

  // Saudáveis
  if (saudavel.length > 0) {
    html += '<div class="cp-section"><div class="cp-section-title cp-ok">🟢 SAUDAVEIS — Sem problemas</div>';
    html += '<div class="cp-grid">';
    saudavel.forEach(function(c) { html += renderClientCard(c, 'ok'); });
    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function renderClientCard(client, level) {
  var borderColor = level === 'danger' ? '#ff4d6a' : (level === 'warning' ? '#ffaa2c' : '#00d68f');
  var issues = client.issues || [];

  var issuesList = '';
  issues.forEach(function(issue) {
    var emoji = issue.gravidade === 'critico' ? '🔴' : (issue.gravidade === 'urgente' ? '🟡' : '🟠');
    var tipo = issue.tipo_problema.replace(/_/g, ' ');
    tipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);

    // Resumo curto dos dados
    var dados = {};
    try { dados = typeof issue.metricas_antes === 'string' ? JSON.parse(issue.metricas_antes) : (issue.metricas_antes || {}); } catch(e) {}
    var resumo = '';
    if (issue.tipo_problema === 'saldo_critico' || issue.tipo_problema === 'saldo_baixo') {
      resumo = 'R$' + (dados.saldo || 0).toFixed(0) + ' (~' + (dados.dias_restantes || 0).toFixed(0) + 'd)';
    } else if (issue.tipo_problema === 'conta_suspensa') {
      resumo = 'Verificar pagamento';
    } else if (issue.tipo_problema === 'cpl_alto' || issue.tipo_problema === 'cpl_spike') {
      resumo = 'CPL R$' + (dados.cpl_3d || dados.cpl_ontem || 0).toFixed(0);
    } else if (issue.tipo_problema === 'ad_bottom') {
      resumo = (dados.ad_name || '').substring(0, 25);
    } else if (issue.tipo_problema === 'ad_top') {
      resumo = 'CPL R$' + (dados.cpl || 0).toFixed(0) + ' — escalar';
    } else if (issue.tipo_problema === 'fadiga_criativo') {
      resumo = 'freq ' + (dados.freq || 0).toFixed(1);
    } else if (issue.tipo_problema === 'zero_leads') {
      resumo = 'R$' + (dados.gasto_hoje || 0).toFixed(0) + ' gastos';
    }

    issuesList += '<div class="cp-issue">' + emoji + ' ' + tipo + (resumo ? ' — <span class="cp-resumo">' + resumo + '</span>' : '') + '</div>';
  });

  var linkHtml = '';
  if (client.slug) {
    linkHtml = '<a class="cp-link" href="https://intel.sevenmidas.com.br/' + client.slug + '_' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '.html" target="_blank">📊 Relatorio</a>';
  }

  return '<div class="cp-card" style="border-left-color:' + borderColor + '">' +
    '<div class="cp-card-header">' +
      '<div class="cp-card-name">' + escapeHtml(client.nome) + '</div>' +
      '<div class="cp-card-count">' + issues.length + ' issue' + (issues.length !== 1 ? 's' : '') + '</div>' +
    '</div>' +
    (issuesList || '<div class="cp-issue" style="color:#00d68f">Sem problemas detectados</div>') +
    linkHtml +
  '</div>';
}

function showClientsPanelView() {
  document.querySelector('.board').style.display = 'none';
  document.querySelector('.tabs').style.display = 'none';
  document.getElementById('calendarView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('clientsPanelView').style.display = 'block';
  document.getElementById('btnCalendar').classList.remove('active');
  document.getElementById('btnDashboard').classList.remove('active');
  document.getElementById('btnClientsPanel').classList.add('active');
  renderClientsPanel();
}
