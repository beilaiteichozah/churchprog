/* Lyrics lower third — one lyric line at a time in a bar at the bottom of the picture,
   for live video while a singer or group sings. Songs come from songs.json (same file as lyrics.html).
   Press ? for the keys, H for the full Help page.
   URL options:  ?bg=transparent|checker|dark|green  ?plate=dark|light  ?clean=1 (no on-screen feedback)
                 ?no=12 (start at song number 12)  ?line=3  ?show=1  ?singer=Name  ?info=0  ?book=1 (show hymn-book number/edition)  ?src=other.json */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var SRC = params.get('src') || 'songs.json';
  var CACHE_KEY = 'clhp-songs-json';       // shared with lyrics.html
  var ll = $('ll'), stage = $('stage'), lyric = $('lyric');

  function pref(k, v) { try { if (v === undefined) return localStorage.getItem('ll-' + k); localStorage.setItem('ll-' + k, v); } catch (e) { /* ignore */ } return null; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  /* ---------- Fit artboard ---------- */
  function fit() { stage.style.setProperty('--s', Math.min(innerWidth / 1920, innerHeight / 1080)); }
  addEventListener('resize', fit); fit();

  /* ---------- Options ---------- */
  if (params.has('clean')) document.body.classList.add('clean');
  var BGS = ['transparent', 'checker', 'dark', 'green'];
  var bg = params.get('bg') || pref('bg') || 'transparent';
  if (BGS.indexOf(bg) < 0) bg = 'transparent';
  root.setAttribute('data-bg', bg);
  var plate = params.get('plate') || pref('plate') || 'dark';
  root.setAttribute('data-plate', plate === 'light' ? 'light' : 'dark');
  var m0 = pref('motion');
  if (m0 !== 'full' && m0 !== 'reduced') m0 = (matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'reduced' : 'full';
  root.setAttribute('data-motion', m0);
  var showInfo = params.has('info') ? params.get('info') !== '0' : pref('info') !== 'off';
  ll.classList.toggle('noinfo', !showInfo);
  var singerParam = params.get('singer') || '';
  // Hymn-book details (song number, book, edition) are off by default: not every song comes from a book.
  var showBook = params.has('book') ? params.get('book') !== '0' : pref('book') === 'on';

  /* ---------- Data ---------- */
  var songs = [];
  var si = 0, li = 0;

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
      var secs = Array.isArray(s.sections) ? s.sections : Array.isArray(s.lines) ? [{ label: '', lines: s.lines }] : [];
      var byId = {};
      secs.forEach(function (x) { if (x && x.id) byId[x.id] = x; });
      var seq = Array.isArray(s.order) && s.order.length ? s.order.map(function (id) { return byId[id]; }).filter(Boolean) : secs;
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
        title: String(s.title || 'Song ' + (n + 1)), author: s.author ? String(s.author) : '', reference: s.reference ? String(s.reference) : '', singer: s.singer ? String(s.singer) : '',
        number: s.number != null ? String(s.number) : '', book: s.book ? String(s.book) : '', edition: s.edition ? String(s.edition) : '',
        lines: lines, meta: meta
      };
    }).filter(function (s) { return s.lines.length; });
    if (!out.length) throw new Error('No songs with lyrics were found.');
    return out;
  }

  /* ---------- State machine: hidden -> in -> shown -> out -> hidden ---------- */
  var state = 'hidden', timers = [], lineEl = null, pending = null;
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function setState(s) { state = s; ll.setAttribute('data-state', s); }
  var reduced = function () { return root.getAttribute('data-motion') === 'reduced'; };
  var visible = function () { return state === 'in' || state === 'shown'; };

  function fillSong() {
    var s = songs[si];
    $('song').textContent = s.title;
    $('meta').textContent = [s.reference, showBook ? s.book : '', showBook ? s.edition : '', singerParam || s.singer].filter(Boolean).join('  ·  ');
    // a very long title (or reference) shrinks the whole top row, down to a limit, so it stays on one line
    var tagEl = $('tag'), sg = $('song'), mt = $('meta'), fs = 25; tagEl.style.fontSize = '';
    while ((sg.scrollWidth > sg.clientWidth + 1 || mt.scrollWidth > mt.clientWidth + 1) && fs > 14) { fs--; tagEl.style.fontSize = fs + 'px'; }
    var mark = $('mark'), num = $('num'), number = showBook ? s.number : '';
    num.textContent = number;
    num.style.fontSize = number.length > 3 ? '60px' : '';
    mark.classList.toggle('nonum', !number);          // no number: the gold block shows a cross instead
  }

  function makeLine(text, cls) {
    var d = el('div', 'ln ' + (cls || ''));
    var sp = el('span', null, text);
    d.appendChild(sp);
    lyric.appendChild(d);
    var size = 60, max = lyric.clientHeight;
    while (sp.offsetHeight > max && size > 34) { size -= 2; d.style.fontSize = size + 'px'; }
    return d;
  }

  var secBuiltFor = -1;
  function setProgress() {
    var s = songs[si];
    if (secBuiltFor !== si) { secBuiltFor = si; buildSecList(); }
    highlightSec();
    ll.style.setProperty('--p', ((li + 1) / s.lines.length).toFixed(4));
    try { history.replaceState(null, '', location.search + '#' + (si + 1) + '.' + (li + 1)); } catch (e) { /* file:// */ }
  }

  var swapT = null, swapSong = false;
  function cancelSwap() { if (swapT) { clearTimeout(swapT); swapT = null; } swapSong = false; }

  function enter() {
    clearTimers(); cancelSwap();
    fillSong();
    lyric.textContent = '';
    lineEl = makeLine(songs[si].lines[li].text, 'first');
    setProgress();
    setState('in');
    later(function () { setState('shown'); }, reduced() ? 400 : 1600);
  }
  function exit(done) {
    clearTimers(); cancelSwap();
    setState('out');
    later(function () { setState('hidden'); lyric.textContent = ''; lineEl = null; if (done) done(); }, reduced() ? 400 : 1000);
  }
  function hide() { if (visible()) exit(); }
  function present() {
    if (state === 'hidden') enter();
    else if (state === 'out') { clearTimers(); later(function () { setState('hidden'); enter(); }, 600); }
  }

  /* ---------- Lines, verses, songs ---------- */
  function preview() {
    var s = songs[si];
    toast((si + 1) + '/' + songs.length + ' · ' + (li + 1) + '/' + s.lines.length + ' · ' + s.lines[li].text);
  }

  /* Replace the line on screen with the current one, in sequence: the old line lifts away and
     disappears first, then the new line rises in. If keys are pressed quickly, the swap in
     progress simply picks up the latest line when it finishes, so lines never pile up. */
  function swapLine(withSong) {
    if (withSong) swapSong = true;
    if (swapT) return;
    var old = lineEl;
    var finish = function () {
      swapT = null;
      if (old && old.parentNode) old.parentNode.removeChild(old);
      if (!visible()) { swapSong = false; return; }
      if (swapSong) {
        swapSong = false;
        fillSong();
        ['tag', 'mark'].forEach(function (id) { var e = $(id); e.classList.remove('swap'); void e.offsetWidth; e.classList.add('swap'); });
      }
      lineEl = makeLine(songs[si].lines[li].text, 'pre');
      void lineEl.offsetWidth;            // start from the hidden state, then let it rise in
      lineEl.classList.remove('pre');
    };
    if (old) {
      old.classList.remove('first', 'enter');
      old.classList.add('leave');
      swapT = setTimeout(finish, reduced() ? 0 : 260);
    } else finish();
  }

  function setLine(n) {
    var s = songs[si];
    li = Math.max(0, Math.min(s.lines.length - 1, n));
    setProgress();
    if (visible()) swapLine(false); else preview();
  }

  function next() {
    var s = songs[si];
    if (!visible()) { present(); return; }
    if (li < s.lines.length - 1) setLine(li + 1);
    else toast(si < songs.length - 1 ? 'End of song · N for the next song · Esc hides' : 'End of song · Esc hides');
  }
  function prev() { if (li > 0) setLine(li - 1); }
  function nextVerse() {
    var s = songs[si], cur = s.lines[li].sec;
    for (var i = li + 1; i < s.lines.length; i++) if (s.lines[i].sec !== cur) { setLine(i); return; }
    next();
  }
  function prevVerse() {
    var s = songs[si], cur = s.lines[li].sec, i = li;
    if (i > 0 && s.lines[i - 1].sec === cur) { while (i > 0 && s.lines[i - 1].sec === cur) i--; setLine(i); return; }
    for (i = li - 1; i >= 0; i--) {
      if (s.lines[i].sec !== cur) { var t = s.lines[i].sec; while (i > 0 && s.lines[i - 1].sec === t) i--; setLine(i); return; }
    }
  }

  function gotoSong(n, show) {
    if (n < 0 || n >= songs.length) { toast(n < 0 ? 'First song' : 'Last song'); return; }
    si = n; li = 0;
    refreshList();
    if (visible()) {
      setProgress();
      swapLine(true);
    } else if (show) { present(); }
    else { setProgress(); toast('Song ' + (songs[si].number || (si + 1)) + ' · ' + songs[si].title); }
  }

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
      b.addEventListener('click', function () { closeOverlays(); setLine(m.start); });
      li_.appendChild(b); ol.appendChild(li_); secBtns.push(b);
    });
  }
  function highlightSec() { if (!secBtns.length) return; var c = curSecIdx(); secBtns.forEach(function (b, i) { b.classList.toggle('current', i === c); }); }
  function jumpSection(kind, no) {
    var s = songs[si], cs = curSecIdx(), cand = [];
    s.meta.forEach(function (m, i) { if (m.kind === kind && (kind !== 'verse' || m.no === no)) cand.push(i); });
    if (!cand.length) { toast(kind === 'chorus' ? 'No chorus in this song' : 'No verse ' + no + ' in this song'); return; }
    var target;
    if (cand.indexOf(cs) > -1) target = cs;                       // already there: start it again
    else { var fwd = cand.filter(function (i) { return i > cs; }); target = fwd.length ? fwd[0] : cand[cand.length - 1]; }
    setLine(s.meta[target].start);
    if (visible()) toast(s.meta[target].label || (kind === 'chorus' ? 'Chorus' : 'Verse ' + no));
  }

  /* ---------- Toast, list, overlays ---------- */
  var toastT;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  var listBtns = [];
  function buildList() {
    var ol = $('items'); ol.textContent = ''; listBtns = [];
    songs.forEach(function (s, i) {
      var li_ = el('li'), b = el('button'); b.type = 'button';
      b.appendChild(el('span', 'n', s.number || '·'));
      b.appendChild(el('span', 't', s.title));
      b.appendChild(el('span', 'b', [s.book, s.edition].filter(Boolean).join(' · ')));
      b.addEventListener('click', function () { closeOverlays(); gotoSong(i, true); });
      li_.appendChild(b); ol.appendChild(li_); listBtns.push(b);
    });
  }
  function refreshList() { listBtns.forEach(function (b, i) { b.classList.toggle('current', i === si); }); }

  var panels = [$('listPanel'), $('helpPanel'), $('secPanel')];
  function overlayOpen() { return panels.some(function (p) { return !p.hidden; }); }
  function closeOverlays() { panels.forEach(function (p) { p.hidden = true; }); }
  function openPanel(p) {
    var was = !p.hidden; closeOverlays(); if (was) return;
    p.hidden = false;
    if (p === panels[0] && listBtns[si]) listBtns[si].focus();
    if (p === panels[2] && secBtns[curSecIdx()]) secBtns[curSecIdx()].focus();
  }
  panels.concat([$('loader')]).forEach(function (p) { p.addEventListener('click', function (e) { if (e.target === p && songs.length) p.hidden = true; }); });

  /* ---------- Loading songs ---------- */
  function start(text, remember) {
    var data;
    try { data = normalize(JSON.parse(text)); } catch (e) { return String(e.message || e); }
    songs = data;
    if (remember) { try { localStorage.setItem(CACHE_KEY, text); } catch (e) { /* ignore */ } }
    $('loader').hidden = true;
    buildList();
    var m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
    var noP = params.get('no');
    si = 0; li = 0;
    if (m) { si = Math.min(songs.length, Math.max(1, +m[1])) - 1; li = m[2] ? +m[2] - 1 : 0; }
    else if (noP) { songs.forEach(function (s, i) { if (s.number === String(parseInt(noP, 10)) && si === 0) si = i; }); }
    if (params.get('line')) li = Math.max(0, parseInt(params.get('line'), 10) - 1 || 0);
    li = Math.min(li, songs[si].lines.length - 1);
    refreshList(); setProgress();
    if (params.has('show')) later(present, 150);
    else toast('Space = show / next line · N next song · ? keys');
    return null;
  }
  function needFile(msg) {
    var cached = null;
    try { cached = localStorage.getItem(CACHE_KEY); } catch (e) { /* ignore */ }
    if (cached && !msg.force && start(cached, false) === null) { toast('Loaded saved songs'); return; }
    $('loaderMsg').textContent = msg.text; $('loaderMsg').className = 'msg'; $('loader').hidden = false;
  }
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

  /* ---------- Settings ---------- */
  function cycleBg() { bg = BGS[(BGS.indexOf(bg) + 1) % BGS.length]; root.setAttribute('data-bg', bg); pref('bg', bg); toast('Background: ' + bg); }
  function togglePlate() {
    plate = root.getAttribute('data-plate') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-plate', plate); pref('plate', plate); toast(plate === 'dark' ? 'Navy plate' : 'Light plate');
  }
  function toggleMotion() {
    var m = reduced() ? 'full' : 'reduced';
    root.setAttribute('data-motion', m); pref('motion', m); toast(m === 'full' ? 'Animation: full' : 'Animation: reduced');
  }
  function toggleBook() {
    showBook = !showBook; pref('book', showBook ? 'on' : 'off');
    var s = songs[si], has = !!(s && (s.number || s.book || s.edition));
    toast(showBook ? 'Hymn-book details: on' + (has ? '' : ' (this song has none)') : 'Hymn-book details: off');
    if (songs.length && visible()) {
      fillSong();
      ['tag', 'mark'].forEach(function (id) { var e = $(id); e.classList.remove('swap'); void e.offsetWidth; e.classList.add('swap'); });
    }
  }
  function toggleInfo() {
    showInfo = !showInfo; ll.classList.toggle('noinfo', !showInfo); pref('info', showInfo ? 'on' : 'off');
    toast(showInfo ? 'Song title row: on' : 'Song title row: off');
  }
  function toggleFullscreen() {
    var d = document, r = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { var q = r.requestFullscreen || r.webkitRequestFullscreen; if (q) q.call(r); }
  }
  function openHelp() { var w = window.open('help.html', '_blank'); if (!w) toast('Pop-up blocked. Open help.html'); }

  /* ---------- Keys ---------- */
  /* Song number: press S, type the number, then Enter (digits on their own jump to verses). */
  var numBuf = '', numT, songEntry = false;
  function endEntry() { clearTimeout(numT); numBuf = ''; songEntry = false; }
  function commitNumber() {
    var n = numBuf; endEntry();
    if (!n) return;
    n = String(parseInt(n, 10));
    var idx = -1;
    songs.forEach(function (s, i) { if (idx < 0 && s.number === n) idx = i; });
    if (idx >= 0) gotoSong(idx, true); else toast('No song ' + n);
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === 'h' || k === 'H') { if (!e.repeat) openHelp(); return; }
    if (!$('loader').hidden) { if (k === 'Escape' && songs.length) $('loader').hidden = true; return; }
    if (!songs.length) return;

    if (k === 'Escape') { if (overlayOpen()) closeOverlays(); else hide(); endEntry(); return; }
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
        if (i > -1) { e.preventDefault(); btns[Math.max(0, Math.min(btns.length - 1, i + (k === 'ArrowDown' ? 1 : -1)))].focus(); }
        return;
      }
      if (k === 'Tab' || k === 'Enter' || k === ' ') return;
    }

    switch (k) {
      case ' ': case 'Enter': case 'ArrowRight': case 'ArrowDown': case 'PageDown':
        e.preventDefault(); if (e.repeat) return; (e.shiftKey && k === 'ArrowRight') ? nextVerse() : next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); (e.shiftKey && k === 'ArrowLeft') ? prevVerse() : prev(); break;
      case 'Home': e.preventDefault(); setLine(0); break;
      case 'End': e.preventDefault(); setLine(songs[si].lines.length - 1); break;
      case 'n': case 'N': gotoSong(si + 1, false); break;
      case 'p': case 'P': gotoSong(si - 1, false); break;
      case 'b': case 'B': case '.': if (visible()) hide(); else present(); break;
      case 'g': case 'G': openPanel(panels[0]); break;
      case 'c': case 'C': jumpSection('chorus'); break;
      case 'j': case 'J': openPanel(panels[2]); break;
      case 's': case 'S': songEntry = true; numBuf = ''; toast('Song number, then Enter'); clearTimeout(numT); numT = setTimeout(function () { if (!numBuf) endEntry(); }, 4000); break;
      case 'i': case 'I': toggleInfo(); break;
      case 'd': case 'D': toggleBook(); break;
      case 'v': case 'V': cycleBg(); break;
      case 't': case 'T': togglePlate(); break;
      case 'm': case 'M': toggleMotion(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'o': case 'O': openLoader(); break;
      case '?': openPanel(panels[1]); break;
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
  fetch(SRC, { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function (t) { var err = start(t, true); if (err) needFile({ text: 'songs.json was found but could not be read: ' + err, force: true }); })
    .catch(function () { needFile({ text: 'The songs could not be loaded automatically.' }); });
})();
