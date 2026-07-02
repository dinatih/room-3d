const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    console.log(`[BROWSER LOG]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]: ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://localhost:5173/cyber_sekes_scratch.html...');
    await page.goto('http://localhost:5173/cyber_sekes_scratch.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    console.log('Waiting 3 seconds for initial load...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('Setting settings for CC Homme...');
    await page.evaluate(() => {
      // Set opacity of CC Homme to 1.0
      const opRefM = document.getElementById('op-ref-m');
      if (opRefM) {
        opRefM.value = 1.0;
        opRefM.dispatchEvent(new Event('input'));
      }

      // Check joint labels
      const labelsCb = document.getElementById('vis-joint-labels');
      if (labelsCb) {
        labelsCb.checked = true;
        labelsCb.dispatchEvent(new Event('change'));
      }

      // Hide targets and female reference for clarity
      const visTargetF = document.getElementById('vis-target-f');
      if (visTargetF) {
        visTargetF.checked = false;
        visTargetF.dispatchEvent(new Event('change'));
      }
      const visTargetM = document.getElementById('vis-target-m');
      if (visTargetM) {
        visTargetM.checked = false;
        visTargetM.dispatchEvent(new Event('change'));
      }
      const visRefF = document.getElementById('vis-ref-f');
      if (visRefF) {
        visRefF.checked = false;
        visRefF.dispatchEvent(new Event('change'));
      }
    });

    console.log('Waiting 1 second...');
    await new Promise(r => setTimeout(r, 1000));

    const screenshotPath = '/home/dinatih/Projects/room-3d/scratch/cyber_sekes_scratch_homme_tpose.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);

  } catch (e) {
    console.error('Execution error:', e.message);
  } finally {
    await browser.close();
  }
})();
