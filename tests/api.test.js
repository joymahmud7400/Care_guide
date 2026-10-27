const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const XLSX = require('xlsx');
const { createCanvas } = require('@napi-rs/canvas');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledgerlens-api-test-'));
process.env.OCR_DATA_DIR = path.join(tempDir, 'data'); process.env.OCR_UPLOAD_DIR = path.join(tempDir, 'uploads'); process.env.GOOGLE_CLIENT_ID = ''; process.env.GOOGLE_CLIENT_SECRET = '';
const { handle, initDatabase } = require('../api');

let server; let base; let authCookie = '';
async function apiFetch(url, options = {}) { const headers = new Headers(options.headers || {}); if (authCookie) headers.set('cookie', authCookie); const response = await globalThis.fetch(url, { ...options, headers }); const cookie = response.headers.get('set-cookie'); if (cookie) authCookie = cookie.split(';')[0]; return response; }

test.before(async () => {
  await initDatabase();
  const cachedLanguage = path.join(__dirname, '..', 'data', 'tessdata', 'eng.traineddata');
  if (fs.existsSync(cachedLanguage)) fs.copyFileSync(cachedLanguage, path.join(tempDir, 'data', 'tessdata', 'eng.traineddata'));
  server = http.createServer((req, res) => Promise.resolve(handle(req, res)).catch(error => { res.writeHead(500); res.end(error.message); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { if (server) await new Promise(resolve => server.close(resolve)); fs.rmSync(tempDir, { recursive: true, force: true }); });

test('local account registration creates a session and protects workspace data', async () => {
  const config = await globalThis.fetch(base + '/api/auth/config'); const settings = await config.json();
  assert.equal(config.status, 200); assert.equal(settings.registrationAvailable, true); assert.equal(settings.googleLoginAvailable, false);
  const anonymous = await globalThis.fetch(base + '/api/documents'); assert.equal(anonymous.status, 401);
  const crossSite = await globalThis.fetch(base + '/api/auth/register', { method: 'POST', headers: { origin: 'http://evil.example', 'content-type': 'application/json' }, body: JSON.stringify({ email: 'evil@gmail.com', password: 'a-long-test-password' }) }); assert.equal(crossSite.status, 403);
  const weakPassword = await globalThis.fetch(base + '/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'owner@gmail.com', password: 'short' }) }); assert.equal(weakPassword.status, 400);
  assert.equal((await globalThis.fetch(base + '/api/search?q=invoice')).status, 401);
  const signup = await globalThis.fetch(base + '/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'owner@gmail.com', name: 'Workspace Owner', password: 'a-very-long-test-password' }) });
  assert.equal(signup.status, 201); authCookie = signup.headers.get('set-cookie').split(';')[0];
  const me = await apiFetch(base + '/api/auth/me'); const signedIn = await me.json();
  assert.equal(signedIn.user.email, 'owner@gmail.com'); assert.equal(signedIn.user.name, 'Workspace Owner');
  assert.equal((await apiFetch(base + '/api/documents')).status, 200);
  const second = await globalThis.fetch(base + '/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'other@gmail.com', password: 'another-long-password' }) });
  assert.equal(second.status, 201);
});

test('password login, logout, and disabled Google setup behave safely', async () => {
  const wrong = await apiFetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'owner@gmail.com', password: 'wrong-password-123' }) });
  assert.equal(wrong.status, 401);
  const logout = await apiFetch(base + '/api/auth/logout', { method: 'POST' }); assert.equal(logout.status, 200);
  const signedOut = await apiFetch(base + '/api/auth/me'); assert.equal((await signedOut.json()).user, null);
  assert.equal((await globalThis.fetch(base + '/api/documents')).status, 401);
  const login = await apiFetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: ' OWNER@gmail.com ', password: 'a-very-long-test-password' }) });
  assert.equal(login.status, 200); assert.equal((await login.json()).user.email, 'owner@gmail.com');
  const google = await globalThis.fetch(base + '/api/auth/google', { redirect: 'manual' }); assert.equal(google.status, 503);
});

