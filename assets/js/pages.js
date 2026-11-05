/* Page renderers: hero bubbles (home), posts grid (posts.html), single post (post.html). */
(function () {
  var T = window.TOH;
  var esc = T.esc, t = T.t;

  function locOf(p) { return p.location ? window.LOCATIONS[p.location] : null; }

  /* ---------- home: photo slideshow ---------- */
  var slides = document.getElementById('slides');
  if (slides && window.HERO_PHOTOS && window.HERO_PHOTOS.length) {
    var photos = window.HERO_PHOTOS, cur = 0, timer = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dots = document.getElementById('slidesDots');
    var imgs = photos.map(function (ph, i) {
      var im = document.createElement('img');
      im.className = 'slides__img' + (i === 0 ? ' is-on' : '');
      im.alt = ph.alt; im.decoding = 'async';
      if (i === 0) { im.src = ph.src; im.fetchPriority = 'high'; } else { im.dataset.src = ph.src; }
      slides.insertBefore(im, slides.querySelector('.slides__bar'));
      return im;
    });
    // load the rest after the page is idle
    window.addEventListener('load', function () {
      setTimeout(function () { imgs.forEach(function (im) { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }); }, 600);
    });
    dots.innerHTML = photos.map(function (ph, i) { return '<button type="button" aria-label="' + esc(ph.alt) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>'; }).join('');
    function go(n) {
      imgs[cur].classList.remove('is-on'); dots.children[cur].removeAttribute('aria-current');
      cur = (n + imgs.length) % imgs.length;
      var im = imgs[cur]; if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); }
      im.classList.add('is-on'); dots.children[cur].setAttribute('aria-current', 'true');
    }
    function play() { if (!reduce) { clearInterval(timer); timer = setInterval(function () { go(cur + 1); }, 5000); } }
    function stop() { clearInterval(timer); }
    document.getElementById('slidesPrev').addEventListener('click', function () { go(cur - 1); play(); });
    document.getElementById('slidesNext').addEventListener('click', function () { go(cur + 1); play(); });
    dots.addEventListener('click', function (e) { var i = Array.prototype.indexOf.call(dots.children, e.target); if (i > -1) { go(i); play(); } });
    slides.addEventListener('mouseenter', stop); slides.addEventListener('mouseleave', play);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
    play();
  }

  /* ---------- info: photo credits ---------- */
  var credits = document.getElementById('photo-credits');
  if (credits && window.HERO_PHOTOS) {
    credits.innerHTML = 'Photos (Wikimedia Commons): ' + window.HERO_PHOTOS.map(function (ph) {
      return '<a href="' + esc(ph.url) + '" target="_blank" rel="noopener">' + esc(ph.alt) + '</a> (' + esc(ph.credit) + ')';
    }).join(', ') + '.';
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
  function renderPost() {
    var id = new URLSearchParams(location.search).get('id');
    var idx = -1;
    window.POSTS.forEach(function (p, i) { if (p.id === id) idx = i; });
    if (idx < 0) {
      postEl.innerHTML = '<p class="placeholder">' + esc(t('post.notFound')) + '</p><p><a class="btn" href="posts.html">' + T.icon('arrow-left') + esc(t('post.back')) + '</a></p>';
      return;
    }
    var p = window.POSTS[idx];
    var title = T.postTitle(p);
    var summary = T.pick(p.summary);
    var body = T.pick(p.body);
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
      '<p class="post__summary' + (summary ? '' : ' placeholder') + '">' + esc(summary || t('post.summarySoon')) + '</p>' +
      '<section class="post__body"><h2>' + esc(t('post.story')) + '</h2>' +
      (paras ? paras.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') : '<p class="placeholder">' + esc(t('post.bodySoon')) + '</p>') +
      '</section>' +
      '<nav class="post__nav">' +
      '<a class="btn" href="' + T.postUrl(prev) + '">' + T.icon('arrow-left') + esc(t('post.prev')) + '</a>' +
      '<a class="btn btn--grad" href="' + T.postUrl(next) + '">' + esc(t('post.next')) + T.icon('arrow-right') + '</a>' +
      '</nav>';
  }
  if (postEl) { renderPost(); document.addEventListener('langchange', renderPost); }
})();
