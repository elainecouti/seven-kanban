/* Seven Midas Kanban — Detail Panel + Templates */

let editingCardId = null;

function populateFilterDropdowns() {
  var cf = document.getElementById('filterClient');
  cf.innerHTML = '<option value="">Todos os clientes</option>';
  CLIENT_GROUPS.forEach(function(cg) {
    var gi = allClients.filter(function(c) { return c.group === cg.key; });
    if (!gi.length) return;
    var og = document.createElement('optgroup'); og.label = cg.label;
    gi.forEach(function(i) { var o = document.createElement('option'); o.value = i.id; o.textContent = i.name; og.appendChild(o); });
    cf.appendChild(og);
  });
  var catf = document.getElementById('filterCategory');
  catf.innerHTML = '<option value="">Todas as categorias</option>';
  CATEGORIES.forEach(function(c) { var o = document.createElement('option'); o.value = c.key; o.textContent = c.icon + ' ' + c.label; catf.appendChild(o); });
  var mf = document.getElementById('filterMember');
  mf.innerHTML = '<option value="">Todos</option>';
  allMembers.forEach(function(m) { var o = document.createElement('option'); o.value = m.id; o.textContent = m.name; mf.appendChild(o); });
}

function buildSelectHtml(items, selectedValue, placeholder, groupKey) {
  var html = '<option value="">' + placeholder + '</option>';
  if (groupKey) {
    CLIENT_GROUPS.forEach(function(cg) {
      var gi = items.filter(function(i) { return i[groupKey] === cg.key; });
      if (!gi.length) return;
      html += '<optgroup label="' + cg.label + '">';
      gi.forEach(function(i) { html += '<option value="' + i.id + '"' + (i.id === selectedValue ? ' selected' : '') + '>' + i.name + '</option>'; });
      html += '</optgroup>';
    });
  } else {
    items.forEach(function(i) {
      var v = i.id || i.key, l = (i.icon ? i.icon + ' ' : '') + (i.label || i.name);
      html += '<option value="' + v + '"' + (v === selectedValue ? ' selected' : '') + '>' + l + '</option>';
    });
  }
  return html;
}

function openPanel() {
  document.getElementById('detailPanel').classList.add('open');
  document.getElementById('detailOverlay').classList.add('open');
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('detailOverlay').classList.remove('open');
  editingCardId = null;
}

// ===== TEMPLATE PICKER =====
function openTemplatePicker() {
  var panel = document.getElementById('detailPanel');
  var html = '<div class="dp-header"><h2>Criar a partir de template</h2><button class="dp-close" onclick="closeDetail()">&times;</button></div>';
  html += '<div class="dp-body"><div class="template-list">';
  allTemplates.forEach(function(t) {
    var cat = getCategoryInfo(t.category);
    var items = [];
    try { items = JSON.parse(typeof t.checklist_items === 'string' ? t.checklist_items : JSON.stringify(t.checklist_items)); } catch(e) {}
    html += '<div class="template-card" onclick="createFromTemplate(\'' + t.id + '\')">' +
      '<div class="template-name">' + escapeHtml(t.name) + '</div>' +
      '<div class="template-meta"><span class="tag tag-cat">' + cat.icon + ' ' + cat.label + '</span><span>' + items.length + ' itens no checklist</span></div>' +
      '<div class="template-desc">' + escapeHtml(t.description) + '</div>' +
    '</div>';
  });
  html += '</div></div>';
  panel.innerHTML = html;
  openPanel();
}

async function createFromTemplate(templateId) {
  var tpl = allTemplates.find(function(t) { return t.id === templateId; });
  if (!tpl) return;
  closeDetail();
  // Open new card form pre-filled
  openNewCardModal(tpl);
}

