# Warren_Street_System

A white, responsive inventory workspace for Qima Cafe Warren Street, with blue accents and the original cafe photograph.

## Pages

- `index.html`: workspace overview, service cards and opening loading indicator.
- `frozen-pastries.html`: all 15 supplied pastry names, live search and an empty-results state. Quantities remain pending and are shown as a dash, not zero.
- Creams Stock and TrayUp Details are marked coming soon.

## Preview and hosting

Open `index.html` in a browser. No build step or dependencies are required. Published through GitHub Pages from the `main` branch and root folder.

Repository: https://github.com/Manish123-cmd/Warren_Street_System

Live site: https://manish123-cmd.github.io/Warren_Street_System/

The interface adapts to mobile screens, supports keyboard navigation and respects reduced-motion preferences.

## Daily stock counts

On Frozen Pastries Stock, choose the stock date, enter whole-number quantities and select Save changes. Empty counts remain unknown; zero is a recorded zero. New dates inherit the latest earlier saved snapshot. Existing snapshots are never replaced automatically. The inventory table shows the previous calendar day's saved stock beside today's editable stock, with dates in both headers. Missing previous-day counts display a dash. The stock-date selector can view history; Save changes is below the inventory table.

Counts are stored in this browser's localStorage, not a shared database. Clearing browser data removes them; another browser/device or moving to a different site address does not carry the data over. Concurrent-tab saves are detected rather than silently overwriting changes.

## Image scanning

Expand Scan a stock sheet and choose a PNG, JPEG, WebP or BMP under 15 MB. Tesseract.js 6.0.1 loads on demand from jsDelivr and reads English text in the browser. The first run needs internet access for the OCR library and language assets. Use a clear, upright supplier order sheet. The scanner matches known supplier product aliases and reads the trailing Qty before price columns. Every scanned Qty is multiplied by 25, including cookie products whose supplier labels say (50). Parenthesised pack descriptions and monetary prices are excluded. Unclear rows must be corrected in the detected-text review; image recognition can still misread text or column layout. Manual stock inputs and review quantity inputs are final individual pastry counts, not pack quantities.

Review detected text, correct reading errors and select Match pastry names. Unmatched or ambiguous lines and duplicate product entries are skipped. Review or edit the matched numbers, then Apply reviewed counts and Save changes. Applying replaces only selected products and never saves automatically.


Scanner regression checks: `node --test tests/order-parser.test.cjs`. The supplied example is covered as a text transcription; a generated supplier-table image is used for browser OCR verification.

## Delivery reminder

The stock page shows a delivery banner for the usual Tuesday, Thursday and Saturday morning schedule, using Europe/London time. On delivery days it highlights today (morning is before noon); on other days it shows the next usual delivery morning. The reminder remains available all day and is not a confirmation that a delivery arrived. Scan the image opens the upload section and focuses the image picker without changing stock or the selected stock date.

## Daily proofer deductions

`scripts/proofer.js` contains the supplied weekday/weekend quantities for all 15 pastries. Preparation uses tomorrow's baking date (Saturday/Sunday are weekends). The confirmed 30 September 2026 snapshot is exempt; deductions begin 1 October at 10 AM Europe/London. On opening the stock page, and every 30 seconds while it is open, due dates are processed once and stored. Unsaved edits and active scan reviews pause background processing. This browser-only app cannot run while closed; it catches up when reopened.

Saved manual counts represent post-proofer quantities and are not deducted again that day. Unknown counts remain unknown. Insufficient stock is capped at zero with explicit shortage information. Existing saved dates are retained rather than recalculated when an older date is edited. The expandable Daily proofer quantities table displays the configured amounts.

Checks: `node --test tests/proofer.test.cjs tests/order-parser.test.cjs`.

## Setting Proover

`setting-proover.html` provides ten searchable tray photo guides from the supplied Assets images. Each card lists the count and arrangement visible in its reference photo, with uncropped images and an accessible enlarged-photo dialog. These counts describe the photographs, not daily preparation totals or measured tray capacities. Red Croissants and Cruffins share one guide (6 croissants and 8 cruffins shown). Cookies and Pistachio Flan do not need tray guides. The page does not change stock or deduction settings.


## Project layout

- `index.html` ? workspace home page.
- `frozen-pastries.html` ? stock inventory page.
- `setting-proover.html` ? tray photo guides.
- `scripts/` ? JavaScript behavior, stock data, scanning and preparation rules.
- `styles/` ? shared styles and page-specific stylesheets.
- `Assets/` ? logos and reference photos.
- `tests/` ? stock-rule and order-parser checks.

HTML pages stay at the root so existing GitHub Pages links continue to work. No build step is required.
