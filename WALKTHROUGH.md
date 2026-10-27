# Walkthrough recording guide

The application and the fictional demo invoice are ready at `http://localhost:3000`. This 2-3 minute recording uses only that invoice. It avoids the personal CV that may also appear in the local document list.

## Prepare the screen

1. If LedgerLens is not already open, start it from PowerShell:

   ```powershell
   cd C:\Users\asltr\Documents\OCR
   npm start
   ```

2. In Chrome, open `http://localhost:3000`.
3. Choose the **Completed** filter, then search for `DEMO-2026-001` so the recording shows only the fictional invoice.
4. Open `demo-invoice.pdf`. Check that the fields and two line items are visible in the review panel.
5. Start a screen recording with Xbox Game Bar (`Win+Alt+R`) or your preferred recorder. Record the Chrome window only, with microphone narration off unless you want to speak.

## Suggested narration and demo

Say: “This is LedgerLens, a local document intelligence application. It accepts PDF, image, Excel, and CSV files, extracts invoice details, validates totals, and stores results on this computer.”

Show the demo invoice fields and line items. Say: “This fictional invoice was processed locally. The system found invoice number DEMO-2026-001, supplier Northstar Demo Supplies, subtotal 1,250 dollars, tax 125 dollars, and total 1,375 dollars. It found both line items and reports no validation issues.”

Open the original-document link and extracted-text section, then return to the review panel. Say: “A reviewer can inspect the original source, edit extracted values, and save corrections. Processing history is kept with each document.”

If at least two completed invoice documents are available, select the demo invoice and a matching spreadsheet invoice, then click **Cross-check selected**. Show the field comparison and, if you have a safe synthetic example with a changed total, point out that the mismatch is flagged. Say: “Cross-checking compares extracted header values across PDFs and spreadsheets and marks missing or conflicting values for review.”

Use the search box for `DEMO-2026-001`. Say: “Documents can be searched by invoice number or supplier. Keyword search works without credentials. OpenAI extraction and semantic search are optional and require an API key; they are not enabled in this demonstration.”

Finish with: “The automated suite currently has 26 passing tests. The evaluation report includes a controlled seven-file synthetic benchmark; a real labeled dataset is still needed to estimate production accuracy.”

Stop the recording with the same recorder control. On Windows, Game Bar saves captures under `Videos\Captures`. Before submitting, replay the video and confirm that no private documents or API keys are visible.

## Current verification

The latest automated run has 26 passing tests and the production frontend build succeeds. `npm run benchmark` runs a controlled seven-file synthetic set; see `EVALUATION_REPORT.md` for measured results and limitations. A separate real, human-labeled invoice dataset is still required to support a representative accuracy claim.
