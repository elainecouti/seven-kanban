/* Seven Midas Kanban — Modal (Trello-style detail view) */

let editingCardId = null;

function populateFilterDropdowns() {
  // Client filter
  var cf = document.getElementById('filterClient');
  cf.innerHTML = '<option value="">Todos os clientes</option>';
  CLIENT_GROUPS.forEach(function(cg) {
    var groupItems = allClients.filter(function(c) { return c.group === cg.key; });
    if (!groupItems.length) return;
    var optgroup = document.createElement('optgroup');
    optgroup.label = cg.label;
    groupItems.forEach(function(item) {
      var opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.name;
      optgroup.appendChild(opt);
    });
    cf.appendChild(optgroup);
  });

  // Category filter
  var catf = document.getElementById('filterCategory');
  catf.innerHTML = '<option value="">Todas as categorias</option>';
  CATEGORIES.forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c.key;
    opt.textContent = c.icon + ' ' + c.label;
    catf.appendChild(opt);
  });

  // Member filter
  var mf = document.getElementById('filterMember');
  mf.innerHTML = '<option value="">Todos</option>';
  allMembers.forEach(function(m) {
    var opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    mf.appendChild(opt);
  });
}

function buildSelectHtml(items, selectedValue, placeholder, groupKey) {
  var html = '<option value="">' + placeholder + '</option>';
  if (groupKey) {
    CLIENT_GROUPS.forEach(function(cg) {
      var groupItems = items.filter(function(i) { return i[groupKey] === cg.key; });
      if (!groupItems.length) return;
      html += '<optgroup label="' + cg.label + '">';
      groupItems.forEach(function(i) {
        html += '<option value="' + i.id + '"' + (i.id === selectedValue ? ' selected' : '') + '>' + i.name + '</option>';
      });
      html += '</optgroup>';
    });
  } else {
    items.forEach(function(i) {
      var val = i.id || i.key;
      var label = (i.icon ? i.icon + ' ' : '') + (i.label || i.name);
      html += '<option value="' + val + '"' + (val === selectedValue ? ' selected' : '') + '>' + label + '</option>';
    });
  }
  return html;
}

// ===== NEW CARD MODAL (simple form) =====
function openNewCardModal() {
  editingCardId = null;
  var panel = document.getElementById('detailPanel');
  var overlay = document.getElementById('detailOverlay');

  panel.innerHTML =
    '<div class="dp-header">' +
      '<h2>Nova Tarefa</h2>' +
      '<button class="dp-close" onclick="closeDetail()">&times;</button>' +
    '</div>' +
    '<form id="newCardForm" class="dp-form">' +
      '<div class="dp-field">' +
        '<label>Titulo</label>' +
        '<input type="text" id="nfTitle" required placeholder="O que precisa ser feito?" autofocus>' +
      '</div>' +
      '<div class="dp-field">' +
        '<label>Descricao</label>' +
        '<textarea id="nfDesc" rows="3" placeholder="Detalhes, links, observacoes..."></textarea>' +
      '</div>' +
      '<div class="dp-row">' +
        '<div class="dp-field"><label>Cliente</label><select id="nfClient">' + buildSelectHtml(allClients, '', 'Sem cliente', 'group') + '</select></div>' +
        '<div class="dp-field"><label>Categoria</label><select id="nfCat">' + buildSelectHtml(CATEGORIES, 'geral', 'Selecione') + '</select></div>' +
      '</div>' +
      '<div class="dp-row">' +
        '<div class="dp-field"><label>Prioridade</label><select id="nfPri">' + buildSelectHtml(PRIORITIES, 'media', 'Selecione') + '</select></div>' +
        '<div class="dp-field"><label>Responsavel</label><select id="nfAssign">' + buildSelectHtml(allMembers, localStorage.getItem('kanban_user') || '', 'Ninguem') + '</select></div>' +
      '</div>' +
      '<div class="dp-field"><label>Prazo</label><input type="date" id="nfDue"></div>' +
      '<div class="dp-actions">' +
        '<button type="button" class="btn-cancel" onclick="closeDetail()">Cancelar</button>' +
        '<button type="submit" class="btn-save">Criar Tarefa</button>' +
      '</div>' +
    '</form>';

  panel.classList.add('open');
  overlay.classList.add('open');

  document.getElementById('newCardForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = this.querySelector('.btn-save');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
      var data = {
        title: document.getElementById('nfTitle').value.trim(),
        description: document.getElementById('nfDesc').value.trim(),
        client_id: document.getElementById('nfClient').value || null,
        category: document.getElementById('nfCat').value || 'geral',
        priority: document.getElementById('nfPri').value || 'media',
        assignee_id: document.getElementById('nfAssign').value || null,
        due_date: document.getElementById('nfDue').value || null,
        column_key: 'todo',
        position: (cards.filter(function(c) { return c.column_key === 'todo'; }).length + 1) * 10,
        created_by: localStorage.getItem('kanban_user') || null
      };
      if (!data.title) { alert('Titulo obrigatorio'); btn.disabled = false; btn.textContent = 'Criar Tarefa'; return; }
      var created = await createCard(data);
      cards.push(created);
      closeDetail();
      applyFilters();
    } catch(err) {
      alert('Erro: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Criar Tarefa';
    }
  });
}

