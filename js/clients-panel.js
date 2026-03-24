/* Seven Midas Kanban — Painel de Clientes */

async function renderClientsPanel() {
  var container = document.getElementById('clientsPanelView');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Carregando painel de clientes...</div>';

  // ── Fonte 1: intelligence_actions (últimas 48h, pega a execução mais recente) ──
  // Só mostra intelligence_actions das últimas 12h (dados frescos)
  var cutoff = new Date(Date.now() - 12 * 3600000).toISOString();
  var { data: actions } = await sb.from('intelligence_actions')
    .select('*')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (!actions) actions = [];

  // Deduplica: se houver vários dias, pega só a última execução por unidade+tipo
  var seen = {};
  var dedupActions = [];
  actions.forEach(function(a) {
    var key = a.unidade + '|' + a.tipo_problema;
    if (!seen[key]) { seen[key] = true; dedupActions.push(a); }
  });

  // ── Fonte 2: cards ativos do kanban (não done, não archived) com alertas ──
  var activeCards = (filteredCards || cards).filter(function(c) {
    return c.column_key !== 'done';
  });

  // Mapear cards por client_id → issues do kanban
  var cardsByClient = {};
  activeCards.forEach(function(c) {
    if (!c.client_id) return;
    if (!cardsByClient[c.client_id]) cardsByClient[c.client_id] = [];
    cardsByClient[c.client_id].push(c);
  });

  // ── Agrupar intelligence_actions por unidade (nome normalizado) ──
  function normalizeUnit(str) {
    return str.toLowerCase()
      .replace(/^dm2\s+/i, '')
      .replace(/^emagrecentro\s+/i, 'emag ')
      .replace(/^cartão de todos\s+/i, 'cdt ')
      .replace(/\s*\(.*\)\s*$/, '') // remove "(Diego Vieira)" etc
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/\s+/g, ' ').trim();
  }

  var byUnitNorm = {};
  dedupActions.forEach(function(a) {
    var key = normalizeUnit(a.unidade);
    if (!byUnitNorm[key]) byUnitNorm[key] = { issues: [], slug: a.slug, originalName: a.unidade };
    byUnitNorm[key].issues.push(a);
  });

  function findUnitData(clientName) {
    var norm = normalizeUnit(clientName);
    if (byUnitNorm[norm]) return byUnitNorm[norm];
    // Fallback: check if any key contains or is contained
    var keys = Object.keys(byUnitNorm);
    for (var i = 0; i < keys.length; i++) {
      if (norm.indexOf(keys[i]) >= 0 || keys[i].indexOf(norm) >= 0) return byUnitNorm[keys[i]];
    }
    return null;
  }

  // ── Classificar clientes ──
  var perigo = [], atencao = [], saudavel = [];
  var matchedNormKeys = new Set();

  allClients.forEach(function(c) {
    var nome = c.name;
    var unitData = findUnitData(nome);
    if (unitData) matchedNormKeys.add(normalizeUnit(nome));
    var clientCards = cardsByClient[c.id] || [];

    // Contar issues: intelligence_actions + cards urgentes/alta
    var intelIssues = unitData ? unitData.issues : [];
    var cardIssues = clientCards.filter(function(card) {
      return card.priority === 'urgente' || card.priority === 'alta';
    });

    var totalIssues = intelIssues.length + cardIssues.length;

    var entry = {
      nome: nome,
      slug: unitData ? unitData.slug : c.slug,
      issues: intelIssues,
      cardIssues: cardIssues,
      totalIssues: totalIssues
    };

    if (totalIssues === 0) {
      entry.gravidade = 'ok';
      saudavel.push(entry);
      return;
    }

    var hasCritico = intelIssues.some(function(i) { return i.gravidade === 'critico'; });
    var hasUrgente = intelIssues.some(function(i) { return i.gravidade === 'urgente'; }) ||
      cardIssues.some(function(card) { return card.priority === 'urgente'; });

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

  // Clientes com issues em intelligence_actions mas sem match em allClients
  Object.keys(byUnitNorm).forEach(function(normKey) {
    if (matchedNormKeys.has(normKey)) return;
    var unitData = byUnitNorm[normKey];
    if (unitData.originalName === 'Sistema') return;
    var issues = unitData.issues;
    var hasCritico = issues.some(function(i) { return i.gravidade === 'critico'; });
    var hasUrgente = issues.some(function(i) { return i.gravidade === 'urgente'; });
    var entry = { nome: unitData.originalName, slug: unitData.slug, issues: issues, cardIssues: [], totalIssues: issues.length };
    if (hasCritico) { entry.gravidade = 'critico'; perigo.push(entry); }
    else if (hasUrgente) { entry.gravidade = 'urgente'; atencao.push(entry); }
    else { entry.gravidade = 'atencao'; atencao.push(entry); }
  });

  // Ordenar por número de issues (mais problemas primeiro)
  perigo.sort(function(a, b) { return b.totalIssues - a.totalIssues; });
  atencao.sort(function(a, b) { return b.totalIssues - a.totalIssues; });

  // ── Render ──
  var totalIntelIssues = dedupActions.filter(function(a) { return a.unidade !== 'Sistema'; }).length;
  var totalCardIssues = Object.values(cardsByClient).reduce(function(sum, arr) {
    return sum + arr.filter(function(c) { return c.priority === 'urgente' || c.priority === 'alta'; }).length;
  }, 0);

  // Timestamp da última análise
  var lastAnalysis = dedupActions.length > 0 ? new Date(dedupActions[0].created_at) : null;
  var lastStr = lastAnalysis ? lastAnalysis.toLocaleDateString('pt-BR') + ' ' + lastAnalysis.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'nunca';

  var html = '<div class="cp-container">';

  // KPI cards
  html += '<div class="cp-kpis">';
  html += '<div class="cp-kpi"><div class="cp-kpi-num" style="color:#ff4d6a">' + perigo.length + '</div><div class="cp-kpi-label">Em Perigo</div></div>';
  html += '<div class="cp-kpi"><div class="cp-kpi-num" style="color:#ffaa2c">' + atencao.length + '</div><div class="cp-kpi-label">Atencao</div></div>';
  html += '<div class="cp-kpi"><div class="cp-kpi-num" style="color:#00d68f">' + saudavel.length + '</div><div class="cp-kpi-label">Saudaveis</div></div>';
  html += '<div class="cp-kpi"><div class="cp-kpi-num">' + (totalIntelIssues + totalCardIssues) + '</div><div class="cp-kpi-label">Issues Ativas</div></div>';
  html += '</div>';

  // Última análise
  html += '<div class="cp-last-analysis">Ultima analise: ' + lastStr + '</div>';

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
  var cardIssues = client.cardIssues || [];

  var issuesList = '';

  // Intelligence issues
  issues.forEach(function(issue) {
    var emoji = issue.gravidade === 'critico' ? '🔴' : (issue.gravidade === 'urgente' ? '🟡' : '🟠');
    var tipo = issue.tipo_problema.replace(/_/g, ' ');
    tipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);

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

  // Kanban card issues (urgente/alta)
  cardIssues.forEach(function(card) {
    var emoji = card.priority === 'urgente' ? '🔴' : '🟠';
    var title = card.title.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, '').substring(0, 50);
    issuesList += '<div class="cp-issue">' + emoji + ' ' + escapeHtml(title) + '</div>';
  });

  var totalCount = issues.length + cardIssues.length;

  var linkHtml = '';
  if (client.slug) {
    linkHtml = '<a class="cp-link" href="https://relatorios.sevenmidas.com.br/dm2-' + client.slug + '/" target="_blank">📊 Relatorio</a>';
  }

  return '<div class="cp-card" style="border-left-color:' + borderColor + '">' +
    '<div class="cp-card-header">' +
      '<div class="cp-card-name">' + escapeHtml(client.nome) + '</div>' +
      '<div class="cp-card-count">' + totalCount + ' issue' + (totalCount !== 1 ? 's' : '') + '</div>' +
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
  var intelView = document.getElementById('intelView');
  if (intelView) intelView.style.display = 'none';
  document.getElementById('btnCalendar').classList.remove('active');
  document.getElementById('btnDashboard').classList.remove('active');
  document.getElementById('btnClientsPanel').classList.add('active');
  var btnIntel = document.getElementById('btnIntel');
  if (btnIntel) btnIntel.classList.remove('active');
  renderClientsPanel();
}
