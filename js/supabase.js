/* Seven Midas Kanban — Supabase Client */

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Cache
let allClients = [];
let allMembers = [];

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

// Realtime
function subscribeCards(callback) {
  sb.channel('kanban-cards')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, callback)
    .subscribe();
}
