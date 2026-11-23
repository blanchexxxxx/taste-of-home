/* Page renderers: hero bubbles (home), posts grid (posts.html), single post (post.html). */
(function () {
  var T = window.TOH;
  var esc = T.esc, t = T.t;

  function locOf(p) { return p.location ? window.LOCATIONS[p.location] : null; }

  /* ---------- home: photo slideshow ----------
     Drawn on a canvas: the photo sits in an irregular shape and breaks up into halftone dots
     (coloured from the photo itself) towards the edge. The further out, the wider apart, smaller
     and fainter the dots. Moves on every 2 seconds: the shape morphs and the photos cross-fade. */
  var show = document.getElementById('show');
  if (show && window.HERO_PHOTOS && window.HERO_PHOTOS.length) {
    var INTERVAL = 2000, FADE = 900;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cv = show.querySelector('.show__canvas'), g = cv.getContext('2d');
    var dotsBox = show.querySelector('.show__dots');
    var photos = window.HERO_PHOTOS, cur = 0, prev = -1, fadeStart = 0, timer = null, raf = 0;
    var S = 0, W = 0, dpr = 1;

    // Each photo gets its own outline: a circle wobbled by a few smooth sine waves.
    function shapeFor(i) {
      var r = function (k) { var x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
      return { base: 0.40, w: [2, 3, 5].map(function (f, k) { return { f: f, a: 0.035 + 0.04 * r(k), p: r(k + 7) * 6.283 }; }) };
    }
    function radius(sh, th) {   // outline radius at angle th, as a fraction of S
      var v = sh.base;
      sh.w.forEach(function (w) { v += w.a * Math.sin(w.f * th + w.p) * sh.base; });
      return v;
    }
    function mix(a, b, p) {     // morph between two outlines
      return { base: a.base + (b.base - a.base) * p, w: a.w.map(function (w, k) {
        return { f: w.f, a: w.a * (1 - p), p: w.p }; }).concat(b.w.map(function (w) { return { f: w.f, a: w.a * p, p: w.p }; })) };
    }

    var slides = photos.map(function (ph, i) {
      var sl = { img: new Image(), ready: false, data: null, size: 0, shape: shapeFor(i) };
      sl.img.decoding = 'async';
      sl.img.onload = function () { sl.ready = true; sl.data = null; if (i === cur) draw(); };
      sl.img.src = ph.src;
      return sl;
    });
    // Pixels of a photo scaled to cover the whole canvas, so dots outside the shape can pick colours.
    function pixels(sl) {
      if (sl.data && sl.size === Math.round(W)) return sl.data;
      var n = Math.round(W), off = document.createElement('canvas'); off.width = n; off.height = n;
      var o = off.getContext('2d'), iw = sl.img.naturalWidth, ih = sl.img.naturalHeight, k = Math.max(n / iw, n / ih);
      o.drawImage(sl.img, (n - iw * k) / 2, (n - ih * k) / 2, iw * k, ih * k);
      sl.canvas = off; sl.size = n;
      try { sl.data = o.getImageData(0, 0, n, n).data; } catch (e) { sl.data = null; }
      return sl.data;
    }

    function layer(sl, sh, alpha) {
      if (!sl.ready) return;
      var data = pixels(sl), n = sl.size, c = W / 2, STEPS = 160, th, r;
      // the photo inside the outline
      g.save(); g.globalAlpha = alpha; g.beginPath();
      for (var i = 0; i <= STEPS; i++) {
        th = i / STEPS * 2 * Math.PI; r = radius(sh, th) * S;
        g[i ? 'lineTo' : 'moveTo'](c + r * Math.cos(th), c + r * Math.sin(th));
      }
      g.closePath(); g.clip(); g.drawImage(sl.canvas, 0, 0, W, W); g.restore();
      if (!data) return;
      // halftone rings following the outline, spreading out with distance
      var d = S * 0.004, ring = 0, maxD = S * 0.24;
      while (d < maxD) {
        var t = d / maxD, gap = S * (0.0135 + 0.05 * Math.pow(t, 1.25));
        var dot = gap * 0.5 * (1 - 0.7 * t), a = alpha * Math.pow(1 - t, 1.4);
        var count = Math.floor(2 * Math.PI * (S * 0.4 + d) / gap), ph = ring * 0.5;
        for (var j = 0; j < count; j++) {
          var h = Math.sin(ring * 127.1 + j * 311.7) * 43758.5453; h -= Math.floor(h);   // stable per-dot random
          if (h < t * 0.75) continue;                                                       // fewer dots further out
          th = ph + (j + (h - 0.5) * t) / count * 2 * Math.PI; r = radius(sh, th) * S + d + (h - 0.5) * gap * t;
          var x = c + r * Math.cos(th), y = c + r * Math.sin(th);
          var px = Math.min(n - 1, Math.max(0, Math.round(x / W * n))), py = Math.min(n - 1, Math.max(0, Math.round(y / W * n)));
          var q = (py * n + px) * 4;
          g.fillStyle = 'rgba(' + data[q] + ',' + data[q + 1] + ',' + data[q + 2] + ',' + a.toFixed(3) + ')';
          g.beginPath(); g.arc(x, y, dot, 0, 2 * Math.PI); g.fill();
        }
        d += gap; ring++;
      }
    }

    function draw(now) {
      raf = 0;
      if (!S) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, W);
      var p = prev < 0 || reduce ? 1 : Math.min(1, ((now || performance.now()) - fadeStart) / FADE);
      var e = 1 - Math.pow(1 - p, 3);   // ease-out
      if (p < 1) {
        var sh = mix(slides[prev].shape, slides[cur].shape, e);
        layer(slides[prev], sh, 1 - e);
        layer(slides[cur], sh, e);
        raf = requestAnimationFrame(draw);
      } else {
        layer(slides[cur], slides[cur].shape, 1);
      }
    }
    function resize() {
      S = show.clientWidth; W = S * 1.4; dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(W * dpr);
      draw();
    }

    var dots = photos.map(function (ph, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'show__dot'; b.setAttribute('aria-label', ph.alt || String(i + 1));
      b.addEventListener('click', function () { go(i); restart(); });
      dotsBox.appendChild(b);
      return b;
    });
    function go(i) {
      i = (i + photos.length) % photos.length;
      if (i !== cur) { prev = cur; cur = i; fadeStart = performance.now(); }
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === cur); d.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
      cv.setAttribute('aria-label', photos[cur].alt || '');
      if (!raf) raf = requestAnimationFrame(draw);
    }
    function restart() {
      clearInterval(timer);
      if (photos.length > 1 && !document.hidden) timer = setInterval(function () { go(cur + 1); }, INTERVAL);
    }
    document.addEventListener('visibilitychange', restart);   // no switching in a background tab
    if (window.ResizeObserver) new ResizeObserver(resize).observe(show); else window.addEventListener('resize', resize);
    resize(); go(0); restart();
  }

  /* ---------- info: photo credits ---------- */
  var credits = document.getElementById('photo-credits');
  if (credits && window.HERO_PHOTOS) {
    var commons = window.HERO_PHOTOS.filter(function (ph) { return ph.url; });
    credits.innerHTML = commons.length ? 'Photos (Wikimedia Commons): ' + commons.map(function (ph) {
      return '<a href="' + esc(ph.url) + '" target="_blank" rel="noopener">' + esc(ph.alt) + '</a> (' + esc(ph.credit) + ')';
    }).join(', ') + '.' : '';
  }

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
      if (items[0] && items[0].items) {   // grouped: [{ title: 'Sambal', items: [...] }, ...]
        return items.map(function (g) {
          return (g.title ? '<h3>' + esc(T.pick(g.title)) + '</h3>' : '') + list(tag, g.items);
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
