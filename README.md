# my-finance-plugin

# 📊 Finance Hunter

A Chrome extension that automatically detects and extracts tables from any webpage and exports them as CSV files. Built for scraping financial data from investor relations pages, SEC filings, and earnings reports.

---

## Features

- **One-click extraction** — scans all `<table>` elements on the current page and lists them for download
- **Smart bracket handling** — converts accounting-format negatives like `(89,715)` into proper negative numbers (`-89715`), including cases where the bracket and number are split across separate table cells
- **Multi-table support** — lists every detected table individually so you can choose which ones to download, with a "download all" button when multiple tables are found
- **Clean CSV output** — strips thousand-separator commas, escapes internal quotes, and prepends a UTF-8 BOM so Excel opens Chinese characters correctly
- **Auto-naming** — uses the element preceding the table (or a `<caption>` tag if present) as the filename

---

## File Structure

```
finance-hunter/
├── manifest.json      # Extension config (MV3)
├── popup.html         # Extension popup UI
├── popup.js           # All popup logic: scraping, rendering, CSV download
├── pdf.js             # PDF.js library (for PDF extraction)
└── pdf.worker.js      # PDF.js worker
```

---

## Installation

This extension is not published on the Chrome Web Store. Install it in developer mode:

1. Clone or download this repository
   ```bash
   git clone https://github.com/your-username/finance-hunter.git
   ```

2. Open Chrome and go to `chrome://extensions`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the project folder

5. The 📊 icon will appear in your Chrome toolbar

> **PDF extraction** requires `pdf.js` and `pdf.worker.js` to be present in the root folder. Download them from the [PDF.js releases page](https://github.com/mozilla/pdf.js/releases) and place the files from the `build/` directory into the project root.

---

## Usage

### Extracting tables from a webpage

1. Navigate to any page containing tables (e.g. an earnings release or 10-Q filing)
2. Click the 📊 extension icon to open the popup
3. Click **Scrape Tables**
4. A list of all detected tables will appear, each with a **↓ CSV** download button
5. Click the button next to the table you want, or use **⬇ Download All** to export everything at once

### What gets cleaned automatically

| Raw value in HTML | Output in CSV |
|---|---|
| `148,466` | `148466` |
| `(89715)` | `-89715` |
| `(89715` + `)` in separate cells | `-89715` |
| `(` + `89715` + `)` across three cells | `-89715` |
| Lone `(` or `)` cells | *(skipped)* |

---

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read the current tab's URL |
| `scripting` | Inject the scraping function into the page |
| `downloads` | Save CSV files to disk |
| `host_permissions: <all_urls>` | Required for scripting to work across all sites in MV3 |

---

## Known Limitations

- Only detects standard HTML `<table>` elements. Tables built with `div` + CSS grid/flexbox are not captured by default.
- Cross-origin iframes cannot be accessed due to browser security restrictions.
- Dynamically rendered tables (e.g. loaded via JavaScript after scroll) may require a page refresh before scraping.

---

## License

MIT
