/* Seven Midas Kanban — Supabase Client */

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Cache
let allClients = [];
let allMembers = [];
let allTemplates = [];

async function fetchClients() {
  const { data } = await sb.from('clients').select('*').eq('active', true).order('name');
  allClients = data || [];
  return allClients;
}

async function fetchMembers() {
  const { data } = await sb.from('team_members').select('*').eq('active', true).order('name');
  allMembers = data || [];
  return allMembers;
}

async function fetchCards() {
  const { data } = await sb.from('cards').select('*').eq('archived', false).order('position');
  return data || [];
}

async function fetchTemplates() {
  const { data } = await sb.from('card_templates').select('*').order('name');
  allTemplates = data || [];
  return allTemplates;
}

// Cards CRUD
async function createCard(card) {
  const { data, error } = await sb.from('cards').insert(card).select().single();
  if (error) throw error;
  return data;
}

async function updateCard(id, updates) {
  const { data, error } = await sb.from('cards').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteCard(id) {
  const { error } = await sb.from('cards').delete().eq('id', id);
  if (error) throw error;
}

async function moveCard(id, columnKey, position) {
  const updates = { column_key: columnKey, position: position };
  if (columnKey === 'done') updates.completed_at = new Date().toISOString();
  else updates.completed_at = null;
  return updateCard(id, updates);
}

// Checklist
async function fetchChecklist(cardId) {
  const { data } = await sb.from('checklist_items').select('*').eq('card_id', cardId).order('position');
  return data || [];
}

async function addChecklistItem(cardId, text, position) {
  const { data, error } = await sb.from('checklist_items').insert({ card_id: cardId, text: text, position: position }).select().single();
  if (error) throw error;
  return data;
}

async function toggleChecklistItem(id, checked) {
  const { error } = await sb.from('checklist_items').update({ checked: checked }).eq('id', id);
  if (error) throw error;
}

async function deleteChecklistItem(id) {
  const { error } = await sb.from('checklist_items').delete().eq('id', id);
  if (error) throw error;
}

// Comments
async function fetchComments(cardId) {
  const { data } = await sb.from('comments').select('*, author:team_members(name, avatar_color)').eq('card_id', cardId).order('created_at', { ascending: true });
  return data || [];
}

async function addComment(cardId, text) {
  const authorId = localStorage.getItem('kanban_user') || null;
  const { data, error } = await sb.from('comments').insert({ card_id: cardId, text: text, author_id: authorId }).select('*, author:team_members(name, avatar_color)').single();
  if (error) throw error;
  return data;
}

// Links
async function fetchLinks(cardId) {
  const { data } = await sb.from('card_links').select('*').eq('card_id', cardId).order('created_at');
  return data || [];
}

async function addLink(cardId, url, label) {
  const { data, error } = await sb.from('card_links').insert({ card_id: cardId, url: url, label: label || url }).select().single();
  if (error) throw error;
  return data;
}

async function deleteLink(id) {
  const { error } = await sb.from('card_links').delete().eq('id', id);
  if (error) throw error;
}

// Realtime
function subscribeCards(callback) {
  sb.channel('kanban-cards')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, callback)
    .subscribe();
}
