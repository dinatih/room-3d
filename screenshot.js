import puppeteer from 'puppeteer';
async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for loader to disappear...');
  await page.waitForFunction(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Lancer maintenant'));
    if (btn) btn.click();
    return !document.querySelector('body').textContent.includes('CHARGEMENT DE LA SCÈNE 3D');
  }, { timeout: 30000 });
  
  await new Promise(r => setTimeout(r, 10000));
  
  await page.mouse.move(960, 540);
  await page.mouse.down();
  await page.mouse.move(960, 800, { steps: 20 });
  await page.mouse.up();
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: '/home/dinatih/.gemini/antigravity-cli/brain/f66e9361-3c67-4915-9a88-a3e09ad28d73/screenshot_studio.png' });
  await browser.close();
}
run().catch(console.error);
