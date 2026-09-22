# AutoForm Fill – QA Form Filler & Test-Data Toolkit

A browser extension for **Chrome** (Manifest V3) and **Firefox** (Manifest V2) that fills web forms with controllable test data in one click. Built for QA engineers, software testers, and developers who need to exercise registration flows, admin panels, checkout funnels, and long multi-step forms without typing the same data over and over.

**Use case:** Open a form → pick a **data mode** → **Fill form** → every fillable field gets sensible, targeted test data and you get a per-field report. No backend, no account — everything runs locally in your browser.

<img width="567" height="567" alt="Image" src="https://github.com/user-attachments/assets/7222cf16-27ea-4f4f-9be7-48e18b837395" />

---

## What's new in 2.0

Version 2 is a ground-up rebuild of the v1 autofill helper into a QA toolkit:

- **5 data modes** — Valid (realistic), Invalid (malformed), Boundary (min/max limits), Extreme (unicode/emoji/huge), Security (XSS / injection probes)
- **Profiles** — full snapshots of settings + rules; quick-switch from the popup; per-site auto-selection by URL pattern; import/export as JSON
- **6 locales** — US, UK, India, Bangladesh, Germany, France (auto-detected from the page)
- **Field picker** — visually select exactly which fields to fill
- **Clear form** — one click wipes every fillable field
- **Per-field rules v2** — text/regex matching, fixed values with `{seq}` `{uuid}` `{date}` … tokens, skip, reordering
- **Fill reports & logs** — per-field result popup, on-page toast, badge count, and a 25-entry history with details
- **Bulk dataset generator** — CSV/JSON files (up to 10,000 rows) for load testing and seeding
- **Smarter filling** — respects `min`/`max`/`maxlength`/`minlength`, checks consent boxes, handles multi-selects, contenteditable, shadow DOM, iframe content, and many JS dropdown widgets
- **Keyboard shortcuts** — `Alt+Shift+F` fill, `Alt+Shift+C` clear (rebindable in browser settings), plus the classic `Ctrl+Shift+V` ×2

---

## Features

| Area | What it does |
|------|----------------|
| **Data modes** | Valid · Invalid · Boundary · Extreme · Security — switch per fill from the popup |
| **Smart matching** | Detects fields via `autocomplete`, HTML type, label, placeholder, name, `data-*`, aria, and `inputmode` |
| **Input types** | text, email, tel, password, url, number, date, time, datetime-local, month, week, range, color, search, textarea, select, multi-select, checkbox, radio, file upload, contenteditable |
| **Locales** | en-US, en-GB, en-IN, bn-BD, de-DE, fr-FR + auto-detection; localized names, streets, cities, states, postcodes, phones, companies |
| **Constraints** | Honors `min`/`max`/`step` (numbers, dates, ranges), `maxlength`/`minlength`, date attribute ranges |
| **Frameworks** | React, Vue, Angular, Livewire/Filament, Select2, Ant Design, React Select, vue-select, MUI, Tom Select, Choices.js, ng-select, PrimeNG, flatpickr, generic `button + ul[role=listbox]` widgets |
| **Shadow DOM & frames** | Collects fields inside open shadow roots and same-origin iframes |
| **Dynamic forms** | Detects “Add new …” repeater buttons, expands rows, fills them |
| **Multi-step forms** | Optional auto-advance: fill → click Next/Continue → fill again, up to N steps |
| **Field picker** | Highlight all fillable fields, click to include/exclude, fill the selection |
| **Profiles & sites** | Named profiles; URL patterns like `*staging.example.com*` auto-activate a profile |
| **Rules** | Per-field overrides: generate a type, insert a fixed value (with tokens), or skip — text or regex, ordered, toggleable |
| **Reports & logs** | Popup report with per-field status/value, page toast, extension-badge count, logs tab with the last 25 fills |
| **Datasets** | Generate CSV/JSON test data (row count + columns configurable) using the active profile’s locale and ranges |
| **Files** | Built-in demo uploads (PNG/PDF/txt) or your own image/PDF/doc, matched by `accept` |
| **Sequence** | Optional incrementing counter so repeated fills produce unique emails/usernames |
| **Safety** | While filling, form submits, risky link clicks, and Enter-key submits are blocked; values rejected by validation are rolled back (valid mode) |

---

## Installation

