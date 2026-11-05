/* Page renderers: hero bubbles (home), posts grid (posts.html), single post (post.html). */
(function () {
  var T = window.TOH;
  var esc = T.esc, t = T.t;

  function locOf(p) { return p.location ? window.LOCATIONS[p.location] : null; }

  /* ---------- home: liquid ball cluster with real physics ---------- */
  var blobs = document.getElementById('blobs');
  if (blobs && window.HERO_PHOTOS) {
    var photos = window.HERO_PHOTOS.slice(0, 5);
    var COLORS = ['#a6f53b', '#c6f23c', '#ddf13d', '#f2ea3f', '#b8f43b'];
    var BIG_R = 0.30, SMALL_R = [0.075, 0.055, 0.068, 0.05, 0.062]; // radii as a fraction of box width
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gooBox = blobs.querySelector('.blobs__goo'), picBox = blobs.querySelector('.blobs__pics');
    var W = 1, big = 0;

    var balls = photos.map(function (ph, i) {
      var g = document.createElement('span'); g.className = 'ball'; g.style.setProperty('--c', COLORS[i % COLORS.length]);
      var pc = document.createElement('span'); pc.className = 'pic';
      pc.innerHTML = '<img src="' + esc(ph.src) + '" alt="' + esc(ph.alt) + '" decoding="async">';
      gooBox.appendChild(g); picBox.appendChild(pc);
      var ang = i * 2.4, d = i ? 0.33 : 0;          // start roughly around the centre
      return { g: g, pc: pc, x: 0.5 + Math.cos(ang) * d, y: 0.5 + Math.sin(ang) * d, vx: 0, vy: 0,
               r: i ? SMALL_R[i] : BIG_R, tr: i ? SMALL_R[i] : BIG_R, small: SMALL_R[i] };
    });

    function setBig(i) {
      if (i < 0 || i === big) return;
      balls[big].tr = balls[big].small; balls[i].tr = BIG_R; big = i;
      balls.forEach(function (b, k) { b.g.classList.toggle('is-big', k === big); b.pc.classList.toggle('is-big', k === big); });
      wake();
    }
    balls[0].g.classList.add('is-big'); balls[0].pc.classList.add('is-big');

    // --- simulation (units: fraction of box width; one step = 1/60 s) ---
    var drag = null;
    function step() {
      var n = balls.length, i, j, b;
      for (i = 0; i < n; i++) {
        b = balls[i];
        b.r += (b.tr - b.r) * 0.08;                         // grow / shrink smoothly
        if (b === drag) continue;
        var pull = i === big ? 0.010 : 0.0045;             // attraction to the centre (big one anchored harder)
        b.vx += (0.5 - b.x) * pull + (Math.random() - 0.5) * 0.00045;   // + a little Brownian jitter
        b.vy += (0.5 - b.y) * pull + (Math.random() - 0.5) * 0.00045;
        b.vx *= 0.9; b.vy *= 0.9;                           // viscous liquid
        b.x += b.vx; b.y += b.vy;
      }
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {  // small balls gently keep their distance, so they spread around the big one
        if (i === big || j === big) continue;
        var p1 = balls[i], p2 = balls[j], ex = p2.x - p1.x, ey = p2.y - p1.y, ed = Math.sqrt(ex * ex + ey * ey) || 1e-6;
        if (ed < 0.3) { var f = 0.0009 * (0.3 - ed) / 0.3; p1.vx -= ex / ed * f; p1.vy -= ey / ed * f; p2.vx += ex / ed * f; p2.vy += ey / ed * f; }
      }
      for (var it = 0; it < 3; it++) {                      // resolve collisions
        for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
          var a = balls[i], c = balls[j];
          var dx = c.x - a.x, dy = c.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
          var min = a.r + c.r + 0.016;                      // small gap: balls stay round, the goo bridges them
          if (dist >= min) continue;
          var nx = dx / dist, ny = dy / dist, over = min - dist;
          var ma = a === drag ? 1e6 : a.r * a.r, mc = c === drag ? 1e6 : c.r * c.r, tot = ma + mc;
          a.x -= nx * over * mc / tot; a.y -= ny * over * mc / tot;
          c.x += nx * over * ma / tot; c.y += ny * over * ma / tot;
          var rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;  // bounce (restitution 0.35)
          if (rv < 0) {
            var imp = -1.35 * rv / (1 / ma + 1 / mc);
            if (a !== drag) { a.vx -= imp * nx / ma; a.vy -= imp * ny / ma; }
            if (c !== drag) { c.vx += imp * nx / mc; c.vy += imp * ny / mc; }
          }
        }
      }
      for (i = 0; i < n; i++) {                             // stay inside the box
        b = balls[i];
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.4; }
        if (b.x > 1 - b.r) { b.x = 1 - b.r; b.vx = -Math.abs(b.vx) * 0.4; }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.4; }
        if (b.y > 1 - b.r) { b.y = 1 - b.r; b.vy = -Math.abs(b.vy) * 0.4; }
      }
    }
    function render() {
      var R = BIG_R * W;                                     // elements are sized for the big radius, then scaled
      balls.forEach(function (b) {
        var tx = b.x * W - R, ty = b.y * W - R, sc = b.r / BIG_R;
        b.g.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + (sc + 0.012 / BIG_R) + ')';
        b.pc.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ')';
      });
    }
    function resize() {
      W = blobs.clientWidth || 1;
      var d = 2 * BIG_R * W + 'px';
      balls.forEach(function (b) { b.g.style.width = b.g.style.height = d; b.pc.style.width = b.pc.style.height = d; });
      render();
    }

    var running = false, visible = true, last = 0, acc = 0;
    function frame(t) {
      if (!running) return;
      acc += Math.min(t - (last || t), 100); last = t;
      while (acc >= 16.67) { step(); acc -= 16.67; }
      render();
      requestAnimationFrame(frame);
    }
    function wake() {
      if (reduce) { for (var k = 0; k < 240; k++) step(); render(); return; }
      if (!running && visible && !document.hidden) { running = true; last = 0; requestAnimationFrame(frame); }
    }
    function sleep() { running = false; }

    resize();
    for (var k0 = 0; k0 < 200; k0++) step();               // settle before first paint
    render();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); else sleep(); }).observe(blobs);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) sleep(); else wake(); });
    wake();

    // --- pointer: click a small ball to make it big; drag (mouse) to throw a ball ---
    function hit(e) {
      var r = blobs.getBoundingClientRect(), px = (e.clientX - r.left) / W, py = (e.clientY - r.top) / W, best = null, bd = 1e9;
      balls.forEach(function (b) { var d = Math.hypot(px - b.x, py - b.y); if (d < b.r + 0.01 && d < bd) { bd = d; best = b; } });
      return { b: best, x: px, y: py };
    }
    var down = null;
    blobs.addEventListener('pointerdown', function (e) {
      var h = hit(e); if (!h.b) return;
      down = { b: h.b, x: e.clientX, y: e.clientY, lx: h.x, ly: h.y, moved: false };
      if (e.pointerType === 'mouse') blobs.setPointerCapture(e.pointerId);
    });
    blobs.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' && !down) blobs.classList.toggle('is-over', !!hit(e).b);
      if (!down || e.pointerType !== 'mouse') return;
      if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) return;
      down.moved = true; drag = down.b; blobs.classList.add('is-dragging');
      var h = hit(e);
      drag.vx = Math.max(-0.05, Math.min(0.05, h.x - down.lx)); drag.vy = Math.max(-0.05, Math.min(0.05, h.y - down.ly)); // throw velocity
      drag.x = h.x; drag.y = h.y; down.lx = h.x; down.ly = h.y;
      wake();
    });
    function up() {
      if (!down) return;
      if (!down.moved) setBig(balls.indexOf(down.b));
      drag = null; down = null; blobs.classList.remove('is-dragging'); wake();
    }
    blobs.addEventListener('pointerup', up);
    blobs.addEventListener('pointercancel', function () { drag = null; down = null; blobs.classList.remove('is-dragging'); });
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
