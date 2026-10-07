/* Lyrics page — one line at a time, songs loaded from songs.json.
   See the help overlay (?) for keyboard shortcuts. */
ChurchData.ready(function () {
  'use strict';

  var SRC = new URLSearchParams(location.search).get('src') || 'songs.json';

  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), track = $('track'), win = $('window');
  var songs = [];
  var si = 0, li = 0;                 // current song / line
  var lineEls = [];
  var curSec = -1;
  var mode = 'focus';                 // 'focus' (neighbours visible) or 'single'

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- Fit artboard to the screen ---------- */
  function fit() { stage.style.setProperty('--s', Math.min(innerWidth / 1920, innerHeight / 1080)); }
  addEventListener('resize', function () { fit(); place(true); });
  fit();

  /* ---------- Data ---------- */
  /* Sections: each played section (verse, chorus, bridge…) with where it starts, so a key can jump to it. */
  function kindOf(sec) {
    var k = String(sec.kind || '').toLowerCase();
    if (k === 'chorus' || k === 'refrain') return 'chorus';
    if (k === 'verse') return 'verse';
    if (k) return 'other';
    var l = sec.label || '';
    if (/chorus|refrain/i.test(l)) return 'chorus';
    if (/bridge|coda|tag|intro|outro|interlude|ending|amen/i.test(l)) return 'other';
    return 'verse';
  }
  function normalize(data) {
    var list = Array.isArray(data) ? data : data && data.songs;
    if (!Array.isArray(list)) throw new Error('songs.json must contain a "songs" list.');
    var out = list.map(function (s, n) {
      var secs = Array.isArray(s.sections) ? s.sections
        : Array.isArray(s.lines) ? [{ label: '', lines: s.lines }] : [];
      var byId = {};
      secs.forEach(function (x) { if (x && x.id) byId[x.id] = x; });
      var seq = Array.isArray(s.order) && s.order.length
        ? s.order.map(function (id) { return byId[id]; }).filter(Boolean) : secs;
      var lines = [], meta = [], unnumbered = [];
      seq.forEach(function (sec, k) {
        var ls = (sec.lines || []).map(String);
        var kind = kindOf(sec), no = null;
        if (kind === 'verse') {
          if (sec.verse != null && !isNaN(+sec.verse)) no = +sec.verse;
          else { var m = /(\d+)/.exec(sec.label || ''); if (m) no = +m[1]; }
          if (no == null) { var u = unnumbered.indexOf(sec); if (u < 0) { unnumbered.push(sec); u = unnumbered.length - 1; } no = u + 1; }
        }
        meta.push({ label: sec.label || '', kind: kind, no: no, start: lines.length, first: ls[0] || '' });
        ls.forEach(function (t, j) { lines.push({ text: t, label: sec.label || '', sec: k, n: ls.length, j: j }); });
      });
      return {
        title: String(s.title || 'Song ' + (n + 1)), author: s.author ? String(s.author) : '', composer: s.composer ? String(s.composer) : '', reference: s.reference ? String(s.reference) : '',
        number: s.number != null ? String(s.number) : '', book: s.book ? String(s.book) : '',
        edition: s.edition ? String(s.edition) : '', lines: lines, meta: meta
      };
    }).filter(function (s) { return s.lines.length; });
    if (!out.length) throw new Error('No songs with lyrics were found.');
    return out;
  }

  function load() {
    return ChurchData.resolveText('songs', SRC);
  }

  function start(text, remember) {
    var data;
    try { data = normalize(JSON.parse(text)); } catch (e) { return String(e.message || e); }
    songs = data;
    if (remember) ChurchData.putText('songs', text);
    $('loader').hidden = true;
    buildSongList();
    var m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
    var s = m ? Math.min(songs.length, Math.max(1, +m[1])) - 1 : 0;
    var l = m && m[2] ? +m[2] - 1 : 0;
    showSong(s, l, false);
    return null;
  }

  function needFile(reason) {
    var cached = ChurchData.storedText('songs');
    if (cached && !reason.force && start(cached, false) === null) { toast('Loaded saved songs'); return; }
    $('loaderMsg').textContent = reason.msg;
    $('loader').hidden = false;
  }

  /* ---------- Rendering ---------- */
  function showSong(n, line, animate) {
    si = Math.max(0, Math.min(songs.length - 1, n));
    var s = songs[si];
    var swap = function () {
      $('title').textContent = s.title;
      $('author').textContent = [s.reference, s.author, s.composer ? 'Composer: ' + s.composer : ''].filter(Boolean).join('  ·  ');
      // very long titles: shrink until they fit on two lines
      var tt = $('title'), tsz = 80; tt.style.fontSize = '';
      while (tt.offsetHeight > 176 && tsz > 36) { tsz -= 4; tt.style.fontSize = tsz + 'px'; }
      $('book').textContent = s.book;
      $('edition').textContent = s.edition;
      $('number').textContent = s.number;
      $('badge').style.visibility = (s.number || s.book || s.edition) ? 'visible' : 'hidden';
      $('badge').classList.toggle('no-num', !s.number);   // edition or book without a number: no empty "No." block
      track.textContent = '';
      lineEls = s.lines.map(function (ln, i) {
        var p = el('p', 'ln' + (i && ln.sec !== s.lines[i - 1].sec ? ' sec-start' : ''), ln.text);
        track.appendChild(p);
        return p;
      });
      curSec = -1;
      li = Math.max(0, Math.min(s.lines.length - 1, line || 0));
      track.classList.add('instant');
      setLine(li, true);
      void track.offsetWidth;
      track.classList.remove('instant');
      buildSecList(); highlightSec();
      document.title = s.title + (s.number ? ' · No. ' + s.number : '') + ' · Lyrics';
      stage.classList.remove('leaving');
      stage.classList.remove('enter');
      void stage.offsetWidth;
      stage.classList.add('enter');
    };
    clearTimeout(showSong.t);
    if (animate && lineEls.length) {
      stage.classList.add('leaving');
      showSong.t = setTimeout(swap, 300);
    } else {
      swap();
    }
    highlightSong();
  }

  function place() {
    var e = lineEls[li];
    if (!e) return;
    var c = e.offsetTop + e.offsetHeight / 2;
    track.style.transform = 'translateY(' + Math.round(win.clientHeight / 2 - c) + 'px)';
  }

  function setLine(n, instant) {
    var s = songs[si];
    li = Math.max(0, Math.min(s.lines.length - 1, n));
    lineEls.forEach(function (p, i) {
      var d = i - li;
      p.dataset.d = Math.abs(d) > 2 ? 'far' : String(d);
    });
    place();

    var ln = s.lines[li];
    if (ln.sec !== curSec) {
      curSec = ln.sec;
      var lab = $('secLabel');
      lab.textContent = ln.label;
      if (!instant) { lab.classList.remove('swap'); void lab.offsetWidth; lab.classList.add('swap'); }
      var dots = $('dots');
      dots.textContent = '';
      for (var k = 0; k < ln.n; k++) dots.appendChild(el('i'));
    }
    var di = $('dots').children;
    for (var k2 = 0; k2 < di.length; k2++) di[k2].classList.toggle('on', k2 === ln.j);

    highlightSec();
    $('rail').style.height = ((li + 1) / s.lines.length * 100) + '%';
    $('counter').textContent = (si + 1) + '/' + songs.length + ' · ' + (li + 1) + '/' + s.lines.length;
    try { history.replaceState(null, '', '#' + (si + 1) + '.' + (li + 1)); } catch (e) { /* file:// */ }
  }

  /* ---------- Navigation ---------- */
  function nextLine() {
    var s = songs[si];
    if (li < s.lines.length - 1) setLine(li + 1);
    else toast(si < songs.length - 1 ? 'End of song · N for the next song' : 'End of song');
  }
  function prevLine() { if (li > 0) setLine(li - 1); }
  function nextVerse() {
    var s = songs[si], cur = s.lines[li].sec;
    for (var i = li + 1; i < s.lines.length; i++) if (s.lines[i].sec !== cur) { setLine(i); return; }
    nextLine();
  }
  function prevVerse() {
    var s = songs[si], cur = s.lines[li].sec;
    if (li > 0 && s.lines[li - 1].sec === cur) { while (li > 0 && s.lines[li - 1].sec === cur) li--; setLine(li); return; }
    for (var i = li - 1; i >= 0; i--) {
      if (s.lines[i].sec !== cur) { var t = s.lines[i].sec; while (i > 0 && s.lines[i - 1].sec === t) i--; setLine(i); return; }
    }
  }
  function gotoSong(n, animate) {
    if (n < 0 || n >= songs.length) { toast(n < 0 ? 'First song' : 'Last song'); return; }
    toggleBlack(false);
    showSong(n, 0, animate !== false);
  }

  /* ---------- Song list ---------- */
  var songBtns = [];
  function buildSongList() {
    var ol = $('songItems'); ol.textContent = ''; songBtns = [];
    songs.forEach(function (s, i) {
      var li_ = el('li'), b = el('button');
      b.type = 'button';
      b.appendChild(el('span', 'n', s.number || '·'));
      b.appendChild(el('span', 't', s.title));
      b.appendChild(el('span', 'b', [s.book, s.edition].filter(Boolean).join(' · ')));
      b.addEventListener('click', function () { closeOverlays(); gotoSong(i); });
      li_.appendChild(b); ol.appendChild(li_); songBtns.push(b);
    });
  }
  function highlightSong() { songBtns.forEach(function (b, i) { b.classList.toggle('current', i === si); }); }

  /* ---------- Jump to a verse, the chorus, or any part ---------- */
  var secBtns = [];
  function curSecIdx() { return songs[si].lines[li].sec; }
  function buildSecList() {
    var ol = $('secItems'); ol.textContent = ''; secBtns = [];
    songs[si].meta.forEach(function (m, i) {
      var li_ = el('li'), b = el('button'); b.type = 'button';
      b.appendChild(el('span', 'n', String(i + 1)));
      b.appendChild(el('span', 't', m.label || ('Part ' + (i + 1))));
      b.appendChild(el('span', 'b', m.first));
      b.addEventListener('click', function () { closeOverlays(); toggleBlack(false); setLine(m.start); });
      li_.appendChild(b); ol.appendChild(li_); secBtns.push(b);
    });
  }
  function highlightSec() { var c = curSecIdx(); secBtns.forEach(function (b, i) { b.classList.toggle('current', i === c); }); }
  function jumpSection(kind, no) {
    var s = songs[si], cs = curSecIdx(), cand = [];
    s.meta.forEach(function (m, i) { if (m.kind === kind && (kind !== 'verse' || m.no === no)) cand.push(i); });
    if (!cand.length) { toast(kind === 'chorus' ? 'No chorus in this song' : 'No verse ' + no + ' in this song'); return; }
    var target;
    if (cand.indexOf(cs) > -1) target = cs;                       // already there: start it again
    else { var fwd = cand.filter(function (i) { return i > cs; }); target = fwd.length ? fwd[0] : cand[cand.length - 1]; }
    toggleBlack(false);
    setLine(s.meta[target].start);
  }

  /* ---------- Overlays, toast, black, theme, motion, bar, fullscreen ---------- */
  var overlays = [$('songList'), $('help'), $('secList')];
  function overlayOpen() { return overlays.some(function (o) { return !o.hidden; }); }
  function closeOverlays() { overlays.forEach(function (o) { o.hidden = true; }); }
  function toggleOverlay(o) {
    var open = o.hidden; closeOverlays(); o.hidden = !open;
    if (open && o === overlays[0] && songBtns[si]) songBtns[si].focus();
    if (open && o === overlays[2] && secBtns[curSecIdx()]) secBtns[curSecIdx()].focus();
  }

  var toastT;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 1500);
  }
  function toggleBlack(force) { var b = $('black'); b.hidden = force != null ? !force : !b.hidden; }

  function setPref(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function getPref(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var root = document.documentElement;

  if (getPref('lyrics-theme')) root.setAttribute('data-theme', getPref('lyrics-theme'));
  function toggleTheme() {
    var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', t); setPref('lyrics-theme', t); toast(t === 'light' ? 'Light theme' : 'Dark theme');
  }

  var m0 = getPref('lyrics-motion');
  if (m0 !== 'full' && m0 !== 'reduced') m0 = (matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'reduced' : 'full';
  root.setAttribute('data-motion', m0);
  function toggleMotion() {
    var m = root.getAttribute('data-motion') === 'reduced' ? 'full' : 'reduced';
    root.setAttribute('data-motion', m); setPref('lyrics-motion', m); toast(m === 'full' ? 'Animation: full' : 'Animation: reduced');
  }

  mode = getPref('lyrics-mode') === 'single' ? 'single' : 'focus';
  win.classList.toggle('single', mode === 'single');
  function toggleMode() {
    mode = mode === 'single' ? 'focus' : 'single';
    win.classList.toggle('single', mode === 'single'); setPref('lyrics-mode', mode);
    toast(mode === 'single' ? 'View: one line' : 'View: focus');
  }

  /* The controls bar is hidden by default. C shows it; C again hides it. */
  function setBar(shown) { document.body.classList.toggle('nobar', !shown); setPref('lyrics-controls', shown ? 'shown' : 'hidden'); }
  if (getPref('lyrics-controls') === 'shown') setBar(true);
  function toggleBar() {
    var show = document.body.classList.contains('nobar'); setBar(show);
    toast(show ? 'Controls shown (C to hide)' : 'Controls hidden'); if (show) wake();
  }
  function openHelp() {
    var w = window.open('help.html', '_blank');
    if (!w) toast('Pop-up blocked. Open help.html');
  }

  function toggleFullscreen() {
    var d = document, r = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { var q = r.requestFullscreen || r.webkitRequestFullscreen; if (q) q.call(r); }
  }

  /* ---------- Loading a songs.json by hand ---------- */
  function readFile(file) {
    if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      var err = start(String(fr.result), true);
      if (err) { $('loaderMsg').textContent = err; $('loaderMsg').className = 'msg err'; $('loader').hidden = false; }
      else toast('Loaded ' + songs.length + (songs.length === 1 ? ' song' : ' songs'));
    };
    fr.readAsText(file);
  }
  $('fileInput').addEventListener('change', function (e) { readFile(e.target.files[0]); e.target.value = ''; });
  var dz = $('dropzone');
  ['dragenter', 'dragover'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('drag'); $('loader').hidden = false; }); });
  ['dragleave', 'drop'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('drag'); }); });
  document.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) readFile(f); else if (songs.length) $('loader').hidden = true; });
  function openLoader() { closeOverlays(); $('loaderMsg').textContent = 'Choose a songs.json file.'; $('loaderMsg').className = 'msg'; $('loader').hidden = false; }
  $('reload').addEventListener('click', openLoader);

  /* ---------- Input ---------- */
  var actions = {
    prev: function () { toggleBlack(false); prevLine(); },
    next: function () { toggleBlack(false); nextLine(); },
    songs: function () { toggleOverlay(overlays[0]); },
    mode: toggleMode, theme: toggleTheme, full: toggleFullscreen,
    help: function () { toggleOverlay(overlays[1]); }
  };
  document.querySelector('.controls').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b && actions[b.dataset.act]) { actions[b.dataset.act](); b.blur(); }
  });
  overlays.concat([$('loader')]).forEach(function (o) { o.addEventListener('click', function (e) { if (e.target === o && songs.length) { o.hidden = true; } }); });
  $('black').addEventListener('click', function () { toggleBlack(false); });

  /* Song number: press S, type the number, then Enter (digits on their own jump to verses). */
  var numBuf = '', numT, songEntry = false;
  function endEntry() { clearTimeout(numT); numBuf = ''; songEntry = false; }
  function commitNumber() {
    var n = numBuf; endEntry();
    if (!n) return;
    var idx = -1;
    songs.forEach(function (s, i) { if (idx < 0 && s.number === String(parseInt(n, 10))) idx = i; });
    if (idx >= 0) gotoSong(idx); else toast('No song ' + n);
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === 'h' || k === 'H') { if (!e.repeat) openHelp(); return; }
    if (!$('loader').hidden) { if (k === 'Escape' && songs.length) $('loader').hidden = true; return; }
    if (!songs.length) return;

    if (k === 'Escape') { if (!$('black').hidden) toggleBlack(false); else closeOverlays(); endEntry(); return; }
    if (songEntry && /^[0-9]$/.test(k)) {
      numBuf = (numBuf + k).slice(0, 4); toast('Song ' + numBuf + ' ↵');
      clearTimeout(numT); numT = setTimeout(commitNumber, 1600); return;
    }
    if (k === 'Enter' && songEntry) { e.preventDefault(); if (numBuf) commitNumber(); else endEntry(); return; }
    if (/^[1-9]$/.test(k) && !overlayOpen() && !e.shiftKey) { jumpSection('verse', +k); return; }   // verse 1-9
    if (k === '0' && !overlayOpen() && !e.shiftKey) { jumpSection('chorus'); return; }

    if (overlayOpen()) {
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        var btns = [].slice.call(document.querySelectorAll('.overlay:not([hidden]) li button'));
        var i = btns.indexOf(document.activeElement);
        if (i > -1) { e.preventDefault(); btns[Math.max(0, Math.min(btns.length - 1, i + (k === 'ArrowDown' ? 1 : -1)))].focus(); return; }
      }
      if (k === 'Tab' || k === 'Enter' || k === ' ') return;
    }

    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
        e.preventDefault(); toggleBlack(false); (e.shiftKey && k === 'ArrowRight') ? nextVerse() : nextLine(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); toggleBlack(false); (e.shiftKey && k === 'ArrowLeft') ? prevVerse() : prevLine(); break;
      case 'Home': e.preventDefault(); toggleBlack(false); setLine(0); break;
      case 'End': e.preventDefault(); toggleBlack(false); setLine(songs[si].lines.length - 1); break;
      case 'n': case 'N': gotoSong(si + 1); break;
      case 'p': case 'P': gotoSong(si - 1); break;
      case 'g': case 'G': toggleOverlay(overlays[0]); break;
      case 'l': case 'L': toggleMode(); break;
      case 'b': case 'B': case '.': toggleBlack(); break;
      case 't': case 'T': toggleTheme(); break;
      case 'm': case 'M': toggleMotion(); break;
      case 'c': case 'C': if (e.shiftKey) toggleBar(); else jumpSection('chorus'); break;
      case 'j': case 'J': toggleOverlay(overlays[2]); break;
      case 's': case 'S': songEntry = true; numBuf = ''; toast('Song number, then Enter'); clearTimeout(numT); numT = setTimeout(function () { if (!numBuf) endEntry(); }, 4000); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'o': case 'O': openLoader(); break;
      case '?': toggleOverlay(overlays[1]); break;
    }
  });

  var tx = null, ty = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx == null || !songs.length) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) nextLine(); else prevLine(); }
  }, { passive: true });

  var idleT;
  function wake() { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add('idle'); }, 2600); }
  ['mousemove', 'mousedown', 'touchstart', 'keydown'].forEach(function (ev) { document.addEventListener(ev, wake, { passive: true }); });
  wake();

  function keepAwake() { if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(function () { /* not allowed */ }); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') keepAwake(); });
  keepAwake();

  addEventListener('hashchange', function () {
    var m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
    if (!m || !songs.length) return;
    var s = Math.min(songs.length, Math.max(1, +m[1])) - 1, l = m[2] ? +m[2] - 1 : 0;
    if (s !== si) showSong(s, l, true); else if (l !== li) setLine(l);
  });

  /* ---------- Go ---------- */
  load().then(function (r) {
    var err = start(r.text, false);
    if (err) needFile({ msg: 'songs.json was found but could not be read: ' + err, force: true });
  }).catch(function () {
    needFile({ msg: 'The songs could not be loaded automatically.' });
  });

  // Make fonts/layout settle, then re-centre the current line
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(); });
});
