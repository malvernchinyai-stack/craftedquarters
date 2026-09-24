# Crafted Quarters Docs

Offline Android app (PWA) for **Crafted Quarters (Private) Limited** to create, edit and manage
**Quotations, Invoices and Bills of Quantities (BOQ)**, and download branded PDFs of each.

464 Herbert Chitepo St, Masvingo, Zimbabwe · +263 77 391 1346 (calls & WhatsApp) · info@craftedquarters.co.zw

_Developed by **Pilotage Business Consultants (Pvt) Ltd** · www.pilotage.co.zw · info@pilotage.co.zw · +263 716 572 205._
The developer credit appears inside the app (Home and Settings → About) only; it is never printed on quotations, invoices, BOQs or their PDFs.

## Features
- Quotations, invoices and BOQs with sections/bills, line items (qty × rate), discount, VAT, BOQ contingency
- Branded A4 PDF (approved logo & colours): download, share (WhatsApp, email, Drive) straight from the phone
- BOQ: numbered bills (1.1, 1.2 …), bill totals carried to a Summary of Bills, grand total
- Quote → Invoice and BOQ → Quote/Invoice conversion, duplicate, status tracking
- Invoice payments (Cash, Bank transfer, EcoCash, InnBucks, Swipe …) with balance due and overdue flags
- Clients book and reusable price list (materials, labour, services)
- Automatic numbering (QT-2026-0001, INV-2026-0001, BOQ-2026-0001) – prefixes editable
- Settings: company details, logo, banking details, VAT, currency (USD / ZWG / ZAR), default terms
- Authorised signature: upload a photo of the freehand signature in Settings – the background is removed automatically on the phone and the signature is added to every document (can be switched off per document)
- PDFs are named with the client first, e.g. `Mutasa Family Trust - Quotation QT-2026-0001.pdf`
- Paid in full / Cancelled stamps on invoices; numbering restarts each year
- Android back button closes pop-up panels; backup reminder every 14 days
- 100% offline: data is stored on the device (IndexedDB). Backup/restore to a JSON file

## Files
```
index.html               app shell
manifest.webmanifest     PWA manifest (name, icons, colours, shortcuts)
sw.js                    service worker – caches everything for offline use
css/app.css              styles
js/db.js                 on-device database
js/core.js               calculations, numbering, defaults
js/pdf.js                branded PDF generator
js/app.js                screens and logic
vendor/                  jsPDF + AutoTable (bundled, no internet needed)
assets/                  logos and app icons
```

## 1. Publish on GitHub Pages
1. Create a new **public** repository, e.g. `crafted-quarters-docs`.
2. Upload **all files and folders in this package** to the root of the repo (keep the folder structure,
   including the empty `.nojekyll` file).
3. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)` → Save.
4. After a minute the app is live at `https://<your-username>.github.io/crafted-quarters-docs/`.
   Open it once in Chrome to check it loads.

## 2. Build the Android app with PWABuilder
1. Go to **https://www.pwabuilder.com**, paste the GitHub Pages URL and click **Start**.
2. The report should show the manifest and service worker as valid. Click **Package For Stores → Android → Generate Package**.
   - Package ID: e.g. `zw.co.craftedquarters.docs`
   - App name: `Crafted Quarters Docs`, launcher name `CQ Docs`
   - Keep *Signing key: Create new* the first time. **Keep the downloaded `signing.keystore` and the passwords safe** –
     you need the same key for every future update.
3. Unzip the download. Install the `.apk` on phones directly (allow "Install unknown apps"), or upload the `.aab` to Google Play.
4. To remove the browser address bar inside the app, upload the `assetlinks.json` from the PWABuilder zip to
   `.well-known/assetlinks.json` in the repo and redeploy.

## Updating the app
Edit files in GitHub, then **change `CACHE` in `sw.js`** (e.g. `cq-docs-v1.0.1`) so phones pick up the new version.
Installed apps update automatically the next time they open with internet; data on the phone is not affected.

## Data & backups
All records live only on the phone. Use **Settings → Export backup** regularly and keep the file safely
(Google Drive / email). **Restore backup** on a new phone to move everything across.
Uninstalling the app or clearing Chrome's site data erases the records on that phone.