// ===== NEW CARD MODAL =====
function openNewCardModal(template) {
  editingCardId = null;
  var panel = document.getElementById('detailPanel');
  var tpl = template || {};
  var title = tpl.name ? 'Nova: ' + tpl.name : 'Nova Tarefa';

  panel.innerHTML =
    '<div class="dp-header"><h2>' + title + '</h2><button class="dp-close" onclick="closeDetail()">&times;</button></div>' +
    '<form id="newCardForm" class="dp-form">' +
      '<div class="dp-field"><label>Titulo</label><input type="text" id="nfTitle" required placeholder="O que precisa ser feito?" value="' + escapeHtml(tpl.name || '') + '" autofocus></div>' +
      '<div class="dp-field"><label>Descricao</label><textarea id="nfDesc" rows="3" placeholder="Detalhes...">' + escapeHtml(tpl.description || '') + '</textarea></div>' +
      '<div class="dp-row">' +
        '<div class="dp-field"><label>Cliente</label><select id="nfClient">' + buildSelectHtml(allClients, '', 'Sem cliente', 'group') + '</select></div>' +
        '<div class="dp-field"><label>Categoria</label><select id="nfCat">' + buildSelectHtml(CATEGORIES, tpl.category || 'geral', 'Selecione') + '</select></div>' +
      '</div>' +
      '<div class="dp-row">' +
        '<div class="dp-field"><label>Prioridade</label><select id="nfPri">' + buildSelectHtml(PRIORITIES, tpl.priority || 'media', 'Selecione') + '</select></div>' +
        '<div class="dp-field"><label>Responsavel</label><select id="nfAssign">' + buildSelectHtml(allMembers, localStorage.getItem('kanban_user') || '', 'Ninguem') + '</select></div>' +
      '</div>' +
      '<div class="dp-field"><label>Prazo</label><input type="date" id="nfDue"></div>' +
      '<div class="dp-actions"><button type="button" class="btn-cancel" onclick="closeDetail()">Cancelar</button><button type="submit" class="btn-save">Criar Tarefa</button></div>' +
    '</form>';

  openPanel();

  // Store template checklist for after card creation
  panel._templateChecklist = null;
  if (tpl.checklist_items) {
    try { panel._templateChecklist = typeof tpl.checklist_items === 'string' ? JSON.parse(tpl.checklist_items) : tpl.checklist_items; } catch(e) {}
  }

  document.getElementById('newCardForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = this.querySelector('.btn-save');
    btn.disabled = true; btn.textContent = 'Salvando...';
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

      // Create checklist items from template
      var tplChecklist = panel._templateChecklist;
      if (tplChecklist && tplChecklist.length > 0) {
        for (var i = 0; i < tplChecklist.length; i++) {
          await addChecklistItem(created.id, tplChecklist[i].text, (i + 1) * 10);
        }
        await loadChecklistCounts();
      }

      closeDetail();
      applyFilters();
    } catch(err) {
      alert('Erro: ' + err.message);
      btn.disabled = false; btn.textContent = 'Criar Tarefa';
    }
  });
}

