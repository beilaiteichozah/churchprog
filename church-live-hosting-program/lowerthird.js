/* Lower third — keyboard-operated name graphic.
   Names come from config.js (lowerThirds).  Press ? for the keys, H for the full Help page.
   URL options:  ?bg=transparent|checker|dark|green   ?hide=SECONDS (0 = stay)   ?plate=dark|light
                 ?pos=left|center|right   ?item=N&show=1 (select / show item N)   ?clean=1 (no on-screen feedback) */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var lt = $('lt'), stage = $('stage');
  var data = (window.CHURCH_CONFIG && window.CHURCH_CONFIG.lowerThirds) || { entries: [] };
  var entries = (data.entries || []).filter(function (e) { return e && e.name; });
  var settings = data.settings || {};

  function pref(k, v) { try { if (v === undefined) return localStorage.getItem('lt-' + k); localStorage.setItem('lt-' + k, v); } catch (e) { /* ignore */ } return null; }

  /* ---------- Fit artboard ---------- */
  function fit() { stage.style.setProperty('--s', Math.min(innerWidth / 1920, innerHeight / 1080)); }
  addEventListener('resize', fit); fit();

  /* ---------- Options ---------- */
  if (params.has('clean')) document.body.classList.add('clean');
  var BGS = ['transparent', 'checker', 'dark', 'green'];
  var bg = params.get('bg') || pref('bg') || 'transparent';
  if (BGS.indexOf(bg) < 0) bg = 'transparent';
  root.setAttribute('data-bg', bg);
  var plate = params.get('plate') || pref('plate') || 'dark';   // dark = navy plate (default), light = pale plate
  root.setAttribute('data-plate', plate === 'light' ? 'light' : 'dark');
  root.setAttribute('data-pos', ['left', 'center', 'right'].indexOf(params.get('pos')) > -1 ? params.get('pos') : 'left');
  var m0 = pref('motion');
  if (m0 !== 'full' && m0 !== 'reduced') m0 = (matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'reduced' : 'full';
  root.setAttribute('data-motion', m0);

  var autoSecs = params.has('hide') ? Math.max(0, parseFloat(params.get('hide')) || 0)
    : (settings.autoHide != null ? Math.max(0, +settings.autoHide || 0) : 10);
  var autoOn = pref('auto') !== 'off';     // A key
  if (autoSecs === 0) autoOn = false;

  /* ---------- State ---------- */
  var cur = 0;            // selected entry
  var shown = null;       // entry currently on screen (or null)
  var state = 'hidden';   // hidden | in | shown | out
  var timers = [];
  var pendingEntry = null;

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function setState(s) { state = s; lt.setAttribute('data-state', s); }

  /* ---------- Rendering ---------- */
  function fitText(el, base, min, wrapSize, max) {
    el.classList.remove('wrap'); el.style.fontSize = '';
    var size = base;
    while (el.offsetWidth > max && size > min) { size -= 2; el.style.fontSize = size + 'px'; }
    if (el.offsetWidth > max) { el.classList.add('wrap'); el.style.fontSize = wrapSize + 'px'; }
  }

  function fill(e) {
    $('role').textContent = e.role || '';
    $('name').textContent = e.name || '';
    $('detail').textContent = e.detail || '';
    lt.toggleAttribute('data-nodetail', !e.detail);
    // long text: shrink first, then wrap onto a second line, so nothing is ever cut off
    var max = 1690 - 118 - 104;   // widest the text can be inside the plate
    fitText($('role'), 25, 18, 20, max);
    fitText($('name'), 64, 40, 46, max);
    fitText($('detail'), 31, 22, 26, max);
  }

  function enter(e) {
    clearTimers();
    shown = e;
    fill(e);
    lt.classList.remove('counting');
    setState('in');
    later(function () {
      setState('shown');
      if (autoOn && autoSecs > 0) {
        lt.style.setProperty('--hide', autoSecs + 's');
        void lt.offsetWidth;
        lt.classList.add('counting');
        later(hide, autoSecs * 1000);
      }
    }, root.getAttribute('data-motion') === 'reduced' ? 400 : 1500);
  }

  function exit(done) {
    clearTimers();
    lt.classList.remove('counting');
    setState('out');
    later(function () { setState('hidden'); shown = null; if (done) done(); }, root.getAttribute('data-motion') === 'reduced' ? 400 : 1000);
  }

  function hide() { if (state === 'in' || state === 'shown') exit(); }

  function present(e) {
    if (state === 'hidden') enter(e);
    else if (state === 'out') { pendingEntry = e; clearTimers(); later(function () { setState('hidden'); shown = null; var p = pendingEntry; pendingEntry = null; enter(p); }, 600); }
    else exit(function () { enter(e); });
  }

  function currentEntry() { return entries[cur]; }

  function select(n, opts) {
    if (!entries.length) return;
    cur = (n + entries.length) % entries.length;
    try { history.replaceState(null, '', location.search + '#' + (cur + 1)); } catch (e) { /* file:// */ }
    refreshList();
    var e = currentEntry();
    if (state === 'in' || state === 'shown' || (opts && opts.show)) present(e);
    else toast((cur + 1) + '/' + entries.length + ' · ' + (e.item ? 'Item ' + e.item + ' · ' : '') + (e.role ? e.role + ' — ' : '') + e.name);
  }

  function toggle() {
    if (state === 'hidden' || state === 'out') present(currentEntry());
    else hide();
  }

  /* ---------- Toast ---------- */
  var toastT;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  /* ---------- List overlay ---------- */
  var listBtns = [];
  function buildList() {
    var ol = $('items'); ol.textContent = ''; listBtns = [];
    entries.forEach(function (e, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      [['n', e.item || ''], ['r', e.role || ''], ['t', e.name]].forEach(function (p) {
        var s = document.createElement('span'); s.className = p[0]; s.textContent = p[1]; b.appendChild(s);
      });
      b.addEventListener('click', function () { closeOverlays(); select(i, { show: true }); });
      li.appendChild(b); ol.appendChild(li); listBtns.push(b);
    });
  }
  function refreshList() { listBtns.forEach(function (b, i) { b.classList.toggle('current', i === cur); }); }

  /* ---------- Overlays ---------- */
  var panels = [$('listPanel'), $('customPanel'), $('helpPanel')];
  function overlayOpen() { return panels.some(function (p) { return !p.hidden; }); }
  function closeOverlays() { panels.forEach(function (p) { p.hidden = true; }); }
  function openPanel(p) {
    var wasOpen = !p.hidden; closeOverlays(); if (wasOpen) return;
    p.hidden = false;
    if (p === panels[0] && listBtns[cur]) listBtns[cur].focus();
    if (p === panels[1]) { $('cRole').focus(); }
  }
  panels.forEach(function (p) { p.addEventListener('click', function (e) { if (e.target === p) p.hidden = true; }); });

  $('customForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = $('cName').value.trim();
    if (!name) return;
    closeOverlays();
    present({ role: $('cRole').value.trim(), name: name, detail: $('cDetail').value.trim() });
  });
  $('cCancel').addEventListener('click', closeOverlays);

  /* ---------- Settings ---------- */
  function cycleBg() {
    bg = BGS[(BGS.indexOf(bg) + 1) % BGS.length];
    root.setAttribute('data-bg', bg); pref('bg', bg);
    toast('Background: ' + bg);
  }
  function togglePlate() {
    plate = root.getAttribute('data-plate') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-plate', plate); pref('plate', plate);
    toast(plate === 'dark' ? 'Navy plate' : 'Light plate');
  }
  function toggleMotion() {
    var m = root.getAttribute('data-motion') === 'reduced' ? 'full' : 'reduced';
    root.setAttribute('data-motion', m); pref('motion', m); toast(m === 'full' ? 'Animation: full' : 'Animation: reduced');
  }
  function toggleAuto() {
    if (autoSecs === 0) { toast('Auto-hide is off in the settings (hide: 0)'); return; }
    autoOn = !autoOn; pref('auto', autoOn ? 'on' : 'off');
    toast(autoOn ? 'Auto-hide: ' + autoSecs + ' s' : 'Auto-hide: off (stays until hidden)');
  }
  function toggleFullscreen() {
    var d = document, r = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { var q = r.requestFullscreen || r.webkitRequestFullscreen; if (q) q.call(r); }
  }
  function openHelp() {
    var w = window.open('help.html', '_blank');
    if (!w) toast('Pop-up blocked. Open help.html');
  }

  /* ---------- Keys ---------- */
  var numBuf = '', numT;
  function commitNumber() {
    clearTimeout(numT);
    var n = parseInt(numBuf, 10); numBuf = '';
    var idx = -1;
    entries.forEach(function (e, i) { if (idx < 0 && e.item === n) idx = i; });
    if (idx >= 0) select(idx, { show: true }); else toast('No name for item ' + n);
  }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') { if (e.key === 'Escape') closeOverlays(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;

    if (k === 'Escape') { if (overlayOpen()) closeOverlays(); else hide(); numBuf = ''; return; }
    if (/^[0-9]$/.test(k) && !overlayOpen()) {
      numBuf = (numBuf + k).slice(0, 2); toast('Item ' + numBuf + ' ↵');
      clearTimeout(numT); numT = setTimeout(commitNumber, 1400); return;
    }
    if (k === 'Enter' && numBuf) { e.preventDefault(); commitNumber(); return; }

    if (overlayOpen()) {
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        var i = listBtns.indexOf(document.activeElement);
        if (i > -1) { e.preventDefault(); listBtns[Math.max(0, Math.min(listBtns.length - 1, i + (k === 'ArrowDown' ? 1 : -1)))].focus(); }
        return;
      }
      if (k === 'Tab' || k === 'Enter' || k === ' ') return;
    }

    switch (k) {
      case ' ': case 'Enter': e.preventDefault(); if (!e.repeat) toggle(); break;
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': e.preventDefault(); select(cur + 1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); select(cur - 1); break;
      case 'Home': e.preventDefault(); select(0); break;
      case 'End': e.preventDefault(); select(entries.length - 1); break;
      case 'e': case 'E': e.preventDefault(); openPanel(panels[1]); break;
      case 'g': case 'G': openPanel(panels[0]); break;
      case 'a': case 'A': toggleAuto(); break;
      case 'v': case 'V': cycleBg(); break;
      case 't': case 'T': togglePlate(); break;
      case 'm': case 'M': toggleMotion(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'h': case 'H': openHelp(); break;
      case '?': openPanel(panels[2]); break;
    }
  });

  var idleT;
  function wake() { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add('idle'); }, 2600); }
  ['mousemove', 'mousedown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, wake, { passive: true }); });
  wake();

  function keepAwake() { if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(function () { /* not allowed */ }); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') keepAwake(); });
  keepAwake();

  /* ---------- Go ---------- */
  buildList();
  var hashN = /^#(\d+)$/.exec(location.hash);
  var itemP = parseInt(params.get('item'), 10);
  if (hashN) cur = Math.min(entries.length, Math.max(1, +hashN[1])) - 1;
  if (itemP) { entries.forEach(function (e, i) { if (e.item === itemP && cur === 0 && !hashN) cur = i; }); }
  refreshList();
  if (!entries.length) toast('No names found in config.js (lowerThirds)');
  else if (params.has('show')) later(function () { present(currentEntry()); }, 150);
  else toast('Space show / hide · → next · E custom · ? keys');
})();
