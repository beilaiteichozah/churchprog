/* Church Live Hosting Program — shared data layer, used by every page.

   All content lives in two JSON files:
     config.json  church, event, colours, labels, program items, lower-third names
     songs.json   hymns and songs

   Pages read them with fetch(). Browsers block fetch() for files opened straight from a
   folder (file://), so the last good copy is also kept in this browser (localStorage); the
   Editor Dashboard keeps that copy up to date, and a page that finds nothing asks you to
   choose the files once.

   Rule when both a file and a saved copy exist: if the JSON file on disk has changed since the
   copy was saved (you edited it by hand, or replaced it), the file wins. Otherwise the saved copy
   (which may hold newer edits from the Editor Dashboard) is used.

   This script also applies the colours from config.json, sets the page title and offers a few
   helpers (date, details, headline) through window.CHURCH_UTIL.                                  */
(function () {
  'use strict';

  var FILES = { config: 'config.json', songs: 'songs.json' };
  var STORE = { config: 'clhp-config-store', songs: 'clhp-songs-store' };
  var root = document.documentElement;
  var isEditor = root.hasAttribute('data-editor');

  /* Hide the page until the colours are known, so it never flashes the wrong colours. */
  root.style.visibility = 'hidden';
  var failSafe = setTimeout(function () { root.style.visibility = ''; }, 4000);
  function reveal() { clearTimeout(failSafe); root.style.visibility = ''; }

  /* ---------- Defaults (used for a blank project and to fill gaps) ---------- */
  function defaults() {
    return {
      config: {
        locale: 'en',
        church: { name: 'Your Church Name', place: 'Town or city' },
        event: {
          headline: ['Sunday Worship', 'Service'], connector: '', title: '',
          date: '', dateText: '', time: '', venue: '', details: []
        },
        labels: { date: 'Date', venue: 'Venue', time: 'Time' },
        theme: { preset: 'navy', colors: {} },
        program: [],
        lowerThirds: { autoHide: 10, entries: [] }
      },
      songs: { songs: [] }
    };
  }

  /* ---------- The copy kept in this browser ---------- */
  function readStore(kind) {
    try {
      var s = JSON.parse(localStorage.getItem(STORE[kind]));
      return s && typeof s.text === 'string' ? s : null;
    } catch (e) { return null; }
  }
  /* text = what pages should use; fileText = what the JSON file contained when this was saved */
  function writeStore(kind, text, fileText) {
    try {
      localStorage.setItem(STORE[kind], JSON.stringify({ text: text, fileText: fileText == null ? text : fileText }));
      return true;
    } catch (e) { return false; }
  }
  function storedText(kind) { var s = readStore(kind); return s ? s.text : null; }

  function fetchText(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  /* Resolves {text, source:'file'|'browser'} or rejects when nothing can be read.
     src = a different file to read (?src=other.json); it is never saved. */
  function resolveText(kind, src) {
    if (src && src !== FILES[kind]) return fetchText(src).then(function (t) { return { text: t, source: 'file' }; });
    var st = readStore(kind);
    return fetchText(FILES[kind]).then(function (t) {
      if (st && st.fileText === t) return { text: st.text, source: st.text === t ? 'file' : 'browser' };
      writeStore(kind, t, t);
      return { text: t, source: 'file' };
    }, function () {
      if (st) return { text: st.text, source: 'browser' };
      throw new Error('unavailable');
    });
  }

  function putText(kind, text) { return writeStore(kind, text, text); }

  /* ---------- Colours, title, helpers ---------- */
  var PRESETS = {
    navy:     { base: '#1e2440', baseDeep: '#171d37', slate: '#3f4a68', accent: '#2f8a8f', accentLight: '#5fa3ab', highlight: '#e8b44c' },
    forest:   { base: '#1c3b30', baseDeep: '#142b23', slate: '#3d5b4e', accent: '#3f9a73', accentLight: '#7cc3a0', highlight: '#e3b448' },
    burgundy: { base: '#3a1a28', baseDeep: '#2b121e', slate: '#5a3446', accent: '#c0566f', accentLight: '#dc98a6', highlight: '#e8b44c' },
    charcoal: { base: '#22262b', baseDeep: '#181b1f', slate: '#454b54', accent: '#3d8fb0', accentLight: '#7ab6d0', highlight: '#f0b94f' }
  };
  var CSSVARS = { base: '--navy', baseDeep: '--navy-deep', slate: '--slate', accent: '--teal', accentLight: '--teal-light', highlight: '--gold' };

  function palette(theme) {
    theme = theme || {};
    var pal = {}, base = PRESETS[theme.preset] || PRESETS.navy;
    Object.keys(base).forEach(function (k) { pal[k] = base[k]; });
    var custom = theme.colors || {};
    Object.keys(custom).forEach(function (k) { if (custom[k] && pal.hasOwnProperty(k)) pal[k] = custom[k]; });
    return pal;
  }

  function applyTheme(C) {
    var pal = palette(C.theme);
    Object.keys(CSSVARS).forEach(function (k) { root.style.setProperty(CSSVARS[k], pal[k]); });
    root.style.setProperty('--ui-line', pal.slate);
    root.style.setProperty('--rule', pal.slate);
    if (C.locale) root.setAttribute('lang', C.locale);
    var name = C.church && C.church.name;
    if (name && !isEditor) document.title = document.title.replace(/\s*·\s*$/, '') + ' · ' + name;
  }

  function makeUtil(C) {
    var church = C.church || {}, event = C.event || {}, labels = C.labels || {};
    function parseDate() {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.date || '');
      return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
    }
    function fmt(opts) {
      var d = parseDate();
      if (!d) return '';
      try { return new Intl.DateTimeFormat(C.locale || 'en', opts).format(d); } catch (e) { return ''; }
    }
    function ordinal(n) {
      if (!/^en/i.test(C.locale || 'en')) return String(n);
      var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
    var util = {
      cfg: C, church: church, event: event,
      /* the headline as an array of 1-2 lines */
      headline: function () {
        var h = event.headline;
        if (typeof h === 'string') h = [h];
        h = (h || []).filter(Boolean);
        return h.length ? h : [church.name || ''];
      },
      /* "Sunday, 4 October 2026" (or the dateText you set) */
      dateText: function () {
        if (event.dateText) return event.dateText;
        return fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) || event.date || '';
      },
      /* parts for the big date plate on the banner */
      dateParts: function () {
        var d = parseDate();
        if (!d) return null;
        return { day: ordinal(d.getDate()), month: fmt({ month: 'long' }), year: String(d.getFullYear()), full: util.dateText() };
      },
      /* rows for the details slide and banner. null = a gap between groups. */
      details: function () {
        var rows = [];
        if (event.date || event.dateText) rows.push([labels.date || 'Date', util.dateText()]);
        if (event.venue) rows.push([labels.venue || 'Venue', event.venue]);
        if (event.time) rows.push([labels.time || 'Time', event.time]);
        var extra = (event.details || []).filter(function (r) { return r && r[1]; });
        if (extra.length) { rows.push(null); extra.forEach(function (r) { rows.push([r[0], r[1]]); }); }
        return rows;
      }
    };
    return util;
  }

  /* ---------- Parsing ---------- */
  function parseConfig(text) {
    var C = JSON.parse(text);
    if (!C || typeof C !== 'object' || Array.isArray(C)) throw new Error('config.json must hold one object.');
    var d = defaults().config;
    Object.keys(d).forEach(function (k) { if (C[k] == null) C[k] = d[k]; });
    if (!C.lowerThirds.entries) C.lowerThirds.entries = [];
    if (!Array.isArray(C.program)) throw new Error('"program" must be a list.');
    return C;
  }

  /* ---------- "Choose your files" box ---------- */
  var boxStyle = null;
  function injectStyle() {
    if (boxStyle) return;
    boxStyle = document.createElement('style');
    boxStyle.textContent =
      '.clhp-box{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:rgba(10,14,32,.92);font:16px/1.5 "Segoe UI","Helvetica Neue",Arial,sans-serif;color:#f1f5f8}' +
      '.clhp-box .in{width:min(640px,100%);padding:28px 32px;background:#171d37;border-top:6px solid #e8b44c;border-radius:2px}' +
      '.clhp-box h2{font-size:24px;margin-bottom:10px}.clhp-box p{margin-bottom:12px;color:#d5dde6}' +
      '.clhp-box .err{color:#ffb4a8;font-weight:700}' +
      '.clhp-box label.pick{display:block;margin:16px 0 8px;padding:26px 16px;text-align:center;border:2px dashed #5a678a;border-radius:4px;cursor:pointer}' +
      '.clhp-box label.pick:hover,.clhp-box.drag label.pick{border-color:#e8b44c;background:#1e2748}' +
      '.clhp-box input{position:absolute;opacity:0;width:1px;height:1px}' +
      '.clhp-box button{margin-top:6px;padding:10px 18px;font:700 15px inherit;font-family:inherit;border:0;border-radius:3px;background:#e8b44c;color:#1e2440;cursor:pointer}' +
      '.clhp-box small{display:block;margin-top:10px;color:#9fb0c1}';
    document.head.appendChild(boxStyle);
  }

  /* Ask the user for the files. Calls done() once config.json has been chosen. */
  function askForFiles(message, isError, done) {
    injectStyle();
    reveal();
    var box = document.createElement('div');
    box.className = 'clhp-box';
    var inner = document.createElement('div'); inner.className = 'in';
    var h = document.createElement('h2'); h.textContent = 'Choose your data files';
    var p1 = document.createElement('p'); p1.textContent = message; if (isError) p1.className = 'err';
    var p2 = document.createElement('p');
    p2.textContent = 'This page cannot read config.json and songs.json by itself when it is opened straight from a folder. Choose both files once (select them together). They are remembered in this browser. Or open the folder through a local web server and this box never appears.';
    var lab = document.createElement('label'); lab.className = 'pick';
    lab.appendChild(document.createTextNode('Click to choose config.json and songs.json, or drop them here'));
    var inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = '.json,application/json';
    lab.appendChild(inp);
    var note = document.createElement('p'); note.className = 'err'; note.hidden = true;
    inner.appendChild(h); inner.appendChild(p1); inner.appendChild(p2); inner.appendChild(lab); inner.appendChild(note);
    if (isEditor) {
      var blank = document.createElement('button'); blank.type = 'button'; blank.textContent = 'Start a blank project instead';
      blank.addEventListener('click', function () { box.remove(); done(JSON.stringify(defaults().config)); });
      inner.appendChild(blank);
    }
    var small = document.createElement('small'); small.textContent = 'Tip: the Editor Dashboard (editor.html) can connect to the folder and keep these files up to date.';
    inner.appendChild(small);
    box.appendChild(inner);
    document.body.appendChild(box);

    function handle(files) {
      var list = [].slice.call(files || []);
      if (!list.length) return;
      var got = { config: null, songs: null }, left = list.length, bad = '';
      list.forEach(function (f) {
        var fr = new FileReader();
        fr.onload = function () {
          var text = String(fr.result), obj = null;
          try { obj = JSON.parse(text); } catch (e) { bad = f.name + ' is not valid JSON (' + e.message + ').'; }
          if (obj && typeof obj === 'object') {
            var kind = Array.isArray(obj.songs) || /song/i.test(f.name) ? 'songs' : 'config';
            got[kind] = text;
          }
          if (--left === 0) finish();
        };
        fr.readAsText(f);
      });
      function finish() {
        if (got.songs) putText('songs', got.songs);
        if (!got.config && !readStore('config')) {
          note.textContent = bad || 'config.json was not among the files you chose.'; note.hidden = false; return;
        }
        if (got.config) {
          try { parseConfig(got.config); } catch (e) { note.textContent = 'config.json could not be read: ' + e.message; note.hidden = false; return; }
          putText('config', got.config);
        }
        box.remove();
        done(got.config || storedText('config'));
      }
    }
    inp.addEventListener('change', function () { handle(inp.files); });
    ['dragenter', 'dragover'].forEach(function (ev) { box.addEventListener(ev, function (e) { e.preventDefault(); box.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { box.addEventListener(ev, function (e) { e.preventDefault(); box.classList.remove('drag'); }); });
    box.addEventListener('drop', function (e) { handle(e.dataTransfer && e.dataTransfer.files); });
  }

  /* ---------- Load config.json ---------- */
  var readyList = [];
  var loaded = false;
  var api = {
    FILES: FILES,
    PRESETS: PRESETS,
    defaults: defaults,
    palette: palette,
    resolveText: resolveText,
    putText: putText,
    storedText: storedText,
    readStore: readStore,
    writeStore: writeStore,
    parseConfig: parseConfig,
    makeUtil: makeUtil,
    applyTheme: applyTheme,
    /* run fn(config) once config.json is loaded and the colours are applied */
    ready: function (fn) { if (loaded) fn(window.CHURCH_UTIL.cfg); else readyList.push(fn); }
  };
  window.ChurchData = api;

  function accept(text) {
    var C;
    try { C = parseConfig(text); } catch (e) { return String(e.message || e); }
    window.CHURCH_CONFIG = C;
    window.CHURCH_UTIL = makeUtil(C);
    applyTheme(C);
    loaded = true;
    reveal();
    readyList.splice(0).forEach(function (fn) { fn(C); });
    return null;
  }

  function boot() {
    resolveText('config').then(function (r) {
      var err = accept(r.text);
      if (err) askForFiles('config.json could not be read: ' + err, true, retry);
    }, function () {
      askForFiles('config.json could not be loaded automatically.', false, retry);
    });
  }
  function retry(text) {
    var err = accept(text);
    if (err) askForFiles('config.json could not be read: ' + err, true, retry);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
