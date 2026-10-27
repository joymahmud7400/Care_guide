# Evaluation report

## Automated checks

Run `npm test`. The suite covers CSV parsing, invoice/non-invoice classification, field extraction, validation and duplicate detection, AI prompt handling with a mocked API, API health and upload errors, digital, scanned, and mixed two-page PDFs, image OCR (when the local English language cache exists), XLSX parsing, document correction and retry, keyword search, PDF-to-PDF/PDF-to-XLSX comparison, and corrupt-PDF failure handling.

Latest run on 2026-10-27: **26 passed, 0 failed, 0 skipped**. API integration tests use temporary SQLite and upload folders so they do not change the user's real document database. The cross-check test verifies matching PDF-to-PDF and PDF-to-XLSX invoices, then confirms a conflicting spreadsheet total is flagged.

## OCR smoke checks

- The automated scanned-PDF integration test rendered the page and recovered invoice number `SCAN-2026`, supplier, customer, subtotal, tax, and total `110.00`.
- The automated two-page mixed-PDF test confirmed that digital page text and scanned page OCR are both retained; image OCR also passed using the local English language cache.

These checks confirm the OCR paths work; they are not a representative accuracy benchmark.

## Extraction metrics

The controlled demo run in `evaluation/demo-sample-results.json` measured 8/8 exact header-field matches (100%) and 2/2 exact line-item matches (precision 100%, recall 100%, F1 100%). The single digital PDF completed successfully (1/1, 100%; failures 0/1, 0%) in 167 ms without an OpenAI key. This is one fictional, clean-text smoke sample; it is not representative of real-world extraction accuracy or a performance guarantee.

No real human-labeled invoice dataset has been provided, so representative field accuracy and processing performance remain unmeasured. To evaluate a real dataset, prepare a JSON file with expected values, observed extracted values, processing status, and processing time. Start from `evaluation/labeled-dataset.example.json`, replace every example value, and run:

```powershell
npm run evaluate -- evaluation\my-labeled-dataset.json
```

The evaluator reports exact normalized accuracy for each supported header field, mean processing time for supplied timings, and document success/failure rates. Record the dataset size, file mix, OCR/AI configuration, and date alongside the results.

## Synthetic multi-format benchmark

Reproduce the controlled seven-file benchmark with:

```powershell
npm run benchmark
npm run evaluate -- evaluation\synthetic-benchmark-results.json
```

Latest run on 2026-10-27: 7 records (digital PDF, scanned PDF, mixed two-page PDF, XLSX, CSV, PNG, and a deliberately corrupted PDF). All 8 labeled header fields were exact across the supplied labels (100%). Line items were labeled in 6 invoice records: 4 expected, 4 extracted, 4 exact (precision 100%, recall 100%, F1 100%). Six valid inputs succeeded and the deliberately corrupted PDF failed as expected (success 85.71%, failure 14.29%). Mean processing time was 362 ms across all seven records, including the intentionally invalid file. The machine, local cache, and fixture generation make this timing non-generalizable.

These are synthetic, controlled fixtures, not independent real-world invoices. Their perfect scores do not establish production accuracy. No human-labeled real invoice dataset has been provided. See `evaluation/synthetic-benchmark-results.json` for per-file measurements; use the labeled-dataset workflow above for a representative evaluation.
