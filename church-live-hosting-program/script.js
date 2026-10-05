/* Church Live Hosting Program — projector slideshow
   All the words come from config.js. Edit that file, not this one. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Content (from config.js)
  ------------------------------------------------------------------ */
  var U = window.CHURCH_UTIL;
  var CHURCH = U.church.name || '';
  var PLACE = U.church.place || '';
  var HL = U.headline();                       // one or two headline lines
  var HONOR = HL.join(' ');
  var AND = U.event.connector || '';           // small word between headline and title ('' = none)
  var TITLE = U.event.title || '';
  var DATE = U.dateText();
  var DETAILS = U.details();
  var PROGRAM = (U.cfg.program || []).filter(function (b) { return b && b.length; });

  /* ------------------------------------------------------------------
     DOM helpers
  ------------------------------------------------------------------ */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function add(parent) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
    return parent;
  }

  // the big headline: one <span class="ln"> per line
  function headline() {
    var h = el('h1');
    HL.slice(0, 2).forEach(function (t) { h.appendChild(el('span', 'ln', t)); });
    return h;
  }

  /* ------------------------------------------------------------------
     Build slides
  ------------------------------------------------------------------ */
  var stage = document.getElementById('stage');
  var slides = [];
  var titles = [];

  function slide(cls, label, listTitle) {
    var s = el('section', 'slide ' + cls);
    s.setAttribute('aria-label', label);
    stage.appendChild(s);
    slides.push(s);
    titles.push(listTitle || label);
    return s;
  }

  function side(extra) {
    var d = el('div', 'side');
    var org = el('div', 'org', CHURCH);
    org.appendChild(el('span', null, PLACE));
    d.appendChild(org);
    if (extra) d.appendChild(extra);
    return d;
  }

  // Title
  (function () {
    var s = slide('slide--title', TITLE, 'Title');
    var main = add(el('div', 't-main'),
      el('div', 'cross'),
      el('p', 'church', CHURCH),
      el('p', 'place', PLACE),
      headline(),
      AND ? add(el('div', 'link'), el('span', null, AND)) : null,
      TITLE ? el('h2', null, TITLE) : null);
    var band = el('dl', 't-band');
    DETAILS.filter(Boolean).slice(0, 3).forEach(function (row) {
      add(band, add(el('div'), el('dt', null, row[0]), el('dd', null, row[1])));
    });
    add(s, main, band);
  })();

  // Details
  (function () {
    var s = slide('slide--info', 'Program details', 'Program details');
    var info = el('dl', 'info');
    var brk = false, ri = 0;
    DETAILS.forEach(function (row) {
      if (!row) { brk = true; return; }
      var r = add(el('div', 'row' + (brk ? ' break' : '')), el('dt', null, row[0]), el('dd', null, row[1]));
      r.style.setProperty('--i', ri++);
      info.appendChild(r);
      brk = false;
    });
    var stack = add(el('div', 'stack'),
      el('p', 'part', HONOR),
      AND ? add(el('div', 'link'), el('span', null, AND)) : null,
      TITLE ? el('p', 'part', TITLE) : null);
    add(s, side(stack), add(el('div', 'main'), info));
  })();

  // Program items
  var total = PROGRAM.length;
  PROGRAM.forEach(function (blocks, i) {
    var n = i + 1;
    var first = blocks[0].label || blocks[0].text;
    var s = slide('slide--item' + (blocks.length > 1 ? ' slide--multi' : ''), 'Item ' + n + ': ' + first, first);
    var body = el('div', 'body');
    blocks.forEach(function (b, bi) {
      var blk = el('div', 'block');
      blk.style.setProperty('--i', bi);
      if (b.label) blk.appendChild(el('div', 'label', b.label));
      if (b.value) blk.appendChild(el('div', 'value' + (b.hymn ? ' hymn' : ''), b.value));
      if (b.text) blk.appendChild(el('div', 'text', b.text));
      if (b.sub) blk.appendChild(el('div', 'sub', b.sub));
      if (b.note) blk.appendChild(el('div', 'note', b.note));
      body.appendChild(blk);
    });
    var foot = el('div', 'foot');
    var count = el('span');
    count.appendChild(el('b', null, String(n)));
    count.appendChild(document.createTextNode(' / ' + total));
    add(foot, el('span', null, DATE), count);
    var run = el('span', 'run');
    run.appendChild(document.createTextNode(HONOR));
    if (AND) { run.appendChild(document.createTextNode(' ')); run.appendChild(el('em', null, AND)); }
    if (TITLE) run.appendChild(document.createTextNode((AND ? ' ' : '  ·  ') + TITLE));
    var panel = side(el('div', 'num', String(n)));
    add(s, panel, add(el('div', 'main'),
      add(el('div', 'running'), run),
      body, foot));
    s.itemNumber = n;
  });

  // Closing
  (function () {
    var s = slide('slide--end', 'End', 'Closing');
    add(s, add(el('div', 't-main'),
      el('div', 'cross'),
      el('p', 'church', CHURCH),
      el('p', 'place', PLACE),
      headline(),
      AND ? add(el('div', 'link'), el('span', null, AND)) : null,
      TITLE ? el('h2', null, TITLE) : null));
  })();

  var last = slides.length - 1;

  /* ------------------------------------------------------------------
     Navigation
  ------------------------------------------------------------------ */
  var cur = -1;
  var counter = document.getElementById('counter');
  var bar = document.querySelector('#progress i');

  function clamp(i) { return Math.max(0, Math.min(last, i)); }

  var leaveTimer;
  function go(i) {
    i = clamp(i);
    if (i === cur) return;
    var prevIdx = cur;
    document.documentElement.setAttribute('data-dir', i < prevIdx ? 'back' : 'fwd');
    slides.forEach(function (s, k) {
      s.classList.toggle('leaving', k === prevIdx);
      s.classList.toggle('active', k === i);
      s.setAttribute('aria-hidden', k === i ? 'false' : 'true');
    });
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(function () {
      slides.forEach(function (s) { s.classList.remove('leaving'); });
    }, 900);
    cur = i;
    counter.textContent = (i + 1) + ' / ' + slides.length;
    bar.style.width = (last ? (i / last) * 100 : 100) + '%';
    refreshIndex();
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) { /* file:// in some browsers */ }
  }
  function next() { go(cur + 1); }
  function prev() { go(cur - 1); }

  function fromHash() {
    var m = /^#(\d+)$/.exec(location.hash);
    return m ? clamp(parseInt(m[1], 10) - 1) : 0;
  }

  /* Scale the 1920x1080 stage to the window */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.setProperty('--s', s);
  }
  window.addEventListener('resize', fit);
  fit();

  /* ------------------------------------------------------------------
     Overlays, toast, black screen, theme, fullscreen
  ------------------------------------------------------------------ */
  var indexEl = document.getElementById('index');
  var helpEl = document.getElementById('help');
  var blackEl = document.getElementById('black');
  var toastEl = document.getElementById('toast');
  var list = document.getElementById('indexList');
  var indexButtons = [];

  titles.forEach(function (t, i) {
    var li = el('li');
    var b = el('button');
    b.type = 'button';
    var num = slides[i].itemNumber;
    add(b, el('span', 'n', num ? String(num) : '·'), el('span', null, t));
    b.addEventListener('click', function () { closeOverlays(); go(i); });
    li.appendChild(b);
    list.appendChild(li);
    indexButtons.push(b);
  });
  function refreshIndex() {
    indexButtons.forEach(function (b, i) { b.classList.toggle('current', i === cur); });
  }

  function overlayOpen() { return !indexEl.hidden || !helpEl.hidden; }
  function closeOverlays() { indexEl.hidden = true; helpEl.hidden = true; }
  function toggle(o) {
    var open = o.hidden;
    closeOverlays();
    o.hidden = !open;
    if (open && o === indexEl) {
      var c = indexButtons[cur];
      if (c) c.focus();
    }
  }

  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1400);
  }

  function toggleBlack(force) {
    blackEl.hidden = force != null ? !force : !blackEl.hidden;
  }

  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('program-theme', t); } catch (e) { /* ignore */ }
  }
  function toggleTheme() {
    var t = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    setTheme(t);
    toast(t === 'dark' ? 'Dark theme' : 'Light theme');
  }
  try { var saved = localStorage.getItem('program-theme'); if (saved) setTheme(saved); } catch (e) { /* ignore */ }

  function setMotion(m) {
    document.documentElement.setAttribute('data-motion', m);
    try { localStorage.setItem('program-motion', m); } catch (e) { /* ignore */ }
  }
  (function () {
    var m = null;
    try { m = localStorage.getItem('program-motion'); } catch (e) { /* ignore */ }
    if (m !== 'full' && m !== 'reduced') {
      m = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'reduced' : 'full';
    }
    document.documentElement.setAttribute('data-motion', m);
  })();
  function toggleMotion() {
    var m = document.documentElement.getAttribute('data-motion') === 'reduced' ? 'full' : 'reduced';
    setMotion(m);
    toast(m === 'full' ? 'Animation: full' : 'Animation: reduced');
  }

  /* The on-screen controls bar is hidden by default so the slides stay clean.
     C shows it (and the progress line); C again hides it. */
  function setBar(shown) {
    document.body.classList.toggle('nobar', !shown);
    try { localStorage.setItem('program-controls', shown ? 'shown' : 'hidden'); } catch (e) { /* ignore */ }
  }
  try { if (localStorage.getItem('program-controls') === 'shown') setBar(true); } catch (e) { /* ignore */ }
  function toggleBar() {
    var show = document.body.classList.contains('nobar');
    setBar(show);
    toast(show ? 'Controls shown (C to hide)' : 'Controls hidden');
    if (show) wake();
  }

  function openHelp() {
    var w = window.open('help.html', '_blank');
    if (!w) toast('Pop-up blocked. Open help.html');
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

  /* Keep the screen awake while presenting */
  var wakeLock = null;
  function keepAwake() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }).catch(function () { /* not allowed */ });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') keepAwake();
  });
  keepAwake();

  /* ------------------------------------------------------------------
     Input
  ------------------------------------------------------------------ */
  var numBuf = '', numTimer;
  function commitNumber() {
    clearTimeout(numTimer);
    var n = parseInt(numBuf, 10);
    numBuf = '';
    if (n >= 1 && n <= total) {
      go(n + 1);               // slide 0 = title, 1 = details, items start at 2
    } else if (n) {
      toast('No item ' + n);
    }
  }

  var actions = {
    prev: function () { toggleBlack(false); prev(); },
    next: function () { toggleBlack(false); next(); },
    index: function () { toggle(indexEl); },
    theme: toggleTheme,
    full: toggleFullscreen,
    help: function () { toggle(helpEl); }
  };

  document.querySelector('.controls').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b && actions[b.dataset.act]) { actions[b.dataset.act](); b.blur(); }
  });
  [indexEl, helpEl].forEach(function (o) {
    o.addEventListener('click', function (e) { if (e.target === o) closeOverlays(); });
  });
  blackEl.addEventListener('click', function () { toggleBlack(false); });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;

    if (k === 'Escape') {
      if (!blackEl.hidden) toggleBlack(false); else closeOverlays();
      numBuf = '';
      return;
    }

    // Digits: type a program item number, then Enter (or wait a moment)
    if (/^[0-9]$/.test(k)) {
      numBuf = (numBuf + k).slice(0, 2);
      toast('Item ' + numBuf + ' ↵');
      clearTimeout(numTimer);
      numTimer = setTimeout(commitNumber, 1300);
      return;
    }
    if (k === 'Enter' && numBuf) { e.preventDefault(); commitNumber(); return; }

    // When the list is open, let the keyboard move focus naturally
    if (overlayOpen() && (k === 'Tab' || k === 'Enter' || k === ' ')) return;
    if (overlayOpen() && (k === 'ArrowDown' || k === 'ArrowUp')) {
      var cs = indexButtons, idx = cs.indexOf(document.activeElement);
      if (idx > -1) {
        e.preventDefault();
        cs[Math.max(0, Math.min(cs.length - 1, idx + (k === 'ArrowDown' ? 1 : -1)))].focus();
        return;
      }
    }

    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
        e.preventDefault(); actions.next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); actions.prev(); break;
      case 'p': case 'P': window.print(); break;
      case 'Home': e.preventDefault(); toggleBlack(false); go(0); break;
      case 'End': e.preventDefault(); toggleBlack(false); go(last); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'g': case 'G': case 'o': case 'O': toggle(indexEl); break;
      case 'b': case 'B': case '.': toggleBlack(); break;
      case 't': case 'T': toggleTheme(); break;
      case 'm': case 'M': toggleMotion(); break;
      case 'c': case 'C': toggleBar(); break;
      case 'h': case 'H': openHelp(); break;
      case '?': toggle(helpEl); break;
    }
  });

  /* Touch swipe */
  var tx = null, ty = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx == null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  /* Hide cursor and controls after a pause */
  var idleTimer;
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { document.body.classList.add('idle'); }, 2600);
  }
  ['mousemove', 'mousedown', 'touchstart', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, wake, { passive: true });
  });
  wake();

  window.addEventListener('hashchange', function () { go(fromHash()); });
  go(fromHash());
})();
