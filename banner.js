/* Main banner — scaling and small helpers.
   F fullscreen · R replay entrance · P print / save as PDF */
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var hint = document.getElementById('hint');

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
    }
  });

  /* Hide cursor after a pause; hide the hint after a few seconds */
  var idleTimer;
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { document.body.classList.add('idle'); }, 2600);
  }
  ['mousemove', 'mousedown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, wake, { passive: true }); });
  wake();
  setTimeout(function () { hint.classList.add('gone'); }, 5000);

  /* Keep the screen awake while the banner is up */
  function keepAwake() {
    if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(function () { /* not allowed */ });
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') keepAwake(); });
  keepAwake();
})();
