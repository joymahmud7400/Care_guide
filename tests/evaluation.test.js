const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { evaluate } = require('../scripts/evaluate');

test('evaluation reports line-item precision, recall, and F1 from labeled records', () => {
  const records = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'evaluation', 'demo-sample-results.json'), 'utf8'));
  const report = evaluate(records);
  assert.equal(report.fieldAccuracy, 100);
  assert.deepEqual(report.lineItems, { labeledRecords: 1, expected: 2, extracted: 2, exactMatches: 2, precision: 100, recall: 100, f1: 100 });
});

test('evaluation penalizes incorrect and missing line items', () => {
  const report = evaluate([{ expected: { lineItems: [{ description: 'A', quantity: 1, amount: 10 }, { description: 'B', quantity: 2, amount: 20 }] }, extracted: { lineItems: [{ description: 'A', quantity: 1, amount: 10 }, { description: 'C', quantity: 1, amount: 30 }] } }]);
  assert.deepEqual(report.lineItems, { labeledRecords: 1, expected: 2, extracted: 2, exactMatches: 1, precision: 50, recall: 50, f1: 50 });
});