// ===== CARD DETAIL VIEW =====
async function openCardDetail(cardId) {
  var card = cards.find(function(c) { return c.id === cardId; });
  if (!card) return;
  editingCardId = cardId;

  var client = getClient(card.client_id);
  var member = getMember(card.assignee_id);
  var creator = getMember(card.created_by);
  var cat = getCategoryInfo(card.category);
  var pri = getPriorityInfo(card.priority);
  var panel = document.getElementById('detailPanel');

  // Load related data
  var checklist = await fetchChecklist(cardId);
  var comments = await fetchComments(cardId);
  var links = await fetchLinks(cardId);

  // Status buttons
  var statusHtml = '';
  COLUMNS.forEach(function(col) {
    statusHtml += '<button class="dp-status-btn' + (col.key === card.column_key ? ' active' : '') + '" data-col="' + col.key + '">' + col.label + '</button>';
  });

  // Checklist HTML
  var checkHtml = '';
  var totalItems = checklist.length;
  var checkedItems = checklist.filter(function(i) { return i.checked; }).length;
  checklist.forEach(function(item) {
    checkHtml += '<div class="cl-item" data-id="' + item.id + '">' +
      '<input type="checkbox"' + (item.checked ? ' checked' : '') + ' class="cl-check">' +
      '<span class="cl-text' + (item.checked ? ' done' : '') + '">' + escapeHtml(item.text) + '</span>' +
      '<button class="cl-del" title="Remover">&times;</button>' +
    '</div>';
  });

  // Comments HTML
  var commHtml = '';
  comments.forEach(function(c) {
    var a = c.author || {};
    var time = new Date(c.created_at);
    var timeStr = time.toLocaleDateString('pt-BR') + ' ' + time.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
    commHtml += '<div class="cm-item">' +
      '<div class="cm-header"><span class="avatar-sm" style="background:' + (a.avatar_color || '#999') + '">' + (a.name || '?').charAt(0) + '</span><strong>' + escapeHtml(a.name || 'Desconhecido') + '</strong><span class="cm-time">' + timeStr + '</span></div>' +
      '<div class="cm-text">' + escapeHtml(c.text) + '</div>' +
    '</div>';
  });

  // Links HTML
  var linksHtml = '';
  links.forEach(function(l) {
    linksHtml += '<div class="lk-item" data-id="' + l.id + '">' +
      '<a href="' + escapeHtml(l.url) + '" target="_blank" class="lk-link">&#128279; ' + escapeHtml(l.label || l.url) + '</a>' +
      '<button class="lk-del" title="Remover">&times;</button>' +
    '</div>';
  });

  // Progress bar
  var progressHtml = '';
  if (totalItems > 0) {
    var pct = Math.round((checkedItems / totalItems) * 100);
    progressHtml = '<div class="cl-progress"><div class="cl-progress-bar"><div class="cl-progress-fill" style="width:' + pct + '%"></div></div><span>' + pct + '%</span></div>';
  }

  panel.innerHTML =
    '<div class="dp-header">' +
      '<div class="dp-header-tags">' +
        (client ? '<span class="tag tag-client" style="background:' + client.color + '22;color:' + client.color + '">' + client.name + '</span>' : '') +
        '<span class="tag tag-cat">' + cat.icon + ' ' + cat.label + '</span>' +
        '<span class="dp-pri" style="color:' + pri.color + '">&#9679; ' + pri.label + '</span>' +
      '</div>' +
      '<button class="dp-close" onclick="closeDetail()">&times;</button>' +
    '</div>' +

    '<div class="dp-title-wrap"><h2 class="dp-title" contenteditable="true" spellcheck="false">' + escapeHtml(card.title) + '</h2></div>' +

    '<div class="dp-status-bar">' + statusHtml + '</div>' +

    '<div class="dp-body">' +
      // Description
      '<div class="dp-section">' +
        '<div class="dp-section-header"><span class="dp-icon">&#128196;</span> Descricao</div>' +
        '<div class="dp-desc" contenteditable="true" data-placeholder="Clique para adicionar descricao...">' + escapeHtml(card.description || '') + '</div>' +
      '</div>' +

      // Checklist
      '<div class="dp-section">' +
        '<div class="dp-section-header"><span class="dp-icon">&#9745;</span> Checklist' + (totalItems > 0 ? ' <span class="cl-count">' + checkedItems + '/' + totalItems + '</span>' : '') + '</div>' +
        progressHtml +
        '<div id="checklistItems">' + checkHtml + '</div>' +
        '<div class="cl-add"><input type="text" id="clNewItem" placeholder="Adicionar item..." class="cl-input"><button class="cl-add-btn" id="clAddBtn">+</button></div>' +
      '</div>' +

      // Links
      '<div class="dp-section">' +
        '<div class="dp-section-header"><span class="dp-icon">&#128279;</span> Links</div>' +
        '<div id="linkItems">' + linksHtml + '</div>' +
        '<div class="lk-add"><input type="url" id="lkUrl" placeholder="URL..." class="lk-input"><input type="text" id="lkLabel" placeholder="Nome (opcional)" class="lk-input lk-label-input"><button class="lk-add-btn" id="lkAddBtn">+</button></div>' +
      '</div>' +

      // Details
      '<div class="dp-details">' +
        '<div class="dp-detail-item"><span class="dp-detail-label">Cliente</span><select class="dp-inline-select" id="dpClient">' + buildSelectHtml(allClients, card.client_id || '', 'Sem cliente', 'group') + '</select></div>' +
        '<div class="dp-detail-item"><span class="dp-detail-label">Categoria</span><select class="dp-inline-select" id="dpCat">' + buildSelectHtml(CATEGORIES, card.category, 'Selecione') + '</select></div>' +
        '<div class="dp-detail-item"><span class="dp-detail-label">Prioridade</span><select class="dp-inline-select" id="dpPri">' + buildSelectHtml(PRIORITIES, card.priority, 'Selecione') + '</select></div>' +
        '<div class="dp-detail-item"><span class="dp-detail-label">Responsavel</span><select class="dp-inline-select" id="dpAssign">' + buildSelectHtml(allMembers, card.assignee_id || '', 'Ninguem') + '</select></div>' +
        '<div class="dp-detail-item"><span class="dp-detail-label">Prazo</span><input type="date" class="dp-inline-input" id="dpDue" value="' + (card.due_date || '') + '"></div>' +
      '</div>' +

      // Comments
      '<div class="dp-section">' +
        '<div class="dp-section-header"><span class="dp-icon">&#128172;</span> Comentarios <span class="cl-count">' + comments.length + '</span></div>' +
        '<div id="commentItems">' + commHtml + '</div>' +
        '<div class="cm-add"><textarea id="cmText" rows="2" placeholder="Escreva um comentario..." class="cm-input"></textarea><button class="cm-add-btn" id="cmAddBtn">Enviar</button></div>' +
      '</div>' +

      // Meta
      '<div class="dp-meta">' +
        (creator ? '<span>Criada por ' + creator.name + '</span>' : '') +
        '<span>' + new Date(card.created_at).toLocaleDateString('pt-BR') + '</span>' +
        (card.completed_at ? '<span>Concluida ' + new Date(card.completed_at).toLocaleDateString('pt-BR') + '</span>' : '') +
      '</div>' +
    '</div>' +

    '<div class="dp-footer">' +
      '<button class="btn-delete" onclick="removeCardFromDetail()">Excluir</button>' +
      '<button class="btn-duplicate" onclick="duplicateCardFromDetail()">Duplicar</button>' +
      '<button class="btn-save" onclick="saveCardFromDetail()">Salvar</button>' +
    '</div>';

  openPanel();
  bindDetailEvents(cardId);
}

