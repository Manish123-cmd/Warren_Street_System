# Weekly Excel backups

## Current state and scope

This checkout has a React/Vite frontend hosted on GitHub Pages, browser-local
`warren-stock-v1`, `warren-wastage-v1` and `warren-order-receipts-v1` records,
calculated sales estimates, and local IndexedDB order PDFs. Optional shared PDF
storage exists in `scripts/shared-orders.js`. There is **no Flask/MongoDB backend
or pre-existing weekly backup implementation** here.

This module implements the requested backup naming/organisation workflow without
changing website code, storage, calculations, recipes, or design. It does not
migrate localStorage, create a production database, turn estimated sales into
actual sales, or back up browser-only data. A GitHub runner cannot read records
stored in staff browsers. Establish and validate the cloud data source before
enabling scheduled backups. The attached larger backend proposal is not silently
treated as an already deployed backend.

## Result

Example first attempt on Monday 12 October 2026 at 20:00 UTC (21:00 London):

```text
<approved parent folder>/
  Warren Street Backups/
    2026/
      October/
        2026-10-12_21-00-00_Stock.xlsx
        2026-10-12_21-00-00_Wastage.xlsx
        2026-10-12_21-00-00_Sales.xlsx
        2026-10-12_21-00-00_Delivery_Notes.xlsx
```

All four files use the **first attempt's** Europe/London timestamp, persisted in
MongoDB. No sequential filenames or colons. Year/month follow the backup run's
London date, not the reporting week's date. Retries retain that original folder,
even across month/year boundaries. English month names do not depend on the host
locale. Each file has a Reporting Period sheet with inclusive Monday/Sunday
dates, timezone/offset, source collection, record count and timestamp, plus its
category data sheet. Missing fields stay blank; quantities/prices are not inferred.
No recipes, PDF binaries, or images are exported. An empty collection/week gets
a clearly labelled, zero-row workbook; a nonexistent collection fails instead
of silently producing an apparently successful empty backup.

## Configure the real source schema

Use Python 3.12 or later:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backups/requirements-dev.txt
```

Set environment variables through your shell/secret manager. `.env.example` is a
template only; this runner does not automatically load `.env` files. Never put
secrets in frontend files, Actions variables, command-line arguments, or commits.

| Configuration | Purpose |
|---|---|
| `MONGODB_URI` (secret) | TLS MongoDB connection with read access to the four source collections and read/write access only to the manifest collection |
| `MONGODB_DATABASE` | Actual existing database name |
| `BACKUP_SOURCES_JSON` | Explicit mapping below; no collection names assumed |
| `BACKUP_MANIFEST_COLLECTION` | Default `weekly_backup_manifests`; use one shared collection across all runners |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID` | Restricted company-approved parent under which Warren Street Backups is created |
| `GOOGLE_DRIVE_CREDENTIALS_JSON` (secret, optional) | OAuth authorized-user or service-account JSON; prefer ADC/workload identity instead |
| `GOOGLE_APPLICATION_CREDENTIALS` (optional) | Local ADC credential file path **outside** this repository |
| `BACKUP_RETENTION_DAYS` | `0` by default: retention disabled; positive days enables proposals only |

`BACKUP_SOURCES_JSON` must contain exactly the four category keys. For example,
**only if your actual database has these collections and fields**:

```json
{
  "Stock": {
    "collection": "REPLACE_WITH_ACTUAL_STOCK_COLLECTION",
    "date_field": "date",
    "date_type": "date-string",
    "fields": {"Report date": "date", "Counts": "counts", "Saved at": "savedAt"}
  },
  "Wastage": {
    "collection": "REPLACE_WITH_ACTUAL_WASTAGE_COLLECTION",
    "date_field": "date",
    "date_type": "date-string",
    "fields": {"Report date": "date", "Counts": "counts", "Additional counts": "extraCounts", "Notes": "notes"}
  },
  "Sales": {
    "collection": "REPLACE_WITH_ACTUAL_SALES_COLLECTION",
    "date_field": "date",
    "date_type": "date-string",
    "fields": {"Date": "date", "Product": "product", "Quantity sold": "quantity", "Unit price": "unitPrice"}
  },
  "Delivery_Notes": {
    "collection": "REPLACE_WITH_ACTUAL_DELIVERY_COLLECTION",
    "date_field": "date",
    "date_type": "date-string",
    "fields": {"Delivery date": "date", "Supplier": "supplier", "Reference": "orderNumber", "Quantities": "quantities"}
  }
}
```

