document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('maq-grid');
  var filtersWrap = document.getElementById('maq-filters');
  if (!grid) return; // not on this page

  var FAMILIA_LABEL = { 'metalurgia': 'Metalurgia', 'construcao-civil': 'Construção Civil' };
  var SELO_LABEL = { 'seminovo': 'Seminovo', 'promocao': 'Promoção' };

  var allMachines = [];
  var currentFamilia = 'todas';

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Cada card leva para a página da máquina: maquina.html?id=<código>
  function cardHTML(m) {
    var seloHtml = m.selo
      ? '<span class="selo selo-' + (m.selo === 'promocao' ? 'promocao' : 'seminovo') + '">' + SELO_LABEL[m.selo] + '</span>'
      : '';
    var img = m.imageUrl
      ? '<img src="' + escHtml(m.imageUrl) + '" alt="' + escHtml(m.title) + '" loading="lazy">'
      : '<div class="ph" style="height:100%;"><span class="ph-icon">▢</span><span class="ph-label">Sem foto ainda</span></div>';
    return (
      '<a class="destaque-card maq-card" href="maquina.html?id=' + encodeURIComponent(m.id) + '">' +
        '<div class="destaque-media">' + img + seloHtml + '</div>' +
        '<div class="destaque-body">' +
          '<h3>' + escHtml(m.title) + '</h3>' +
          '<div class="fam">' + escHtml(FAMILIA_LABEL[m.familia] || '') + (m.tipo ? ' · ' + escHtml(m.tipo) : '') + '</div>' +
          (m.excerpt ? '<p style="font-size:14px;color:var(--ink-soft);margin-bottom:14px;">' + escHtml(m.excerpt) + '</p>' : '') +
          '<span class="destaque-cta">Ver máquina →</span>' +
        '</div>' +
      '</a>'
    );
  }

  function renderGrid() {
    var list = currentFamilia === 'todas'
      ? allMachines
      : allMachines.filter(function (m) { return m.familia === currentFamilia; });

    if (!list.length) {
      grid.innerHTML = '<p class="maq-empty">Nenhuma máquina publicada nessa categoria ainda. Fale com a gente pelo WhatsApp que a gente ajuda a encontrar o modelo certo.</p>';
      return;
    }
    grid.innerHTML = list.map(cardHTML).join('');
  }

  if (filtersWrap) {
    filtersWrap.querySelectorAll('.maq-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        filtersWrap.querySelectorAll('.maq-filter').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFamilia = btn.dataset.familia;
        renderGrid();
      });
    });
  }

  // Busca as máquinas publicadas no Firestore. Se o Firebase ainda não foi
  // configurado (ver admin/js/firebase-config.js), mostra um aviso amigável
  // em vez de travar a página carregando pra sempre.
  if (!window.MC || !MC.configured || !MC.db) {
    grid.innerHTML = '<p class="maq-empty">O catálogo online ainda está sendo montado. Fale com a gente pelo WhatsApp que a equipe indica o modelo certo enquanto isso.</p>';
    return;
  }

  MC.db.collection('maquinas')
    .where('status', '==', 'publicado')
    .get()
    .then(function (snap) {
      allMachines = [];
      snap.forEach(function (doc) { allMachines.push(Object.assign({ id: doc.id }, doc.data())); });
      allMachines.sort(function (a, b) {
        var ta = (a.createdAt && a.createdAt.seconds) || 0;
        var tb = (b.createdAt && b.createdAt.seconds) || 0;
        return tb - ta;
      });
      renderGrid();
    })
    .catch(function (err) {
      grid.innerHTML = '<p class="maq-empty">Não foi possível carregar o catálogo agora. Tenta de novo em instantes, ou fala com a gente pelo WhatsApp.</p>';
      console.error(err);
    });
});
