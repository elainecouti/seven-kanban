/* Seven Midas Kanban — Config */

const SUPABASE_URL = 'https://eeakqgsnhbrzvkwskkgv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlYWtxZ3NuaGJyenZrd3Nra2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzEzMDgsImV4cCI6MjA4OTUwNzMwOH0.qA5ZbZPxmq62affukWSQT58lmnqaWI1_OWYTCoCfoks';

const COLUMNS = [
  { key: 'todo', label: 'A Fazer' },
  { key: 'doing', label: 'Em Andamento' },
  { key: 'review', label: 'Revisão' },
  { key: 'done', label: 'Concluído' }
];

const CATEGORIES = [
  { key: 'campanha', label: 'Campanhas', icon: '📣' },
  { key: 'criativo', label: 'Criativos', icon: '🎨' },
  { key: 'relatorio', label: 'Relatórios', icon: '📊' },
  { key: 'tracking', label: 'Tracking', icon: '🎯' },
  { key: 'orcamento', label: 'Orçamento', icon: '💰' },
  { key: 'landing-page', label: 'Landing Pages', icon: '🌐' },
  { key: 'onboarding', label: 'Onboarding', icon: '👤' },
  { key: 'social', label: 'Social Media', icon: '📱' },
  { key: 'geral', label: 'Geral', icon: '📁' }
];

const PRIORITIES = [
  { key: 'urgente', label: 'Urgente', color: '#e74c3c' },
  { key: 'alta', label: 'Alta', color: '#f39c12' },
  { key: 'media', label: 'Média', color: '#3498db' },
  { key: 'baixa', label: 'Baixa', color: '#95a5a6' }
];

const CLIENT_GROUPS = [
  { key: 'dm2', label: 'DM2 Diabetes' },
  { key: 'emagrecentro', label: 'Emagrecentro' },
  { key: 'avulso', label: 'Avulsos' },
  { key: 'medico', label: 'Parceiros Médicos' }
];
