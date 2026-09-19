document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('maq-grid');
  var filtersWrap = document.getElementById('maq-filters');
  if (!grid) return; // not on this page

  var WHATSAPP_NUMBER = '5514997758195';
  var FAMILIA_LABEL = { 'metalurgia': 'Metalurgia', 'construcao-civil': 'Construção Civil' };
  var SELO_LABEL = { 'seminovo': 'Seminovo', 'promocao': 'Promoção' };

  var allMachines = [];
  var currentFamilia = 'todas';

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function whatsappLink(title) {
    var text = 'Olá, vi a ' + title + ' no site da Meccal e gostaria de mais informações.';
    return 'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(text);
  }

  function parseSpecs(raw) {
    if (!raw) return [];
    return raw.split('\n')
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (line) {
        var idx = line.indexOf(':');
        if (idx === -1) return { campo: '', valor: line };
        return { campo: line.slice(0, idx).trim(), valor: line.slice(idx + 1).trim() };
      });
  }

  function cardHTML(m) {
    var seloHtml = m.selo
      ? '<span class="selo selo-' + (m.selo === 'promocao' ? 'promocao' : 'seminovo') + '">' + SELO_LABEL[m.selo] + '</span>'
      : '';
    var img = m.imageUrl
      ? '<img src="' + escHtml(m.imageUrl) + '" alt="' + escHtml(m.title) + '">'
      : '<div class="ph" style="height:100%;"><span class="ph-icon">▢</span><span class="ph-label">Sem foto ainda</span></div>';
    return (
      '<div class="destaque-card maq-card" data-id="' + m.id + '">' +
        '<div class="destaque-media">' + img + seloHtml + '</div>' +
        '<div class="destaque-body">' +
          '<h3>' + escHtml(m.title) + '</h3>' +
          '<div class="fam">' + escHtml(FAMILIA_LABEL[m.familia] || '') + (m.tipo ? ' · ' + escHtml(m.tipo) : '') + '</div>' +
          (m.excerpt ? '<p style="font-size:14px;color:var(--ink-soft);margin-bottom:14px;">' + escHtml(m.excerpt) + '</p>' : '') +
          '<span class="destaque-cta">Saiba mais →</span>' +
        '</div>' +
      '</div>'
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

    grid.querySelectorAll('.maq-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var m = allMachines.find(function (x) { return x.id === card.dataset.id; });
        if (m) openModal(m);
      });
    });
  }

  function openModal(m) {
    document.getElementById('maqModalImg').src = m.imageUrl || '';
    document.getElementById('maqModalImg').alt = m.title || '';
    var seloEl = document.getElementById('maqModalSelo');
    if (m.selo) {
      seloEl.textContent = SELO_LABEL[m.selo];
      seloEl.className = 'selo selo-' + (m.selo === 'promocao' ? 'promocao' : 'seminovo');
      seloEl.style.display = 'inline-block';
    } else {
      seloEl.style.display = 'none';
    }
    document.getElementById('maqModalFam').textContent =
      (FAMILIA_LABEL[m.familia] || '') + (m.tipo ? ' · ' + m.tipo : '');
    document.getElementById('maqModalTitle').textContent = m.title || '';
    document.getElementById('maqModalExcerpt').textContent = m.excerpt || '';

    var descEl = document.getElementById('maqModalDescription');
    descEl.innerHTML = (m.description || '').split('\n').filter(Boolean)
      .map(function (p) { return '<p>' + escHtml(p) + '</p>'; }).join('');

    var specs = parseSpecs(m.specs);
    var specsEl = document.getElementById('maqModalSpecs');
    specsEl.innerHTML = specs.map(function (s) {
      return '<tr><td>' + escHtml(s.campo) + '</td><td>' + escHtml(s.valor) + '</td></tr>';
    }).join('');
    specsEl.style.display = specs.length ? 'table' : 'none';

    document.getElementById('maqModalWhats').href = whatsappLink(m.title || 'uma máquina');

    document.getElementById('maqOverlay').classList.add('open');
    document.body.classList.add('nav-locked');
  }

  function closeModal() {
    document.getElementById('maqOverlay').classList.remove('open');
    document.body.classList.remove('nav-locked');
  }
  document.getElementById('maqModalClose').addEventListener('click', closeModal);
  document.getElementById('maqOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

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
    .orderBy('createdAt', 'desc')
    .get()
    .then(function (snap) {
      allMachines = [];
      snap.forEach(function (doc) { allMachines.push(Object.assign({ id: doc.id }, doc.data())); });
      renderGrid();
    })
    .catch(function (err) {
      grid.innerHTML = '<p class="maq-empty">Não foi possível carregar o catálogo agora. Tenta de novo em instantes, ou fala com a gente pelo WhatsApp.</p>';
      console.error(err);
    });
});