function bindDetailEvents(cardId) {
  // Status buttons
  document.querySelectorAll('.dp-status-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.dp-status-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  // Checklist: toggle
  document.querySelectorAll('.cl-check').forEach(function(cb) {
    cb.addEventListener('change', async function() {
      var item = cb.closest('.cl-item');
      var id = item.dataset.id;
      var textEl = item.querySelector('.cl-text');
      textEl.classList.toggle('done', cb.checked);
      await toggleChecklistItem(id, cb.checked);
      await loadChecklistCounts();
      renderBoard();
      updateChecklistProgress();
    });
  });

  // Checklist: delete
  document.querySelectorAll('.cl-del').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var item = btn.closest('.cl-item');
      await deleteChecklistItem(item.dataset.id);
      item.remove();
      await loadChecklistCounts();
      renderBoard();
      updateChecklistProgress();
    });
  });

  // Checklist: add
  document.getElementById('clAddBtn').addEventListener('click', async function() {
    var input = document.getElementById('clNewItem');
    var text = input.value.trim();
    if (!text) { input.focus(); input.style.borderColor = '#e74c3c'; setTimeout(function(){ input.style.borderColor = ''; }, 1500); return; }
    var count = document.querySelectorAll('.cl-item').length;
    var item = await addChecklistItem(cardId, text, (count + 1) * 10);
    input.value = '';
    // Append to list
    var div = document.createElement('div');
    div.className = 'cl-item';
    div.dataset.id = item.id;
    div.innerHTML = '<input type="checkbox" class="cl-check"><span class="cl-text">' + escapeHtml(text) + '</span><button class="cl-del" title="Remover">&times;</button>';
    document.getElementById('checklistItems').appendChild(div);
    // Rebind
    div.querySelector('.cl-check').addEventListener('change', async function() {
      div.querySelector('.cl-text').classList.toggle('done', this.checked);
      await toggleChecklistItem(item.id, this.checked);
      await loadChecklistCounts();
      renderBoard();
      updateChecklistProgress();
    });
    div.querySelector('.cl-del').addEventListener('click', async function() {
      await deleteChecklistItem(item.id);
      div.remove();
      await loadChecklistCounts();
      renderBoard();
      updateChecklistProgress();
    });
    await loadChecklistCounts();
    renderBoard();
    updateChecklistProgress();
  });

  // Enter to add checklist item
  document.getElementById('clNewItem').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('clAddBtn').click(); }
  });

  // Links: delete
  document.querySelectorAll('.lk-del').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var item = btn.closest('.lk-item');
      await deleteLink(item.dataset.id);
      item.remove();
    });
  });

  // Links: add
  document.getElementById('lkAddBtn').addEventListener('click', async function() {
    var url = document.getElementById('lkUrl').value.trim();
    if (!url) { document.getElementById('lkUrl').focus(); document.getElementById('lkUrl').style.borderColor = '#e74c3c'; setTimeout(function(){ document.getElementById('lkUrl').style.borderColor = ''; }, 1500); return; }
    var label = document.getElementById('lkLabel').value.trim() || url;
    var link = await addLink(cardId, url, label);
    document.getElementById('lkUrl').value = '';
    document.getElementById('lkLabel').value = '';
    var div = document.createElement('div');
    div.className = 'lk-item';
    div.dataset.id = link.id;
    div.innerHTML = '<a href="' + escapeHtml(url) + '" target="_blank" class="lk-link">&#128279; ' + escapeHtml(label) + '</a><button class="lk-del" title="Remover">&times;</button>';
    document.getElementById('linkItems').appendChild(div);
    div.querySelector('.lk-del').addEventListener('click', async function() {
      await deleteLink(link.id);
      div.remove();
    });
  });

  // Comments: add
  document.getElementById('cmAddBtn').addEventListener('click', async function() {
    var textarea = document.getElementById('cmText');
    var text = textarea.value.trim();
    if (!text) { textarea.focus(); textarea.style.borderColor = '#e74c3c'; setTimeout(function(){ textarea.style.borderColor = ''; }, 1500); return; }
    var btn = this;
    btn.disabled = true; btn.textContent = 'Enviando...';
    try {
      var comment = await addComment(cardId, text);
      textarea.value = '';
      var a = comment.author || {};
      var time = new Date(comment.created_at);
      var timeStr = time.toLocaleDateString('pt-BR') + ' ' + time.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
      var div = document.createElement('div');
      div.className = 'cm-item cm-new';
      div.innerHTML = '<div class="cm-header"><span class="avatar-sm" style="background:' + (a.avatar_color || '#999') + '">' + (a.name || '?').charAt(0) + '</span><strong>' + escapeHtml(a.name || 'Voce') + '</strong><span class="cm-time">' + timeStr + '</span></div><div class="cm-text">' + escapeHtml(text) + '</div>';
      document.getElementById('commentItems').appendChild(div);
      // Update count
      var countEl = document.querySelector('.dp-section-header .cl-count');
      if (countEl) { var n = document.querySelectorAll('.cm-item').length; }
      div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch(err) { alert('Erro ao comentar: ' + err.message); }
    btn.disabled = false; btn.textContent = 'Enviar';
  });

  // Enter to send comment (Ctrl+Enter)
  document.getElementById('cmText').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); document.getElementById('cmAddBtn').click(); }
  });
}

