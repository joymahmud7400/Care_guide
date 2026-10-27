# LedgerLens OCR

An end-to-end local document intelligence app for uploading business documents, extracting invoice data, validating it, and reviewing uncertain results.

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

- First launch opens a one-owner sign-in screen with local email/password authentication; optional Google OAuth login is available when configured. Workspace API data is protected by server sessions. See `AUTHENTICATION.md`.

- React interface with multi-file upload for PDF, JPG, PNG, TIFF, XLSX, XLS, and CSV (25 MB per file by default).
- Text extraction from digital PDFs; page-by-page Tesseract OCR for scanned or low-text PDF pages, including mixed PDFs; Tesseract OCR for images; all-sheet spreadsheet parsing; CSV parsing.
- In-process background jobs, document classification (invoice / not invoice / unclear), extracted text, review reasons, and processing history.
- Invoice fields: number, date, supplier, customer, subtotal, tax, total, currency, and line items. Unknown fields stay blank.
- Validation for missing fields, invalid amounts, subtotal/tax/total inconsistencies, line-item totals, and likely duplicate invoices.
- Review drawer to open the original file, inspect extracted text and history, correct fields, change document type, and retry failed jobs.
- Cross-check 2 to 10 completed invoice documents side by side, including PDF-to-PDF and PDF-to-spreadsheet comparisons; missing values and conflicting header or line-item totals are flagged.
- SQLite persistence in `data/ledgerlens.sqlite`; uploaded files in `uploads/`.
- Keyword search without credentials. Optional semantic search and LLM-assisted extraction when configured with an OpenAI API key.
- API routes: `GET /api/health`, `GET /api/auth/config`, `GET /api/auth/me`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/google` (when configured), `GET /api/metrics`, `GET /api/documents`, `POST /api/documents?filename=...`, `GET /api/documents/:id`, `GET /api/documents/:id/file`, `PATCH /api/documents/:id`, `POST /api/documents/:id/reprocess`, `GET /api/search?q=...`, and `POST /api/compare` with `{ "documentIds": ["id-1", "id-2"] }`. The compare endpoint accepts 2-10 completed invoice documents and reports matching, missing, or conflicting values. All document, search, upload, and review APIs require a signed-in session; `/api/health` remains public.
- Architecture and data flow in `ARCHITECTURE.md`.
- Fictional test invoice in `evaluation/samples/demo-invoice.pdf` and its observed extraction in `evaluation/demo-sample-results.json`.

## Sign-in and Google login

On first launch, create the one local owner account using your email and a password with at least 12 characters. Later visits use that email and password. Passwords are stored as salted scrypt hashes; there is no password reset or email verification yet.

Google sign-in is optional. To enable it, create a Google OAuth Web application client, set the authorized origin to `http://localhost:3000` and the redirect URI to `http://localhost:3000/api/auth/google/callback`, copy `.env.example` to `.env`, and enter the client ID and secret. Restart with `npm start`. Never commit `.env` or share the client secret. Full steps are in `AUTHENTICATION.md`.

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

This local prototype has Admin and Employee roles. The first account becomes Admin and sets a PIN. Admins can create Employee accounts and view all invoices; Employees can access only documents they upload. Account roles and document ownership are enforced by the API. The API binds to `127.0.0.1` by default. Password reset, encrypted storage at rest, a hosted database, and a distributed job queue are not included; one local worker processes queued jobs. OpenAI extraction and semantic search require your API credentials. Review important invoice results before using them for accounting. Do not expose the local server to the public internet.

The local homepage (`http://localhost:3000/`) is Al Mahamud's portfolio landing page. Open the invoice application from its **Explore LedgerLens** link, or visit `http://localhost:3000/app` directly.