Column labels map to actual MongoDB field paths (including dotted nested paths).
Only those fields plus `_id` are read/exported, avoiding an indiscriminate export
of unrelated personal data. Arrays/maps remain JSON cells without assuming a
different product order or inventing quantities. Add location, opening/closing
stock, costs, recorded-by, etc. only when the real schema contains them. Do not
map recipe collections or a combined collection containing recipes. Recipe-named
collections and the manifest collection are rejected; operators must ensure the
selected collections actually contain only their declared category.

Choose `date-string` only for consistent, **London calendar `YYYY-MM-DD` strings**;
choose `datetime` for BSON dates. Do not use `date-string` for UTC ISO timestamps.
The query uses inclusive start/exclusive next-Monday end; BSON dates use London
midnights converted to UTC, including 167/169-hour DST weeks. Index the selected
date fields in your database separately. Do not assume a savedAt/edit timestamp
is the business reporting date. Existing localStorage records are keyed by date:
a future migration must preserve that date as a queryable field and preserve
product ordering/extra counts. Never replace them with a new save date.

## Google Drive credentials and permissions

1. Enable the Google Drive API in the company's Google Cloud project.
2. Choose a restricted company Drive parent and set its folder ID. The runner
   creates Warren Street Backups, year, and month under that parent; don't point
   it at an already nested month. Do not make business backups public.
3. Prefer GitHub OIDC Workload Identity Federation with service-account
   impersonation and restricted repository/branch conditions. Configure
   `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_BACKUP_SERVICE_ACCOUNT` Actions
   variables; the workflow uses `google-github-actions/auth` to supply ADC.
   Enable the required IAM/STS APIs and grant only the required impersonation
   role for the trusted GitHub principal. Google authentication does not itself
   grant Drive access: separately grant the service identity access to the folder.
4. For service accounts, use an organisation **Shared Drive** with appropriate
   membership/content permissions. Service accounts cannot own My Drive files
   and have no personal storage quota. For company My Drive instead, use an
   approved user OAuth flow and store its authorized-user JSON as the encrypted
   `GOOGLE_DRIVE_CREDENTIALS_JSON` Actions secret. Long-lived service-account keys
   are a fallback only; keep them in secrets and rotate them.
5. The runner requests Drive scope because it must discover a designated folder
   and manage its own nested backups. Do not grant the identity access to unrelated
   company files. All calls support Shared Drives. Credentials are never logged.

