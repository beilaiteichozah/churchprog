/* Home page — fills the heading from config.json.
   Shortcut keys: E opens the Editor, 1–5 open a page, H opens Help. */
ChurchData.ready(function () {
  'use strict';
  var U = window.CHURCH_UTIL;
  function $(id) { return document.getElementById(id); }

  $('church').textContent = U.church.name || '';
  $('place').textContent = U.church.place || '';
  $('place').hidden = !U.church.place;

  var h1 = $('headline');
  U.headline().slice(0, 2).forEach(function (t) {
    var s = document.createElement('span'); s.textContent = t; h1.appendChild(s);
  });

  var conn = U.event.connector || '';
  $('connectorText').textContent = conn; $('connector').hidden = !conn;
  var title = U.event.title || '';
  $('program').textContent = title; $('program').hidden = !title;

  var dp = U.dateParts();
  if (dp) {
    $('plateDay').textContent = dp.day; $('plateMonth').textContent = dp.month; $('plateYear').textContent = dp.year;
    $('cross').setAttribute('aria-label', dp.full);
  } else {
    $('plate').hidden = true;
  }

  /* Date, venue and time (the rows before the first gap) */
  var facts = $('facts');
  U.details().some(function (row) {
    if (!row) return true;
    var f = document.createElement('div');
    var dt = document.createElement('dt'); dt.textContent = row[0];
    var dd = document.createElement('dd'); dd.textContent = row[1];
    f.appendChild(dt); f.appendChild(dd); facts.appendChild(f);
    return false;
  });
  facts.hidden = !facts.children.length;

  /* ---------- Shortcut keys ---------- */
  var links = {};
  [].slice.call(document.querySelectorAll('a[data-key]')).forEach(function (a) {
    links[a.getAttribute('data-key')] = a.getAttribute('href');
  });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    var href = links[e.key.toLowerCase()];
    if (!href) return;
    e.preventDefault();
    window.location.href = href;
  });
});