### Chrome / Edge (Chromium)
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `Chrome-Extension` folder

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` inside the `Firefox-Extension` folder

> Temporary Firefox installs are removed when the browser closes.

---

## Usage

1. Navigate to any page with a form.
2. Click the extension icon → choose a profile and data mode → **Fill form**,
   or press `Alt+Shift+F`,
   or press `Ctrl+Shift+V` twice on the page,
   or right-click the page → *Fill form with test data*.
3. Watch the popup report (filled / skipped / failed per field) and the on-page toast.
4. **Clear** wipes the form; **Select fields** lets you hand-pick what to fill.

### Console API (on any page)

```js
window.__AutoFormFill()                       // fill with the active profile
window.__AutoFormFill({ mode: 'boundary' })   // one-off mode override
window.__AutoFormFillClear()                  // clear the form
window.__AutoFormFillPick()                   // open the field picker
window.__bengaliFakeFill()                    // v1 alias, still works
```

---

## Data modes

| Mode | Behaviour |
|------|-----------|
| **Valid** | Realistic locale data; values rejected by the page’s validation are rolled back; consent-style checkboxes get ticked |
| **Invalid** | Malformed values (`user@@invalid`, `abc-def-ghij`, `31/31/9999`), placeholders selected, consents unchecked — to test error handling |
| **Boundary** | `maxlength`-exact strings, attribute min/max numbers and dates, minimum lengths |
| **Extreme** | 500+ char strings, emoji/RTL/CJK unicode, gigantic numbers, far-future dates |
| **Security** | Classic XSS / SQL-injection / path-traversal / template-injection probe strings. **For authorized testing only.** |

---

## Settings

Options (right-click the toolbar icon → *Options*, or the ⚙ in the popup):

| Tab | What you configure |
|-----|--------------------|
| **General** | Data mode, locale, phone format, number/date/birth-year ranges, password style & length, long-text strategy, sequence counter, scope (main form vs whole page), dynamic-section expansion, multi-step auto-advance, fill delay, highlight colour, toast, debug logging, in-page shortcut |
| **Fields** | Enable/disable each of the 17 fill types |
| **Rules** | Ordered per-field rules: match by text or regex → generate a type, insert a fixed value (`{seq}`, `{uuid}`, `{ts}`, `{date}`, `{time}`, `{rand:6}`, `{first}`, `{last}`, `{email}`, `{phone}`, `{city}`, `{country}`, `{index}`), or skip |
| **Profiles** | Create, duplicate, delete, activate; set site URL patterns for auto-selection; export/import everything as JSON; full reset |
| **Datasets** | Bulk CSV/JSON generation from the active profile |
| **Files** | Custom upload files for `<input type=file>` (max 2 MB each) |
| **Logs** | Last 25 fills with per-field details; copy as JSON |

---

## Project structure

```
auto-form-fill-chrome-firefox-extension/
├── src/                        # ← edit here
│   ├── shared/shared.js        # schema, defaults, storage, migration
│   ├── content/                # fill engine (bundled into content.js)
│   │   ├── c01-utils.js        # helpers, RNG, sequence
│   │   ├── c02-locales.js      # locale datasets
│   │   ├── c03-generator.js    # value generator + data modes + tokens
│   │   ├── c04-detect.js       # field detection & constraints
│   │   ├── c05-dom.js          # collection, widgets, guard, picker, clear
│   │   ├── c06-fill.js         # orchestrator: report, rules, multi-step
│   │   └── c07-main.js         # message router, shortcuts, public API
│   ├── background/background.js# commands, context menus, badge
│   ├── popup/                  # toolbar popup
│   └── options/                # settings page
├── manifests/                  # per-browser manifest templates
├── assets/icons/
├── test/page/test-form.html    # comprehensive manual test page
├── build.js                    # zero-dependency bundler (+ --zip for store packages)
├── Chrome-Extension/           # build output (MV3) — load this in Chrome
├── Firefox-Extension/          # build output (MV2) — load this in Firefox
└── dist/                       # store-ready zips (npm run zip)
```

`Chrome-Extension/` and `Firefox-Extension/` are **generated** — don’t edit them by hand.

### Development

```bash
node build.js        # rebuild both browsers' folders
node build.js --zip  # also produce store-ready zips in dist/
```

No dependencies, no node_modules. After rebuilding, reload the extension in `chrome://extensions` / `about:debugging` and refresh the target page.

To test the engine quickly, serve the repo (`npx serve .` or any static server), open `test/page/test-form.html`, and run `window.__AutoFormFill()` in the console.

### Storage

Everything lives in `storage.local` under one key (`affData`), plus `affLogs` (fill history) and `affFiles` (custom uploads). Settings from v1.x (`formSettings`, `customRules`, `phoneFormat`, `shortcutEnabled`, `customFiles`) are migrated automatically on first run.

### Permissions

- `activeTab` + `scripting` (Chrome) — inject the fill script on demand from the popup
- `storage` — save settings locally
- `contextMenus` — right-click actions
- `<all_urls>` content script — shortcut works on any tab, including iframes

No data is sent to any server. All data is generated client-side.

---

## Important notes

- **Testing only** — do not submit fake data on production systems with real users.
- The **Security mode payloads are inert strings** for verifying input handling and output encoding on systems you are authorized to test.
- **File uploads** — enable *File uploads* in the Fields tab; optionally set custom files in the Files tab.

## License

Open source. Use and modify freely for personal and commercial projects.
