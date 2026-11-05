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
      return { key: k, lat: l.lat, lng: l.lng, country: l.country, city: l.city, code: l.code, side: l.side, posts: groups[k] };
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
    loadScript('vendor/globe.gl.min.js').then(init).catch(showFallback);
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

    var markers = [];
    var data = groupedLocations();

    function makeMarker(d) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'marker' + (d.side === 'left' ? ' marker--left' : '');
      el.innerHTML = '<span class="marker__line"></span><span class="marker__dot"></span><span class="marker__tag"><b></b><small></small></span>';
      el.style.pointerEvents = 'auto';
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        openFor(d);
      });
      // keep drag-rotate from starting when pressing on a label
      el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      d.el = el;
      markers.push(d);
      updateMarkerText(d);
      return el;
    }
    function updateMarkerText(d) {
      d.el.querySelector('b').textContent = T.t('country.' + d.country);
      d.el.querySelector('small').textContent = T.t('city.' + d.city);
      d.el.setAttribute('aria-label', T.t('country.' + d.country) + ', ' + T.t('city.' + d.city));
    }
    document.addEventListener('langchange', function () { markers.forEach(updateMarkerText); });

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
      .htmlElementsData(data)
      .htmlLat('lat').htmlLng('lng').htmlAltitude(0.01)
      .htmlElement(makeMarker)
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

    globe.pointOfView({ lat: 12, lng: 100, altitude: small ? 2.5 : 1.85 }, 0);

    var controls = globe.controls();
    controls.enableZoom = false;        // let the mouse wheel scroll the page
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.45;

    // Auto-rotate only while the pointer is NOT on the globe and no popup is open.
    var hovering = false, popupOpen = false;
    function syncRotate() { controls.autoRotate = !reduceMotion && !hovering && !popupOpen; }
    holder.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; syncRotate(); } });
    holder.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; syncRotate(); } });
    // On touch screens: stop while touching, resume a moment after.
    var touchTimer;
    holder.addEventListener('touchstart', function () { clearTimeout(touchTimer); hovering = true; syncRotate(); }, { passive: true });
    holder.addEventListener('touchend', function () { touchTimer = setTimeout(function () { hovering = false; syncRotate(); }, 2500); }, { passive: true });

    function openFor(d) {
      popupOpen = true; syncRotate();
      globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: globe.pointOfView().altitude }, 700);
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
