document.addEventListener('DOMContentLoaded', function () {

  function initReveal() {
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in-view'); });
    }
  }

  // Loading screen (Home only) — shows once per browser session.
  // sessionStorage clears when the tab/browser is closed, so it reappears
  // on a fresh visit but not when navigating back to the home page.
  var loader = document.querySelector('#site-loader');
  if (loader) {
    var alreadyShown = false;
    try { alreadyShown = sessionStorage.getItem('meccalLoaderShown') === '1'; } catch (e) {}

    if (alreadyShown) {
      loader.remove();
      document.body.classList.remove('loading');
      initReveal();
    } else {
      try { sessionStorage.setItem('meccalLoaderShown', '1'); } catch (e) {}

      var video = loader.querySelector('.loader-video');
      if (video) {
        video.muted = true;
        video.setAttribute('muted', '');
        var tryPlay = function () {
          var p = video.play();
          if (p && typeof p.catch === 'function') { p.catch(function () {}); }
        };
        tryPlay();
        document.addEventListener('click', tryPlay, { once: true });
      }
      setTimeout(function () { loader.classList.add('fade-out'); }, 3200);
      setTimeout(function () {
        loader.remove();
        document.body.classList.remove('loading');
        initReveal(); // home content fades in right as the loader disappears
      }, 4000);
    }
  } else {
    initReveal();
  }

  // Mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.mainnav');
  var backdrop = document.querySelector('.nav-backdrop');
  var closeBtn = document.querySelector('.nav-close');

  function openNav() {
    nav.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-locked');
  }
  function closeNav() {
    nav.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-locked');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.contains('open') ? closeNav() : openNav();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeNav);
    if (backdrop) backdrop.addEventListener('click', closeNav);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeNav(); });
    });
  }

  // Header shadow on scroll
  var headerWrap = document.querySelector('#site-header-wrap');
  if (headerWrap) {
    window.addEventListener('scroll', function () {
      headerWrap.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true });
  }

  // Contact form (simulated)
  var form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Formulário será conectado ao envio real na Fase 3. Envio simulado com sucesso.');
      form.reset();
    });
  }

  // Force-play any background/hero videos (covers stricter mobile autoplay policies)
  document.querySelectorAll('video[autoplay]').forEach(function (v) {
    v.muted = true;
    v.setAttribute('muted', '');
    var attemptPlay = function () {
      var p = v.play();
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    };
    attemptPlay();
    document.addEventListener('click', attemptPlay, { once: true });
  });

  // Parallax — subtle vertical drift on elements with .parallax + data-speed
  var parallaxEls = document.querySelectorAll('.parallax');
  if (parallaxEls.length) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      var ticking = false;
      var updateParallax = function () {
        parallaxEls.forEach(function (el) {
          var speed = parseFloat(el.getAttribute('data-speed')) || 0.25;
          var wrapEl = el.closest('.parallax-wrap') || el.parentElement;
          var rect = wrapEl.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) { return; }
          var offset = (rect.top - window.innerHeight / 2) * speed;
          var maxOffset = rect.height * 0.08; // keeps the image's bled edges safely covered
          if (offset > maxOffset) { offset = maxOffset; }
          if (offset < -maxOffset) { offset = -maxOffset; }
          el.style.transform = 'translateY(' + offset + 'px)';
        });
        ticking = false;
      };
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
      updateParallax();
    }
  }
});
