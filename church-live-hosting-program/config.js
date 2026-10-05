/* ====================================================================
   Church Live Hosting Program — the ONE file to edit for your church.

   Change the words between the quote marks, save, then press F5 in the
   browser. Songs are in songs.json (see the README or the Help page).
   Everything below is sample content: replace it with your own.
   ==================================================================== */
window.CHURCH_CONFIG = {

  /* Language of the date and the page text, e.g. 'en', 'fr', 'es', 'sw', 'hi'. */
  locale: 'en',

  /* ---------- Your church ---------- */
  church: {
    name: 'Grace Community Church',
    place: '12 Main Street, Springfield'
  },

  /* ---------- This service or event ----------
     headline : big title on the slideshow and the banner. One or two lines.
     connector: small word between the headline and the title, e.g. 'and' or '&'.
                Leave '' for none.
     title    : the smaller line under the headline.
     date     : YYYY-MM-DD. It is written out in the language above.
                (Optional dateText replaces the written date, e.g. 'Sunday, 4 October 2026'.)
     time, venue : shown on the slideshow title slide and on the banner.
     details  : extra rows for the details slide and the banner,
                each ['Label', 'Value'].                                  */
  event: {
    headline: ['Sunday Morning', 'Worship Service'],
    connector: '',
    title: 'A Service of Praise and Thanksgiving',
    date: '2026-10-04',
    dateText: '',
    time: '10:00 am – 12:00 noon',
    venue: 'Main Sanctuary',
    details: [
      ['Host', 'Pastor Sample Name'],
      ['Worship leader', 'Sample Leader']
    ]
  },

  /* Words used for the three standard rows. Change them to translate. */
  labels: { date: 'Date', venue: 'Venue', time: 'Time' },

  /* ---------- Colours ----------
     preset: 'navy' (default), 'forest', 'burgundy' or 'charcoal'.
     colors: optional. Change any of these to use your own church colours:
       base         main background          baseDeep   darker panels
       slate        secondary shade          accent     second colour (cross, bars)
       accentLight  lighter shade of accent  highlight  headings and highlights
     Example:  colors: { highlight: '#f2c14e', accent: '#1f8a70' }       */
  theme: {
    preset: 'navy',
    colors: {}
  },

  /* ---------- Program, one entry per item ----------
     Each item is a list of blocks. A block is one of:
       { label: 'Role', value: 'Person or hymn', sub: 'Title or group', hymn: true }
       { text: 'A plain line', note: 'A small italic note under it' }
     An item with more than one block is shown a little smaller.
     Typing the item number then Enter jumps to it on the slideshow.   */
  program: [
    [{ text: 'Welcome and call to worship' }],
    [{ label: 'Opening hymn', value: 'Sample Hymn One', hymn: true }],
    [{ label: 'Opening prayer', value: 'Elder Sample Name', sub: 'Church elder' }],
    [{ label: 'Scripture reading', value: 'Sample Reader', sub: 'Psalm 100' }],
    [{ label: 'Choir', value: 'Grace Community Choir' }],
    [{ label: 'Announcements', value: 'Sample Name', sub: 'Church secretary' }],
    [{ label: 'Hymn', value: 'Sample Hymn Two', hymn: true }],
    [{ label: 'Sermon', value: 'Pastor Sample Name', sub: 'Senior Pastor' },
     { text: 'Sample sermon theme' }],
    [{ label: 'Special song', value: 'Youth Group' }],
    [{ label: 'Offering and thanksgiving', value: 'Deacon Sample Name' }],
    [{ label: 'Closing hymn', value: 'Sample Hymn Three', hymn: true }],
    [{ label: 'Benediction', value: 'Pastor Sample Name' }]
  ],

  /* ---------- Name lower thirds (names over live video) ----------
     role   : small label on top (Speaker, Singer, Choir…).
     name   : the large line.
     detail : optional smaller line (title, group or church).
     item   : program item number, so typing the number then Enter shows it.
     autoHide: seconds before the graphic hides itself (0 = stay until hidden). */
  lowerThirds: {
    autoHide: 10,
    entries: [
      { item: 1,  role: 'Welcome',          name: 'Pastor Sample Name',     detail: 'Senior Pastor' },
      { item: 3,  role: 'Prayer',           name: 'Elder Sample Name',      detail: 'Church elder' },
      { item: 4,  role: 'Scripture',        name: 'Sample Reader',          detail: 'Psalm 100' },
      { item: 5,  role: 'Choir',            name: 'Grace Community Choir',  detail: '' },
      { item: 6,  role: 'Announcements',    name: 'Sample Name',            detail: 'Church secretary' },
      { item: 8,  role: 'Speaker',          name: 'Pastor Sample Name',     detail: 'Senior Pastor' },
      { item: 9,  role: 'Special song',     name: 'Youth Group',            detail: '' },
      { item: 10, role: 'Offering',         name: 'Deacon Sample Name',     detail: '' },
      { item: 12, role: 'Benediction',      name: 'Pastor Sample Name',     detail: 'Senior Pastor' }
    ]
  }
};
