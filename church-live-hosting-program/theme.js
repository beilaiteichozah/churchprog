/* Shared by every page: applies the colours from config.js, sets the page
   title, and offers a few helpers (date, details, headline). */
(function () {
  'use strict';

  var C = window.CHURCH_CONFIG || {};
  var church = C.church || {};
  var event = C.event || {};
  var labels = C.labels || {};
  var theme = C.theme || {};

  /* ---------- Colours ---------- */
  var PRESETS = {
    navy:     { base: '#1e2440', baseDeep: '#171d37', slate: '#3f4a68', accent: '#2f8a8f', accentLight: '#5fa3ab', highlight: '#e8b44c' },
    forest:   { base: '#1c3b30', baseDeep: '#142b23', slate: '#3d5b4e', accent: '#3f9a73', accentLight: '#7cc3a0', highlight: '#e3b448' },
    burgundy: { base: '#3a1a28', baseDeep: '#2b121e', slate: '#5a3446', accent: '#c0566f', accentLight: '#dc98a6', highlight: '#e8b44c' },
    charcoal: { base: '#22262b', baseDeep: '#181b1f', slate: '#454b54', accent: '#3d8fb0', accentLight: '#7ab6d0', highlight: '#f0b94f' }
  };
  var pal = {};
  var base = PRESETS[theme.preset] || PRESETS.navy;
  Object.keys(base).forEach(function (k) { pal[k] = base[k]; });
  var custom = theme.colors || {};
  Object.keys(custom).forEach(function (k) { if (custom[k] && pal.hasOwnProperty(k)) pal[k] = custom[k]; });

  var root = document.documentElement;
  var map = { base: '--navy', baseDeep: '--navy-deep', slate: '--slate', accent: '--teal', accentLight: '--teal-light', highlight: '--gold' };
  Object.keys(map).forEach(function (k) { root.style.setProperty(map[k], pal[k]); });
  root.style.setProperty('--ui-line', pal.slate);
  root.style.setProperty('--rule', pal.slate);
  if (C.locale) root.setAttribute('lang', C.locale);

  /* ---------- Page title: "Page · Church name" ---------- */
  if (church.name) document.title = document.title.replace(/\s*·\s*$/, '') + ' · ' + church.name;

  /* ---------- Helpers ---------- */
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

  window.CHURCH_UTIL = {
    cfg: C,
    church: church,
    event: event,
    /* the headline as an array of 1-2 lines */
    headline: function () {
      var h = event.headline;
      if (typeof h === 'string') h = [h];
      return (h && h.length) ? h : [church.name || ''];
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
      return {
        day: ordinal(d.getDate()),
        month: fmt({ month: 'long' }),
        year: String(d.getFullYear()),
        full: this.dateText()
      };
    },
    /* rows for the details slide and banner. null = a gap between groups. */
    details: function () {
      var rows = [];
      if (event.date || event.dateText) rows.push([labels.date || 'Date', this.dateText()]);
      if (event.venue) rows.push([labels.venue || 'Venue', event.venue]);
      if (event.time) rows.push([labels.time || 'Time', event.time]);
      var extra = (event.details || []).filter(function (r) { return r && r[1]; });
      if (extra.length) { rows.push(null); extra.forEach(function (r) { rows.push([r[0], r[1]]); }); }
      return rows;
    }
  };
})();
