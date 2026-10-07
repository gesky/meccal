document.addEventListener('DOMContentLoaded', function () {
  var root = document.getElementById('md-root');
  if (!root) return;
  var wrap = root.querySelector('.wrap');

  var WHATSAPP_NUMBER = '5514997758195';
  var FAMILIA_LABEL = { 'metalurgia': 'Metalurgia', 'construcao-civil': 'Construção Civil' };
  var SELO_LABEL = { 'seminovo': 'Seminovo', 'promocao': 'Promoção' };
  var BACK = '<a class="md-back" href="maquinas.html">&larr; Todas as máquinas</a>';

  function esc(s) {
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
    return raw.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (line) {
      var idx = line.indexOf(':');
      return idx === -1 ? { campo: '', valor: line } : { campo: line.slice(0, idx).trim(), valor: line.slice(idx + 1).trim() };
    });
  }

  // Uma linha de "mídias" vira um item da galeria: imagem, GIF, vídeo (arquivo) ou vídeo incorporado (YouTube/Vimeo)
  function parseMediaLine(url) {
    var u = url.trim();
    var yt = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
    if (yt) return { type: 'embed', src: 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0', thumb: 'https://img.youtube.com/vi/' + yt[1] + '/mqdefault.jpg' };
    var vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vm) return { type: 'embed', src: 'https://player.vimeo.com/video/' + vm[1], thumb: '' };
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(u)) return { type: 'video', src: u, thumb: '' };
    return { type: 'image', src: u, thumb: u };
  }

  function buildItems(m) {
    var items = [];
    if (m.imageUrl) items.push({ type: 'image', src: m.imageUrl, thumb: m.imageUrl });
    (Array.isArray(m.gallery) ? m.gallery : []).forEach(function (g) { if (g) items.push({ type: 'image', src: g, thumb: g }); });
    String(m.media || '').split('\n').forEach(function (l) { if (l.trim()) items.push(parseMediaLine(l)); });
    return items;
  }

  function stageHTML(it) {
    if (!it) return '<div class="ph" style="height:100%;"><span class="ph-icon">▢</span><span class="ph-label">Sem foto ainda</span></div>';
    if (it.type === 'embed') return '<iframe src="' + esc(it.src) + '" title="Vídeo da máquina" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>';
    if (it.type === 'video') return '<video src="' + esc(it.src) + '" controls playsinline preload="metadata"></video>';
    return '<img src="' + esc(it.src) + '" alt="">';
  }

  function thumbHTML(it, i) {
    var inner = it.thumb
      ? '<img src="' + esc(it.thumb) + '" alt="" loading="lazy">'
      : '<span class="md-thumb-fill"></span>';
    var play = (it.type === 'video' || it.type === 'embed') ? '<span class="md-play">&#9654;</span>' : '';
    return '<button type="button" class="md-thumb' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" aria-label="Mídia ' + (i + 1) + '">' + inner + play + '</button>';
  }

  function relatedHTML(r) {
    var img = r.imageUrl ? '<img src="' + esc(r.imageUrl) + '" alt="' + esc(r.title) + '" loading="lazy">' : '<div class="ph" style="height:100%;"></div>';
    return '<a class="destaque-card maq-card" href="maquina.html?id=' + encodeURIComponent(r.id) + '">' +
      '<div class="destaque-media">' + img + '</div>' +
      '<div class="destaque-body"><h3>' + esc(r.title) + '</h3>' +
      '<div class="fam">' + esc(FAMILIA_LABEL[r.familia] || '') + (r.tipo ? ' · ' + esc(r.tipo) : '') + '</div>' +
      '<span class="destaque-cta">Ver máquina →</span></div></a>';
  }

  function notFound(msg) {
    wrap.innerHTML = BACK + '<p class="maq-empty">' + msg + '</p>';
  }

  function render(m, preview) {
    document.title = m.title + ' | Meccal';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', m.excerpt || ('Detalhes e ficha técnica da ' + m.title + ', fabricada pela Meccal em Bauru/SP.'));

    var items = buildItems(m);
    var specs = parseSpecs(m.specs);
    var desc = String(m.description || '').split('\n').filter(Boolean).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var selo = m.selo ? '<span class="md-selo md-selo-' + (m.selo === 'promocao' ? 'promocao' : 'seminovo') + '">' + SELO_LABEL[m.selo] + '</span>' : '';

    wrap.innerHTML =
      BACK +
      (preview ? '<div class="md-preview">Pré-visualização: esta máquina está como "' + esc(m.status || 'rascunho') + '" e não aparece para os visitantes.</div>' : '') +
      '<div class="md-top">' +
        '<div class="md-gallery">' +
          '<div class="md-stage" id="md-stage">' + stageHTML(items[0]) + '</div>' +
          (items.length > 1 ? '<div class="md-thumbs" id="md-thumbs">' + items.map(thumbHTML).join('') + '</div>' : '') +
        '</div>' +
        '<div class="md-info">' +
          '<div class="md-fam">' + esc(FAMILIA_LABEL[m.familia] || '') + (m.tipo ? ' · ' + esc(m.tipo) : '') + selo + '</div>' +
          '<h1>' + esc(m.title) + '</h1>' +
          (m.excerpt ? '<p class="lead">' + esc(m.excerpt) + '</p>' : '') +
          '<a href="' + whatsappLink(m.title) + '" target="_blank" rel="noopener" class="btn btn-primary">Falar sobre esta máquina</a>' +
          (specs.length ? '<a href="#md-specs" class="md-anchor">Ver ficha técnica ↓</a>' : '') +
          '<p class="md-note">Fabricada em Bauru/SP, com atendimento direto da equipe Meccal.</p>' +
        '</div>' +
      '</div>' +
      ((desc || specs.length) ?
        '<div class="md-body">' +
          (desc ? '<div class="md-desc"><h2>Sobre a máquina</h2>' + desc + '</div>' : '') +
          (specs.length ? '<div class="md-specs-wrap" id="md-specs"><h2>Ficha técnica</h2><table class="maq-specs">' +
            specs.map(function (s) { return '<tr><td>' + esc(s.campo) + '</td><td>' + esc(s.valor) + '</td></tr>'; }).join('') +
          '</table></div>' : '') +
        '</div>' : '') +
      '<div class="md-related" id="md-related" style="display:none;"><h2>Outras máquinas</h2><div class="maq-grid" id="md-related-grid"></div></div>';

    // Galeria: troca da mídia principal
    var stage = document.getElementById('md-stage');
    var thumbs = document.getElementById('md-thumbs');
    if (thumbs) {
      thumbs.addEventListener('click', function (e) {
        var btn = e.target.closest('.md-thumb');
        if (!btn) return;
        thumbs.querySelectorAll('.md-thumb').forEach(function (t) { t.classList.remove('active'); });
        btn.classList.add('active');
        stage.innerHTML = stageHTML(items[+btn.dataset.i]);
      });
    }
    return m;
  }

  function loadRelated(m) {
    MC.db.collection('maquinas').where('status', '==', 'publicado').get().then(function (snap) {
      var list = [];
      snap.forEach(function (d) { if (d.id !== m.id) list.push(Object.assign({ id: d.id }, d.data())); });
      list.sort(function (a, b) {
        function score(x) { return (x.tipo && x.tipo === m.tipo ? 2 : 0) + (x.familia === m.familia ? 1 : 0); }
        return score(b) - score(a);
      });
      list = list.slice(0, 4);
      if (!list.length) return;
      document.getElementById('md-related-grid').innerHTML = list.map(relatedHTML).join('');
      document.getElementById('md-related').style.display = '';
    }).catch(function () {});
  }

  var id = new URLSearchParams(location.search).get('id');
  if (!id) { notFound('Máquina não encontrada. Veja o catálogo completo e escolha o modelo.'); return; }
  if (!window.MC || !MC.configured || !MC.db) { notFound('O catálogo online ainda está sendo montado. Fale com a gente pelo WhatsApp.'); return; }

  MC.db.collection('maquinas').doc(id).get().then(function (doc) {
    if (!doc.exists) { notFound('Máquina não encontrada. Veja o catálogo completo e escolha o modelo.'); return; }
    var m = Object.assign({ id: doc.id }, doc.data());
    if (m.status === 'publicado') { render(m, false); loadRelated(m); return; }
    // Rascunho/arquivada: só quem está logado no admin consegue pré-visualizar
    var shown = false;
    var done = function (user) {
      if (shown) return; shown = true;
      if (user) { render(m, true); } else { notFound('Máquina não encontrada. Veja o catálogo completo e escolha o modelo.'); }
    };
    if (MC.auth && MC.auth.onAuthStateChanged) { var off = MC.auth.onAuthStateChanged(function (u) { if (off) off(); done(u); }); }
    else done(null);
  }).catch(function (err) {
    notFound('Não foi possível carregar a máquina agora. Tenta de novo em instantes, ou fala com a gente pelo WhatsApp.');
    console.error(err);
  });
});