test('Google OAuth start uses state and a loopback callback', async () => {
  process.env.GOOGLE_CLIENT_ID = 'test-client-id'; process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  try {
    const start = await globalThis.fetch(base + '/api/auth/google', { redirect: 'manual' });
    assert.equal(start.status, 302);
    const destination = new URL(start.headers.get('location'));
    assert.equal(destination.origin, 'https://accounts.google.com');
    assert.equal(destination.searchParams.get('scope'), 'openid email profile');
    assert.equal(destination.searchParams.get('redirect_uri'), 'http://localhost:3000/api/auth/google/callback');
    assert.equal(destination.searchParams.get('code_challenge_method'), 'S256');
    const cookie = start.headers.get('set-cookie').split(';')[0];
    const callback = await globalThis.fetch(base + '/api/auth/google/callback?state=forged&code=fake', { headers: { cookie }, redirect: 'manual' });
    assert.equal(callback.status, 302); assert.equal(callback.headers.get('location'), '/?authError=google-signin-failed');
  } finally { delete process.env.GOOGLE_CLIENT_ID; delete process.env.GOOGLE_CLIENT_SECRET; }
});

test('health endpoint reports a running API', async () => {
  const response = await apiFetch(`${base}/api/health`); const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.status, 'ok');
});

test('upload API rejects unsupported file types with a useful message', async () => {
  const response = await apiFetch(`${base}/api/documents?filename=bad.exe`, { method: 'POST', body: 'fake' }); const body = await response.json();
  assert.equal(response.status, 415); assert.match(body.error, /Supported files/);
});

test('upload API rejects empty supported files', async () => {
  const response = await apiFetch(`${base}/api/documents?filename=empty.pdf`, { method: 'POST', body: '' }); const body = await response.json();
  assert.equal(response.status, 400); assert.match(body.error, /empty/);
});

test('upload is processed, saved in SQLite, and returns extracted invoice fields', async () => {
  const csv = 'Invoice Number,Invoice Date,Supplier,Subtotal,Tax,Total\nINV-1001,2026-10-01,Northwind,100.00,10.00,110.00';
  const response = await apiFetch(`${base}/api/documents?filename=invoice.csv`, { method: 'POST', headers: { 'content-type': 'text/csv' }, body: csv }); const accepted = await response.json();
  assert.equal(response.status, 202);
  let doc;
  for (let i = 0; i < 40; i++) { await new Promise(resolve => setTimeout(resolve, 100)); const result = await apiFetch(`${base}/api/documents/${accepted.document.id}`); doc = (await result.json()).document; if (doc.status !== 'Processing') break; }
  assert.equal(doc.status, 'Completed'); assert.equal(doc.fields.invoiceNumber, 'INV-1001'); assert.equal(doc.fields.supplierName, 'Northwind'); assert.equal(doc.fields.total, 110);
});

async function uploadAndWait(filename, buffer, contentType) {
  const response = await apiFetch(`${base}/api/documents?filename=${encodeURIComponent(filename)}`, { method: 'POST', headers: { 'content-type': contentType }, body: buffer });
  assert.equal(response.status, 202); const accepted = await response.json(); let doc;
  for (let i = 0; i < 100; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const result = await apiFetch(`${base}/api/documents/${accepted.document.id}`); doc = (await result.json()).document;
    if (!['Processing', 'queued'].includes(doc.status)) break;
  }
  assert.ok(doc && !['Processing', 'queued'].includes(doc.status), `${filename} did not finish processing`);
  return doc;
}

