/* Help page — search, contents highlight, theme.  / search · T theme · P print */
(function () {
  'use strict';
  var root = document.documentElement;
  var q = document.getElementById('q');
  var count = document.getElementById('count');
  var sections = [].slice.call(document.querySelectorAll('[data-section]'));
  var links = [].slice.call(document.querySelectorAll('.toc a'));

  /* ---------- Theme ---------- */
  function pref() { try { return localStorage.getItem('help-theme'); } catch (e) { return null; } }
  var t = pref() || ((window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
  root.setAttribute('data-theme', t);
  function toggleTheme() {
    t = t === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('help-theme', t); } catch (e) { /* ignore */ }
  }

  /* ---------- Search ---------- */
  function clearMarks(node) {
    [].slice.call(node.querySelectorAll('mark')).forEach(function (m) {
      var p = m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize();
    });
  }
  function markText(node, term) {
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    var hits = [], n;
    while ((n = walker.nextNode())) {
      if (n.parentNode.closest('kbd, code, pre, mark')) continue;
      if (n.nodeValue.toLowerCase().indexOf(term) > -1) hits.push(n);
    }
    hits.forEach(function (tn) {
      var text = tn.nodeValue, low = text.toLowerCase(), i = 0, frag = document.createDocumentFragment(), at;
      while ((at = low.indexOf(term, i)) > -1) {
        frag.appendChild(document.createTextNode(text.slice(i, at)));
        var m = document.createElement('mark'); m.textContent = text.slice(at, at + term.length); frag.appendChild(m);
        i = at + term.length;
      }
      frag.appendChild(document.createTextNode(text.slice(i)));
      tn.parentNode.replaceChild(frag, tn);
    });
  }

  function search() {
    var term = q.value.trim().toLowerCase();
    var total = 0;
    sections.forEach(function (sec) {
      clearMarks(sec);
      var items = [].slice.call(sec.querySelectorAll('[data-s]'));
      var title = (sec.querySelector('h2') || {}).textContent || '';
      if (!term) { items.forEach(function (i) { i.classList.remove('hide'); }); sec.classList.remove('hide'); return; }
      var titleHit = title.toLowerCase().indexOf(term) > -1;
      var any = false;
      if (items.length) {
        items.forEach(function (it) {
          var hit = it.textContent.toLowerCase().indexOf(term) > -1;
          it.classList.toggle('hide', !hit && !titleHit);
          if (hit) { any = true; total++; markText(it, term); }
        });
        if (titleHit && !any) total++;
      } else {
        // prose-only section: match against its whole text
        any = sec.textContent.toLowerCase().indexOf(term) > -1;
        if (any) { total++; [].slice.call(sec.querySelectorAll('p, li')).forEach(function (el) { markText(el, term); }); }
      }
      sec.classList.toggle('hide', !any && !titleHit);
    });
    count.textContent = term ? (total ? total + (total === 1 ? ' match' : ' matches') : 'No matches') : '';
  }
  q.addEventListener('input', search);

  /* ---------- Contents highlight ---------- */
  function onScroll() {
    var y = window.scrollY + 120, cur = null;
    sections.forEach(function (s) { if (!s.classList.contains('hide') && s.offsetTop <= y) cur = s.id; });
    links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Keys ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var typing = document.activeElement === q;
    if (e.key === 'Escape' && typing) { q.value = ''; search(); q.blur(); return; }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); q.focus(); q.select(); }
    else if (e.key === 't' || e.key === 'T') toggleTheme();
    else if (e.key === 'p' || e.key === 'P') window.print();
  });
})();
