const launchBrowser = require('./browser-test-options.cjs');
const fs = require('node:fs');
const path = require('node:path');
function* glbFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* glbFiles(file);
    else if (entry.name.endsWith('.glb')) yield file;
  }
}
(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn' || msg.text().startsWith('TEXTURE_BLOB')) console.log(msg.type(), msg.text());
    });
    page.on('pageerror', err => console.log('PAGE_ERROR', err.message));
    page.on('requestfailed', req => console.log('REQUEST_FAILED', req.url(), req.failure()));
    if (!process.argv.includes('--textures-only')) {
      await page.goto(process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    await page.goto('about:blank');
    let images = 0;
    let failures = 0;
    for (const file of glbFiles('public')) {
      const data = fs.readFileSync(file);
      const jsonLength = data.readUInt32LE(12);
      const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
      const binaryStart = 28 + jsonLength;
      if (json.images?.length) console.log('SCAN_FILE', file);
      for (const [index, image] of (json.images || []).entries()) {
        if (image.bufferView === undefined) continue;
        const view = json.bufferViews[image.bufferView];
        const start = binaryStart + (view.byteOffset || 0);
        const bytes = data.subarray(start, start + view.byteLength).toString('base64');
        const error = await page.evaluate(async (bytes, mimeType) => {
          const blob = await (await fetch(`data:${mimeType};base64,${bytes}`)).blob();
          try {
            const bitmap = await createImageBitmap(blob);
            bitmap.close();
            return null;
          } catch (error) { return error.message; }
        }, bytes, image.mimeType);
        images++;
        if (error) {
          failures++;
          console.log('INVALID_TEXTURE', file, index, image.mimeType, view.byteLength, error);
        }
      }
    }
    console.log('TEXTURE_SCAN', { images, failures });
    if (failures) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