function updateChecklistProgress() {
  var items = document.querySelectorAll('.cl-item');
  var total = items.length;
  var checked = document.querySelectorAll('.cl-check:checked').length;
  var countEl = document.querySelector('.cl-count');
  if (countEl) countEl.textContent = checked + '/' + total;
  var progWrap = document.querySelector('.cl-progress');
  if (total > 0) {
    var pct = Math.round((checked / total) * 100);
    if (progWrap) {
      progWrap.querySelector('.cl-progress-fill').style.width = pct + '%';
      progWrap.querySelector('span').textContent = pct + '%';
    }
  }
}

async function saveCardFromDetail() {
  if (!editingCardId) return;
  var panel = document.getElementById('detailPanel');
  var btn = panel.querySelector('.dp-footer .btn-save');
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    var activeStatus = panel.querySelector('.dp-status-btn.active');
    var data = {
      title: panel.querySelector('.dp-title').textContent.trim(),
      description: panel.querySelector('.dp-desc').textContent.trim(),
      client_id: document.getElementById('dpClient').value || null,
      category: document.getElementById('dpCat').value || 'geral',
      priority: document.getElementById('dpPri').value || 'media',
      assignee_id: document.getElementById('dpAssign').value || null,
      due_date: document.getElementById('dpDue').value || null
    };
    if (activeStatus) {
      data.column_key = activeStatus.dataset.col;
      data.completed_at = data.column_key === 'done' ? new Date().toISOString() : null;
    }
    var updated = await updateCard(editingCardId, data);
    var idx = cards.findIndex(function(c) { return c.id === editingCardId; });
    if (idx >= 0) cards[idx] = Object.assign({}, cards[idx], updated);
    closeDetail();
    applyFilters();
  } catch(err) {
    alert('Erro: ' + err.message);
    btn.disabled = false; btn.textContent = 'Salvar';
  }
}

