const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createCanvas } = require('@napi-rs/canvas');
const XLSX = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ledgerlens-benchmark-'));
process.env.OCR_DATA_DIR = path.join(TEMP, 'data');
process.env.OCR_UPLOAD_DIR = path.join(TEMP, 'uploads');
process.env.MAX_OCR_PAGES = '1000';
delete process.env.OPENAI_API_KEY;
const { initDatabase, handle } = require('../api');

function makeInvoiceImage() {
  const canvas = createCanvas(1500, 1100); const context = canvas.getContext('2d');
  context.fillStyle = '#fff'; context.fillRect(0, 0, 1500, 1100); context.fillStyle = '#111';
  context.font = 'bold 72px Arial'; context.fillText('INVOICE', 100, 130);
  context.font = '48px Arial';
  [
    'Invoice Number: IMG-2026-77', 'Invoice Date: 2026-10-12', 'Supplier: OCR Test Supplies',
    'Customer: Pixel Studio', 'Subtotal: $200.00', 'Tax: $20.00', 'Total: $220.00', 'Currency: USD',
  ].forEach((line, index) => context.fillText(line, 100, 240 + index * 95));
  return canvas.toBuffer('image/png');
}

function makeWorkbook() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['Invoice Number', 'Invoice Date', 'Supplier', 'Customer', 'Subtotal', 'Tax', 'Total', 'Currency'],
    ['XLSX-2026-04', '2026-10-24', 'Juniper Office Mart', 'Cobalt Design', 1250, 125, 1375, 'USD'],
  ]), 'Invoice');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['Description', 'Quantity', 'Unit Price', 'Amount'],
    ['Sample office kits', 1, 750, 750],
    ['Shipping and handling', 2, 250, 500],
  ]), 'Items');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

const demoExpected = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation', 'demo-sample-results.json'), 'utf8'))[0].expected;
const scannedExpected = { invoiceNumber: 'SCAN-2026', invoiceDate: '2026-10-20', supplierName: 'Riverbend Paper Co.', customerName: 'Bluebird Studio', subtotal: 100, tax: 10, total: 110, currency: 'USD', lineItems: [] };
const mixedExpected = { invoiceNumber: 'PAGE-2026-01', invoiceDate: '2026-10-21', supplierName: 'Cedar Lane Services', customerName: 'Harbor Demo Works', subtotal: 200, tax: 20, total: 220, currency: 'USD', lineItems: [] };
const xlsxExpected = { invoiceNumber: 'XLSX-2026-04', invoiceDate: '2026-10-24', supplierName: 'Juniper Office Mart', customerName: 'Cobalt Design', subtotal: 1250, tax: 125, total: 1375, currency: 'USD', lineItems: [{ description: 'Sample office kits', quantity: 1, amount: 750 }, { description: 'Shipping and handling', quantity: 2, amount: 500 }] };
const csvExpected = { invoiceNumber: 'CSV-2026-09', invoiceDate: '2026-10-25', supplierName: 'Fieldstone Kitchen Ltd', customerName: 'Orbit Design', subtotal: 450, tax: 45, total: 495, currency: 'USD', lineItems: [] };
const imageExpected = { invoiceNumber: 'IMG-2026-77', invoiceDate: '2026-10-12', supplierName: 'OCR Test Supplies', customerName: 'Pixel Studio', subtotal: 200, tax: 20, total: 220, currency: 'USD', lineItems: [] };

async function run() {
  await initDatabase();
  const cachedLanguage = path.join(ROOT, 'data', 'tessdata', 'eng.traineddata');
  if (fs.existsSync(cachedLanguage)) fs.copyFileSync(cachedLanguage, path.join(process.env.OCR_DATA_DIR, 'tessdata', 'eng.traineddata'));
  const server = http.createServer((req, res) => Promise.resolve(handle(req, res)).catch(error => { if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: error.message })); } }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const fixtures = [
    { name: 'demo-invoice.pdf', type: 'application/pdf', buffer: fs.readFileSync(path.join(ROOT, 'evaluation', 'samples', 'demo-invoice.pdf')), expected: demoExpected },
    { name: 'scanned-invoice.pdf', type: 'application/pdf', buffer: fs.readFileSync(path.join(ROOT, 'evaluation', 'samples', 'scanned-invoice.pdf')), expected: scannedExpected },
    { name: 'multipage-mixed-invoice.pdf', type: 'application/pdf', buffer: fs.readFileSync(path.join(ROOT, 'evaluation', 'samples', 'multipage-mixed-invoice.pdf')), expected: mixedExpected },
    { name: 'invoice.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: makeWorkbook(), expected: xlsxExpected },
    { name: 'invoice.csv', type: 'text/csv', buffer: Buffer.from('Invoice Number,Invoice Date,Supplier,Customer,Subtotal,Tax,Total,Currency\nCSV-2026-09,2026-10-25,Fieldstone Kitchen Ltd,Orbit Design,450,45,495,USD'), expected: csvExpected },
    { name: 'invoice.png', type: 'image/png', buffer: makeInvoiceImage(), expected: imageExpected },
    { name: 'corrupted.pdf', type: 'application/pdf', buffer: Buffer.from('not a PDF document'), expected: null },
  ];
  const records = [];
  try {
    for (const fixture of fixtures) {
      const response = await fetch(`${base}/api/documents?filename=${encodeURIComponent(fixture.name)}`, { method: 'POST', headers: { 'content-type': fixture.type }, body: fixture.buffer });
      if (response.status !== 202) throw new Error(`Upload failed for ${fixture.name}: ${response.status} ${(await response.text()).slice(0, 200)}`);
      const accepted = await response.json(); let detail;
      for (let attempt = 0; attempt < 200; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const result = await fetch(`${base}/api/documents/${accepted.document.id}`);
        if (!result.ok) throw new Error(`Could not read processing result for ${fixture.name}.`);
        detail = (await result.json()).document;
        if (detail.status !== 'Processing') break;
      }
      const processingStatus = detail.status === 'Failed' ? 'failed' : 'completed';
      if (fixture.expected && processingStatus !== 'completed') throw new Error(`${fixture.name} failed: ${detail.error || detail.reviewReason || 'unknown processing error'}`);
      if (!fixture.expected && processingStatus !== 'failed') throw new Error('The corrupted-PDF failure case unexpectedly succeeded.');
      records.push({ documentId: fixture.name, fileType: path.extname(fixture.name).slice(1), expected: fixture.expected || undefined, extracted: detail.fields || {}, processingStatus, processingMs: Number(detail.processingMs || 0) });
      console.log(`${fixture.name}: ${processingStatus}, ${detail.processingMs || 0} ms`);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(TEMP, { recursive: true, force: true });
  }
  const output = path.join(ROOT, 'evaluation', 'synthetic-benchmark-results.json');
  fs.writeFileSync(output, `${JSON.stringify(records, null, 2)}\n`);
  console.log(`Wrote ${records.length} labeled records to ${path.relative(ROOT, output)}.`);
}

run().catch(error => { console.error(error); process.exitCode = 1; });
