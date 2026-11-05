/* Page renderers: hero bubbles (home), posts grid (posts.html), single post (post.html). */
(function () {
  var T = window.TOH;
  var esc = T.esc, t = T.t;

  function locOf(p) { return p.location ? window.LOCATIONS[p.location] : null; }

  /* ---------- home: droplet balls with real physics ----------
     Behaves like immiscible droplets in oil: slow wandering drift, heavy drag, soft low-bounce
     contacts, and a slight squash where two droplets press together. Every ball moves freely. */
  var blobs = document.getElementById('blobs');
  if (blobs && window.HERO_PHOTOS) {
    var photos = window.HERO_PHOTOS.slice(0, 5);
    var COLORS = ['#a6f53b', '#c6f23c', '#ddf13d', '#f2ea3f', '#b8f43b'];
    var BIG_R = 0.27, SMALL_R = [0.075, 0.055, 0.068, 0.05, 0.062]; // radii as a fraction of box width
    var RIM = 0.012;                                   // gradient ring around the big photo
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gooBox = blobs.querySelector('.blobs__goo'), picBox = blobs.querySelector('.blobs__pics');
    var W = 1, big = 0;
    // loose, off-centre starting spots
    var START = [[0.40, 0.44], [0.82, 0.18], [0.86, 0.62], [0.22, 0.86], [0.70, 0.88]];

    var balls = photos.map(function (ph, i) {
      var g = document.createElement('span'); g.className = 'ball'; g.style.setProperty('--c', COLORS[i % COLORS.length]);
      var pc = document.createElement('span'); pc.className = 'pic';
      pc.innerHTML = '<img src="' + esc(ph.src) + '" alt="' + esc(ph.alt) + '" decoding="async">';
      gooBox.appendChild(g); picBox.appendChild(pc);
      return { g: g, pc: pc, x: START[i][0], y: START[i][1], vx: 0, vy: 0,
               r: i ? SMALL_R[i] : BIG_R, tr: i ? SMALL_R[i] : BIG_R, small: SMALL_R[i],
               dir: Math.random() * Math.PI * 2, sq: 0, sqa: 0, px: 0, py: 0 };
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
    var DRAG = 0.955, VMAX = 0.0045, WANDER = 0.000022, BOUNCE = 0.15;
    function radius(b, k) { return b.r + (k === big ? RIM : 0); }
    function step() {
      var n = balls.length, i, j, b;
      for (i = 0; i < n; i++) {
        b = balls[i];
        b.r += (b.tr - b.r) * 0.06;                                   // grow / shrink smoothly
        b.px = 0; b.py = 0;                                           // contact pressure (for squash)
        if (b === drag) continue;
        b.dir += (Math.random() - 0.5) * 0.12;                        // slowly wandering direction
        var acc = WANDER * Math.sqrt(0.06 / b.r);                     // heavier (bigger) drops wander less
        b.vx = (b.vx + Math.cos(b.dir) * acc) * DRAG;
        b.vy = (b.vy + Math.sin(b.dir) * acc) * DRAG;
        var sp = Math.hypot(b.vx, b.vy); if (sp > VMAX) { b.vx *= VMAX / sp; b.vy *= VMAX / sp; }
        b.x += b.vx; b.y += b.vy;
      }
      for (var it = 0; it < 2; it++) {
        for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
          var a = balls[i], c = balls[j];
          var dx = c.x - a.x, dy = c.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
          var min = radius(a, i) + radius(c, j) + 0.003;
          if (dist >= min) continue;
          var nx = dx / dist, ny = dy / dist, over = min - dist;
          var ma = a === drag ? 1e6 : a.r * a.r, mc = c === drag ? 1e6 : c.r * c.r, tot = ma + mc;
          var push = over * 0.5;                                      // soft separation, not an instant snap
          a.x -= nx * push * mc / tot; a.y -= ny * push * mc / tot;
          c.x += nx * push * ma / tot; c.y += ny * push * ma / tot;
          var rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rv < 0) {                                               // low bounce, like droplets
            var imp = -(1 + BOUNCE) * rv / (1 / ma + 1 / mc);
            if (a !== drag) { a.vx -= imp * nx / ma; a.vy -= imp * ny / ma; }
            if (c !== drag) { c.vx += imp * nx / mc; c.vy += imp * ny / mc; }
          }
          a.px -= nx * over; a.py -= ny * over; c.px += nx * over; c.py += ny * over;
        }
      }
      for (i = 0; i < n; i++) {                                       // soft walls
        b = balls[i]; var rr = radius(b, i), hit = false;
        if (b.x < rr) { b.x += (rr - b.x) * 0.5; b.vx = Math.abs(b.vx) * BOUNCE; b.dir = Math.PI - b.dir; b.px -= rr - b.x; hit = true; }
        if (b.x > 1 - rr) { b.x -= (b.x - 1 + rr) * 0.5; b.vx = -Math.abs(b.vx) * BOUNCE; b.dir = Math.PI - b.dir; b.px += b.x - 1 + rr; hit = true; }
        if (b.y < rr) { b.y += (rr - b.y) * 0.5; b.vy = Math.abs(b.vy) * BOUNCE; b.dir = -b.dir; b.py -= rr - b.y; hit = true; }
        if (b.y > 1 - rr) { b.y -= (b.y - 1 + rr) * 0.5; b.vy = -Math.abs(b.vy) * BOUNCE; b.dir = -b.dir; b.py += b.y - 1 + rr; hit = true; }
        // squash along the contact direction, then relax back to round
        var p = Math.hypot(b.px, b.py), target = Math.min(0.09, p / rr * 1.6);
        if (p > 1e-5) b.sqa = Math.atan2(b.py, b.px);
        b.sq += (target - b.sq) * 0.18;
      }
    }
    function render() {
      var R = (BIG_R + RIM) * W;                                       // elements are sized for the big drop, then scaled
      balls.forEach(function (b, k) {
        var tx = b.x * W - R, ty = b.y * W - R, deg = b.sqa * 180 / Math.PI;
        var sg = radius(b, k) / (BIG_R + RIM), sp = b.r / (BIG_R + RIM);
        var squash = ' rotate(' + deg + 'deg) scale(' + (1 - b.sq) + ',' + (1 + b.sq * 0.6) + ') rotate(' + (-deg) + 'deg)';
        b.g.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sg + ')' + squash;
        b.pc.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sp + ')' + squash;
      });
    }
    function resize() {
      W = blobs.clientWidth || 1;
      var d = 2 * (BIG_R + RIM) * W + 'px';
      balls.forEach(function (b) { b.g.style.width = b.g.style.height = d; b.pc.style.width = b.pc.style.height = d; });
      render();
    }

    var running = false, visible = true, last = 0, accT = 0;
    function frame(t) {
      if (!running) return;
      accT += Math.min(t - (last || t), 100); last = t;
      while (accT >= 16.67) { step(); accT -= 16.67; }
      render();
      requestAnimationFrame(frame);
    }
    function wake() {
      if (reduce) { for (var k = 0; k < 240; k++) step(); render(); return; }
      if (!running && visible && !document.hidden) { running = true; last = 0; requestAnimationFrame(frame); }
    }
    function sleep() { running = false; }

    resize();
    for (var k0 = 0; k0 < 120; k0++) step();               // settle before first paint
    render();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); else sleep(); }).observe(blobs);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) sleep(); else wake(); });
    wake();

    // --- pointer: click a small ball to make it big; drag (mouse) to push a ball around ---
    function hit(e) {
      var r = blobs.getBoundingClientRect(), px = (e.clientX - r.left) / W, py = (e.clientY - r.top) / W, best = null, bd = 1e9;
      balls.forEach(function (b, k) { var d = Math.hypot(px - b.x, py - b.y); if (d < radius(b, k) + 0.01 && d < bd) { bd = d; best = b; } });
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
      drag.vx = Math.max(-VMAX * 2, Math.min(VMAX * 2, (h.x - down.lx) * 0.5));
      drag.vy = Math.max(-VMAX * 2, Math.min(VMAX * 2, (h.y - down.ly) * 0.5));
      drag.x += (h.x - drag.x) * 0.35; drag.y += (h.y - drag.y) * 0.35;   // follows the cursor with a little lag, like a drop
      down.lx = h.x; down.ly = h.y;
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
