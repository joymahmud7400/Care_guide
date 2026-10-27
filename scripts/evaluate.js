const fs = require('node:fs');
const path = require('node:path');
const fields = ['invoiceNumber','invoiceDate','supplierName','customerName','subtotal','tax','total','currency'];
const norm = value => value == null ? '' : String(value).trim().toLowerCase().replace(/[,\s$€£৳]/g, '');
const normNumber = value => value == null || value === '' ? '' : Number.isFinite(Number(value)) ? String(Number(value)) : norm(value);

function evaluate(records) {
  if (!Array.isArray(records) || records.length === 0) throw new Error('Dataset must be a non-empty JSON array.');
  const counts = Object.fromEntries(fields.map(field => [field, { correct: 0, total: 0 }]));
  let success = 0; let failures = 0; let totalMs = 0; let measured = 0;
  let expectedItems = 0; let extractedItems = 0; let correctItems = 0; let labeledItemRecords = 0;
  for (const record of records) {
    if (record.processingStatus === 'failed') failures++;
    if (record.processingStatus === 'completed') success++;
    if (Number.isFinite(record.processingMs)) { totalMs += record.processingMs; measured++; }
    for (const field of fields) { if (!record.expected || !(field in record.expected)) continue; counts[field].total++; if (norm(record.expected[field]) === norm(record.extracted?.[field])) counts[field].correct++; }
    if (Array.isArray(record.expected?.lineItems)) {
      labeledItemRecords++; const expected = record.expected.lineItems; const actual = Array.isArray(record.extracted?.lineItems) ? record.extracted.lineItems : [];
      expectedItems += expected.length; extractedItems += actual.length;
      const key = item => JSON.stringify({ description: norm(item?.description), quantity: normNumber(item?.quantity), amount: normNumber(item?.amount) });
      const unmatched = [...actual];
      for (const item of expected) { const index = unmatched.findIndex(candidate => key(candidate) === key(item)); if (index >= 0) { correctItems++; unmatched.splice(index, 1); } }
    }
  }
  const totalChecks = Object.values(counts).reduce((n, count) => n + count.total, 0); const correct = Object.values(counts).reduce((n, count) => n + count.correct, 0);
  const precision = extractedItems ? correctItems / extractedItems : expectedItems ? 0 : 1;
  const recall = expectedItems ? correctItems / expectedItems : 1;
  const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
  return {
    records: records.length,
    fieldAccuracy: totalChecks ? Number((correct / totalChecks * 100).toFixed(2)) : null,
    perField: Object.fromEntries(fields.map(field => [field, counts[field].total ? Number((counts[field].correct / counts[field].total * 100).toFixed(2)) : null])),
    lineItems: labeledItemRecords ? { labeledRecords: labeledItemRecords, expected: expectedItems, extracted: extractedItems, exactMatches: correctItems, precision: Number((precision * 100).toFixed(2)), recall: Number((recall * 100).toFixed(2)), f1: Number((f1 * 100).toFixed(2)) } : null,
    documentSuccessRate: Number((success / records.length * 100).toFixed(2)),
    documentFailureRate: Number((failures / records.length * 100).toFixed(2)),
    meanProcessingMs: measured ? Math.round(totalMs / measured) : null,
    note: 'Metrics reflect only the labeled records supplied to this run.'
  };
}

if (require.main === module) {
  const file = path.resolve(process.argv[2] || 'evaluation/labeled-dataset.json');
  if (!fs.existsSync(file)) {
    console.error(`Evaluation dataset not found: ${file}`);
    console.error('Copy evaluation/labeled-dataset.example.json, add real labeled examples, and run npm run evaluate -- <path>.');
    process.exit(2);
  }
  try { console.log(JSON.stringify(evaluate(JSON.parse(fs.readFileSync(file, 'utf8'))), null, 2)); }
  catch (error) { console.error(error.message); process.exit(2); }
}

module.exports = { evaluate };
