/* Seven Midas Kanban — Intel Feed (Newsletter) */

var INTEL_FEEDS = [
  { category: 'Marketing Digital', icon: '📢', queries: ['marketing+digital+brasil', 'meta+ads+facebook'] },
  { category: 'Inteligencia Artificial', icon: '🤖', queries: ['inteligencia+artificial+marketing', 'AI+marketing+automation'] },
  { category: 'Diabetes & Saude', icon: '🏥', queries: ['diabetes+tipo+2+tratamento', 'clinica+diabetes+brasil'] },
  { category: 'Estetica & Emagrecimento', icon: '💎', queries: ['estetica+emagrecimento+clinica', 'procedimento+estetico+tendencia'] },
  { category: 'E-commerce & Varejo', icon: '🛒', queries: ['ecommerce+brasil+tendencia', 'varejo+digital+2026'] },
];

var RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';

function fetchNewsFeed(query) {
  var rssUrl = 'https://news.google.com/rss/search?q=' + encodeURIComponent(query) + '&hl=pt-BR&gl=BR&ceid=BR:pt-419';
  var apiUrl = RSS2JSON_BASE + encodeURIComponent(rssUrl);
  return fetch(apiUrl)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.status !== 'ok' || !data.items) return [];
      return data.items.slice(0, 5).map(function(item) {
        return {
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
          source: extractSource(item.title),
        };
      });
    })
    .catch(function() { return []; });
}

function extractSource(title) {
  var parts = title.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1].trim() : '';
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  var date = new Date(dateStr);
  var now = new Date();
  var diff = Math.floor((now - date) / 1000);
  if (diff < 3600) return Math.floor(diff / 60) + 'min';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function cleanTitle(title) {
  // Remove source suffix " - Fonte"
  var parts = title.split(' - ');
  if (parts.length > 1) parts.pop();
  return parts.join(' - ');
}

function renderIntel() {
  var container = document.getElementById('intelView');
  if (!container) return;

  container.innerHTML = '<div class="intel-loading"><div class="spinner"></div>Carregando noticias...</div>';

  var promises = INTEL_FEEDS.map(function(feed) {
    // Fetch first query of each category
    return fetchNewsFeed(feed.queries[0]).then(function(articles) {
      return { category: feed.category, icon: feed.icon, articles: articles };
    });
  });

  Promise.all(promises).then(function(results) {
    var html = '<div class="intel-container">';

    // Header
    html += '<div class="intel-header">';
    html += '<h2 class="intel-title">Intel Feed</h2>';
    html += '<span class="intel-sub">Noticias relevantes para a agencia — atualizado automaticamente</span>';
    html += '</div>';

    // Grid
    html += '<div class="intel-grid">';

    results.forEach(function(feed) {
      html += '<div class="intel-card">';
      html += '<div class="intel-card-header">';
      html += '<span class="intel-card-icon">' + feed.icon + '</span>';
      html += '<span class="intel-card-cat">' + feed.category + '</span>';
      html += '</div>';

      if (feed.articles.length === 0) {
        html += '<div class="intel-empty">Nenhuma noticia encontrada</div>';
      } else {
        feed.articles.forEach(function(article) {
          html += '<a class="intel-article" href="' + article.link + '" target="_blank" rel="noopener">';
          html += '<span class="intel-article-title">' + cleanTitle(article.title) + '</span>';
          html += '<span class="intel-article-meta">';
          if (article.source) html += '<span class="intel-source">' + article.source + '</span>';
          html += '<span class="intel-time">' + formatTimeAgo(article.pubDate) + '</span>';
          html += '</span>';
          html += '</a>';
        });
      }

      html += '</div>';
    });

    html += '</div>';

    // Tips section
    html += '<div class="intel-tips">';
    html += '<div class="intel-tips-header">Dica do Dia</div>';
    var tips = [
      'Criativos com prova social (depoimento real) convertem 2-3x mais que criativos genericos.',
      'O CPL tende a subir nos primeiros 3 dias de um ad set novo — espere 72h antes de pausar.',
      'Campanhas CBO com 3-5 ad sets performam melhor que com 10+. Menos eh mais.',
      'Sexta e sabado tem CPL mais alto na maioria dos nichos de saude. Ajuste budgets.',
      'A fadiga criativa aparece quando a frequencia passa de 3.5. Troque o criativo antes disso.',
      'Headlines com numero ("5 sinais", "3 passos") tem CTR 20-30% maior que genericas.',
      'Lookalike 1% baseado em compradores reais > lookalike de leads.',
      'Remarketing com janela de 7 dias tem ROAS 3x maior que 30 dias.',
    ];
    var tipIdx = Math.floor((new Date().getDate() + new Date().getMonth()) % tips.length);
    html += '<p class="intel-tip-text">' + tips[tipIdx] + '</p>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  });
}

function showIntelView() {
  document.querySelector('.board').style.display = 'none';
  document.querySelector('.tabs').style.display = 'none';
  var cal = document.getElementById('calendarView');
  if (cal) cal.style.display = 'none';
  var dash = document.getElementById('dashboardView');
  if (dash) dash.style.display = 'none';
  var clients = document.getElementById('clientsPanelView');
  if (clients) clients.style.display = 'none';

  document.getElementById('intelView').style.display = 'block';

  // Toggle active states
  document.querySelectorAll('.btn-view').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('btnIntel').classList.add('active');

  renderIntel();
}
