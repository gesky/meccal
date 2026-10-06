document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('prod-grid');
  var filtersWrap = document.getElementById('prod-filters');
  var searchInput = document.getElementById('prod-search');
  if (!grid) return;

  var WHATSAPP_NUMBER = '5514997758195';
  var all = [];
  var currentCat = '';

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function whatsappLink(p) {
    var text = 'Olá, vi a peça ' + p.title +
      (p.codigo ? ' (cód. ' + p.codigo + ')' : '') +
      (p.compat ? ', compatível com ' + p.compat + ',' : '') +
      ' no site da Meccal e gostaria de um orçamento.';
    return 'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(text);
  }

  function cardHTML(p) {
    var img = p.imageUrl
      ? '<img src="' + escHtml(p.imageUrl) + '" alt="' + escHtml(p.title) + '" loading="lazy">'
      : '<div class="ph" style="height:100%;"><span class="ph-icon">▢</span><span class="ph-label">Sem foto ainda</span></div>';
    return (
      '<div class="destaque-card maq-card prod-card">' +
        '<div class="destaque-media">' + img + '</div>' +
        '<div class="destaque-body">' +
          (p.codigo ? '<div class="prod-code">Cód. ' + escHtml(p.codigo) + '</div>' : '') +
          '<h3>' + escHtml(p.title) + '</h3>' +
          (p.categoria ? '<div class="fam">' + escHtml(p.categoria) + '</div>' : '') +
          (p.compat ? '<div class="prod-compat"><b>Compatível com:</b> ' + escHtml(p.compat) + '</div>' : '') +
          (p.description ? '<p style="font-size:14px;color:var(--ink-soft);margin-bottom:14px;">' + escHtml(p.description) + '</p>' : '') +
          '<a class="btn btn-primary" href="' + whatsappLink(p) + '" target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>' +
        '</div>' +
      '</div>'
    );
  }

  function renderFilters() {
    if (!filtersWrap) return;
    var cats = [];
    all.forEach(function (p) { if (p.categoria && cats.indexOf(p.categoria) === -1) cats.push(p.categoria); });
    cats.sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    if (cats.length < 2) { filtersWrap.style.display = 'none'; return; }
    filtersWrap.style.display = '';
    filtersWrap.innerHTML = ['<button class="maq-filter' + (currentCat === '' ? ' active' : '') + '" data-cat="">Todas</button>']
      .concat(cats.map(function (c) {
        return '<button class="maq-filter' + (currentCat === c ? ' active' : '') + '" data-cat="' + escHtml(c) + '">' + escHtml(c) + '</button>';
      })).join('');
    filtersWrap.querySelectorAll('.maq-filter').forEach(function (btn) {
      btn.addEventListener('click', function () { currentCat = btn.dataset.cat; renderFilters(); renderGrid(); });
    });
  }

  function renderGrid() {
    var q = norm(searchInput && searchInput.value);
    var list = all.filter(function (p) {
      if (currentCat && p.categoria !== currentCat) return false;
      if (!q) return true;
      return norm([p.title, p.codigo, p.compat, p.categoria, p.description].join(' ')).indexOf(q) !== -1;
    });
    if (!list.length) {
      grid.innerHTML = '<p class="maq-empty">' + (all.length
        ? 'Nenhuma peça encontrada para essa busca. Fale com a gente pelo WhatsApp que a equipe indica a peça certa.'
        : 'Em breve a lista de peças estará aqui. Enquanto isso, fale com a gente pelo WhatsApp que a equipe indica a peça certa.') + '</p>';
      return;
    }
    grid.innerHTML = list.map(cardHTML).join('');
  }

  if (searchInput) searchInput.addEventListener('input', renderGrid);

  if (!window.MC || !MC.configured || !MC.db) {
    grid.innerHTML = '<p class="maq-empty">O catálogo de peças ainda está sendo montado. Fale com a gente pelo WhatsApp que a equipe indica a peça certa.</p>';
    return;
  }

  MC.db.collection('produtos')
    .where('status', '==', 'publicado')
    .get()
    .then(function (snap) {
      all = [];
      snap.forEach(function (doc) { all.push(Object.assign({ id: doc.id }, doc.data())); });
      all.sort(function (a, b) { return String(a.title).localeCompare(String(b.title), 'pt-BR', { numeric: true }); });
      renderFilters();
      renderGrid();
    })
    .catch(function (err) {
      grid.innerHTML = '<p class="maq-empty">Não foi possível carregar as peças agora. Tenta de novo em instantes, ou fala com a gente pelo WhatsApp.</p>';
      console.error(err);
    });
});