See [Google upload/retry guidance](https://developers.google.com/workspace/drive/api/guides/manage-uploads),
[Shared Drive ownership](https://developers.google.com/workspace/drive/api/guides/about-shareddrives),
and [GitHub Google authentication setup](https://github.com/google-github-actions/auth).

## Scheduling and recovery

`.github/workflows/weekly-backup.yml` preserves **Monday 20:00 UTC** (`0 20 * * 1`),
which is 20:00 London in GMT and 21:00 in BST. Reporting is the previous completed
Monday–Sunday in Europe/London. Manual runs on Tuesday–Sunday still select the
previous completed week, not the ongoing week.

Configure encrypted `MONGODB_URI` and, if needed, Google credential secrets.
Configure the non-secret Actions variables listed above. Do a manual test using
separate test collections/Drive parent first, inspect all four workbooks, then
set repository variable **`BACKUPS_ENABLED=true`**. Until then, the backup job is
deliberately skipped. Do not enable it against the current browser-only app.
Production Actions runs do not run retention or mutate source records.

Manual local backup:

```powershell
python -m backups
python -m backups --week 2026-10-05
```

Or choose Actions → Weekly Excel backup → Run workflow, entering the original
reporting Monday in `week`. This is important when recovering after a later
Monday; leaving it blank then would select a newer week. Reruns of a completed
week verify/reuse the original files, not overwrite them with later edits.

GitHub schedules can be delayed or dropped under load, run only from the default
branch, and may become inactive in idle public repositories. Review the Actions
history regularly. Watch the repository's Actions notifications and enable email
notifications in GitHub; a failed job produces an annotation and job summary.
No email/Slack messages are sent by this code. See
[GitHub schedule limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Retry, concurrency and integrity

- Mongo's unique manifest `_id` is `weekly:YYYY-MM-DD`. Keep this collection and
  its built-in unique `_id` index: deleting it removes the idempotency history.
  It stores timestamp, source/destination fingerprint, planned Drive IDs, sizes,
  checksums, row counts, attempts, verified status and safe error type.
- A database-backed global two-hour renewable lease plus Actions concurrency
  prevents overlapping backups/retention. A crashed worker releases naturally
  after expiry; wait two hours before recovering a hard-killed run. Do not clear
  an active lease. Normal failures release it immediately.
- Each file/folder ID is allocated and saved before creation. Google Drive
  pre-generated IDs make retries after ambiguous create responses safe. Existing
  files are checked by ID, folder, filename, MIME type, run/week/category tags,
  byte size and MD5 checksum. MD5 is an upload-integrity check, not encryption.
- Successful files remain untouched while a partial run resumes. Deterministic
  workbook packaging permits identical retries. If an unfinished category's
  source has changed, stop for manual recovery rather than overwrite the stored
  checksum and risk losing an earlier successful upload. Missing/modified/trashed
  verified files also stop automatic recovery. Restore those files from Drive
  history/trash or investigate privately before retrying. Do not remove manifests
  to force a new run. Changing source mappings or destination for an existing
  week is rejected; use a reviewed migration plan instead.
- Collections are read independently; this is not an atomic four-collection
  database snapshot. Partial-run workbooks retain their first successful content.
  Oversized/illegal Excel values fail instead of silently truncating records.
- The CLI makes up to three bounded attempts. Actions fails after an unresolved
  error; no credentials, connection strings or records are printed.

## Retention: disabled unless explicitly approved

No weekly run deletes old files or database records, regardless of space usage.
Setting `BACKUP_RETENTION_DAYS=365` alone still does not delete anything.
The only deletion path is the separate operator command below:

```powershell
# Set BACKUP_RETENTION_DAYS to the approved age, then generate a proposal only.
python -m backups --retention-plan retention-plan.json
# Review the exact week and four Drive IDs with the authorised owner.
# Run ONLY after that owner explicitly approves this specific proposal:
python -m backups --approve-retention retention-plan.json
```

The approval command revalidates the proposal against completed, verified backup
sets in the configured parent and verifies every file before changing anything.
It moves only those four-file sets to **Drive trash**, not permanent deletion,
and records retirement in the manifest. Folders and live source data remain.
Drive's own trash-expiration rules still apply. If interrupted mid-retention,
rerun the same approved plan; already trashed files are accepted during validation.
Do not add the approval command to the weekly workflow. Keep the reviewed plan
private; don't commit its file IDs. This CLI flag represents explicit operator
approval, not an automatic space-management decision.

## Tests and restore limits

```powershell
python -m unittest discover -s tests/backups -v
npm test
```

Tests use mongomock and a simulated Drive, including loss of an upload response,
partial retries, DST, folder creation, formula-as-text protection, unchanged
source collections, overlapping locks and explicit retention checks. They do not
claim live MongoDB/Google access has been tested. After credentials are configured,
test the real upload/permissions with a dedicated test database and Drive parent.

For reporting recovery, download the four verified files for the same manifest
timestamp/week and inspect Reporting Period before using them. Source record IDs
are provided for reconciliation. Workbooks are **not a complete MongoDB restore**:
selected columns, nested JSON cells and Excel types cannot reconstruct every BSON
type, index, attachment or unexported field. Do not automatically import Excel
over production. Reconcile into a test database first with schema validation.

Use a separate, approved native MongoDB backup process (`mongodump`/`mongorestore`
or an available managed snapshot service) to preserve BSON IDs/types, all needed
collections and indexes. Store that encrypted archive in an approved private
destination, include the manifest collection, and test restoration separately.
This module does not execute database dumps or delete data after an Excel export.
