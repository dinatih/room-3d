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
    console.log('Navigating to http://localhost:5176/cyber_sekes_scratch.html...');
    await page.goto('http://localhost:5173/cyber_sekes_scratch.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    console.log('Waiting 3 seconds for initial load...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('Setting visibility and opacity settings for all models...');
    await page.evaluate(() => {
      // Set opacity of reference meshes to 0.75 for clear comparison overlay
      const opRefF = document.getElementById('op-ref-f');
      if (opRefF) {
        opRefF.value = 1.0;
        opRefF.dispatchEvent(new Event('input'));
      }
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

      // Show targets and references
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
        visRefF.checked = true;
        visRefF.dispatchEvent(new Event('change'));
      }
      const visRefM = document.getElementById('vis-ref-m');
      if (visRefM) {
        visRefM.checked = true;
        visRefM.dispatchEvent(new Event('change'));
      }
    });

    console.log('Waiting 1 second...');
    await new Promise(r => setTimeout(r, 1000));

    const screenshotPath = '/home/dinatih/Projects/room-3d/scratch/test_rot_minus90.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);

  } catch (e) {
    console.error('Execution error:', e.message);
  } finally {
    await browser.close();
  }
})();
