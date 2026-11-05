/* Shared: language detection/switching, helpers, post popup. */
(function () {
  var STORE_KEY = 'toh-lang';
  var codes = window.LANGS.map(function (l) { return l.code; });

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function detectLang() {
    var saved = safeGet(STORE_KEY);
    if (saved && codes.indexOf(saved) > -1) return saved;
    var prefs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var p = String(prefs[i]).toLowerCase().split('-')[0];
      if (p === 'in') p = 'id'; // legacy Indonesian code
      if (codes.indexOf(p) > -1) return p;
    }
    return 'en';
  }

  var lang = detectLang();

  function t(key) {
    var d = window.I18N[lang] || {};
    return d[key] != null ? d[key] : (window.I18N.en[key] != null ? window.I18N.en[key] : key);
  }

  /* Pick a localized value from a string or {en, zh, ...} object. */
  function pick(v) {
    if (v == null) return null;
    if (typeof v === 'string' || Array.isArray(v)) return v;
    return v[lang] || v.en || v[Object.keys(v)[0]] || null;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function icon(name) { return '<span class="icon">' + ((window.ICONS && window.ICONS[name]) || '') + '</span>'; }
  function injectIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      if (!el.firstChild) el.innerHTML = (window.ICONS && window.ICONS[el.getAttribute('data-icon')]) || '';
      el.classList.add('icon');
    });
  }

  function applyI18n(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    (root || document).querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.documentElement.lang = lang;
  }

  function setLang(code) {
    if (codes.indexOf(code) < 0) return;
    lang = code;
    safeSet(STORE_KEY, code);
    applyI18n();
    renderLangMenu();
    document.dispatchEvent(new CustomEvent('langchange', { detail: code }));
  }

  /* ---------- language menu ---------- */
  var btn, menu;
  function renderLangMenu() {
    if (!menu) return;
    menu.innerHTML = window.LANGS.map(function (l) {
      return '<li role="option" aria-selected="' + (l.code === lang) + '"><button type="button" lang="' + l.code + '" data-code="' + l.code + '">' + esc(l.name) + '</button></li>';
    }).join('');
  }
  function closeMenu() { if (menu) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); } }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  function initHeader() {
    injectIcons();
    initReveal();
    btn = document.getElementById('langBtn');
    menu = document.getElementById('langMenu');
    if (!btn || !menu) return;
    renderLangMenu();
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-code]');
      if (b) { setLang(b.getAttribute('data-code')); closeMenu(); }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.lang')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeModal(); } });
  }

  /* ---------- post helpers ---------- */
  function postTitle(p) { return pick(p.title) || t('post.titleSoon'); }
  function postAuthor(p) { return pick(p.author) || t('post.student'); }
  function placeLabel(p) {
    var loc = p.location && window.LOCATIONS[p.location];
    if (!loc) return t('posts.tba');
    return t('country.' + loc.country) + ' · ' + t('city.' + loc.city);
  }
  function postUrl(p) { return 'post.html?id=' + encodeURIComponent(p.id); }

  function videoHTML(p) {
    var v = p.video;
    if (!v) {
      return '<div class="video video--empty"><span class="play">' + icon('play') + '</span><span>' + esc(t('post.videoSoon')) + '</span></div>';
    }
    if (/\.(mp4|webm|mov)(\?|$)/i.test(v)) {
      return '<div class="video"><video controls playsinline preload="metadata"' + (p.poster ? ' poster="' + esc(p.poster) + '"' : '') + ' src="' + esc(v) + '"></video></div>';
    }
    return '<div class="video"><iframe src="' + esc(v) + '" title="' + esc(postTitle(p)) + '" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
  }

  /* ---------- popup ---------- */
  var modal, lastFocus, onCloseCb;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.hidden = true;
    modal.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__card" role="dialog" aria-modal="true" tabindex="-1"><button class="modal__x" type="button" data-close data-i18n-aria="modal.close" aria-label="Close">' + icon('x') + '</button><div class="modal__body"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
    return modal;
  }

  var modalPosts = null;
  function renderModal() {
    var body = modal.querySelector('.modal__body');
    body.innerHTML = modalPosts.map(function (p) {
      return '<article class="modal__post">' +
        videoHTML(p) +
        '<div class="modal__text">' +
        '<span class="chip">' + icon('map-pin') + esc(placeLabel(p)) + '</span>' +
        '<h3>' + esc(postTitle(p)) + '</h3>' +
        '<p class="byline">' + esc(t('post.by')) + ' ' + esc(postAuthor(p)) + '</p>' +
        '</div>' +
        '<div class="modal__foot"><a class="btn btn--grad btn--sm" href="' + postUrl(p) + '">' + esc(t('modal.detail')) + icon('arrow-right') + '</a></div>' +
        '</article>';
    }).join('');
    applyI18n(modal);
  }

  function openModal(posts, onClose) {
    ensureModal();
    modalPosts = posts;
    onCloseCb = onClose;
    lastFocus = document.activeElement;
    renderModal();
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add('is-open'); modal.querySelector('.modal__card').focus(); });
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    modal.querySelectorAll('video').forEach(function (v) { v.pause(); });
    modal.querySelector('.modal__body').innerHTML = ''; // stops iframes too
    modal.hidden = true;
    modalPosts = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (onCloseCb) onCloseCb();
  }
  document.addEventListener('langchange', function () { if (modalPosts) renderModal(); });

  window.TOH = {
    t: t, pick: pick, icon: icon, injectIcons: injectIcons, esc: esc, getLang: function () { return lang; }, setLang: setLang,
    applyI18n: applyI18n, postTitle: postTitle, postAuthor: postAuthor, placeLabel: placeLabel,
    postUrl: postUrl, videoHTML: videoHTML, openModal: openModal, closeModal: closeModal
  };

  applyI18n();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeader);
  else initHeader();
})();
