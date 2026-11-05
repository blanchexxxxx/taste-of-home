/* Page renderers: hero bubbles (home), posts grid (posts.html), single post (post.html). */
(function () {
  var T = window.TOH;
  var esc = T.esc, t = T.t;

  function locOf(p) { return p.location ? window.LOCATIONS[p.location] : null; }

  /* ---------- home: liquid photo cluster ---------- */
  var blobs = document.getElementById('blobs');
  if (blobs && window.HERO_PHOTOS) {
    var photos = window.HERO_PHOTOS.slice(0, 5);
    var BIG = 70;                                    // big circle diameter, % of the box (matches CSS width)
    var CX = 48, CY = 46, GAP = 1;                   // big circle centre; small gap so the liquid bridges them
    // small circles hug the big one: [angle in degrees (0 = right, 90 = down), diameter %]
    var RING = [[-48, 16], [8, 12], [62, 15], [148, 13]];
    var SLOTS = [[CX, CY, BIG]].concat(RING.map(function (r) {
      var d = BIG / 2 + r[1] / 2 + GAP, a = r[0] * Math.PI / 180;
      return [CX + Math.cos(a) * d, CY + Math.sin(a) * d, r[1]];
    }));
    var pics = blobs.querySelector('.blobs__pics'), gooBox = blobs.querySelector('.blobs__goo');
    gooBox.innerHTML = photos.map(function () { return '<span class="goo"></span>'; }).join('');
    pics.innerHTML = photos.map(function (ph, i) {
      return '<button type="button" class="blob" style="--i:' + i + '" data-i="' + i + '" aria-label="' + esc(ph.alt) + '">' +
        '<img src="' + esc(ph.src) + '" alt="" decoding="async"></button>';
    }).join('');
    var els = pics.querySelectorAll('.blob'), goos = gooBox.querySelectorAll('.goo');
    var cap = document.createElement('span'); cap.className = 'blobs__cap'; blobs.appendChild(cap);
    var slotOf = photos.map(function (_, i) { return i; });   // photo i sits in slot slotOf[i]
    var big = 0, locked = null;

    function place() {
      var W = blobs.clientWidth, size = W * BIG / 100;
      for (var i = 0; i < els.length; i++) {
        var sl = SLOTS[slotOf[i]], sc = sl[2] / BIG;
        var tx = sl[0] / 100 * W - size / 2, ty = sl[1] / 100 * W - size / 2;
        els[i].style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ')';
        goos[i].style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + (sc + 0.035) + ')';
        var isBig = slotOf[i] === 0;
        els[i].classList.toggle('is-big', isBig); goos[i].classList.toggle('is-big', isBig);
        els[i].tabIndex = 0;
      }
    }
    function caption() {
      cap.classList.add('is-fading');
      setTimeout(function () { cap.textContent = photos[big].alt; cap.classList.remove('is-fading'); }, 250);
    }
    function makeBig(i) {
      if (i === big) return;
      var s = slotOf[i]; slotOf[big] = s; slotOf[i] = 0;
      locked = els[big];            // the old big one lands under the cursor: ignore it until the pointer leaves it
      big = i; place(); caption();
    }
    cap.textContent = photos[0].alt;
    place();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(place, 120); });

    pics.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var b = e.target.closest('.blob'); if (!b || b === locked) return;
      makeBig(+b.getAttribute('data-i'));
    });
    pics.addEventListener('pointerout', function (e) {
      if (locked && e.target.closest('.blob') === locked && !locked.contains(e.relatedTarget)) locked = null;
    });
    pics.addEventListener('click', function (e) { var b = e.target.closest('.blob'); if (b) makeBig(+b.getAttribute('data-i')); });
    pics.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { var b = e.target.closest('.blob'); if (b) { e.preventDefault(); makeBig(+b.getAttribute('data-i')); } }
    });
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
