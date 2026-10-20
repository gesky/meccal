// Seção "Máquinas em destaque" da Home. As máquinas e a ordem vêm do admin (estrela ★ na aba Máquinas).
// Mínimo de 3 destaques publicados; com menos que isso a seção não aparece.
document.addEventListener('DOMContentLoaded', function () {
  var section = document.getElementById('destaques');
  var grid = document.getElementById('destaques-grid');
  if (!section || !grid) return;

  var MIN = 3, MAX = 8;
  var FAMILIA_LABEL = { 'metalurgia': 'Metalurgia', 'construcao-civil': 'Construção Civil', 'ambas': 'Metalurgia e Construção Civil' };
  var SELO_LABEL = { 'seminovo': 'Seminovo', 'promocao': 'Promoção' };

  // Sem destaques, o botão do topo leva ao catálogo completo
  function fallbackCta() {
    var cta = document.querySelector('a[href="#destaques"]');
    if (cta) { cta.setAttribute('href', 'maquinas.html'); cta.textContent = 'Ver máquinas'; }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function cardHTML(m) {
    var selo = m.selo ? '<span class="selo selo-' + (m.selo === 'promocao' ? 'promocao' : 'seminovo') + '">' + SELO_LABEL[m.selo] + '</span>' : '';
    var img = m.imageUrl
      ? '<img src="' + esc(m.imageUrl) + '" alt="' + esc(m.title) + '" loading="lazy">'
      : '<div class="ph" style="height:100%;"><span class="ph-icon">▢</span><span class="ph-label">Sem foto ainda</span></div>';
    return '<a class="destaque-card maq-card" href="maquina.html?id=' + encodeURIComponent(m.id) + '">' +
      '<div class="destaque-media">' + img + selo + '</div>' +
      '<div class="destaque-body">' +
        '<h3>' + esc(m.title) + '</h3>' +
        '<div class="fam">' + esc(FAMILIA_LABEL[m.familia] || '') + (m.tipo ? ' · ' + esc(m.tipo) : '') + '</div>' +
        '<span class="destaque-cta">Ver máquina →</span>' +
      '</div></a>';
  }

  if (!window.MC || !MC.configured || !MC.db) { fallbackCta(); return; }

  MC.db.collection('maquinas').where('destaque', '==', true).get()
    .then(function (snap) {
      var list = [];
      snap.forEach(function (doc) {
        var m = Object.assign({ id: doc.id }, doc.data());
        if (m.status === 'publicado') list.push(m);
      });
      list.sort(function (a, b) { return (a.destaqueOrdem || 999) - (b.destaqueOrdem || 999); });
      list = list.slice(0, MAX);
      if (list.length < MIN) { fallbackCta(); return; }
      grid.innerHTML = list.map(cardHTML).join('');
      section.style.display = '';
    })
    .catch(function (err) { console.error(err); fallbackCta(); });
});
