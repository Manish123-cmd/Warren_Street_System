# Connect shared order PDFs

The four supplied PDFs are included in `Assets/orders` and become available to everyone when the updated site is deployed. New cross-device uploads require the connection below. No shared service has been provisioned or connected yet.

1. Create a Supabase project in your own account.
2. Run `setup/shared-orders.sql` once in its SQL editor. It creates document metadata, a PDF bucket with a 20 MB limit, and policies restricting uploads to approved staff. Documents are publicly readable, matching the site's open viewing model.
3. In Authentication > Users, create a staff user with email/password. Add their user UUID to `public.order_uploaders` using the example at the bottom of the SQL file. Only administrators can grant this permission. Disable public signups if you do not need them.
4. Put the project URL and **publishable key** into `scripts/shared-config.js`. These are browser-safe project settings. Never put a secret or service-role key in the site. Staff passwords are entered through the sign-in form, not saved in source files.
5. Preview the site over HTTP, then deploy the changed site, including the PDFs and configuration, to your existing host. No server runtime is required on that host.
6. Open Orders & Sales > Order PDFs, sign in, choose an expected delivery date and PDF, and select Upload shared PDF. A filename in DD-MM-YYYY.pdf format prefills the date. Uploaded files use unique paths; they do not overwrite another order.
7. Verify from another browser/device without signing in: refresh the page and open the new PDF. Verify an unapproved account cannot upload. Check failure messages with a non-PDF or file larger than 20 MB.

Sessions stay in memory and are cleared on reload/sign-out. Sign in again if a session expires. Metadata saves only after the file uploads; failed metadata saves trigger file cleanup. The original four files remain links to the site's own assets.

An upload saves the dated document for viewing. It does not extract product quantities, change stock, or create an order in the comparison chart. Those still use the reviewed order records in `scripts/weekly-orders.js`. Local-only PDFs are not migrated automatically when shared storage is enabled; upload those again.

Until configured, the form explicitly saves only on the current device using IndexedDB. This is not shared storage or a backup.

References: [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [password authentication](https://supabase.com/docs/guides/auth/passwords), [public file URLs](https://supabase.com/docs/guides/storage/serving/downloads).