test('digital PDF invoice extracts labeled fields, persists the file, supports review, retry, and search', async () => {
  const fixture = fs.readFileSync(path.join(__dirname, '..', 'evaluation', 'samples', 'demo-invoice.pdf'));
  const doc = await uploadAndWait('demo-invoice.pdf', fixture, 'application/pdf');
  assert.equal(doc.status, 'Completed'); assert.equal(doc.documentType, 'invoice');
  assert.deepEqual({ invoiceNumber: doc.fields.invoiceNumber, invoiceDate: doc.fields.invoiceDate, supplierName: doc.fields.supplierName, customerName: doc.fields.customerName, subtotal: doc.fields.subtotal, tax: doc.fields.tax, total: doc.fields.total, currency: doc.fields.currency }, { invoiceNumber: 'DEMO-2026-001', invoiceDate: '2026-10-27', supplierName: 'Northstar Demo Supplies', customerName: 'Acme Demo Studio', subtotal: 1250, tax: 125, total: 1375, currency: 'USD' });
  assert.deepEqual(doc.fields.lineItems, [{ description: 'Sample office kits', quantity: 1, amount: 750 }, { description: 'Shipping and handling', quantity: 2, amount: 500 }]);
  assert.deepEqual(doc.validationErrors, []); assert.equal(doc.fileAvailable, true);
  const original = await apiFetch(`${base}/api/documents/${doc.id}/file`); assert.equal(original.status, 200); assert.match(original.headers.get('content-type'), /application\/pdf/);
  const corrected = await apiFetch(`${base}/api/documents/${doc.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: { customerName: 'Acme Test Studio' }, documentType: 'invoice' }) });
  assert.equal(corrected.status, 200); assert.equal((await corrected.json()).document.fields.customerName, 'Acme Test Studio');
  const search = await apiFetch(`${base}/api/search?q=DEMO-2026-001`); assert.ok((await search.json()).results.some(item => item.id === doc.id));
  const retry = await apiFetch(`${base}/api/documents/${doc.id}/reprocess`, { method: 'POST' }); assert.equal(retry.status, 202);
  let processedAgain;
  for (let i = 0; i < 100; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    processedAgain = (await (await apiFetch(`${base}/api/documents/${doc.id}`)).json()).document;
    if (processedAgain.status === 'Completed' && processedAgain.history.at(-1)?.status === 'completed') break;
  }
  assert.equal(processedAgain.status, 'Completed'); assert.equal(processedAgain.fields.customerName, 'Acme Demo Studio');
  assert.ok(processedAgain.history.filter(entry => entry.status === 'completed').length >= 2);
});

test('XLSX upload parses every sheet and extracts invoice values', async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Invoice Number', 'Invoice Date', 'Supplier', 'Subtotal', 'Tax', 'Total'], ['SHEET-9', '2026-10-02', 'Sheet Supplier', 80, 8, 88]]), 'Invoice');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Notes'], ['Imported from test']]), 'Notes');
  const doc = await uploadAndWait('invoice.xlsx', XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.equal(doc.status, 'Completed'); assert.equal(doc.documentType, 'invoice'); assert.equal(doc.fields.invoiceNumber, 'SHEET-9'); assert.equal(doc.fields.supplierName, 'Sheet Supplier'); assert.equal(doc.fields.total, 88);
});

test('cross-check compares PDF-to-PDF and PDF-to-Excel invoices and flags conflicts', async () => {
  const fixture = fs.readFileSync(path.join(__dirname, '..', 'evaluation', 'samples', 'demo-invoice.pdf'));
  const pdf = await uploadAndWait('cross-check.pdf', fixture, 'application/pdf');
  const pdfCopy = await uploadAndWait('cross-check-copy.pdf', fixture, 'application/pdf');
  const pdfMatches = await apiFetch(`${base}/api/compare`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ documentIds: [pdf.id, pdfCopy.id] }) });
  assert.equal(pdfMatches.status, 200); const pdfResult = await pdfMatches.json();
  assert.equal(pdfResult.status, 'match'); assert.equal(pdfResult.summary.mismatches, 0);

  const headers = ['Invoice Number', 'Invoice Date', 'Supplier', 'Customer', 'Subtotal', 'Tax', 'Total', 'Currency'];
  const makeWorkbook = total => { const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers, ['DEMO-2026-001', '2026-10-27', 'Northstar Demo Supplies', 'Acme Demo Studio', 1250, 125, total, 'USD']]), 'Invoice'); XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Description', 'Quantity', 'Unit Price', 'Amount'], ['Sample office kits', 1, 750, 750], ['Shipping and handling', 2, 250, 500]]), 'Items'); return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }); };
  const sheet = await uploadAndWait('cross-check.xlsx', makeWorkbook(1375), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const matches = await apiFetch(`${base}/api/compare`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ documentIds: [pdf.id, sheet.id] }) });
  assert.equal(matches.status, 200); const matching = await matches.json();
  assert.equal(matching.status, 'match'); assert.equal(matching.summary.mismatches, 0);
  assert.equal(matching.comparisons.find(item => item.field === 'invoiceNumber').status, 'match');
  assert.equal(matching.comparisons.find(item => item.field === 'total').status, 'match');
  assert.equal(matching.comparisons.find(item => item.field === 'lineItemsSubtotal').status, 'match');
  const altered = await uploadAndWait('cross-check-altered.xlsx', makeWorkbook(1400), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const mismatch = await apiFetch(`${base}/api/compare`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ documentIds: [pdf.id, altered.id] }) });
  assert.equal(mismatch.status, 200); const result = await mismatch.json();
  assert.equal(result.status, 'mismatch'); assert.ok(result.comparisons.some(item => item.field === 'total' && item.status === 'mismatch'));
  const invalid = await apiFetch(`${base}/api/compare`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ documentIds: [pdf.id] }) });
  assert.equal(invalid.status, 400);
});

test('scanned PDF invoice is OCRed and its labeled header fields are extracted', async () => {
  const fixture = fs.readFileSync(path.join(__dirname, '..', 'evaluation', 'samples', 'scanned-invoice.pdf'));
  const doc = await uploadAndWait('scanned-invoice.pdf', fixture, 'application/pdf');
  assert.equal(doc.status, 'Completed'); assert.equal(doc.documentType, 'invoice'); assert.match(doc.meta, /1 page/);
  assert.equal(doc.fields.invoiceNumber, 'SCAN-2026'); assert.equal(doc.fields.invoiceDate, '2026-10-20');
  assert.equal(doc.fields.supplierName, 'Riverbend Paper Co.'); assert.equal(doc.fields.customerName, 'Bluebird Studio');
  assert.equal(doc.fields.subtotal, 100); assert.equal(doc.fields.tax, 10); assert.equal(doc.fields.total, 110);
  assert.match(doc.extractedText, /Currency:\s*USD/i);
});

test('mixed digital and scanned two-page invoice processes both pages', async () => {
  const fixture = fs.readFileSync(path.join(__dirname, '..', 'evaluation', 'samples', 'multipage-mixed-invoice.pdf'));
  const doc = await uploadAndWait('multipage-mixed-invoice.pdf', fixture, 'application/pdf');
  assert.equal(doc.status, 'Completed'); assert.equal(doc.documentType, 'invoice'); assert.match(doc.meta, /2 pages/);
  assert.equal(doc.fields.invoiceNumber, 'PAGE-2026-01'); assert.equal(doc.fields.total, 220);
  assert.match(doc.extractedText, /CONTINUED FROM PAGE ONE/i);
});

test('corrupted PDF is recorded as a failed job with a retryable error', async () => {
  const doc = await uploadAndWait('corrupt.pdf', Buffer.from('not a valid PDF'), 'application/pdf');
  assert.equal(doc.status, 'Failed'); assert.ok(doc.error); assert.ok(doc.history.some(entry => entry.status === 'failed'));
});

test('image OCR extracts invoice text when local English language data is available', { skip: !fs.existsSync(path.join(__dirname, '..', 'data', 'tessdata', 'eng.traineddata')) }, async () => {
  const canvas = createCanvas(1500, 850); const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, 1500, 850); context.fillStyle = '#111';
  context.font = 'bold 72px Arial'; context.fillText('INVOICE', 100, 130);
  context.font = '48px Arial';
  ['Invoice Number: OCR-2026-77', 'Invoice Date: 2026-10-12', 'Supplier: OCR Test Supplies', 'Subtotal: $200.00', 'Tax: $20.00', 'Total: $220.00'].forEach((line, index) => context.fillText(line, 100, 240 + index * 85));
  const doc = await uploadAndWait('ocr-invoice.png', canvas.toBuffer('image/png'), 'image/png');
  assert.equal(doc.status, 'Completed'); assert.equal(doc.documentType, 'invoice'); assert.equal(doc.fields.invoiceNumber, 'OCR-2026-77'); assert.equal(doc.fields.supplierName, 'OCR Test Supplies'); assert.equal(doc.fields.total, 220);
});
