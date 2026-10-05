/* Main banner — scaling and small helpers.
   F fullscreen · R replay entrance · P print / save as PDF · H help */
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var U = window.CHURCH_UTIL;

  /* ---------- Fill the words from config.js ---------- */
  function $(id) { return document.getElementById(id); }
  function span(cls, text) { var e = document.createElement('span'); e.className = cls; e.textContent = text; return e; }

  $('church').textContent = U.church.name || '';
  $('place').textContent = U.church.place || '';
  $('place').hidden = !U.church.place;

  var h1 = $('headline');
  U.headline().slice(0, 2).forEach(function (t) {
    var m = span('mask', ''); m.appendChild(span('line', t)); h1.appendChild(m);
  });

  var conn = U.event.connector || '';
  $('connectorText').textContent = conn; $('connector').hidden = !conn;
  var title = U.event.title || '';
  $('programText').textContent = title; $('program').hidden = !title;

  /* Long text: shrink to fit the column, then wrap, so nothing runs under the cross. */
  var COL = 1090;
  function fitText(el, base, min) {
    var lines = [].slice.call(el.querySelectorAll('.line'));
    var size = base;
    el.style.fontSize = '';
    function tooWide() { return lines.some(function (l) { return l.scrollWidth > COL; }); }
    while (tooWide() && size > min) { size -= 2; el.style.fontSize = size + 'px'; }
    if (tooWide()) lines.forEach(function (l) { l.style.whiteSpace = 'normal'; });
  }
  fitText(h1, 96, 54);
  fitText($('program'), 62, 34);

  var dp = U.dateParts();
  if (dp) {
    $('plateDay').textContent = dp.day; $('plateMonth').textContent = dp.month; $('plateYear').textContent = dp.year;
    $('plate').setAttribute('aria-label', dp.full);
  } else {
    $('plate').hidden = true;
  }

  var facts = $('facts');
  U.details().forEach(function (row) {
    if (!row) return;
    var f = document.createElement('div'); f.className = 'fact';
    var dt = document.createElement('dt'); dt.textContent = row[0];
    var dd = document.createElement('dd'); dd.textContent = row[1];
    f.appendChild(dt); f.appendChild(dd); facts.appendChild(f);
  });

  function fit() {
    stage.style.setProperty('--s', Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
  }
  window.addEventListener('resize', fit);
  fit();

  function replay() {
    stage.classList.add('static');
    void stage.offsetWidth;            // flush so animations restart
    stage.classList.remove('static');
  }

  function toggleFullscreen() {
    var d = document, root = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else {
      var req = root.requestFullscreen || root.webkitRequestFullscreen;
      if (req) req.call(root);
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case 'f': case 'F': toggleFullscreen(); break;
      case 'r': case 'R': case ' ': e.preventDefault(); replay(); break;
      case 'p': case 'P': window.print(); break;
      case 'h': case 'H': window.open('help.html', '_blank'); break;
    }
  });

  /* Hide the cursor after a pause */
  var idleTimer;
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { document.body.classList.add('idle'); }, 2600);
  }
  ['mousemove', 'mousedown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, wake, { passive: true }); });
  wake();

  /* Keep the screen awake while the banner is up */
  function keepAwake() {
    if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(function () { /* not allowed */ });
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') keepAwake(); });
  keepAwake();
})();
