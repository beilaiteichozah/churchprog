# Church Live Hosting Program

Keyboard-operated, offline display pages for running a church service or event on a projector and on live video. Any church can use it: edit **one configuration file** and **one songs file**, and the program slideshow, the banner, the lyrics and the lower-third graphics all follow.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no internet connection needed. Everything is controlled from the keyboard (or a presenter clicker), so there are no buttons or bars on the projector screen.

> The folder ships with **sample content** (a made-up church, program, names and three sample hymns). Replace it with your own.

---

## Contents

- [What is in the box](#what-is-in-the-box)
- [Quick start](#quick-start)
- [Make it your church's: `config.js`](#make-it-your-churchs-configjs)
- [Songs and hymns: `songs.json`](#songs-and-hymns-songsjson)
- [Colours and themes](#colours-and-themes)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Live video: the lower thirds](#live-video-the-lower-thirds)
- [Another language](#another-language)
- [Printing](#printing)
- [What the pages remember](#what-the-pages-remember)
- [Project structure](#project-structure)
- [Browser support](#browser-support)
- [Service-day checklist](#service-day-checklist)
- [Troubleshooting](#troubleshooting)
- [Copyright](#copyright)

---

## What is in the box

| Page | File | What it is for |
| --- | --- | --- |
| Program slideshow | `index.html` | The order of service, one program item per slide, with a title slide, a details slide and a closing slide. |
| Main banner | `banner.html` | A poster-style screen for the wall before the service starts and after it ends: church, title, big date plate and details. |
| Song lyrics | `lyrics.html` | One lyric line at a time for the congregation, with the song title on top and the hymn number at the bottom right. |
| Name lower third | `lowerthird.html` | A name graphic (speaker, singer, choir…) for the bottom of a live picture, with a transparent background. |
| Lyrics lower third | `lyrics-lowerthird.html` | The lyrics, one line at a time, in a bar at the bottom of a live picture while a singer or choir sings. |
| Help | `help.html` | The full on-screen guide: shortcut keys, setup, troubleshooting. Searchable and printable. |

All screens are designed for a **16:9 projector (1920 × 1080)**. On other shapes they keep their proportions and add bars at the sides; text is never stretched.

---

## Quick start

1. Download or copy this folder and keep **all files together** (it also runs from a USB stick).
2. Open `index.html` in Chrome or Edge by double-clicking it.
3. Move the window to the projector screen and press **F** for fullscreen.
4. Move on with **→** or **Space**; go back with **←**.
5. Open `config.js` in any text editor (Notepad is fine), change the sample words to yours, save, and press **F5** in the browser.

**Lyrics pages and `songs.json`.** Browsers do not let a page read `songs.json` straight from a folder (`file://`). The lyrics pages then ask you to choose the file once (or drag it onto the page; press **O** any time) and remember it. If you edit `songs.json`, choose it again, or serve the folder so the newest file is always read:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/lyrics.html
```

Any static web server works. Nothing is loaded from the internet.

Press **H** on any page for the Help page, or **?** for a quick key list.

---

## Make it your church's: `config.js`

`config.js` is the one file to edit for your church. The slideshow, the banner and the name lower third are all built from it.

```js
window.CHURCH_CONFIG = {
  locale: 'en',                                   // language of the written date

  church: { name: 'Grace Community Church', place: '12 Main Street, Springfield' },

  event: {
    headline: ['Sunday Morning', 'Worship Service'],   // big title, one or two lines
    connector: '',                                     // small word between headline and title, or ''
    title: 'A Service of Praise and Thanksgiving',
    date: '2026-10-04',                                // YYYY-MM-DD
    dateText: '',                                      // optional: replaces the written date
    time: '10:00 am – 12:00 noon',
    venue: 'Main Sanctuary',
    details: [['Host', 'Pastor Sample Name'], ['Worship leader', 'Sample Leader']]
  },

  labels: { date: 'Date', venue: 'Venue', time: 'Time' },

  theme: { preset: 'navy', colors: {} },

  program: [ /* one entry per item, see below */ ],

  lowerThirds: { autoHide: 10, entries: [ /* names over live video, see below */ ] }
};
```

| Setting | What it does |
| --- | --- |
| `locale` | Language of the written date (`'en'`, `'fr'`, `'es'`, `'sw'`, `'hi'`…). |
| `church.name`, `church.place` | Shown on every page. |
| `event.headline` | The big title. One or two lines. Long lines shrink to fit. |
| `event.connector` | A small word between the headline and the title (for example `'and'` or `'&'`). Leave `''` for none. |
| `event.title` | The line under the headline. Leave `''` for none. |
| `event.date` | `YYYY-MM-DD`. Written out in your language, and shown big on the banner. |
| `event.time`, `event.venue` | Shown on the title slide, the details slide and the banner. |
| `event.details` | Extra rows `['Label', 'Value']` for the details slide and the banner (host, chairman, worship leader…). |
| `labels` | The words for Date, Venue and Time. Change them to translate. |
| `theme` | A colour preset and optional custom colours. See [Colours and themes](#colours-and-themes). |
| `program` | The items of the service. |
| `lowerThirds` | The names shown over live video. |

### Program items

Each item is a list of blocks. An item with more than one block is shown a little smaller so everything fits. Typing the item number then **Enter** jumps to it on the slideshow.

```js
// a role and a person (sub is optional)
{ label: 'Scripture reading', value: 'Sample Reader', sub: 'Psalm 100' }

// a hymn title, shown in a lighter weight
{ label: 'Opening hymn', value: 'Sample Hymn One', hymn: true }

// a plain line, with an optional small note under it
{ text: 'Welcome and call to worship', note: 'Please stand' }
```

### Name lower thirds

```js
{ item: 8, role: 'Speaker', name: 'Pastor Sample Name', detail: 'Senior Pastor' }
```

`role` is the small label (Speaker, Singer, Choir, Prayer…), `name` the large line, `detail` an optional smaller line, and `item` the program item number so that typing the number then **Enter** shows it. `autoHide` is the seconds before the graphic hides itself (`0` = stay until hidden). Long names shrink to fit and then wrap, so nothing is cut off.

---

## Songs and hymns: `songs.json`

Songs are plain data, so adding a hymn never needs code changes. Each song needs a `title` and `sections`. Everything else is optional, so a song that is not from a hymn book needs no number, book or edition.

```json
{
  "songs": [
    {
      "id": "my-song",
      "title": "Song title",
      "composer": "Name of the composer",
      "sections": [
        { "id": "v1", "label": "Verse 1", "lines": ["First line", "Second line"] },
        { "id": "c",  "label": "Chorus",  "lines": ["First line", "Second line"] },
        { "id": "v2", "label": "Verse 2", "lines": ["First line", "Second line"] }
      ]
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `title` | Shown large at the top. **Required.** Very long titles shrink to fit. |
| `sections` | **Required.** A list of `{ "label": "...", "lines": [...] }`. The label shows at the bottom left. |
| `composer` | Shown under the title as "Composer: …". |
| `author` | A small line under the title for the writer of the words. |
| `reference` | A Bible reference or other note, e.g. `"(Psalm 100)"`. |
| `number` | For hymn-book songs: shown in the badge at the bottom right and used by **S**, *number*, **Enter**. |
| `book`, `edition` | Book name and edition beside the number. A song with an edition but no number shows the edition only. |
| `singer` | A singer or group name for the top row of the lyrics lower third. |
| `id` (song) | A unique short name. |
| `id` (section) and `order` | To repeat a chorus without retyping it, give each section an `id` and add `"order": ["v1", "c", "v2", "c"]` to the song. |
| `label` / `kind` / `verse` | The jump keys find parts from the label: `Verse 2` is verse 2; a label containing `Chorus` or `Refrain` is the chorus. For other names add `"verse": 2` or `"kind": "chorus"` to the section. |

Tips:

- Type each hymn **exactly as it is in your hymn book or song sheet**, and only use songs your church is allowed to display (public-domain hymns, or songs covered by your church's licence such as CCLI).
- For a very long line, split it into two lines.
- Check commas and quote marks. One missing comma makes the whole file unreadable; the page tells you what is wrong.

The three songs in the folder are **original sample texts** written only to show the format.

---

## Colours and themes

Choose a preset in `config.js`:

| Preset | Look |
| --- | --- |
| `navy` (default) | Deep navy with teal and gold. |
| `forest` | Deep green with soft green and gold. |
| `burgundy` | Deep burgundy with rose and gold. |
| `charcoal` | Charcoal with blue and amber. |

Use your own colours by adding any of these to `theme.colors`:

```js
theme: { preset: 'navy', colors: { highlight: '#f2c14e', accent: '#1f8a70' } }
```

| Key | Used for |
| --- | --- |
| `base` | Main background. |
| `baseDeep` | Darker panels. |
| `slate` | Secondary shade and lines. |
| `accent` | Second colour (cross arms, side panels, bars). |
| `accentLight` | Lighter shade of the accent. |
| `highlight` | Headings, labels and highlights. |

Dark navy is the default because it suits a dim hall. **T** switches the slideshow and lyrics to a light theme, and the lower thirds between a dark and a light plate. **M** switches between full animation and simple fades (the pages also follow the computer's reduced-motion setting).

---

## Keyboard shortcuts

Click once on the page first so the browser window has focus. The built-in Help page (`help.html`) has the complete lists; the main keys are below.

### Everywhere

| Key | Action |
| --- | --- |
| **F** | Fullscreen on/off |
| **H** | Open the Help page |
| **?** | Quick list of keys |
| **Esc** | Close a list, or leave the black screen |
| **B** or **.** | Black screen on/off (slideshow and lyrics) |
| **T** | Dark / light theme (plate on the lower thirds) |
| **M** | Full / reduced animation |
| **C** | Show/hide the small controls bar on the slideshow (**Shift + C** on the lyrics page) |

### Program slideshow

| Key | Action |
| --- | --- |
| **→ ↓ Space PgDn Enter** | Next slide |
| **← ↑ Backspace PgUp** | Previous slide |
| **Home / End** | First / last slide |
| *number*, then **Enter** | Jump to that program item |
| **G** or **O** | Program list |
| **P** | Print / save as PDF |

### Song lyrics

| Key | Action |
| --- | --- |
| **→ ↓ Space PgDn Enter** / **← ↑ Backspace PgUp** | Next / previous line |
| **Shift + → / ←** | Next verse / back to the start of the verse |
| **Home / End** | First / last line |
| **N / P** | Next / previous song |
| **1 … 9** | Jump to that verse (repeat an earlier verse) |
| **C** or **0** | Jump to the chorus |
| **J** | List of every part of the song |
| **S**, *number*, **Enter** | Jump to the song with that hymn number |
| **G** | Song list |
| **L** | Focus view / one-line view |
| **O** | Choose a `songs.json` file (or drag it onto the page) |

### Banner

**F** fullscreen · **R** or **Space** replay the opening animation · **P** print · **H** help.

### Name lower third

| Key | Action |
| --- | --- |
| **Space** or **Enter** | Show the selected name, or hide it |
| **→ ↓ PgDn** / **← ↑ PgUp** | Next / previous name |
| **Home / End** | First / last name |
| *number*, then **Enter** | Show the name for that program item |
| **Esc** | Hide |
| **E** | Type a label, name and detail for a guest who is not in the list |
| **G** | List of all names |
| **A** | Auto-hide on/off |
| **V** | Test background: transparent, checker, dark, green |

### Lyrics lower third

| Key | Action |
| --- | --- |
| **Space Enter → ↓ PgDn** | Show the bar at the current line, or go to the next line |
| **← ↑ Backspace PgUp** | Previous line |
| **Shift + → / ←** | Next verse / back to the start of the verse |
| **1 … 9**, **C** or **0**, **J** | Jump to a verse, the chorus, or any part |
| **N / P** | Next / previous song |
| **S**, *number*, **Enter** | Start the song with that number |
| **B** or **.** | Hide / show the bar, keeping your place |
| **Esc** | Hide the bar |
| **G** | Song list |
| **I** | Title row on/off |
| **D** | Hymn-book details (number, book, edition) on/off |

Lines change only when you press a key, so the words never run ahead of the singing.

Most presenter clickers send **PgDn** for next, **PgUp** for back and **.** or **B** for the black screen. All of these already work.

---

## Live video: the lower thirds

The lower thirds are graphics meant to sit **on top of a picture** (a camera or live stream). A web page cannot draw on top of another page, so use a video program such as OBS Studio, vMix or a hardware mixer. The page has a see-through background so the picture shows around it.

Two ways to use them with OBS Studio:

1. **Window capture with green screen.** Open e.g. `lowerthird.html?bg=green` in its own browser window, add a *Window Capture* of that window in OBS, then add the *Chroma Key* filter. Press the keys in this window.
2. **Browser source.** Add a *Browser* source, choose *Local file* and pick the page, size **1920 × 1080**. The background is already transparent. To press keys, right-click the source and choose *Interact*. Add `?clean=1` so no feedback messages appear in the picture.

### Options in the web address

Add after the page name, starting with `?` and joining several with `&`, for example `lowerthird.html?bg=dark&hide=6&plate=light`.

**`lowerthird.html`**

| Option | Meaning |
| --- | --- |
| `bg=transparent` | `transparent` (default), `checker`, `dark` or `green`. |
| `hide=10` | Seconds before it hides itself; `hide=0` keeps it on screen. |
| `plate=light` | Light plate (default is the dark plate). |
| `pos=center` | `left` (default), `center` or `right`. |
| `item=8&show=1` | Select the name for item 8 and show it as soon as the page opens. |
| `clean=1` | No messages, lists or forms on screen. |

**`lyrics-lowerthird.html`**

| Option | Meaning |
| --- | --- |
| `bg=transparent` | `transparent` (default), `checker`, `dark` or `green`. |
| `plate=light` | Light plate. |
| `no=12&show=1` | Select song number 12 and show it as soon as the page opens; add `line=3` to start at line 3. |
| `singer=Name` | Show this singer or group name in the top row. |
| `info=0` | Start with the title row hidden. |
| `book=1` | Start with hymn-book details shown; `book=0` hides them. |
| `clean=1` | No messages or lists on screen. |
| `src=other.json` | Read the songs from a different file. |

---

## Another language

Everything you type (church name, program, hymns, names) is shown exactly as written, in any language and script. To translate the fixed words, set `locale` (for the written date) and `labels` (Date, Venue, Time) in `config.js`. The key help text and the Help page are in English; you can edit `help.html` to translate them.

---

## Printing

Press **P** on the slideshow or the banner. In the print window choose *Landscape*, margins *None*, and turn on *Background graphics* (otherwise colours are missing). The slideshow prints one slide per page, so *Save as PDF* makes a handout and a handy backup if the computer fails.

---

## What the pages remember

These choices are saved in the browser on that computer and come back next time: theme and animation, whether the controls bar is shown, the lower-third background, plate and auto-hide, the lyrics view, and the last `songs.json` you chose when opening from a folder. The address changes as you move (for example `index.html#5` or `lyrics.html#2.5`), so reloading returns to the same place. To reset everything, clear the site data for the page in the browser's settings.

---

## Project structure

```
church-live-hosting-program/
├── config.js          ← EDIT THIS: church, event, colours, program, names
├── songs.json         ← EDIT THIS: hymns and songs
├── theme.js           colours, page title and date helpers (shared by every page)
├── index.html · style.css · script.js          Program slideshow
├── banner.html · banner.css · banner.js        Main banner
├── lyrics.html · lyrics.css · lyrics.js        Song lyrics page
├── lowerthird.html · .css · .js                Name lower third
├── lyrics-lowerthird.html · .css · .js         Lyrics lower third
├── help.html · help.css · help.js              Help / user guide
└── README.md
```

Each page has its own HTML, CSS and JavaScript file. Every page reads `config.js` and `theme.js`; the two lyrics pages also read `songs.json`. The folder can be hosted on any static web host. No server-side code is needed.

---

## Browser support

Recent Chrome or Edge are best (and the OBS browser source is Chromium-based). Firefox and Safari work too.

---

## Service-day checklist

1. Open every page you need in its own browser tab or window; press **F** on each once to be sure fullscreen works on the projector.
2. If you use the lower thirds, open `lowerthird.html` in its own window, check the names, and press **V** to match your video program (transparent or green).
3. Start with the banner on screen. **Ctrl + Tab** moves to the next tab (**Ctrl + 1, 2, 3 …** jump to a tab). Each tab remembers where it was.
4. For a song, use the lyrics tab and press **G**, or **S**, the number and **Enter**.
5. Between items, **B** gives a black screen. Press it again, or move on, to return.
6. Check from the back of the hall: room light and projector brightness differ.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| The keys do nothing | Click once on the page so the browser window has focus. |
| I changed `config.js` but nothing changed | Save the file and press **F5** (or **Ctrl + R**) in the browser. |
| The page is blank, or the words are missing | There is a typing mistake in `config.js`, usually a missing comma, quote or bracket. Press **F12** and look at the Console for the line. |
| The lyrics page asks me to load songs | The browser blocked reading `songs.json` from a folder. Choose the file in the box, or serve the folder (see Quick start). |
| "The songs file could not be read" | A mistake in `songs.json`, usually a missing comma, quote or bracket. The message says what is wrong. |
| The screen went black | You pressed **B** or **.**. Press it again or press **Esc**. |
| No animations | The computer may be set to reduce motion. Press **M** for full animation. |
| Fullscreen does not start | Browsers only allow it after a key press or click on the page. Click the page and press **F** again. |
| Black bars at the sides | The projector is not 16:9. Set it to 1920 × 1080 if possible. |
| The lyrics lower third is not showing | It is hidden until you press **Space** or **→**. If you pressed **B** or **Esc**, press **B**. |
| The lower third page is white | A transparent background shows as white in a browser. Press **V** for dark, checker or green. |
| Feedback messages appear in my video | Add `?clean=1` to the address. |
| The printed PDF is missing colours | Turn on *Background graphics* in the print window. |

More answers are in the built-in Help page, which also has a search box (**/**).

---

## Copyright

**Copyright © 2026 Laitei ([laiei.dev](https://laiei.dev)). All rights reserved.**

The design, layout, styling, source code (HTML, CSS and JavaScript) and documentation in this folder are the work of Laitei. No licence to copy, modify, redistribute or reuse them is granted unless Laitei gives it in writing. To ask about permission, contact Laitei through laiei.dev.

**Third-party content.** This notice covers the software and its design only. Hymn and song texts, names and other content that a church adds belong to their respective composers, authors, publishers and owners; the sample texts shipped here are original placeholders. A church is responsible for having the right to display the songs it adds.