async function removeCardFromDetail() {
  if (!editingCardId) return;
  if (!confirm('Excluir esta tarefa?')) return;
  try {
    await deleteCard(editingCardId);
    cards = cards.filter(function(c) { return c.id !== editingCardId; });
    closeDetail();
    applyFilters();
  } catch(err) { alert('Erro: ' + err.message); }
}

async function duplicateCardFromDetail() {
  if (!editingCardId) return;
  var original = cards.find(function(c) { return c.id === editingCardId; });
  if (!original) return;
  var btn = document.querySelector('.btn-duplicate');
  if (btn) { btn.disabled = true; btn.textContent = 'Duplicando...'; }
  try {
    var newCard = {
      title: original.title + ' (copia)',
      description: original.description || '',
      client_id: original.client_id || null,
      category: original.category || 'geral',
      priority: original.priority || 'media',
      assignee_id: original.assignee_id || null,
      due_date: original.due_date || null,
      column_key: 'todo',
      position: (cards.filter(function(c) { return c.column_key === 'todo'; }).length + 1) * 10,
      created_by: localStorage.getItem('kanban_user') || null
    };
    var created = await createCard(newCard);
    cards.push(created);

    // Duplicate checklist items (all unchecked)
    var checklist = await fetchChecklist(editingCardId);
    for (var i = 0; i < checklist.length; i++) {
      await addChecklistItem(created.id, checklist[i].text, (i + 1) * 10);
    }
    if (checklist.length > 0) await loadChecklistCounts();

    closeDetail();
    applyFilters();
  } catch(err) {
    alert('Erro ao duplicar: ' + err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Duplicar'; }
  }
}
