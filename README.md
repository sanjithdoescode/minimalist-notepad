# Minimalist Notepad

The **Minimalist Notepad** is a distraction-free, browser-based markdown notebook.  It behaves like a small desktop writing app, yet everything lives in a single folder. No build tools, no hidden cloud.

## Why this exists

I wanted an editor that opens instantly, remembers my drafts, and gets out of the way.  The result is a plain-HTML project you can drop on any machine or USB stick.  LocalStorage keeps your notes private; there is no backend.

## Feature highlights

* Multiple documents with graceful tab navigation
* Live markdown preview powered by _marked.js_
* LaTeX rendering via **KaTeX** – type `$E = mc^2$`, see maths
* Code blocks with Prism.js syntax highlighting
* Search & Replace (regex + case-sensitive modes)
* Focus Mode and Typewriter Mode for deep work
* Optional typewriter key-click sounds (yes, really)
* Auto-save every few seconds and manual _Save_ button
* Export to **PDF** (jsPDF) or plain text
* Light, Dark and Sepia themes – switch anytime with the ☀️ button

## Quick start

1.  Clone or download the repository.

    ```bash
    git clone https://github.com/your-user/minimalist-notepad.git
    cd minimalist-notepad
    ```
2.  Open `index.html` in a modern browser – that’s it.  All assets are loaded from CDNs and the app runs fully offline after the first visit.

## Running a tiny local server (optional)

Opening the file directly works on most systems, but some browser extensions block localStorage for `file://` origins.  If you hit issues, serve the folder over HTTP:

```bash
# with Python 3
python -m http.server 8000
# or Node.js users
npx serve -l 8000 .
```
Visit http://localhost:8000 in your browser!

## Directory map

```
.
├── index.html      # main UI and external library links
├── app.js          # all application logic (plain ES6, no bundler)
└── style.css       # minimal yet responsive styling
```

There are no build steps – edit, refresh, done.

## Customisation tips

* **Themes** – adjust CSS variables at the top of `style.css` or add a new theme class and extend `applyTheme()` inside `app.js`.
* **Auto-save interval** – tweak `setupAutoSave()` in `app.js` (default: 5 s).
* **Initial document** – change the markdown inside `createInitialDocument()` for a personalised welcome page.

## Browser support

Tested on recent versions of Chrome, Firefox and Edge.  Safari works too (i think), but PDF export may embellish fonts differently.

## Contributing

Pull requests are welcome if they stay true to the single-file, zero-build philosophy.  Bug fixes, accessibility tweaks and theme additions are great places to start.

## License

MIT – do what you wish, but a star would be lovely. 