/* Editor Dashboard — edit config.json and songs.json in forms.

   Save keeps a copy in this browser (so the pages show your changes at once) and, when a folder
   is connected (Chrome / Edge), writes config.json and songs.json straight into it. Without a
   folder, use "Download files" and copy the two files into the project folder.            */
ChurchData.ready(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Small helpers
  ------------------------------------------------------------------ */
  const $ = (s, r) => (r || document).querySelector(s);
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    Object.keys(props || {}).forEach(k => {
      const v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'value') e.value = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    kids.flat(Infinity).forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return e;
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  const FSA = typeof window.showDirectoryPicker === 'function';

  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 3800);
  }

  /* A modal question. Resolves to the value of the button chosen (or null). */
  function ask(title, bodyNodes, buttons) {
    return new Promise(resolve => {
      const dlg = $('#dlg');
      dlg.textContent = '';
      let result = null;
      const form = h('form', { method: 'dialog' },
        h('h2', { text: title }), bodyNodes,
        h('div', { class: 'bar' }, buttons.map(b => h('button', {
          type: 'button', class: 'btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : ''), text: b.label,
          onclick: () => { result = b.value; dlg.close(); }
        }))));
      dlg.append(form);
      dlg.onclose = () => resolve(result);
      dlg.showModal();
    });
  }
  const confirmBox = (title, msg, okLabel, danger) =>
    ask(title, h('p', { class: 'hint', text: msg }), [{ label: 'Cancel', value: false }, { label: okLabel, value: true, primary: !danger, danger }]).then(v => v === true);

  /* ------------------------------------------------------------------
     State
  ------------------------------------------------------------------ */
  const S = { cfg: null, songs: null, sel: 0, filter: '', tab: 'church' };
  let dirty = false;
  let savedWhere = '';        // '', 'browser' or 'folder'
  let savedAt = null;
  const origin = { config: '', songs: '' };   // where the data was loaded from

  function touch() { dirty = true; updateChrome(); }

  function normalizeConfig(c) {
    c = c || {};
    c.locale = c.locale || 'en';
    c.church = Object.assign({ name: '', place: '' }, c.church);
    const ev = c.event = Object.assign({ headline: [], connector: '', title: '', date: '', dateText: '', time: '', venue: '', details: [] }, c.event);
    let hl = ev.headline; if (typeof hl === 'string') hl = [hl];
    ev.headline = [(hl && hl[0]) || '', (hl && hl[1]) || ''];
    ev.details = (ev.details || []).map(r => [String((r && r[0]) || ''), String((r && r[1]) || '')]);
    c.labels = Object.assign({ date: 'Date', venue: 'Venue', time: 'Time' }, c.labels);
    c.theme = Object.assign({ preset: 'navy' }, c.theme); c.theme.colors = Object.assign({}, c.theme.colors);
    c.program = (c.program || []).map(item => item.map(b => Object.assign({ _t: b.text != null ? 'text' : (b.hymn ? 'hymn' : 'role') }, b)));
    c.lowerThirds = Object.assign({ autoHide: 10, entries: [] }, c.lowerThirds);
    c.lowerThirds.entries = (c.lowerThirds.entries || []).map(e => ({ item: e.item != null ? String(e.item) : '', role: e.role || '', name: e.name || '', detail: e.detail || '' }));
    return c;
  }
  function normalizeSongs(d) {
    d = d || {};
    if (!Array.isArray(d.songs)) d.songs = [];
    d.songs.forEach(s => {
      s.sections = (s.sections || []).map(x => Object.assign({}, x, { label: x.label || '', lines: (x.lines || []).map(String) }));
      s._order = (s.order || []).join(', ');
      ['title', 'composer', 'author', 'reference', 'singer', 'book', 'edition'].forEach(k => { s[k] = s[k] == null ? '' : String(s[k]); });
      s.number = s.number == null ? '' : String(s.number);
    });
    return d;
  }

  /* ---------- Build the JSON that gets saved ---------- */
  function buildConfig() {
    const c = S.cfg, preset = ChurchData.PRESETS[c.theme.preset] || ChurchData.PRESETS.navy;
    const colors = {};
    Object.keys(c.theme.colors).forEach(k => { const v = c.theme.colors[k]; if (v && preset[k] && v.toLowerCase() !== preset[k].toLowerCase()) colors[k] = v; });
    const program = c.program.map(item => item.map(b => {
      const out = {};
      if (b._t === 'text') { out.text = (b.text || '').trim(); if ((b.note || '').trim()) out.note = b.note.trim(); }
      else {
        if ((b.label || '').trim()) out.label = b.label.trim();
        out.value = (b.value || '').trim();
        if ((b.sub || '').trim()) out.sub = b.sub.trim();
        if (b._t === 'hymn') out.hymn = true;
      }
      return out;
    }).filter(b => b.text || b.value)).filter(item => item.length);
    const entries = c.lowerThirds.entries.filter(e => e.name.trim()).map(e => {
      const o = {};
      const n = String(e.item).trim();
      if (n !== '') o.item = /^\d+$/.test(n) ? Number(n) : n;
      o.role = e.role.trim(); o.name = e.name.trim(); o.detail = e.detail.trim();
      return o;
    });
    const out = {};
    if (c._readme) out._readme = c._readme;
    out.locale = c.locale || 'en';
    out.church = { name: c.church.name.trim(), place: c.church.place.trim() };
    const ev = c.event;
    out.event = {
      headline: ev.headline.map(x => x.trim()).filter(Boolean), connector: ev.connector.trim(), title: ev.title.trim(),
      date: ev.date, dateText: ev.dateText.trim(), time: ev.time.trim(), venue: ev.venue.trim(),
      details: ev.details.filter(r => r[0].trim() || r[1].trim()).map(r => [r[0].trim(), r[1].trim()])
    };
    out.labels = clone(c.labels);
    out.theme = { preset: c.theme.preset, colors };
    out.program = program;
    out.lowerThirds = { autoHide: Math.max(0, Number(c.lowerThirds.autoHide) || 0), entries };
    return out;
  }

  function slug(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'song'; }
  function sectionIdFor(label, used) {
    let id;
    const v = /^\s*(?:verse|stanza|v)\s*\.?\s*(\d+)/i.exec(label);
    if (v) id = 'v' + v[1];
    else if (/chorus|refrain/i.test(label)) id = 'c';
    else if (/bridge/i.test(label)) id = 'b';
    else if (/end/i.test(label)) id = 'end';
    else id = slug(label).slice(0, 12) || 's';
    let k = id, n = 2;
    while (used.has(k)) k = id + (n++);
    return k;
  }
  function buildSongs() {
    const usedSong = new Set();
    const songs = S.songs.songs.map(s => {
      const o = {};
      let id = s.id || slug(s.title);
      let k = id, n = 2; while (usedSong.has(k)) k = id + '-' + (n++);
      usedSong.add(k); o.id = k;
      o.title = s.title.trim();
      ['composer', 'author', 'reference', 'singer'].forEach(f => { if (s[f].trim()) o[f] = s[f].trim(); });
      const num = s.number.trim();
      if (num) o.number = /^\d+$/.test(num) ? Number(num) : num;
      ['book', 'edition'].forEach(f => { if (s[f].trim()) o[f] = s[f].trim(); });
      const used = new Set();
      o.sections = s.sections.filter(x => x.lines.some(l => l.trim())).map(x => {
        const sec = Object.assign({}, x);
        sec.id = x.id && !used.has(x.id) ? x.id : sectionIdFor(x.label || 'Part', used);
        used.add(sec.id);
        sec.label = (x.label || '').trim() || 'Part';
        sec.lines = x.lines.map(l => l.replace(/\s+$/, '')).filter(l => l.trim());
        return sec;
      });
      const ord = s._order.split(/[\s,]+/).filter(Boolean);
      if (ord.length) o.order = ord;
      return o;
    });
    const out = {};
    if (S.songs._readme) out._readme = S.songs._readme;
    out.songs = songs;
    return out;
  }
  const toText = o => JSON.stringify(o, null, 2) + '\n';

  /* ---------- Things that look wrong ---------- */
  function problems() {
    const list = [];
    const c = S.cfg;
    if (!c.church.name.trim()) list.push('The church name is empty.');
    if (c.event.date && !/^\d{4}-\d{2}-\d{2}$/.test(c.event.date)) list.push('The event date must be written YYYY-MM-DD.');
    c.program.forEach((item, i) => { if (!item.some(b => (b.text || b.value || '').trim())) list.push('Program item ' + (i + 1) + ' is empty and will be left out.'); });
    const nItems = c.program.length;
    c.lowerThirds.entries.forEach(e => {
      if (!e.name.trim() && (e.role.trim() || e.detail.trim())) list.push('A lower-third entry has no name and will be left out.');
      const n = parseInt(e.item, 10);
      if (e.name.trim() && n > nItems) list.push('Lower third "' + e.name + '" points to item ' + n + ', but the program has ' + nItems + ' items.');
    });
    const nums = {};
    S.songs.songs.forEach((s, i) => {
      const t = s.title.trim() || 'Song ' + (i + 1);
      if (!s.title.trim()) list.push('Song ' + (i + 1) + ' has no title.');
      if (!s.sections.some(x => x.lines.some(l => l.trim()))) list.push('"' + t + '" has no lyrics and will not show.');
      const ids = new Set(); const b = buildSongsOne(s); b.forEach(id => ids.add(id));
      s._order.split(/[\s,]+/).filter(Boolean).forEach(id => { if (!ids.has(id)) list.push('"' + t + '": the play order uses "' + id + '", which is not a part of the song.'); });
      const n = s.number.trim();
      if (n) { if (nums[n]) list.push('Songs "' + nums[n] + '" and "' + t + '" share the number ' + n + '.'); else nums[n] = t; }
    });
    return list;
  }
  function buildSongsOne(s) {
    const used = new Set(), ids = [];
    s.sections.filter(x => x.lines.some(l => l.trim())).forEach(x => {
      const id = x.id && !used.has(x.id) ? x.id : sectionIdFor(x.label || 'Part', used);
      used.add(id); ids.push(id);
    });
    return ids;
  }

  /* ------------------------------------------------------------------
     Header, tabs, status
  ------------------------------------------------------------------ */
  const statusEl = $('#status');
  function updateChrome() {
    $('#churchName').textContent = S.cfg.church.name || 'Church Live Hosting Program';
    $('#cProgram').textContent = S.cfg.program.length || '';
    $('#cLower').textContent = S.cfg.lowerThirds.entries.length || '';
    $('#cSongs').textContent = S.songs.songs.length || '';
    statusEl.textContent = '';
    if (dirty) statusEl.append(h('b', { text: 'Unsaved changes' }), ' — press Ctrl + S');
    else if (savedWhere === 'folder') statusEl.append(h('span', { class: 'ok', text: 'Saved to the folder' }), ' · ' + savedAt.toLocaleTimeString());
    else if (savedWhere === 'browser') statusEl.append(h('span', { class: 'ok', text: 'Saved in this browser' }), ' · files not updated yet (see Files)');
    else statusEl.append('All changes saved');
    $('#btnConnect').hidden = !FSA;
    $('#btnConnect').textContent = dirHandle ? 'Folder: ' + dirHandle.name : (pendingHandle ? 'Reconnect folder' : 'Connect folder');
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'true' : 'false'));
  }

  function go(tab) {
    S.tab = renderers[tab] ? tab : 'church';
    try { history.replaceState(null, '', '#' + S.tab); } catch (e) { /* ignore */ }
    render();
  }
  function render() {
    const y = window.scrollY;
    const panel = $('#panel');
    panel.textContent = '';
    panel.append(...renderers[S.tab]());
    updateChrome();
    window.scrollTo(0, y);
  }

  /* ------------------------------------------------------------------
     Form building blocks
  ------------------------------------------------------------------ */
  function field(label, obj, key, o) {
    o = o || {};
    const inp = h(o.area ? 'textarea' : 'input', {
      type: o.area ? null : (o.type || 'text'), value: obj[key] == null ? '' : obj[key], placeholder: o.ph, list: o.list,
      maxlength: o.max, inputmode: o.mode, rows: o.rows, spellcheck: o.spell === false ? 'false' : null
    });
    inp.addEventListener('input', () => { obj[key] = inp.value; if (o.after) o.after(inp.value); touch(); });
    return h('label', { class: 'f' + (o.wide ? ' wide' : '') }, h('span', { class: 'l' }, label, o.hint ? [' ', h('small', { text: o.hint })] : null), inp);
  }
  function selectField(label, value, options, onchange) {
    const sel = h('select', {}, options.map(([v, t]) => h('option', { value: v, text: t })));
    sel.value = value;
    sel.addEventListener('change', () => onchange(sel.value));
    return h('label', { class: 'f' }, h('span', { class: 'l', text: label }), sel);
  }
  const btn = (text, onclick, cls, title) => h('button', { type: 'button', class: 'btn ' + (cls || ''), onclick, title, text });
  function move(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; }
  function rowButtons(arr, i, after, extra) {
    return h('div', { class: 'row-actions' },
      btn('↑', () => { if (move(arr, i, -1)) { touch(); after(); } }, 'small', 'Move up'),
      btn('↓', () => { if (move(arr, i, 1)) { touch(); after(); } }, 'small', 'Move down'),
      extra || null,
      btn('✕', () => { arr.splice(i, 1); touch(); after(); }, 'small danger', 'Remove'));
  }
  function head(title, lead) { return [h('h1', { class: 'page', text: title }), h('p', { class: 'lead' }, lead)]; }

  /* ------------------------------------------------------------------
     Tab: Church & event
  ------------------------------------------------------------------ */
  function tabChurch() {
    const c = S.cfg, ev = c.event;
    const written = h('p', { class: 'hint' });
    const showDate = () => { const t = ChurchData.makeUtil(c).dateText(); written.textContent = t ? 'Shown as: ' + t : ''; };
    showDate();
    const detailsRows = h('div', { class: 'rows' });
    const drawDetails = () => {
      detailsRows.textContent = '';
      ev.details.forEach((r, i) => {
        detailsRows.append(h('div', { class: 'row detail' },
          field('Label', r, 0, { ph: 'Host' }), field('Value', r, 1, { ph: 'Pastor Sample Name' }),
          rowButtons(ev.details, i, drawDetails)));
      });
      if (!ev.details.length) detailsRows.append(h('p', { class: 'hint', text: 'No extra details yet.' }));
    };
    drawDetails();
    return [
      ...head('Church & event', ['Shown on the slideshow, the banner and every page. Saved in ', h('code', { text: 'config.json' }), '.']),
      h('section', { class: 'card' }, h('h2', { text: 'Your church' }),
        h('div', { class: 'grid' },
          field('Church name', c.church, 'name', { after: updateChrome }), field('Place or address', c.church, 'place'))),
      h('section', { class: 'card' }, h('h2', { text: 'This service or event' }),
        h('p', { class: 'hint', text: 'The headline is the big title. Use two lines if it is long.' }),
        h('div', { class: 'grid' },
          field('Headline, line 1', ev.headline, 0), field('Headline, line 2', ev.headline, 1, { hint: '(optional)' }),
          field('Connector word', ev, 'connector', { hint: '(optional, e.g. “and”)' }),
          field('Title line', ev, 'title', { wide: true }),
          field('Date', ev, 'date', { type: 'date', after: showDate }),
          field('Date written out instead', ev, 'dateText', { hint: '(optional)', ph: 'Sunday, 4 October 2026', after: showDate }),
          field('Time', ev, 'time', { ph: '10:00 am – 12:00 noon' }), field('Venue', ev, 'venue')),
        written),
      h('section', { class: 'card' }, h('h2', { text: 'Extra details' }),
        h('p', { class: 'hint', text: 'Rows shown below Date, Venue and Time on the details slide and the banner (host, chairman, worship leader…).' }),
        detailsRows, h('div', { class: 'bar' }, btn('+ Add a detail', () => { ev.details.push(['', '']); touch(); drawDetails(); }))),
      h('section', { class: 'card' }, h('h2', { text: 'Language' }),
        h('p', { class: 'hint', text: 'Everything you type is shown exactly as written. These set the language of the written date and the words for the three standard rows.' }),
        h('div', { class: 'grid' },
          field('Language code', c, 'locale', { list: 'locales', ph: 'en', hint: '(en, fr, es, sw, hi…)', after: showDate }),
          field('Word for “Date”', c.labels, 'date'), field('Word for “Venue”', c.labels, 'venue'), field('Word for “Time”', c.labels, 'time')),
        h('datalist', { id: 'locales' }, ['en', 'fr', 'es', 'pt', 'de', 'it', 'sw', 'hi', 'ta', 'te', 'ml', 'ko', 'zh', 'id', 'tl'].map(v => h('option', { value: v }))))
    ];
  }

  /* ------------------------------------------------------------------
     Tab: Colours
  ------------------------------------------------------------------ */
  const COLOR_KEYS = [
    ['base', 'Background', 'Main background of slides and pages'],
    ['baseDeep', 'Darker panels', 'Bars, lists and panels'],
    ['slate', 'Secondary shade', 'Lines and quiet shapes'],
    ['accent', 'Second colour', 'Side panels, cross arms, bars'],
    ['accentLight', 'Light second colour', 'Progress and highlights'],
    ['highlight', 'Highlight', 'Headings, labels, the date plate']
  ];
  function tabColours() {
    const t = S.cfg.theme;
    const pal = () => ChurchData.palette(t);
    const preview = h('div', { class: 'preview' });
    const drawPreview = () => {
      const p = pal();
      preview.style.background = p.base;
      preview.textContent = '';
      preview.append(
        h('div', { class: 'side', style: 'background:' + p.accent }, S.cfg.church.name || 'Church name', h('small', { text: S.cfg.church.place || '' })),
        h('div', { class: 'main' }, h('div', { class: 'lab', style: 'color:' + p.highlight, text: 'Sermon' }), h('div', { class: 'val', text: 'Pastor Sample Name' }),
          h('div', { class: 'sub', text: 'Senior Pastor' }), h('div', { class: 'bar2', style: 'background:' + p.accentLight })));
      ChurchData.applyTheme(S.cfg);
    };
    const swWrap = h('div', { class: 'swatches' });
    const drawSw = () => {
      swWrap.textContent = '';
      const p = pal();
      COLOR_KEYS.forEach(([k, name, use]) => {
        const inp = h('input', { type: 'color', value: p[k], 'aria-label': name });
        inp.addEventListener('input', () => { t.colors[k] = inp.value; touch(); drawPreview(); });
        swWrap.append(h('div', { class: 'sw' }, inp, h('div', { class: 't' }, h('b', { text: name }), h('span', { text: use })),
          btn('Reset', () => { delete t.colors[k]; touch(); drawSw(); drawPreview(); }, 'small', 'Back to the preset colour')));
      });
    };
    const presets = h('div', { class: 'presets' });
    const drawPresets = () => {
      presets.textContent = '';
      Object.keys(ChurchData.PRESETS).forEach(name => {
        const p = ChurchData.PRESETS[name];
        presets.append(h('button', { type: 'button', class: 'preset', 'aria-pressed': String(t.preset === name), onclick: () => { t.preset = name; t.colors = {}; touch(); drawPresets(); drawSw(); drawPreview(); } },
          h('span', { class: 'chips' }, ['base', 'slate', 'accent', 'accentLight', 'highlight'].map(k => h('i', { style: 'background:' + p[k] }))), h('b', { text: name })));
      });
    };
    drawPresets(); drawSw(); drawPreview();
    return [
      ...head('Colours', 'Choose a preset, then change any colour to match your church. The slideshow, banner, lyrics and lower thirds all follow these colours.'),
      h('section', { class: 'card' }, h('h2', { text: 'Preset' }), presets),
      h('section', { class: 'card' }, h('h2', { text: 'Your own colours' }), h('p', { class: 'hint', text: 'Only the colours you change are saved on top of the preset.' }), swWrap),
      h('section', { class: 'card' }, h('h2', { text: 'Preview' }), preview)
    ];
  }

  /* ------------------------------------------------------------------
     Tab: Program
  ------------------------------------------------------------------ */
  const BLOCK_TYPES = [['role', 'Role and person'], ['hymn', 'Hymn'], ['text', 'Plain line']];
  const newBlock = t => t === 'text' ? { _t: 'text', text: '', note: '' } : { _t: t, label: '', value: '', sub: '' };
  function itemSummary(item) { const b = item[0] || {}; return (b.label || b.text || b.value || 'Empty item') + (b.label && b.value ? ' — ' + b.value : ''); }

  function tabProgram() {
    const c = S.cfg;
    const wrap = h('div');
    const draw = () => {
      wrap.textContent = '';
      c.program.forEach((item, i) => wrap.append(itemCard(item, i, draw)));
      if (!c.program.length) wrap.append(h('p', { class: 'empty', text: 'No program items yet. Add the first one below.' }));
      updateChrome();
    };
    draw();
    return [
      ...head('Program', ['The items of the service, in order. The slideshow shows one slide per item, and typing an item number then Enter jumps to it. Saved in ', h('code', { text: 'config.json' }), '.']),
      wrap,
      h('div', { class: 'bar' },
        btn('+ Item: role and person', () => { c.program.push([newBlock('role')]); touch(); draw(); }, 'primary'),
        btn('+ Item: hymn', () => { c.program.push([newBlock('hymn')]); touch(); draw(); }),
        btn('+ Item: plain line', () => { c.program.push([newBlock('text')]); touch(); draw(); })),
      h('p', { class: 'hint', text: 'Moving or deleting an item changes the numbers of the items after it. Check the item numbers on the Lower thirds tab afterwards.' })
    ];
  }
  function itemCard(item, i, redraw) {
    const sum = h('span', { class: 'sum' });
    const upd = () => { sum.textContent = itemSummary(item); };
    upd();
    const body = h('div', { class: 'body' });
    const drawBlocks = () => {
      body.textContent = '';
      item.forEach((b, bi) => body.append(blockRow(item, b, bi, drawBlocks, upd)));
      body.append(h('div', { class: 'bar' },
        btn('+ Role and person', () => { item.push(newBlock('role')); touch(); drawBlocks(); }, 'small'),
        btn('+ Hymn', () => { item.push(newBlock('hymn')); touch(); drawBlocks(); }, 'small'),
        btn('+ Plain line', () => { item.push(newBlock('text')); touch(); drawBlocks(); }, 'small')));
    };
    drawBlocks();
    const dup = btn('⧉', () => { S.cfg.program.splice(i + 1, 0, clone(item)); touch(); redraw(); }, 'small', 'Duplicate this item');
    return h('section', { class: 'item' },
      h('header', {}, h('span', { class: 'no', text: i + 1 }), sum, rowButtons(S.cfg.program, i, redraw, dup)),
      body);
  }
  function blockRow(item, b, bi, redraw, upd) {
    const typeSel = selectField('Type', b._t, BLOCK_TYPES, v => { b._t = v; touch(); redraw(); upd(); });
    const f = [];
    if (b._t === 'text') {
      f.push(field('Line', b, 'text', { after: upd, wide: true }), field('Small note under it', b, 'note', { hint: '(optional)' }));
    } else {
      f.push(field(b._t === 'hymn' ? 'Label' : 'Role', b, 'label', { ph: b._t === 'hymn' ? 'Opening hymn' : 'Scripture reading', after: upd }),
        field(b._t === 'hymn' ? 'Hymn title' : 'Person or group', b, 'value', { list: b._t === 'hymn' ? 'songtitles' : null, after: upd }),
        field('Title or group', b, 'sub', { hint: '(optional)' }));
    }
    return h('div', { class: 'row block' }, typeSel, h('div', { class: 'fields' }, f), rowButtons(item, bi, () => { redraw(); upd(); }));
  }

  /* ------------------------------------------------------------------
     Tab: Lower thirds
  ------------------------------------------------------------------ */
  function tabLower() {
    const lt = S.cfg.lowerThirds, list = lt.entries;
    const rows = h('div', { class: 'rows' });
    const draw = () => {
      rows.textContent = '';
      list.forEach((e, i) => rows.append(h('div', { class: 'row entry' },
        field('Item', e, 'item', { mode: 'numeric', ph: '8' }), field('Label', e, 'role', { ph: 'Speaker' }),
        field('Name', e, 'name'), field('Title or group', e, 'detail', { hint: '(optional)' }), rowButtons(list, i, draw))));
      if (!list.length) rows.append(h('p', { class: 'empty', text: 'No names yet.' }));
      updateChrome();
    };
    draw();
    return [
      ...head('Lower thirds', ['Names shown at the bottom of the live picture. Typing a program item number then Enter on the lower-third page shows that name. Saved in ', h('code', { text: 'config.json' }), '.']),
      h('section', { class: 'card' },
        h('div', { class: 'grid' }, field('Hide by itself after (seconds)', lt, 'autoHide', { type: 'number', hint: '(0 = stay until hidden)', max: 4 })),
        h('p', { class: 'hint', text: 'Songs with a hymn lower third (lyrics line by line) come from the Songs tab.' })),
      rows,
      h('div', { class: 'bar' },
        btn('+ Add a name', () => { list.push({ item: '', role: '', name: '', detail: '' }); touch(); draw(); }, 'primary'),
        btn('Fill from the program', () => {
          let added = 0;
          S.cfg.program.forEach((item, i) => item.forEach(b => {
            if (b._t === 'role' && (b.value || '').trim() && !list.some(e => e.name.trim() === b.value.trim() && String(e.item) === String(i + 1))) {
              list.push({ item: String(i + 1), role: b.label || '', name: b.value.trim(), detail: b.sub || '' }); added++;
            }
          }));
          if (added) { touch(); draw(); }
          toast(added ? added + ' name' + (added === 1 ? '' : 's') + ' added from the program.' : 'Every person in the program is already in the list.');
        }))
    ];
  }

  /* ------------------------------------------------------------------
     Tab: Songs
  ------------------------------------------------------------------ */
  const newSong = () => ({ id: '', title: '', composer: '', author: '', reference: '', singer: '', number: '', book: '', edition: '', sections: [{ label: 'Verse 1', lines: [] }], _order: '' });

  function parseLyrics(text) {
    const blocks = text.replace(/\r/g, '').split(/\n[ \t]*\n/).map(b => b.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim()));
    const out = []; let verse = 0;
    const HEAD = /^\s*(verse|stanza|chorus|cho|refrain|bridge|ending|end|intro|outro|tag)\b\.?\s*(\d+)?\s*[:.]?\s*(.*)$/i;
    blocks.forEach(lines => {
      if (!lines.length) return;
      let label = null, first = lines[0], m;
      if ((m = HEAD.exec(first)) && (!m[3] || /^(chorus|cho|refrain)/i.test(first))) {
        const w = m[1].toLowerCase();
        if (/^(chorus|cho|refrain)$/.test(w)) label = 'Chorus';
        else if (w === 'verse' || w === 'stanza') { label = 'Verse ' + (m[2] || (verse + 1)); verse = Number(m[2] || verse + 1); }
        else label = w.charAt(0).toUpperCase() + w.slice(1) + (m[2] ? ' ' + m[2] : '');
        lines = lines.slice(1);
        if (m[3]) lines.unshift(m[3]);
      } else if ((m = /^\s*(\d+)\s*[.)]\s*(.*)$/.exec(first))) {
        verse = Number(m[1]); label = 'Verse ' + verse; lines = lines.slice(1); if (m[2]) lines.unshift(m[2]);
      } else { verse += 1; label = 'Verse ' + verse; }
      if (lines.length) out.push({ label, lines });
    });
    return out;
  }

  function tabSongs() {
    const songs = S.songs.songs;
    if (S.sel >= songs.length) S.sel = songs.length - 1;
    if (S.sel < 0) S.sel = songs.length ? 0 : -1;
    const listBox = h('div', { class: 'scroll' });
    const editor = h('div');
    const drawList = () => {
      listBox.textContent = '';
      const q = S.filter.trim().toLowerCase();
      let shown = 0;
      songs.forEach((s, i) => {
        const t = s.title || 'Song ' + (i + 1);
        if (q && !(t + ' ' + s.number + ' ' + s.composer).toLowerCase().includes(q)) return;
        shown++;
        listBox.append(h('button', { type: 'button', class: 's', 'aria-current': String(i === S.sel), onclick: () => { S.sel = i; drawList(); drawEditor(); } },
          h('b', { text: t }), h('span', { text: [s.number ? 'No. ' + s.number : '', s.composer].filter(Boolean).join(' · ') || ' ' })));
      });
      if (!shown) listBox.append(h('p', { class: 'hint', style: 'padding:12px', text: songs.length ? 'No song matches.' : 'No songs yet.' }));
      updateChrome(); refreshTitles();
    };
    const drawEditor = () => {
      editor.textContent = '';
      if (S.sel < 0 || !songs[S.sel]) { editor.append(h('p', { class: 'empty', text: 'Add a song to start.' })); return; }
      editor.append(songForm(songs[S.sel], S.sel, drawList, drawEditor));
    };
    const search = h('input', { type: 'text', placeholder: 'Find a song…', value: S.filter, 'aria-label': 'Find a song' });
    search.addEventListener('input', () => { S.filter = search.value; drawList(); });
    drawList(); drawEditor();
    return [
      ...head('Songs', ['Hymns and songs for the lyrics pages and the lyrics lower third. Type each hymn exactly as it is in your hymn book, and only add songs your church may display. Saved in ', h('code', { text: 'songs.json' }), '.']),
      h('div', { class: 'songs' },
        h('div', { class: 'songlist' }, search, listBox,
          h('div', { class: 'bar', style: 'margin:0' },
            btn('+ New song', () => { songs.push(newSong()); S.sel = songs.length - 1; S.filter = ''; search.value = ''; touch(); drawList(); drawEditor(); }, 'primary small'),
            btn('Move ↑', () => { if (S.sel > 0 && move(songs, S.sel, -1)) { S.sel--; touch(); drawList(); } }, 'small'),
            btn('Move ↓', () => { if (S.sel >= 0 && move(songs, S.sel, 1)) { S.sel++; touch(); drawList(); } }, 'small'))),
        editor)
    ];
  }

  function songForm(s, si, drawList, drawEditor) {
    const upd = () => drawList();
    const secsBox = h('div');
    const idsHint = h('div', { class: 'chips2' });
    const drawIds = () => { idsHint.textContent = ''; buildSongsOne(s).forEach(id => idsHint.append(h('code', { text: id }))); };
    const drawSecs = () => {
      secsBox.textContent = '';
      s.sections.forEach((x, i) => {
        const ta = h('textarea', { rows: Math.max(4, x.lines.length + 1), spellcheck: 'false', 'aria-label': 'Lines of ' + (x.label || 'this part'), placeholder: 'One line of the song per row' });
        ta.value = x.lines.join('\n');
        ta.addEventListener('input', () => { x.lines = ta.value.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim()); touch(); drawIds(); });
        secsBox.append(h('div', { class: 'sec' },
          h('div', { class: 'top2' }, field('Part', x, 'label', { ph: 'Verse 1, Chorus, Bridge…', after: drawIds }),
            rowButtons(s.sections, i, () => { drawSecs(); drawIds(); })),
          ta));
      });
    };
    drawSecs(); drawIds();
    const importBtn = btn('Paste the whole song…', async () => {
      const ta = h('textarea', { placeholder: 'Verse 1\nFirst line\nSecond line\n\nChorus\nFirst line\n\n2.\nFirst line of verse 2' });
      const how = h('select', {}, h('option', { value: 'replace', text: 'Replace the parts below' }), h('option', { value: 'append', text: 'Add after the parts below' }));
      const ok = await ask('Paste the whole song', [
        h('p', { class: 'hint', text: 'Separate the parts with a blank line. A line such as “Verse 2”, “Chorus” or “Cho:” names the part; a part with no name is numbered as the next verse. A number at the start of a line (1. or 2)) also makes a verse.' }), ta, how],
        [{ label: 'Cancel', value: false }, { label: 'Split into parts', value: true, primary: true }]);
      if (!ok) return;
      const parts = parseLyrics(ta.value);
      if (!parts.length) { toast('Nothing to add.'); return; }
      if (how.value === 'replace') s.sections = parts; else s.sections.push(...parts);
      touch(); drawSecs(); drawIds(); toast(parts.length + ' part' + (parts.length === 1 ? '' : 's') + ' added.');
    });
    return h('div', {},
      h('section', { class: 'card' }, h('h2', { text: 'Song' }),
        h('div', { class: 'grid' },
          field('Title', s, 'title', { wide: true, after: upd }),
          field('Composer', s, 'composer'), field('Author of the words', s, 'author'),
          field('Bible reference or note', s, 'reference', { ph: '(Psalm 100)' }), field('Singer or group', s, 'singer', { hint: '(shown on the lyrics lower third)' })),
        h('p', { class: 'hint', style: 'margin-top:12px', text: 'Only for songs from a hymn book:' }),
        h('div', { class: 'grid', style: 'margin-top:6px' },
          field('Number', s, 'number', { after: upd, mode: 'numeric' }), field('Book', s, 'book'), field('Edition', s, 'edition')),
        h('div', { class: 'bar' },
          btn('Duplicate this song', () => { const d = clone(s); d.id = ''; d.title = (d.title || 'Song') + ' (copy)'; S.songs.songs.splice(si + 1, 0, d); S.sel = si + 1; touch(); drawList(); drawEditor(); }, 'small'),
          btn('Delete this song', async () => { if (await confirmBox('Delete this song?', '“' + (s.title || 'Untitled') + '” will be removed from the list. It is not removed from the files until you save.', 'Delete', true)) { S.songs.songs.splice(si, 1); S.sel = Math.min(si, S.songs.songs.length - 1); touch(); drawList(); drawEditor(); } }, 'small danger'))),
      h('section', { class: 'card' }, h('h2', { text: 'Lyrics' }),
        h('p', { class: 'hint', text: 'One part per box (verses, chorus…). Each row is one line shown on screen. In the lyrics pages the keys 1–9 jump to “Verse 1–9”, and C or 0 jumps to the chorus.' }),
        secsBox,
        h('div', { class: 'bar' },
          btn('+ Verse', () => { const n = s.sections.filter(x => /^verse/i.test(x.label)).length + 1; s.sections.push({ label: 'Verse ' + n, lines: [] }); touch(); drawSecs(); drawIds(); }, 'small'),
          btn('+ Chorus', () => { s.sections.push({ label: 'Chorus', lines: [] }); touch(); drawSecs(); drawIds(); }, 'small'),
          btn('+ Other part', () => { s.sections.push({ label: 'Bridge', lines: [] }); touch(); drawSecs(); drawIds(); }, 'small'),
          importBtn)),
      h('section', { class: 'card' }, h('h2', { text: 'Play order' }), h('p', { class: 'hint' }, 'Optional. To repeat a chorus without typing it again, list the part names in the order they are sung, for example ', h('code', { text: 'v1, c, v2, c' }), '. Leave empty to sing the parts in the order above.'),
        h('div', { class: 'grid' }, field('Order', s, '_order', { ph: 'v1, c, v2, c', after: () => {} })), h('p', { class: 'hint', style: 'margin-top:10px', text: 'Part names you can use:' }), idsHint));
  }

  /* ------------------------------------------------------------------
     Tab: Files & preview
  ------------------------------------------------------------------ */
  function tabFiles() {
    const src = k => origin[k] === 'file' ? h('span', { class: 'badge ok', text: 'the file in the folder' }) : origin[k] === 'browser' ? h('span', { class: 'badge warn', text: 'the copy saved in this browser' }) : h('span', { class: 'badge', text: 'a blank start' });
    const pages = [
      ['index.html', 'Program slideshow', 'The order of service'], ['banner.html', 'Main banner', 'Wall screen before and after'],
      ['lyrics.html', 'Lyrics', 'One line at a time'], ['lowerthird.html', 'Name lower third', 'Names over live video'],
      ['lyrics-lowerthird.html', 'Lyrics lower third', 'Hymn lines over live video'], ['help.html', 'Help', 'Keys and setup']
    ];
    const cText = toText(buildConfig()), sText = toText(buildSongs());
    return [
      ...head('Files & preview', 'All the data is stored in two JSON files. Here you save them, connect your folder, and open the pages to see your changes.'),
      problemsBox(),
      h('section', { class: 'card' }, h('h2', { text: 'Where the data lives' }),
        h('dl', { class: 'kv' },
          h('dt', { text: 'config.json' }), h('dd', {}, 'Loaded from ', src('config'), '. Church, event, colours, program, lower-third names.'),
          h('dt', { text: 'songs.json' }), h('dd', {}, 'Loaded from ', src('songs'), '. Hymns and songs.'),
          h('dt', { text: 'Folder' }), h('dd', { text: dirHandle ? 'Connected: ' + dirHandle.name + ' — Save writes both files straight into it.' : FSA ? 'Not connected. Connect the project folder so Save writes the files directly.' : 'Your browser cannot write to a folder. Use Download files, then copy the two files into the project folder (Chrome or Edge can connect a folder).' })),
        h('div', { class: 'bar' },
          FSA ? btn(dirHandle ? 'Change folder' : (pendingHandle ? 'Reconnect folder' : 'Connect folder'), connectFolder, 'primary') : null,
          btn('Save', save, dirHandle ? '' : 'primary'),
          btn('Download config.json', () => download('config.json', cText)), btn('Download songs.json', () => download('songs.json', sText)),
          btn('Import files…', () => $('#importInput').click()))),
      h('section', { class: 'card' }, h('h2', { text: 'Open the pages' }), h('p', { class: 'hint', text: 'Pages open in a new tab and show the data you last saved. Reload a page (F5) after saving again.' }),
        h('div', { class: 'links' }, pages.map(([f, t, d]) => h('a', { href: f, target: '_blank', rel: 'noopener' }, h('b', { text: t }), h('span', { text: d }))))),
      h('section', { class: 'card' }, h('h2', { text: 'Start over' }),
        h('div', { class: 'bar', style: 'margin-top:0' },
          btn('Discard unsaved changes', discard, 'danger'),
          btn('Start a blank project', blank, 'danger'))),
      h('section', { class: 'card' }, h('h2', { text: 'What will be saved' }), h('p', { class: 'hint', text: 'A look at the two JSON files exactly as they will be written.' }),
        h('h3', { text: 'config.json', style: 'font-size:14px;margin:12px 0 6px' }), h('pre', { class: 'json', text: cText }),
        h('h3', { text: 'songs.json', style: 'font-size:14px;margin:12px 0 6px' }), h('pre', { class: 'json', text: sText }))
    ];
  }
  function problemsBox() {
    const p = problems();
    return p.length ? h('div', { class: 'warn' }, h('b', { text: 'Worth a look before you save:' }), h('ul', {}, p.slice(0, 12).map(x => h('li', { text: x })), p.length > 12 ? h('li', { text: '…and ' + (p.length - 12) + ' more.' }) : null)) : h('p', { class: 'hint', style: 'margin-bottom:14px', text: '✓ Nothing looks wrong.' });
  }

  const renderers = { church: tabChurch, colours: tabColours, program: tabProgram, lower: tabLower, songs: tabSongs, files: tabFiles };

  function refreshTitles() {
    const dl = $('#songtitles') || document.body.appendChild(h('datalist', { id: 'songtitles' }));
    dl.textContent = '';
    S.songs.songs.forEach(s => { if (s.title) dl.append(h('option', { value: s.title })); });
  }

  /* ------------------------------------------------------------------
     Saving, folder, import
  ------------------------------------------------------------------ */
  let dirHandle = null, pendingHandle = null;

  function idb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('clhp-editor', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  const idbGet = k => idb().then(db => new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
  const idbSet = (k, v) => idb().then(db => new Promise((res, rej) => { const q = db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); q.onsuccess = () => res(); q.onerror = () => rej(q.error); }));

  async function writeFile(name, text) {
    const fh = await dirHandle.getFileHandle(name, { create: true });
    const w = await fh.createWritable(); await w.write(text); await w.close();
  }
  async function readFile(name) {
    try { const fh = await dirHandle.getFileHandle(name); return await (await fh.getFile()).text(); } catch (e) { return null; }
  }

  async function save() {
    const cText = toText(buildConfig()), sText = toText(buildSongs());
    if (dirHandle) {
      try {
        if ((await dirHandle.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await dirHandle.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('Permission to write to the folder was not given.');
        await writeFile('config.json', cText); await writeFile('songs.json', sText);
        ChurchData.putText('config', cText); ChurchData.putText('songs', sText);
        dirty = false; savedWhere = 'folder'; savedAt = new Date(); origin.config = origin.songs = 'file';
        toast('Saved config.json and songs.json to the folder “' + dirHandle.name + '”.');
        updateChrome(); if (S.tab === 'files') render();
        return;
      } catch (e) { toast('Could not write to the folder: ' + (e.message || e) + ' Saving in this browser instead.'); }
    }
    const cs = ChurchData.readStore('config'), ss = ChurchData.readStore('songs');
    const ok1 = ChurchData.writeStore('config', cText, cs ? cs.fileText : null);
    const ok2 = ChurchData.writeStore('songs', sText, ss ? ss.fileText : null);
    if (!ok1 || !ok2) { toast('Your browser would not keep the data. Use Download files instead.'); return; }
    dirty = false; savedWhere = 'browser'; savedAt = new Date();
    origin.config = origin.songs = 'browser';
    toast(FSA ? 'Saved in this browser. Connect the folder (or download the files) to update the files themselves.' : 'Saved in this browser. Download the files and copy them into the project folder to keep them.');
    updateChrome(); if (S.tab === 'files') render();
  }

  function download(name, text) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function loadTexts(cText, sText, from) {
    if (cText != null) { S.cfg = normalizeConfig(ChurchData.parseConfig(cText)); origin.config = from; }
    if (sText != null) { S.songs = normalizeSongs(JSON.parse(sText)); origin.songs = from; }
    S.sel = 0; dirty = false; savedWhere = '';
    ChurchData.applyTheme(S.cfg);
    refreshTitles(); render();
  }

  async function connectFolder() {
    try {
      if (!dirHandle && pendingHandle) {
        if ((await pendingHandle.requestPermission({ mode: 'readwrite' })) === 'granted') { dirHandle = pendingHandle; pendingHandle = null; toast('Folder “' + dirHandle.name + '” reconnected.'); updateChrome(); if (S.tab === 'files') render(); return; }
      }
      const dh = await window.showDirectoryPicker({ mode: 'readwrite', id: 'clhp-project' });
      dirHandle = dh; pendingHandle = null;
      await idbSet('dir', dh).catch(() => {});
      const c = await readFile('config.json'), s = await readFile('songs.json');
      if (c == null && s == null) { toast('Folder “' + dh.name + '” connected. It has no data files yet — Save will create them.'); }
      else {
        const use = !dirty || await confirmBox('Load the files from the folder?', 'The folder “' + dh.name + '” has ' + [c != null ? 'config.json' : null, s != null ? 'songs.json' : null].filter(Boolean).join(' and ') + '. Loading replaces what you are editing now, including unsaved changes.', 'Load the files');
        if (use) {
          try { loadTexts(c, s, 'file'); if (c != null) ChurchData.putText('config', c); if (s != null) ChurchData.putText('songs', s); toast('Loaded from the folder “' + dh.name + '”.'); }
          catch (e) { toast('A file in the folder could not be read: ' + (e.message || e)); }
        }
      }
      updateChrome(); if (S.tab === 'files') render();
    } catch (e) { if (e && e.name !== 'AbortError') toast('Could not connect the folder: ' + (e.message || e)); }
  }

  async function importFiles(files) {
    const list = [...files];
    if (!list.length) return;
    if (dirty && !(await confirmBox('Replace what you are editing?', 'Importing replaces your unsaved changes.', 'Import'))) return;
    let c = null, s = null;
    for (const f of list) {
      const text = await f.text();
      let obj; try { obj = JSON.parse(text); } catch (e) { toast(f.name + ' is not valid JSON: ' + e.message); return; }
      if (Array.isArray(obj.songs) || /song/i.test(f.name)) s = text; else c = text;
    }
    try { loadTexts(c, s, 'file'); toast('Imported. Press Save to keep it.'); dirty = true; updateChrome(); }
    catch (e) { toast('Could not read the file: ' + (e.message || e)); }
  }

  async function discard() {
    if (!(await confirmBox('Discard unsaved changes?', 'Everything you changed since the last save is lost.', 'Discard', true))) return;
    const [c, s] = await Promise.all([ChurchData.resolveText('config').catch(() => null), ChurchData.resolveText('songs').catch(() => null)]);
    try { loadTexts(c ? c.text : toText(ChurchData.defaults().config), s ? s.text : toText(ChurchData.defaults().songs), 'file'); if (c) origin.config = c.source; if (s) origin.songs = s.source; toast('Changes discarded.'); render(); }
    catch (e) { toast('Could not reload: ' + (e.message || e)); }
  }
  async function blank() {
    if (!(await confirmBox('Start a blank project?', 'This empties the church details, program, lower-third names and songs in the editor. The files are not changed until you press Save.', 'Start blank', true))) return;
    const d = ChurchData.defaults();
    S.cfg = normalizeConfig(d.config); S.songs = normalizeSongs(d.songs); S.sel = -1;
    origin.config = origin.songs = ''; dirty = true; savedWhere = '';
    ChurchData.applyTheme(S.cfg); refreshTitles(); render();
  }

  /* ------------------------------------------------------------------
     Start
  ------------------------------------------------------------------ */
  async function start() {
    const [c, s] = await Promise.all([ChurchData.resolveText('config').catch(() => null), ChurchData.resolveText('songs').catch(() => null)]);
    S.cfg = normalizeConfig(c ? ChurchData.parseConfig(c.text) : clone(window.CHURCH_CONFIG));
    origin.config = c ? c.source : '';
    try { S.songs = normalizeSongs(s ? JSON.parse(s.text) : null); origin.songs = s ? s.source : ''; }
    catch (e) { S.songs = normalizeSongs(null); toast('songs.json could not be read (' + e.message + '). Starting with an empty list.'); }
    if (!s) toast('songs.json was not found. Connect the folder or import the file to load your songs.');
    if (FSA) {
      try {
        const hd = await idbGet('dir');
        if (hd) { const p = await hd.queryPermission({ mode: 'readwrite' }); if (p === 'granted') dirHandle = hd; else pendingHandle = hd; }
      } catch (e) { /* ignore */ }
    }
    const t = location.hash.slice(1);
    S.tab = renderers[t] ? t : 'church';
    refreshTitles();
    render();
  }

  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { go(b.dataset.tab); window.scrollTo(0, 0); } });
  $('#btnSave').addEventListener('click', save);
  $('#btnConnect').addEventListener('click', connectFolder);
  $('#importInput').addEventListener('change', e => { importFiles(e.target.files); e.target.value = ''; });
  window.addEventListener('hashchange', () => { const t = location.hash.slice(1); if (renderers[t] && t !== S.tab) go(t); });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); save(); } });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  start();
});
