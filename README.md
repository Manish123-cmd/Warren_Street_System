# Warren_Street_System

A white, responsive inventory workspace for Qima Cafe Warren Street, with blue accents and the original cafe photograph.

## Pages

- `index.html`: workspace overview, service cards and opening loading indicator.
- `frozen-pastries.html`: all 15 supplied pastry names, live search and an empty-results state. Quantities remain pending and are shown as a dash, not zero.
- `creams.html`: cream recipes and preparation steps, starting with Whipped White Chocolate Ganache (1,174 g whipping cream, 80 g gelatine mass and 250 g white chocolate).

## Preview and hosting

The interface now uses React and Vite. Install Node.js 24, then run `npm ci` and `npm run dev` to edit and preview the app. Run `npm test`, `npm run build`, and optionally `npm run test:browser` before publishing.

Edit React source in `frontend/src/`, with page entry templates in `frontend/*.html`. Root HTML and `react-assets/` are compiled deployment files; do not edit them manually. The build writes `dist/` and updates the root deployment files. GitHub Pages continues serving the `main` branch root at the existing address, so browser storage stays on the same origin. Commit the compiled root files and `react-assets/` alongside source changes after building. GitHub Actions runs the tests and production build on every main push and retains the compiled site as an artifact.

React renders shared navigation, header, footer and six page components. Existing DOM controllers in `scripts/` initialize sequentially after React mounts, retaining stock calculations, OCR, reporting and storage behavior. Page links intentionally perform full document navigation to preserve controller lifetimes and unsaved-change prompts. These controllers are a compatibility layer; moving their state into React hooks and adding a Flask API/database are separate future work.

Browser checks use Playwright with Microsoft Edge (`npm run test:browser`). Stock, wastage and order data still use their existing localStorage keys; this migration does not introduce a database or change data ownership.

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

The confirmed 1 October 2026 delivery in `scripts/initial-stock.js` adds 50 butter croissants, 25 pain au chocolat, 50 labneh twists, 50 cinnamon buns, 25 pistachio flans and 25 strawberry & lemon verbena Danish pastries. Cannelé, almond croissants and frangipane are excluded. Opening the stock page applies the delivery once per browser and recalculates affected automatic preparation snapshots, including previously capped shortages. Later manual stock counts remain authoritative. Receipt IDs are saved with the delivery day's record to prevent duplicate additions.

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

Compiled HTML pages stay at the root so existing GitHub Pages links continue to work. Run `npm run build` after React source changes.

## Wastage

The weekly receiving panel combines confirmed deliveries with advance orders from `scripts/weekly-orders.js`. Advance orders use unique IDs, expected delivery dates, supplier names, status and individual pastry quantities; pending orders never increase stock. When confirming receipt, use the same ID in `CONFIRMED_DELIVERIES` to avoid counting the order twice. The purple/lilac chart compares ordered units with estimated sales by pastry. Sales estimates use saved automatic preparation for the baking date, adjusted for shortages, minus reported wastage. Missing data stays unknown and each product shows coverage out of seven days; these are estimates, not till sales. The existing daily wastage chart remains below the comparison.

Weekly records run Monday through Sunday and show saved daily totals, draft/complete status and a weekly total of known quantities. Use Previous week / Next week to browse retained history, or select a day to edit its report. Yesterday opens the previous London calendar date. Missing reports and unknown quantities are not treated as zero; weekly totals exclude unsaved edits. Records stay in browser storage across week changes.

`wastage.html` records the front-of-house end-of-day report for all 15 pastries, with a London-calendar report date, optional reporter and notes. Unknown quantities stay blank and reports save as drafts; all 15 counts, including explicit zeros, are required for complete status. Saved reports can be reopened by date. Wastage uses separate browser storage (`warren-wastage-v1`) and never reduces frozen stock. This is manual report entry, not a shared submission system or an authenticated owner-only service.

## Receiving orders

Orders & Sales offers Mark as received for pending deliveries due today or earlier, plus Undo received for browser-confirmed receipts. Status saves in `warren-order-receipts-v1`, updates weekly receiving totals and delivery alerts, and syncs across tabs on the same browser. Confirmed deliveries already included in stock data cannot be undone here. This status action does not add frozen stock; record the stock receipt separately.

The confirmed 9 October stock is after Friday preparation for Saturday baking. Scheduled deliveries are expected at 08:00 London time. Receipts confirmed from 10 October onward feed frozen stock once per order ID when the stock page opens, including before the normal 10:00 preparation deduction. Earlier receipt statuses do not add quantities already covered by the confirmed baseline. Stock-linked receipts cannot be undone through the status control.
