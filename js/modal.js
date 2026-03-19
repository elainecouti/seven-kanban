/* Seven Midas Kanban — Modal (Create/Edit) */

let editingCardId = null;

function populateSelect(id, items, groupKey) {
  const sel = document.getElementById(id);
  if (!sel) return;

  // Keep first option (placeholder)
  const first = sel.options[0];
  sel.innerHTML = '';
  sel.appendChild(first);

  if (groupKey) {
    // Grouped select (clients)
    const groups = {};
    items.forEach(function(item) {
      const g = item[groupKey] || 'outro';
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });

    CLIENT_GROUPS.forEach(function(cg) {
      const groupItems = groups[cg.key];
      if (!groupItems || !groupItems.length) return;
      const optgroup = document.createElement('optgroup');
      optgroup.label = cg.label;
      groupItems.forEach(function(item) {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item.name;
        optgroup.appendChild(opt);
      });
      sel.appendChild(optgroup);
    });
  } else {
    items.forEach(function(item) {
      const opt = document.createElement('option');
      opt.value = item.id || item.key;
      opt.textContent = (item.icon ? item.icon + ' ' : '') + (item.label || item.name);
      sel.appendChild(opt);
    });
  }
}

function populateFilters() {
  // Client filter
  const cf = document.getElementById('filterClient');
  cf.innerHTML = '<option value="">Todos os clientes</option>';
  CLIENT_GROUPS.forEach(function(cg) {
    const groupItems = allClients.filter(c => c.group === cg.key);
    if (!groupItems.length) return;
    const optgroup = document.createElement('optgroup');
    optgroup.label = cg.label;
    groupItems.forEach(function(item) {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.name;
      optgroup.appendChild(opt);
    });
    cf.appendChild(optgroup);
  });

  // Category filter
  const catf = document.getElementById('filterCategory');
  catf.innerHTML = '<option value="">Todas as categorias</option>';
  CATEGORIES.forEach(function(c) {
    const opt = document.createElement('option');
    opt.value = c.key;
    opt.textContent = c.icon + ' ' + c.label;
    catf.appendChild(opt);
  });

  // Member filter
  const mf = document.getElementById('filterMember');
  mf.innerHTML = '<option value="">Todos</option>';
  allMembers.forEach(function(m) {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    mf.appendChild(opt);
  });
}

function openNewCardModal() {
  editingCardId = null;
  document.getElementById('modalTitle').textContent = 'Nova Tarefa';
  document.getElementById('cardForm').reset();
  document.getElementById('btnDelete').style.display = 'none';
  document.getElementById('mobileMove').style.display = 'none';

  // Populate dropdowns
  populateSelect('inputClient', allClients, 'group');
  populateSelect('inputCategory', CATEGORIES);
  populateSelect('inputPriority', PRIORITIES);
  populateSelect('inputAssignee', allMembers);

  // Default to current user
  const currentUser = localStorage.getItem('kanban_user');
  if (currentUser) document.getElementById('inputAssignee').value = currentUser;

  document.getElementById('modal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
}

function openCardModal(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  editingCardId = cardId;
  document.getElementById('modalTitle').textContent = 'Editar Tarefa';
  document.getElementById('btnDelete').style.display = 'inline-block';

  // Populate dropdowns
  populateSelect('inputClient', allClients, 'group');
  populateSelect('inputCategory', CATEGORIES);
  populateSelect('inputPriority', PRIORITIES);
  populateSelect('inputAssignee', allMembers);

  // Fill values
  document.getElementById('inputTitle').value = card.title;
  document.getElementById('inputDesc').value = card.description || '';
  document.getElementById('inputClient').value = card.client_id || '';
  document.getElementById('inputCategory').value = card.category;
  document.getElementById('inputPriority').value = card.priority;
  document.getElementById('inputAssignee').value = card.assignee_id || '';
  document.getElementById('inputDueDate').value = card.due_date || '';

  // Mobile move buttons
  const moveDiv = document.getElementById('mobileMove');
  moveDiv.style.display = 'flex';
  moveDiv.innerHTML = '';
  COLUMNS.forEach(function(col) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-move' + (col.key === card.column_key ? ' active' : '');
    btn.textContent = col.label;
    btn.onclick = function() {
      moveDiv.querySelectorAll('.btn-move').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn.dataset.column = col.key;
    };
    btn.dataset.column = col.key;
    moveDiv.appendChild(btn);
  });

  document.getElementById('modal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('modalOverlay').classList.remove('open');
  editingCardId = null;
}

async function saveCard(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const data = {
      title: document.getElementById('inputTitle').value.trim(),
      description: document.getElementById('inputDesc').value.trim(),
      client_id: document.getElementById('inputClient').value || null,
      category: document.getElementById('inputCategory').value || 'geral',
      priority: document.getElementById('inputPriority').value || 'media',
      assignee_id: document.getElementById('inputAssignee').value || null,
      due_date: document.getElementById('inputDueDate').value || null
    };

    if (!data.title) {
      alert('Título é obrigatório');
      return;
    }

    if (editingCardId) {
      // Check if column changed via mobile move
      const activeMove = document.querySelector('.btn-move.active');
      if (activeMove) {
        data.column_key = activeMove.dataset.column;
        if (data.column_key === 'done') data.completed_at = new Date().toISOString();
        else data.completed_at = null;
      }
      const updated = await updateCard(editingCardId, data);
      const idx = cards.findIndex(c => c.id === editingCardId);
      if (idx >= 0) cards[idx] = { ...cards[idx], ...updated };
    } else {
      data.column_key = 'todo';
      data.position = (cards.filter(c => c.column_key === 'todo').length + 1) * 10;
      data.created_by = localStorage.getItem('kanban_user') || null;
      const created = await createCard(data);
      cards.push(created);
    }

    closeModal();
    applyFilters();
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
}

async function removeCard() {
  if (!editingCardId) return;
  if (!confirm('Tem certeza que quer excluir esta tarefa?')) return;

  try {
    await deleteCard(editingCardId);
    cards = cards.filter(c => c.id !== editingCardId);
    closeModal();
    applyFilters();
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}
