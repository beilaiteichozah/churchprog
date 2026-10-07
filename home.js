/* Home page — shortcut keys: 1–5 open a page, H opens Help. */
(function () {
  'use strict';

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
})();
