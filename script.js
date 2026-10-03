/* Byhnâ Paawsana Program — projector slideshow
   Edit the PROGRAM data below to change the wording. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Content
     block types:
       { label, value, sub, hymn }  role label + person (or hymn title)
       { text, note }               plain line, optional italic note
  ------------------------------------------------------------------ */
  var CHURCH = 'Mara Evangelical Church';
  var PLACE = 'Lialaipi Pastor Bia, Lialaipi';
  // The title has three parts: honoring Rev. Haidau  +  "Nata" (and)  +  the blessing service program
  var HONOR = 'Rev. Haidau Chori Palyupalihna';
  var AND = 'Nata';
  var HW = HONOR.split(' ');
  var HONOR_A = HW.slice(0, -1).join(' ');   // "Rev. Haidau Chori"
  var HONOR_B = HW[HW.length - 1];           // "Palyupalihna"
  var TITLE = 'Byhnâ Paawsana Program';
  var DATE = '4th October, 2026 (Sunday)';

  var DETAILS = [
    ['Date', DATE],
    ['A su', 'Lialaipi Vaihpi Achhyna O'],
    ['Daihti', '12:00 noon – 2:00 pm'],
    null,
    ['Directors', 'Machâ Hnau Aw & Machâ Abizah'],
    ['Chairman', 'Machâ Râhki, Bia Chairman']
  ];

  var PROGRAM = [
    [{ text: 'Chairman tawhta Program phuahna' }],
    [{ text: 'Rev. Haidau & Pinô Sive atyuna su raopa lâta pangaina',
       note: 'Zawpi a duahpa ta "Khazohpa cha a pha, a pha" tahpa zawpi hla sa awpa' }],
    [{ label: 'Zawpi Hla sana', value: 'Hy, Beipa Chônôchai eima cha reihthai', hymn: true }],
    [{ label: 'Daihti pathaona thlahchhâna', value: 'Rev. Dr. Vazilai', sub: 'Director, COME' }],
    [{ label: 'Rev. Haidau Châbu Tlâhzawna', value: 'Rev. Dr. L. B. Siama', sub: 'Moderator' },
     { text: 'A Thâtih Pachhopa reina' },
     { label: 'Local Lâta Châbu Piena', value: 'Pinô Sive', sub: '(Mrs. Haidau)' }],
    [{ label: 'Hla Paryhna (Choir)', value: 'Lialaipi Kô Machâzy Akaona (LKMA)' }],
    [{ label: 'Byhnâ Awna Opi sana Report', value: 'Machâ Seihnai', sub: 'Chairman, Building Board' }],
    [{ label: 'Hla solo', value: 'Ls. Centenary', sub: 'Aphapaaw Local KTP' }],
    [{ label: 'O Hlana', value: 'Rev. A. Rakhai', sub: 'Biatuhpa Pastor' }],
    [{ label: 'Hla Paryhpa (Choir)', value: 'Lialaipi Vaihpi KTP' }],
    [{ label: 'Lialaipi sawzy châta Byhnâ Awna', value: 'Rev. Haidau Chori' }],
    [{ label: 'KNP Jubilee Hlapy', value: 'Lialaipi Bia KNP Jubilee Hlapy' }],
    [{ label: 'Palyupalihna Message', value: 'Rev. Sa E Hmô', sub: '(Associate Gen. Secy)' }],
    [{ label: 'Hla Solo', value: 'Ls. Ngôthekhai', sub: 'Lialaipi Vaihpi KTP' }],
    [{ label: 'Bietana reina', value: 'Chairman, Global Lialaipi Akaona' }],
    [{ label: 'Hla Paryhna (Choir)', value: 'Aphapaaw KTP' }],
    [{ label: 'Alykheina Short Speech', value: 'Rev. C. Sitlô', sub: 'Pastor, Aphapaaw Local' }],
    [{ label: 'Hla Solo', value: 'Ls. Khaidaw', sub: 'Lialaipi Vaihpi KTP' }],
    [{ label: 'Zawpi Reithaina Hlasana', value: 'Khih dei ta Awhsi a diapa hawh', hymn: true }],
    [{ label: 'Byhnâ awna', value: 'Rev. Satu Ve U', sub: 'Senior Pastor' }],
    [{ label: 'Thopi nata Viahchhâ Hlâna', value: 'Machâ Sauma', sub: 'Hyutuhpa, Aphapaaw Local' }]
  ];

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
      add(el('h1'), el('span', 'ln', HONOR_A), el('span', 'ln', HONOR_B)),
      add(el('div', 'link'), el('span', null, AND)),
      el('h2', null, TITLE));
    var band = el('dl', 't-band');
    [DETAILS[0], DETAILS[1], DETAILS[2]].forEach(function (row) {
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
      add(el('div', 'link'), el('span', null, AND)),
      el('p', 'part', TITLE));
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
    run.appendChild(document.createTextNode(HONOR + ' '));
    run.appendChild(el('em', null, AND));
    run.appendChild(document.createTextNode(' ' + TITLE));
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
      add(el('h1'), el('span', 'ln', HONOR_A), el('span', 'ln', HONOR_B)),
      add(el('div', 'link'), el('span', null, AND)),
      el('h2', null, TITLE)));
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
    var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
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

  /* C: hide the controls bar completely (it will not reappear on mouse move) or bring it back */
  function setBar(hidden) {
    document.body.classList.toggle('nobar', hidden);
    try { localStorage.setItem('program-bar', hidden ? 'hidden' : 'auto'); } catch (e) { /* ignore */ }
  }
  try { if (localStorage.getItem('program-bar') === 'hidden') setBar(true); } catch (e) { /* ignore */ }
  function toggleBar() {
    var hide = !document.body.classList.contains('nobar');
    setBar(hide);
    toast(hide ? 'Controls hidden (C to show)' : 'Controls shown');
    if (!hide) wake();
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
      case 'h': case 'H': case '?': toggle(helpEl); break;
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
