# Rev. Haidau Chori Palyupalihna Nata Byhnâ Paawsana Program

Keyboard-operated, offline display pages for a church program: a program slideshow, a main banner, song lyrics, and two lower-third graphics for live video (names, and lyrics line by line).

> **Mara Evangelical Church** · Lialaipi Vaihpi Achhyna O · 4th October 2026 · 12:00 noon – 2:00 pm
> *Honoring Rev. Haidau (**Chori Palyupalihna**) **Nata** (and) the blessing service program (**Byhnâ Paawsana Program**).*

Plain HTML, CSS and JavaScript. No build step, no dependencies, no internet connection needed. Everything is controlled from the keyboard (or a presenter clicker), so there are no buttons or bars on the projector screen.

---

## Contents

- [Pages](#pages)
- [Quick start](#quick-start)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Songs (`songs.json`)](#songs-songsjson)
- [Lower thirds for live video](#lower-thirds-for-live-video)
- [Changing the content](#changing-the-content)
- [Design](#design)
- [What the pages remember](#what-the-pages-remember)
- [Printing](#printing)
- [Project structure](#project-structure)
- [Browser support](#browser-support)
- [Service-day checklist](#service-day-checklist)
- [Troubleshooting](#troubleshooting)
- [Copyright and content notice](#copyright-and-content-notice)

---

## Pages

| Page | File | What it is for |
| --- | --- | --- |
| Home | `index.html` | The page that opens first: the title and date, and a card for every screen below. Press **1**–**5** to open a page, **H** for Help. Not for the projector. |
| Program slideshow | `program.html` | The order of the program, one item per slide: title slide, details slide, items 1–21, closing slide (24 slides). |
| Main banner | `banner.html` | A dark poster-style screen with a gold and teal cross, the title, the date plate and the details. For the wall before the service starts and after it ends. |
| Song lyrics | `lyrics.html` | One lyric line at a time with a smooth glide. The song title stays at the top; song number and edition (if any) are at the bottom right. Songs come from `songs.json`. |
| Name lower third | `lowerthird.html` | A name graphic for the bottom of a live picture: a small label (Speaker, Singer, Choir…), the name, and an optional detail line. Transparent background for video overlay. |
| Lyrics lower third | `lyrics-lowerthird.html` | A bar at the bottom of a live picture that shows the lyrics one line at a time while a singer or group sings. Transparent background for video overlay. |
| Help | `help.html` | The full user guide: shortcut keys, controls, setup, troubleshooting. Searchable, printable. |

All screens are designed for a **16:9 projector (1920 × 1080)**. On other shapes they keep their proportions and add black bars at the sides or top; text is never stretched.

---

## Quick start

1. Download or clone this repository and keep **all files together in one folder** (it also runs from a USB stick).
2. Open `index.html` (the home page) and choose a screen, or open any page above directly, in a modern browser by double-clicking it.
3. Move the browser window to the projector screen and press **F** for fullscreen.
4. Move forward with **→** or **Space**, back with **←**.

**Lyrics pages and `songs.json`.** Browsers do not let a page read `songs.json` when it is opened straight from a folder (`file://`). When that happens, the lyrics pages ask you to choose the file once (or drag it onto the page; press **O** any time). The choice is remembered. If you edit `songs.json`, choose it again, or serve the folder so the page always reads the newest file:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/lyrics.html
```

Any static web server works. Nothing is loaded from the internet.

Press **H** on any page to open the built-in Help page, or **?** for a quick key list on the slideshow, lyrics and lower-third pages.

---

## Keyboard shortcuts

Click once on the page first so the browser window has focus. Moving to another slide or line also brings the picture back from a black screen.

### Keys that work on (almost) every page

| Key | Action |
| --- | --- |
| **F** | Fullscreen on/off (browser's **F11** also works). |
| **H** | Open the Help page in a new tab. |
| **?** | Quick list of shortcut keys (slideshow, lyrics, lower thirds). **Esc** closes it. |
| **Esc** | Close a list or help box, or leave the black screen. |
| **B** or **.** | Black screen on/off (slideshow and lyrics). |
| **T** | Dark / light theme (slideshow and lyrics). On the lower thirds: navy plate / light plate. |
| **M** | Full / reduced animation (reduced uses simple fades only). |
| **C** | Show/hide the small on-screen controls bar on the slideshow (hidden by default). On the lyrics page this is **Shift + C**. |

### Program slideshow (`program.html`)

| Key | Action |
| --- | --- |
| **→ ↓ Space PgDn Enter** | Next slide |
| **← ↑ Backspace PgUp** | Previous slide |
| **Home / End** | First slide (title) / last slide (closing) |
| *number*, then **Enter** | Jump to program item 1–21 (e.g. **1 2 Enter** shows item 12). A message at the top right shows what you typed. |
| **G** or **O** | Program list; choose with **↑ ↓ Enter** or click. **Esc** closes. |
| **P** | Print / save as PDF, one slide per page |

Slide order: slide 1 is the title, slide 2 the details, slides 3–23 are items 1–21, slide 24 is the closing slide. The address changes as you move (for example `program.html#12`), so reloading returns to the same place.

### Main banner (`banner.html`)

| Key | Action |
| --- | --- |
| **F** | Fullscreen |
| **R** or **Space** | Replay the opening animation (useful when you bring the banner back on screen) |
| **P** | Print / save as PDF |
| **H** | Help |

### Song lyrics (`lyrics.html`)

| Key | Action |
| --- | --- |
| **→ ↓ Space PgDn Enter** | Next line (at the end of a song a message says so; it never jumps to the next song by itself) |
| **← ↑ Backspace PgUp** | Previous line |
| **Shift + →** | First line of the next verse |
| **Shift + ←** | Back to the start of this verse, or the previous verse if already at the start |
| **Home / End** | First / last line of the song |
| **N / P** | Next / previous song |
| **1 … 9** | Jump to the first line of that verse (repeat an earlier verse, or skip ahead) |
| **C** or **0** | Jump to the chorus. If it comes several times you go to the next one after where you are; press again to restart that chorus |
| **J** | List of every part of the song (verses, choruses, a bridge…) |
| **S**, *number*, **Enter** | Jump to the song with that hymn-book number |
| **G** | Song list |
| **L** | Focus view (lines before and after are faint) / one-line view |
| **O** | Choose a `songs.json` from the computer (or drag it onto the page) |
| **Shift + C** | Show/hide the controls bar |

### Name lower third (`lowerthird.html`)

| Key | Action |
| --- | --- |
| **Space** or **Enter** | Show the selected name, or hide it if it is on screen |
| **→ ↓ PgDn** | Next name (changes at once if a name is on screen) |
| **← ↑ PgUp** | Previous name |
| **Home / End** | First / last name |
| *number*, then **Enter** | Show the name for that program item straight away (e.g. **1 3 Enter** for item 13) |
| **Esc** | Hide |
| **E** | Type a label, name and detail for someone who is not in the list, then **Enter** to show |
| **G** | List of all names |
| **A** | Auto-hide on/off (hides after 10 seconds; a thin gold line shows the time left) |
| **V** | Background for testing: transparent, checker, dark, green |
| **T** | Navy plate (default) / light plate |

Long names, labels and details shrink to fit and then wrap onto a second line, so nothing is cut off.

### Lyrics lower third (`lyrics-lowerthird.html`)

| Key | Action |
| --- | --- |
| **Space Enter → ↓ PgDn** | If the bar is hidden, show it at the current line; if it is on screen, go to the next line |
| **← ↑ Backspace PgUp** | Previous line |
| **Shift + → / ←** | Next verse / back to the start of the verse (or previous verse) |
| **Home / End** | First / last line of the song |
| **N / P** | Next / previous song (title changes smoothly, starts at the first line) |
| **1 … 9** | Jump to that verse |
| **C** or **0** | Jump to the chorus |
| **J** | List of every part of the song |
| **S**, *number*, **Enter** | Start the song with that number and show its first line |
| **B** or **.** | Hide / show the bar, keeping your place (talking, prayer, applause) |
| **Esc** | Hide the bar |
| **G** | Song list |
| **I** | Song title row on/off |
| **D** | Hymn-book details (number, book, edition) on/off — off by default |
| **V T M F O H ?** | Background, plate, animation, fullscreen, load `songs.json`, help, key list |

Lines change only when you press a key (or your clicker), so the words never run ahead of the singing. When a line changes, the old line lifts away first and the new line rises in, so two lines are never on screen together.

### Presenter remote (clicker)

Most clickers act as a tiny keyboard: **PgDn** for next, **PgUp** for back, and **.** or **B** for the black screen. All of these already work on the slideshow and lyrics pages.

---

## Songs (`songs.json`)

Songs are plain data, so a new song never needs code changes. Each song needs a `title` and `sections`. Everything else is optional, so a song that is not from a hymn book needs no number, book or edition.

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
| `sections` | **Required.** List of `{ "label": "...", "lines": [...] }`. The label (e.g. "Chorus") shows at the bottom left. |
| `composer` | Shown under the title on the lyrics page as "Composer: …". |
| `author` | Small line under the title for the writer of the words. |
| `reference` | A Bible reference or other note, e.g. `"(Psalm 92:12-15)"`. Shown under the title on the lyrics page and after the title on the lyrics lower third. |
| `number` | For hymn-book songs: shown in the badge at the bottom right and used by **S**, *number*, **Enter**. A song without a number can still be chosen with **G**, **N** and **P**. |
| `book`, `edition` | Book name and edition beside the number. A song with an edition but no number shows the edition only. |
| `singer` | A singer or group name for the top row of the lyrics lower third (or use `?singer=Name` in the address). |
| `id` (song) | A unique short name for the song. |
| `id` (section) and `order` | To repeat a chorus without typing it again, give each section an `id` and add `"order": ["v1", "c", "v2", "c"]` to the song. |
| `label` / `kind` / `verse` | The jump keys find parts from the label: `Verse 2` is verse 2; a label containing `Chorus` or `Refrain` is the chorus. For other names add `"verse": 2` or `"kind": "chorus"` to the section. |

Notes:

- Text is shown **as written**. Keep the spelling and punctuation of the source.
- A very long line shrinks to fit on two rows on the lyrics lower third; for extremely long lines, split them into two lines.
- Check commas and quote marks: one missing comma makes the whole file unreadable. The page tells you what is wrong.
- Add new songs after the last one, separated by commas.

---

## Lower thirds for live video

The lower thirds are graphics meant to sit **on top of a picture** (a camera or live stream). A web page cannot draw on top of another page, so you need a video program such as OBS Studio, vMix or a hardware mixer. The page has a see-through background so the picture shows around it.

### Two ways to use them with OBS Studio

1. **Window capture with green screen.** Open e.g. `lowerthird.html?bg=green` in its own browser window. In OBS add a *Window Capture* of that window, then add the *Chroma Key* filter. Press the keys in this window.
2. **Browser source.** In OBS add a *Browser* source, choose *Local file* and pick the page, size **1920 × 1080**. The background is already transparent. To press keys, right-click the source and choose *Interact*. Add `?clean=1` so no feedback messages appear in the picture.

### Options in the web address

Add after the page name, starting with `?` and joining several with `&`. Example: `lowerthird.html?bg=dark&hide=6&plate=light`.

**`lowerthird.html`**

| Option | Meaning |
| --- | --- |
| `bg=transparent` | Background: `transparent` (default), `checker`, `dark` or `green`. |
| `hide=10` | Seconds before it hides itself. `hide=0` keeps it on screen until you hide it. |
| `plate=light` | Start with the light plate (default is the navy plate). |
| `pos=center` | Place at `left` (default), `center` or `right`. |
| `item=13&show=1` | Select the name for item 13 and show it as soon as the page opens. |
| `clean=1` | No messages, lists or forms on screen. |

**`lyrics-lowerthird.html`**

| Option | Meaning |
| --- | --- |
| `bg=transparent` | Background: `transparent` (default), `checker`, `dark` or `green`. |
| `plate=light` | Start with the light plate. |
| `no=12&show=1` | Select song number 12 and show it as soon as the page opens. Add `line=3` to start at line 3. |
| `singer=Name` | Show this singer or group name in the top row. |
| `info=0` | Start with the song title row hidden. |
| `book=1` | Start with hymn-book details (number, book, edition) shown; `book=0` hides them. |
| `clean=1` | No messages or lists on screen. |
| `src=other.json` | Read the songs from a different file. |

### Changing the names

Open `lowerthird-data.js` in a text editor. Each line is one name:

```js
{ item: 13, role: 'Speaker', name: 'Rev. Sa E Hmô', detail: 'Associate Gen. Secy' },
```

`role` is the small label, `name` the large line, `detail` an optional smaller line, and `item` the program item number (so typing the number then **Enter** shows it). `settings.autoHide` sets the seconds before the graphic hides itself (`0` = stay until hidden). Save and press **F5**.

---

## Changing the content

The pages are plain files. Open them in any text editor, change the text, save, and press **F5** (or **Ctrl + R**) in the browser.

| What | Where |
| --- | --- |
| Program slideshow words | Top of `script.js`: `CHURCH`, `PLACE`, `DATE`, `TITLE`, `HONOR` and `AND` (the first and middle parts of the title), `DETAILS`, and `PROGRAM` (the 21 items). |
| Main banner words | Inside `banner.html` (title lines, date plate, and the facts list). |
| Songs | `songs.json` (see above). |
| Lower-third names | `lowerthird-data.js`. |
| Help text | `help.html`. |

A slideshow item is a list of blocks:

```js
// a role and a person
{ label: 'Hla solo', value: 'Ls. Centenary', sub: 'Aphapaaw Local KTP' }
// a hymn title (shown in a lighter weight)
{ label: 'Zawpi Hla sana', value: 'Hy, Beipa Chônôchai eima cha reihthai', hymn: true }
// a plain line, with an optional note under it
{ text: 'Chairman tawhta Program phuahna' }
```

An item with more than one block is shown a little smaller so everything fits.

---

## Design

- **Fixed 1920 × 1080 artboard**, scaled to the window with letterboxing on other shapes, so layouts look the same on any projector or monitor.
- **Colours from the Rev. Haidau 80th book cover:** deep navy `#1e2440` / `#171d37`, slate `#3f4a68`, teal `#2f8a8f` / `#5fa3ab`, gold `#e8b44c`, ice `#aebdc9`. Dark navy is the default (it suits a dim hall); a light theme is available with **T**.
- **System fonts only** (Segoe UI, Helvetica Neue, Arial, Liberation Sans), so nothing is downloaded. Text looks slightly different on each computer, so test on the one you will use.
- **CSS-only animation** that always rests in its final state: wipes, rises and glides on slides, lines and lower thirds.
- **Reduced motion:** the pages follow the operating system's reduced-motion setting, and **M** switches between full animation and simple fades.
- **No visible controls:** everything is a shortcut key, so the projector shows only the content. (The slideshow's small controls bar can be shown with **C**.)

---

## What the pages remember

These choices are saved in the browser on that computer and come back next time:

- Dark/light theme and full/reduced animation (separately for the slideshow and the lyrics page).
- Whether the controls bar is shown.
- For the lower thirds: the background, plate and animation. The name lower third also remembers auto-hide; the lyrics lower third remembers whether the title row and hymn-book details are shown.
- The lyrics view (focus or one line), and the last `songs.json` you chose when opening from a folder.
- Where you were: the address changes as you move (for example `program.html#12` or `lyrics.html#2.5`), so reloading returns to the same place.

To reset everything, clear the site data for the page in the browser's settings.

---

## Printing

Press **P** on the slideshow or the banner. In the print window choose *Landscape*, margins *None*, and turn on *Background graphics* (otherwise colours are missing). On the slideshow, each slide prints on its own page, so *Save as PDF* gives a handout of the whole program.

---

## Project structure

```
.
├── index.html · home.css · home.js             Home page (links to every screen)
├── program.html · style.css · script.js        Program slideshow
├── banner.html · banner.css · banner.js        Main banner
├── lyrics.html · lyrics.css · lyrics.js        Song lyrics page
├── lowerthird.html · .css · .js                Name lower third
├── lowerthird-data.js                          Names for the lower third
├── lyrics-lowerthird.html · .css · .js         Lyrics lower third
├── help.html · help.css · help.js              Help / user guide
├── songs.json                                  Song data for both lyrics pages
└── README.md
```

Each page has its own HTML, CSS and JavaScript file and shares no code with the others; only `songs.json` is shared by the two lyrics pages. The pages can be hosted on any static host, and the pull-request previews in this repository are built with Cloudflare Pages. No server-side code is needed.

---

## Browser support

Any current Chromium-based browser (Chrome, Edge), Firefox or Safari. The pages use CSS custom properties, `clip-path`, `transform`, the Fullscreen API and `fetch`. Chrome or Edge is recommended for the projector computer and for OBS (the OBS browser source is Chromium-based).

---

## Service-day checklist

1. Open every page you need in its own browser tab or window; press **F** on each once to be sure fullscreen works on the projector.
2. If you use the lower thirds, open `lowerthird.html` in its own window, check the names, and press **V** to match your video program (transparent or green).
3. Start with the banner on screen. Press **Ctrl + Tab** to move on to the slideshow (**Ctrl + 1, 2, 3 …** jump to a tab). Each tab remembers where it was.
4. For a song, switch to the lyrics tab and press **G**, or press **S**, type the song number and press **Enter**.
5. Between items, **B** gives a black screen. Press it again, or move to the next slide, to return.
6. Check from the back of the hall: room light and projector brightness differ.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| The keys do nothing | Click once on the page so the browser window has focus, then try again. |
| I am on the wrong slide, verse or song | Slideshow: type the item number and **Enter**. Lyrics: press the verse number, **C** for the chorus, **J** for the list of parts, or **G** for the song list. |
| The screen went black | You pressed **B** or **.**. Press it again or press **Esc**. |
| No animations | The computer may be set to reduce motion. Press **M** to switch to full animation. |
| The controls bar is missing | That is on purpose. Press **C** (**Shift + C** on the lyrics page). |
| The lyrics page asks me to load songs | The browser blocked reading `songs.json` from a folder. Choose the file in the box, or serve the folder (see Quick start). |
| "The songs file could not be read" | There is a mistake in `songs.json`, usually a missing comma, quote or bracket. The message says what is wrong. |
| Fullscreen does not start | Browsers only allow fullscreen after a key press or click on the page itself. Click the page and press **F** again. |
| Black bars at the sides | The projector is not 16:9. Set it to 1920 × 1080 if possible. |
| The lyrics lower third is not showing | It is hidden until you press **Space** or **→**. If you pressed **B** or **Esc** it is hidden on purpose; press **B** to bring it back. |
| The lower third page is white | A transparent background shows as white in a browser. Press **V** for dark, checker or green. |
| Feedback messages appear in my video | Open the page with `?clean=1` at the end of the address. |
| The lower third disappears by itself | Auto-hide is on. Press **A**, or add `?hide=0`. |
| The printed PDF is missing colours | Turn on *Background graphics* in the print window. |
| **H** does not open Help | The browser may have blocked the new tab. Allow pop-ups, or open `help.html` yourself. |

More answers are in the built-in Help page (`help.html`), which also has a search box (**/**).

---

## Copyright and content notice

**Copyright © 2026 Laitei ([laitei.dev](https://laitei.dev)).**

The design, layout, styling, source code (HTML, CSS and JavaScript) and documentation in this repository are the work of Laitei. Laitei is happy to give permission to use them: if you would like to use, copy or adapt them, just ask Laitei through laitei.dev.

**Third-party content.** The copyright above applies to the software and its design only. The program details, names, and the song texts and hymns in `songs.json` and the other data files belong to their respective composers, authors, publishers and to the church that supplied them. They are included only to run this church program and remain the property of their owners; this notice does not transfer or claim any rights in them. The Rev. Haidau 80th book cover colours are used as a colour reference only.