// ===== CARD DETAIL VIEW (Trello-style) =====
function openCardDetail(cardId) {
  var card = cards.find(function(c) { return c.id === cardId; });
  if (!card) return;
  editingCardId = cardId;

  var client = getClient(card.client_id);
  var member = getMember(card.assignee_id);
  var creator = getMember(card.created_by);
  var cat = getCategoryInfo(card.category);
  var pri = getPriorityInfo(card.priority);
  var colLabel = COLUMNS.find(function(c) { return c.key === card.column_key; });

  var panel = document.getElementById('detailPanel');
  var overlay = document.getElementById('detailOverlay');

  // Build status buttons
  var statusHtml = '';
  COLUMNS.forEach(function(col) {
    statusHtml += '<button class="dp-status-btn' + (col.key === card.column_key ? ' active' : '') + '" data-col="' + col.key + '">' + col.label + '</button>';
  });

  panel.innerHTML =
    // Header
    '<div class="dp-header">' +
      '<div class="dp-header-tags">' +
        (client ? '<span class="tag tag-client" style="background:' + client.color + '22;color:' + client.color + '">' + client.name + '</span>' : '') +
        '<span class="tag tag-cat">' + cat.icon + ' ' + cat.label + '</span>' +
        '<span class="dp-pri" style="color:' + pri.color + '">&#9679; ' + pri.label + '</span>' +
      '</div>' +
      '<button class="dp-close" onclick="closeDetail()">&times;</button>' +
    '</div>' +

    // Title (editable)
    '<div class="dp-title-wrap">' +
      '<h2 class="dp-title" contenteditable="true" spellcheck="false">' + escapeHtml(card.title) + '</h2>' +
    '</div>' +

    // Status bar
    '<div class="dp-status-bar">' + statusHtml + '</div>' +

    // Body
    '<div class="dp-body">' +
      // Description
      '<div class="dp-section">' +
        '<div class="dp-section-header"><span class="dp-icon">&#128196;</span> Descricao</div>' +
        '<div class="dp-desc" contenteditable="true" data-placeholder="Clique para adicionar uma descricao...">' + (card.description ? escapeHtml(card.description) : '') + '</div>' +
      '</div>' +

      // Details sidebar
      '<div class="dp-details">' +
        '<div class="dp-detail-item">' +
          '<span class="dp-detail-label">Cliente</span>' +
          '<select class="dp-inline-select" id="dpClient">' + buildSelectHtml(allClients, card.client_id || '', 'Sem cliente', 'group') + '</select>' +
        '</div>' +
        '<div class="dp-detail-item">' +
          '<span class="dp-detail-label">Categoria</span>' +
          '<select class="dp-inline-select" id="dpCat">' + buildSelectHtml(CATEGORIES, card.category, 'Selecione') + '</select>' +
        '</div>' +
        '<div class="dp-detail-item">' +
          '<span class="dp-detail-label">Prioridade</span>' +
          '<select class="dp-inline-select" id="dpPri">' + buildSelectHtml(PRIORITIES, card.priority, 'Selecione') + '</select>' +
        '</div>' +
        '<div class="dp-detail-item">' +
          '<span class="dp-detail-label">Responsavel</span>' +
          '<select class="dp-inline-select" id="dpAssign">' + buildSelectHtml(allMembers, card.assignee_id || '', 'Ninguem') + '</select>' +
        '</div>' +
        '<div class="dp-detail-item">' +
          '<span class="dp-detail-label">Prazo</span>' +
          '<input type="date" class="dp-inline-input" id="dpDue" value="' + (card.due_date || '') + '">' +
        '</div>' +
      '</div>' +

      // Meta info
      '<div class="dp-meta">' +
        (creator ? '<span>Criada por ' + creator.name + '</span>' : '') +
        '<span>Criada em ' + new Date(card.created_at).toLocaleDateString('pt-BR') + '</span>' +
        (card.completed_at ? '<span>Concluida em ' + new Date(card.completed_at).toLocaleDateString('pt-BR') + '</span>' : '') +
      '</div>' +
    '</div>' +

    // Footer
    '<div class="dp-footer">' +
      '<button class="btn-delete" onclick="removeCardFromDetail()">Excluir</button>' +
      '<button class="btn-save" onclick="saveCardFromDetail()">Salvar alteracoes</button>' +
    '</div>';

  panel.classList.add('open');
  overlay.classList.add('open');

  // Status button clicks
  panel.querySelectorAll('.dp-status-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      panel.querySelectorAll('.dp-status-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
}

async function saveCardFromDetail() {
  if (!editingCardId) return;
  var panel = document.getElementById('detailPanel');
  var btn = panel.querySelector('.btn-save');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    var activeStatus = panel.querySelector('.dp-status-btn.active');
    var newCol = activeStatus ? activeStatus.dataset.col : null;

    var data = {
      title: panel.querySelector('.dp-title').textContent.trim(),
      description: panel.querySelector('.dp-desc').textContent.trim(),
      client_id: document.getElementById('dpClient').value || null,
      category: document.getElementById('dpCat').value || 'geral',
      priority: document.getElementById('dpPri').value || 'media',
      assignee_id: document.getElementById('dpAssign').value || null,
      due_date: document.getElementById('dpDue').value || null
    };

    if (newCol) {
      data.column_key = newCol;
      if (newCol === 'done') data.completed_at = new Date().toISOString();
      else data.completed_at = null;
    }

    var updated = await updateCard(editingCardId, data);
    var idx = cards.findIndex(function(c) { return c.id === editingCardId; });
    if (idx >= 0) cards[idx] = Object.assign({}, cards[idx], updated);

    closeDetail();
    applyFilters();
  } catch(err) {
    alert('Erro: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Salvar alteracoes';
  }
}

async function removeCardFromDetail() {
  if (!editingCardId) return;
  if (!confirm('Tem certeza que quer excluir esta tarefa?')) return;
  try {
    await deleteCard(editingCardId);
    cards = cards.filter(function(c) { return c.id !== editingCardId; });
    closeDetail();
    applyFilters();
  } catch(err) {
    alert('Erro: ' + err.message);
  }
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('detailOverlay').classList.remove('open');
  editingCardId = null;
}
