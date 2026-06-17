import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  page.on('pageerror', err => {
    console.error('BROWSER ERROR:', err.message);
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 5000));

  console.log('Toggling Skeleton...');
  await page.evaluate(() => {
    if (window.useSceneStore) {
        window.useSceneStore.getState().toggleLayer('skeleton');
    }
  });

  // Wait a bit to see if it crashes
  await new Promise(r => setTimeout(r, 3000));

  console.log('Taking screenshot...');
  const screenshotPath = path.resolve('scratch/skeleton_crash_check.png');
  await page.screenshot({ path: screenshotPath });

  await browser.close();
})();
