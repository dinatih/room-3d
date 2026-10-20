const path = require('node:path');
const { pathToFileURL } = require('node:url');
const launch = require('./browser-test-options.cjs');
const { writeHistory } = require('../tests/support/visual-gallery.cjs');

(async () => {
    const root = path.resolve('test-results/visual');
    writeHistory(root);
    const browser = await launch({ args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('pageerror', error => errors.push(String(error)));
        page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
        await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
        await page.evaluate(async () => {
            for (const img of document.images) img.loading = 'eager';
            await Promise.all([...document.images].map(img => img.decode()));
        });
        console.log(JSON.stringify({ errors, images: await page.evaluate(() => document.images.length) }));
        if (errors.length) process.exitCode = 1;
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
