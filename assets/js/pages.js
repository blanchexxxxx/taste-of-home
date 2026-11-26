/* Page renderers: hero bubbles (home), posts grid (posts.html), single post (post.html). */
(function () {
  var T = window.TOH;
  var esc = T.esc, t = T.t;

  function locOf(p) { return p.location ? window.LOCATIONS[p.location] : null; }

  /* ---------- home: photo slideshow ----------
     Portrait photo card: photos cross-fade with a slow zoom every 2 seconds; the segmented
     bar shows progress and jumps to a photo when clicked. Paused in background tabs. */
  var show = document.getElementById('show');
  if (show && window.HERO_PHOTOS && window.HERO_PHOTOS.length) {
    var INTERVAL = 2000;
    var photos = window.HERO_PHOTOS, cur = -1, timer = null;
    var box = show.querySelector('.show__slides'), dotsBox = show.querySelector('.show__dots'), count = show.querySelector('.show__count');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    show.style.setProperty('--dur', INTERVAL + 'ms');
    var slides = photos.map(function (ph) {
      var img = document.createElement('img');
      img.src = ph.src; img.alt = ph.alt || ''; img.decoding = 'async';
      box.appendChild(img);
      return img;
    });
    var dots = photos.map(function (ph, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'show__dot'; b.setAttribute('aria-label', ph.alt || String(i + 1));
      b.innerHTML = '<span></span>';
      b.addEventListener('click', function () { go(i); restart(); });
      dotsBox.appendChild(b);
      return b;
    });
    function go(i) {
      cur = (i + photos.length) % photos.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === cur); s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
      dots.forEach(function (d, k) {
        d.classList.remove('is-on'); d.classList.toggle('is-done', k < cur);
        d.setAttribute('aria-current', k === cur ? 'true' : 'false');
      });
      void dots[cur].offsetWidth;          // restart the fill animation
      dots[cur].classList.add('is-on');
      count.innerHTML = '<b>' + pad(cur + 1) + '</b> / ' + pad(photos.length);
    }
    function restart() {
      clearInterval(timer);
      if (photos.length > 1 && !document.hidden) timer = setInterval(function () { go(cur + 1); }, INTERVAL);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) go(cur); restart(); });
    go(0); restart();
  }

  /* ---------- info: photo credits ---------- */
  var credits = document.getElementById('photo-credits');
  if (credits && window.HERO_PHOTOS) {
    var commons = window.HERO_PHOTOS.filter(function (ph) { return ph.url; });
    credits.innerHTML = commons.length ? 'Photos (Wikimedia Commons): ' + commons.map(function (ph) {
      return '<a href="' + esc(ph.url) + '" target="_blank" rel="noopener">' + esc(ph.alt) + '</a> (' + esc(ph.credit) + ')';
    }).join(', ') + '.' : '';
  }

  /* ---------- info: team (from the posts' authors; the professor first) ---------- */
  var team = document.getElementById('team');
  function renderTeam() {
    var people = window.POSTS.filter(function (p) { return p.role === 'teacher'; })
      .concat(window.POSTS.filter(function (p) { return p.role !== 'teacher'; }));
    team.innerHTML = people.map(function (p) {
      var name = T.pick(p.author), l = locOf(p);
      var initials = name ? name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase() : '';
      var role = p.role === 'teacher' ? t('post.professor') : t('post.student');
      return '<div><span class="' + (name ? 'is-named' : '') + '">' + esc(initials) + '</span>' +
        '<b>' + esc(name || t('post.student')) + '</b>' +
        '<small>' + esc(name ? role + (l ? ' · ' + t('country.' + l.country) : '') : (l ? t('country.' + l.country) : '')) + '</small></div>';
    }).join('');
  }
  if (team) { renderTeam(); document.addEventListener('langchange', renderTeam); }

  /* ---------- news (assets/js/news.js): cards on the Info page + the article page ---------- */
  function newsText(n) { return n.text[T.getLang()] || n.text.en; }
  function newsUrl(n) { return 'news.html?id=' + encodeURIComponent(n.id); }

  var newsList = document.getElementById('news-list');
  function renderNewsList() {
    newsList.innerHTML = (window.NEWS || []).map(function (n) {
      var x = newsText(n);
      return '<a class="news-card reveal is-in" href="' + newsUrl(n) + '">' +
        '<div class="news-card__img"><img src="' + esc(n.cover) + '" alt="" loading="lazy"></div>' +
        '<div class="news-card__body"><span class="chip chip--grad">' + esc(t('info.reportTag')) + '</span>' +
        '<h2>' + esc(x.title) + '</h2><p>' + esc(x.dek) + '</p><p class="news-card__meta">' + esc(x.meta) + '</p>' +
        '<span class="btn btn--grad">' + esc(t('info.readArticle')) + T.icon('arrow-right') + '</span></div></a>';
    }).join('');
  }
  if (newsList) { renderNewsList(); document.addEventListener('langchange', renderNewsList); }

  var newsEl = document.getElementById('news');
  function renderNews() {
    var id = new URLSearchParams(location.search).get('id'), n = null;
    (window.NEWS || []).forEach(function (x) { if (x.id === id) n = x; });
    if (!n && window.NEWS && window.NEWS.length) n = window.NEWS[0];   // unknown or missing id: show the latest article
    var back = '<a class="pill-btn back" href="info.html">' + T.icon('arrow-left') + esc(t('info.backInfo')) + '</a>';
    if (!n) { newsEl.innerHTML = back + '<p class="placeholder">' + esc(t('post.notFound')) + '</p>'; return; }
    var x = newsText(n);
    document.title = x.title + ' | Taste of Home';
    function fig(inner, cap, cls) {
      return '<figure' + (cls ? ' class="' + cls + '"' : '') + '>' + inner + (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
    }
    function img(src) { return '<a href="' + esc(src) + '" target="_blank" rel="noopener"><img src="' + esc(src) + '" alt="" loading="lazy"></a>'; }
    var body = x.blocks.map(function (b) {
      if (b.p) return '<p>' + esc(b.p) + '</p>';
      if (b.img) return fig(img(b.img), b.caption, /tall|desserts/.test(b.img) ? 'is-tall' : '');
      if (b.imgs) return fig('<div class="news__pair">' + b.imgs.map(img).join('') + '</div>', b.caption);
      if (b.video) return fig('<div class="video"><video controls playsinline preload="metadata"' + (b.poster ? ' poster="' + esc(b.poster) + '"' : '') + ' src="' + esc(b.video) + '"></video></div>', b.caption);
      return '';
    }).join('');
    newsEl.innerHTML = back +
      '<div><span class="chip chip--grad">' + esc(t('info.reportTag')) + '</span></div>' +
      '<h1>' + esc(x.title) + '</h1>' +
      '<p class="news__dek">' + esc(x.dek) + '</p>' +
      '<p class="news__meta">' + esc(x.meta) + '</p>' +
      '<div class="news__body">' + body + '</div>' +
      (n.author ? '<p class="news__byline">' + esc(t('news.by')) + ' <b>' + esc(n.author) + '</b></p>' : '');
  }
  if (newsEl) { renderNews(); document.addEventListener('langchange', renderNews); }

  /* ---------- posts grid ---------- */
  var grid = document.getElementById('posts-grid');
  function renderGrid() {
    grid.innerHTML = window.POSTS.map(function (p) {
      var l = locOf(p);
      var media = p.poster
        ? '<img src="' + esc(p.poster) + '" alt="" loading="lazy">'
        : '<span class="tile__code">' + esc(l ? l.code : '?') + '</span>';
      return '<a class="tile reveal" href="' + T.postUrl(p) + '">' +
        '<div class="tile__media">' + media + '<span class="tile__play">' + T.icon('play') + '</span></div>' +
        '<div class="tile__body"><div><h3>' + esc(T.postTitle(p)) + '</h3>' +
        '<p class="tile__place">' + esc(T.placeLabel(p)) + '</p></div>' +
        '<span class="tile__go" aria-hidden="true">' + T.icon('arrow-right') + '</span></div>' +
        '</a>';
    }).join('');
    grid.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i * 60) + 'ms';
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-in'); }); });
    });
  }
  if (grid) { renderGrid(); document.addEventListener('langchange', renderGrid); }

  /* ---------- single post ---------- */
  var postEl = document.getElementById('post');

  // Key words, ingredients and steps. A list left as null shows "coming soon".
  function recipeHTML(p) {
    function list(tag, items) {
      items = T.pick(items);
      if (!items || !items.length) return '<p class="placeholder">' + esc(t('post.recipeSoon')) + '</p>';
      if (items[0] && items[0].items) {   // grouped: [{ title: 'Sambal', note: '...', items: [...] }, ...]
        return items.map(function (g) {
          return (g.note ? '<p class="post__note">' + esc(T.pick(g.note)) + '</p>' : '') +
            (g.title ? '<h3>' + esc(T.pick(g.title)) + '</h3>' : '') + list(tag, g.items);
        }).join('');
      }
      return '<' + tag + '>' + items.map(function (x) { return '<li>' + esc(T.pick(x)) + '</li>'; }).join('') + '</' + tag + '>';
    }
    var kw = T.postField(p, 'keywords');
    return (kw && kw.length
        ? '<section class="post__body post__keywords"><h2>' + esc(t('post.keywords')) + '</h2><dl>' + kw.map(function (k) {
            return '<div><dt>' + esc(T.pick(k.word)) + '</dt>' + (k.meaning ? '<dd>' + esc(T.pick(k.meaning)) + '</dd>' : '') + '</div>';
          }).join('') + '</dl></section>'
        : '') +
      '<section class="post__body post__list"><h2>' + esc(t('post.ingredients')) + '</h2>' + list('ul', T.postField(p, 'ingredients')) + '</section>' +
      '<section class="post__body post__list"><h2>' + esc(t('post.method')) + '</h2>' + list('ol', T.postField(p, 'steps')) + '</section>';
  }
  function renderPost() {
    var id = new URLSearchParams(location.search).get('id');
    var idx = -1;
    window.POSTS.forEach(function (p, i) { if (p.id === id) idx = i; });
    if (idx < 0) {
      postEl.innerHTML = '<p class="placeholder">' + esc(t('post.notFound')) + '</p><p><a class="btn" href="posts.html">' + T.icon('arrow-left') + esc(t('post.back')) + '</a></p>';
      return;
    }
    var p = window.POSTS[idx];
    var loc = locOf(p);
    if (loc && loc.code) {
      // Dimmed, faded country flag behind the top of the page (assets/img/flags/<code>.svg).
      var flag = document.querySelector('.flag-bg') || document.body.insertBefore(document.createElement('div'), document.body.firstChild);
      flag.className = 'flag-bg'; flag.setAttribute('aria-hidden', 'true');
      // absolute URL: a url() inside a custom property would otherwise resolve against style.css
      flag.style.setProperty('--flag', 'url("' + new URL('assets/img/flags/' + loc.code.toLowerCase() + '.svg', location.href).href + '")');
    }
    var title = T.postTitle(p);
    var summary = T.postField(p, 'summary');
    var body = T.postField(p, 'body');
    var paras = body ? (Array.isArray(body) ? body : [body]) : null;
    var prev = window.POSTS[(idx - 1 + window.POSTS.length) % window.POSTS.length];
    var next = window.POSTS[(idx + 1) % window.POSTS.length];

    document.title = title + ' | Taste of Home';

    postEl.innerHTML =
      '<a class="pill-btn back" href="posts.html">' + T.icon('arrow-left') + esc(t('post.back')) + '</a>' +
      '<div><span class="chip chip--grad">' + T.icon('map-pin') + esc(T.placeLabel(p)) + '</span></div>' +
      '<h1>' + esc(title) + '</h1>' +
      '<p class="byline">' + esc(t('post.by')) + ' ' + esc(T.postAuthor(p)) + '</p>' +
      T.videoHTML(p) +
      (summary || !(paras || p.ingredients || p.steps) ? '<p class="post__summary' + (summary ? '' : ' placeholder') + '">' + esc(summary || t('post.summarySoon')) + '</p>' : '') +
      '<section class="post__body"><h2>' + esc(t('post.story')) + '</h2>' +
      (paras ? paras.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') : '<p class="placeholder">' + esc(t('post.bodySoon')) + '</p>') +
      '</section>' +
      (paras || p.ingredients || p.steps ? recipeHTML(p) : '') +
      '<nav class="post__nav">' +
      '<a class="btn" href="' + T.postUrl(prev) + '">' + T.icon('arrow-left') + esc(t('post.prev')) + '</a>' +
      '<a class="btn btn--grad" href="' + T.postUrl(next) + '">' + esc(t('post.next')) + T.icon('arrow-right') + '</a>' +
      '</nav>';
  }
  if (postEl) { renderPost(); document.addEventListener('langchange', renderPost); }
})();
