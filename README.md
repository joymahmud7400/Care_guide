# LedgerLens OCR

An end-to-end document intelligence app for uploading business documents, extracting invoice data, validating it, and reviewing uncertain results.

## View the live demo (no password or PIN)

1. Open [LedgerLens on Render](https://care-guide.onrender.com).
2. Choose **Admin** to see the whole shared workspace, or **Employee** to see that user's documents.
3. Click a suggested **Admin** or **Employee** name in the quick-start panel; it fills the user field.
4. Click **Continue**. No account creation, password, or PIN is needed for this demo.

This is open demo access: anyone with the link can enter either role. Use fictional sample files only; do not upload private or real business documents. The free hosted service may sleep while idle, and demo data may reset when redeployed.

## Run it on Windows

1. Install Node.js 20 or newer.
2. Open PowerShell and enter: `cd C:\Users\asltr\Documents\OCR`
3. Install project dependencies once: `npm install`
4. Start the app: `npm start` (this builds the React interface, then starts the API)
5. Open `http://localhost:3000` in your browser. Keep the PowerShell window open while using the app. Press `Ctrl+C` there to stop it.

For development with hot reload, run `npm run dev` and open `http://localhost:5173` instead. This starts the API and React development server together.

Do not open `index.html` as a file. Uploading and reviewing use the local API server.

## Try the demo invoice (no Python required)

1. Start LedgerLens using the Windows steps above and leave its PowerShell window open.
2. In the app, click **Upload documents** and select `C:\Users\asltr\Documents\OCR\evaluation\samples\demo-invoice.pdf`.
3. Wait for processing to finish, then open `demo-invoice.pdf` in the document list.
4. Check for invoice number `DEMO-2026-001`, supplier `Northstar Demo Supplies`, subtotal `1250`, tax `125`, total `1375`, and two line items. This fictional invoice should show **Completed** with no validation issues.
5. Use **Save review** only if you change a value. Uploaded documents stay in your local `uploads` folder and results are stored in `data\ledgerlens.sqlite`.

If a field is blank or marked for review on another document, inspect the original and correct it in the review panel. OCR results should be checked before use in accounting.

## Included features

- The hosted demo offers passwordless Admin and Employee role selection with suggested names. Admins can review all workspace documents; Employees see documents assigned to their account. This sign-in is for demonstrations, not private production use.

- React interface with multi-file upload for PDF, JPG, PNG, TIFF, XLSX, XLS, and CSV (25 MB per file by default).
- Text extraction from digital PDFs; page-by-page Tesseract OCR for scanned or low-text PDF pages, including mixed PDFs; Tesseract OCR for images; all-sheet spreadsheet parsing; CSV parsing.
- In-process background jobs, document classification (invoice / not invoice / unclear), extracted text, review reasons, and processing history.
- Invoice fields: number, date, supplier, customer, subtotal, tax, total, currency, and line items. Unknown fields stay blank.
- Validation for missing fields, invalid amounts, subtotal/tax/total inconsistencies, line-item totals, and likely duplicate invoices.
- Review drawer to open the original file, inspect extracted text and history, correct fields, change document type, and retry failed jobs.
- Cross-check 2 to 10 completed invoice documents side by side, including PDF-to-PDF and PDF-to-spreadsheet comparisons; missing values and conflicting header or line-item totals are flagged.
- SQLite persistence in `data/ledgerlens.sqlite`; uploaded files in `uploads/`.
- Keyword search without credentials. Optional semantic search and LLM-assisted extraction when configured with an OpenAI API key.
- API routes: `GET /api/health`, `GET /api/auth/config`, `GET /api/auth/me`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/demo-login`, `POST /api/auth/logout`, `GET /api/auth/google` (when configured), `GET /api/metrics`, `GET /api/documents`, `POST /api/documents?filename=...`, `GET /api/documents/:id`, `GET /api/documents/:id/file`, `PATCH /api/documents/:id`, `POST /api/documents/:id/reprocess`, `GET /api/search?q=...`, and `POST /api/compare` with `{ "documentIds": ["id-1", "id-2"] }`. The compare endpoint accepts 2-10 completed invoice documents and reports matching, missing, or conflicting values. Document, search, upload, and review APIs require a session after entering through the demo sign-in; /api/health remains public. Demo roles do not verify a visitor's identity.
- Architecture and data flow in `ARCHITECTURE.md`.
- Fictional test invoice in `evaluation/samples/demo-invoice.pdf` and its observed extraction in `evaluation/demo-sample-results.json`.

## Demo sign-in

The hosted demo starts with suggested **Admin** and **Employee** users. Choose a role, use the matching suggested name, and continue. Admin can see documents across the shared workspace; Employee sees only documents assigned to that user. Admins may add employees by name and email from **Manage employees**; no password is needed in demo mode.

Because anyone with the public link can select either role, this mode is intended only for instructor or manager demonstrations using fictional data. It does not protect real invoices or verify a visitor's identity. Do not use the hosted demo for confidential documents or production accounting.
## Optional AI setup

In PowerShell, set the key for the current session before starting the app:

```powershell
$env:OPENAI_API_KEY = "your-key"
npm start
```

Optionally set `$env:OPENAI_MODEL` and `$env:EMBEDDING_MODEL`. Never put secrets in frontend files or commit them to GitHub. The app works without a key, using conservative pattern extraction and keyword search. OCR does not require an OpenAI key; Tesseract may download its English language data on first use.

## Tests and evaluation

- Run the automated and API integration tests with `npm test`.
- Reproduce the controlled synthetic multi-format run with `npm run benchmark`, then summarize it with `npm run evaluate -- evaluation\synthetic-benchmark-results.json`. The seven-file result is documented in `EVALUATION_REPORT.md`; it is a synthetic smoke benchmark, not a real-world accuracy estimate.
- Reproduce the controlled sample metrics with `npm run evaluate -- evaluation\demo-sample-results.json`. The single fictional, clean-text sample is a smoke check, not a representative accuracy claim.
- For a real evaluation, copy `evaluation/labeled-dataset.example.json`, replace its example values with measured outputs and human-verified expected values, then run `npm run evaluate -- path\to\your-dataset.json`. The evaluator reports header-field accuracy, line-item precision/recall/F1, processing time, and document success/failure rates.

## Current limits

This is a demonstration prototype. Invoice extraction can miss or misread fields, so review results before using them. The hosted Render service uses temporary local storage unless a persistent disk and database are configured; files and demo records can disappear after redeploys or restarts. The free instance can sleep while idle. OpenAI extraction and semantic search require API credentials. Do not upload real confidential invoices to the public demo.
The local homepage (`http://localhost:3000/`) is Al Mahamud's portfolio landing page. Open the invoice application from its **Explore LedgerLens** link, or visit `http://localhost:3000/app` directly.
