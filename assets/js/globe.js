/* 3D globe (globe.gl + three.js, MIT) with clickable country labels.
   Performance:
   - library + texture load lazily, only when the globe section is near the viewport
   - low-res texture & capped pixel ratio on phones / low-core machines
   - rendering pauses when the globe is off-screen or the tab is hidden
   - falls back to a plain list when WebGL isn't available */
(function () {
  var section = document.getElementById('globe-section');
  var holder = document.getElementById('globe');
  var status = document.getElementById('globe-skeleton');
  var fallback = document.getElementById('globe-fallback');
  if (!section || !holder) return;

  var T = window.TOH;

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function groupedLocations() {
    var groups = {};
    window.POSTS.forEach(function (p) {
      if (!p.location || !window.LOCATIONS[p.location]) return;
      (groups[p.location] = groups[p.location] || []).push(p);
    });
    return Object.keys(groups).map(function (k) {
      var l = window.LOCATIONS[k];
      return { key: k, lat: l.lat, lng: l.lng, country: l.country, city: l.city, code: l.code, side: l.side, label: l.label || [6, l.side === 'left' ? -12 : 12], posts: groups[k] };
    });
  }

  function showFallback() {
    if (status) status.hidden = true;
    holder.hidden = true;
    if (!fallback) return;
    fallback.hidden = false;
    var render = function () {
      fallback.querySelector('ul').innerHTML = groupedLocations().map(function (g) {
        return '<li><button type="button" class="chip chip--grad" data-key="' + g.key + '">' + T.esc(T.t('country.' + g.country)) + ', ' + T.esc(T.t('city.' + g.city)) + '</button></li>';
      }).join('');
    };
    render();
    document.addEventListener('langchange', render);
    fallback.addEventListener('click', function (e) {
      var b = e.target.closest('[data-key]');
      if (!b) return;
      var g = groupedLocations().filter(function (x) { return x.key === b.getAttribute('data-key'); })[0];
      if (g) T.openModal(g.posts);
    });
  }

  if (!hasWebGL()) { showFallback(); return; }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    loadScript('vendor/globe.gl.min.js?v=2.46.2').then(init).catch(showFallback);
  }

  if ('IntersectionObserver' in window) {
    var pre = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { pre.disconnect(); start(); }
    }, { rootMargin: '600px 0px' });
    pre.observe(section);
  }
  // Also warm up once the page is idle, so the globe is ready by the time users scroll.
  window.addEventListener('load', function () {
    (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(start);
  });

  function init() {
    var small = window.matchMedia('(max-width: 720px)').matches;
    var weak = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    var lowPower = small || weak;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var LABEL_ALT = small ? 0.2 : 0.3;   // how far the labels float above the surface
    var SPREAD = small ? 0.55 : 1;       // narrow screens: keep labels closer so they stay on screen
    var labels = [];
    var data = groupedLocations();
    var overLabel = false;

    // Two kinds of HTML elements per location: a dot on the surface and a floating label.
    var htmlData = [];
    data.forEach(function (d) {
      d.llat = d.lat + d.label[0] * SPREAD;
      d.llng = d.lng + d.label[1] * SPREAD;
      htmlData.push({ kind: 'dot', d: d, lat: d.lat, lng: d.lng, alt: 0.005 });
      htmlData.push({ kind: 'label', d: d, lat: d.llat, lng: d.llng, alt: LABEL_ALT });
    });

    // Leader line: rises off the surface and curves out to the label (real 3D line, so it has depth).
    var N = 28;
    var paths = data.map(function (d) {
      var pts = [];
      for (var i = 0; i <= N; i++) {
        var t = i / N;
        var e = 1 - Math.pow(1 - t, 2.2);            // ease-out: climbs fast, then glides to the label
        pts.push([d.lat + (d.llat - d.lat) * t, d.lng + (d.llng - d.lng) * t, 0.006 + (LABEL_ALT - 0.006) * Math.sin(e * Math.PI / 2)]);
      }
      return pts;
    });

    function bindHover(el) {
      el.style.pointerEvents = 'auto';
      el.addEventListener('pointerenter', function () { overLabel = true; syncRotate(); });
      el.addEventListener('pointerleave', function () { overLabel = false; syncRotate(); });
      el.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); // don't start a drag from a label
    }

    function makeEl(o) {
      var d = o.d, el = document.createElement('button');
      el.type = 'button';
      if (o.kind === 'dot') {
        el.className = 'gdot';
        el.innerHTML = '<span></span>';
        el.tabIndex = -1;
        el.setAttribute('aria-hidden', 'true');
      } else {
        el.className = 'glabel' + (d.side === 'left' ? ' glabel--left' : '');
        el.innerHTML = '<span class="glabel__tag"><b></b><small></small></span>';
        d.el = el;
        labels.push(d);
        updateLabel(d);
      }
      bindHover(el);
      el.addEventListener('click', function (e) { e.stopPropagation(); openFor(d); });
      return el;
    }
    function updateLabel(d) {
      d.el.querySelector('b').textContent = T.t('country.' + d.country);
      d.el.querySelector('small').textContent = T.t('city.' + d.city);
      d.el.setAttribute('aria-label', T.t('country.' + d.country) + ', ' + T.t('city.' + d.city));
    }
    document.addEventListener('langchange', function () { labels.forEach(updateLabel); });

    var globe = new window.Globe(holder, {
      rendererConfig: { antialias: !lowPower, alpha: true, powerPreference: 'high-performance', precision: lowPower ? 'mediump' : 'highp' },
      animateIn: !reduceMotion
    })
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl((navigator.hardwareConcurrency || 4) <= 2 ? 'assets/img/globe-1k.jpg' : 'assets/img/globe-2k.jpg')
      .showAtmosphere(true)
      .atmosphereColor('#b6f23d')
      .atmosphereAltitude(0.13)
      .showGraticules(false)
      .pathsData(paths)
      .pathPoints(function (p) { return p; })
      .pathPointLat(function (p) { return p[0]; })
      .pathPointLng(function (p) { return p[1]; })
      .pathPointAlt(function (p) { return p[2]; })
      .pathResolution(1)
      .pathColor(function () { return ['rgba(246, 236, 63, 0.95)', 'rgba(166, 245, 59, 0.55)']; })
      .pathStroke(lowPower ? null : 1.6)
      .pathTransitionDuration(0)
      .htmlElementsData(htmlData)
      .htmlLat('lat').htmlLng('lng').htmlAltitude('alt')
      .htmlElement(makeEl)
      .htmlTransitionDuration(0)
      .htmlElementVisibilityModifier(function (el, visible) {
        el.classList.toggle('is-hidden', !visible);
      });

    var mat = globe.globeMaterial();
    if (mat) { mat.shininess = 4; if (mat.specular) mat.specular.set('#1b2016'); }

    var renderer = globe.renderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 2));

    function size() {
      globe.width(holder.clientWidth).height(holder.clientHeight);
    }
    size();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });

    globe.pointOfView({ lat: 12, lng: 100, altitude: small ? 3.0 : 1.85 }, 0);

    var controls = globe.controls();
    controls.enableZoom = false;        // let the mouse wheel scroll the page
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    // Horizontal drag only: lock the vertical (polar) angle to the starting view.
    var cam = globe.camera().position, polar = Math.acos(Math.max(-1, Math.min(1, cam.y / cam.length())));
    controls.minPolarAngle = polar;
    controls.maxPolarAngle = polar;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.45;

    // Auto-rotate stops only while the pointer is on the sphere itself or on a label/dot,
    // while dragging, or while a popup is open. Empty space around the globe doesn't count.
    var onSphere = false, dragging = false, popupOpen = false, pending = null;
    function syncRotate() { controls.autoRotate = !reduceMotion && !onSphere && !overLabel && !dragging && !popupOpen; }
    holder.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var queued = !!pending;
      pending = e;
      if (queued) return;           // one check per frame at most
      requestAnimationFrame(function () {
        var ev = pending; pending = null;
        var r = holder.getBoundingClientRect();
        onSphere = !!globe.toGlobeCoords(ev.clientX - r.left, ev.clientY - r.top);
        holder.style.cursor = onSphere ? '' : 'default';
        syncRotate();
      });
    });
    holder.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { onSphere = false; syncRotate(); } });
    holder.addEventListener('pointerdown', function () { dragging = true; syncRotate(); });
    window.addEventListener('pointerup', function () { if (dragging) { dragging = false; syncRotate(); } });
    // Touch screens: stop while touching, resume a moment after.
    var touchTimer;
    holder.addEventListener('touchstart', function () { clearTimeout(touchTimer); dragging = true; syncRotate(); }, { passive: true });
    holder.addEventListener('touchend', function () { touchTimer = setTimeout(function () { dragging = false; syncRotate(); }, 2500); }, { passive: true });

    function openFor(d) {
      popupOpen = true; syncRotate();
      var pov = globe.pointOfView(); globe.pointOfView({ lat: pov.lat, lng: d.lng + d.label[1] / 3, altitude: pov.altitude }, 700); // turn left/right only
      T.openModal(d.posts, function () { popupOpen = false; syncRotate(); });
    }

    // Pause rendering when off-screen or tab hidden.
    var onScreen = true, running = true;
    function syncRun() {
      var should = onScreen && !document.hidden;
      if (should && !running) { globe.resumeAnimation(); running = true; }
      else if (!should && running) { globe.pauseAnimation(); running = false; }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; syncRun(); }, { threshold: 0 }).observe(holder);
    }
    document.addEventListener('visibilitychange', syncRun);

    globe.onGlobeReady(function () {
      if (status) status.hidden = true;
      holder.classList.add('is-ready');
    });
  }
})();
