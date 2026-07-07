const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    } else if (msg.type() === 'warning') {
      console.log('BROWSER WARN:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('BROWSER PAGE EXCEPTION:', err.toString());
  });

  try {
    await page.goto('http://localhost:5173/test_metarig.html', {waitUntil: 'networkidle2', timeout: 5000});
  } catch (e) {
    console.log('Navigation timeout or error', e.message);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
