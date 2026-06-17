const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('WALKER_DEBUG')) {
      console.log('BROWSER:', text);
    }
  });

  console.log("Navigating to app...");
  await page.goto('http://localhost:5173/');

  // Wait for XBot to load
  console.log("Waiting for XBot load...");
  await new Promise(r => setTimeout(r, 10000));

  // Inspect actions via browser evaluation
  console.log("Inspecting actions...");
  const actionData = await page.evaluate(() => {
    // We need a way to reach the actions. 
    // Since they are in a React component ref, it's hard.
    // Let's look for logs instead or expose them if I can.
    return "Check logs for 'Actions initialized'";
  });
  console.log(actionData);

  // Switch to walk mode and move
  console.log("Entering walk mode...");
  await page.keyboard.press('m'); 
  await new Promise(r => setTimeout(r, 2000));

  console.log("Checking internal state...");
  const state = await page.evaluate(() => {
    const dw = window.debugWalker;
    if (!dw) return "NOT FOUND";
    return {
        hasActions: Object.keys(dw.actions).length,
        mode: dw.cameraState.mode,
        isMoving: dw.cameraState.isMoving,
        activeWalker: dw.cameraState.activeWalkerIdx
    };
  });
  console.log("State:", state);

  console.log("Forcing movement...");
  await page.evaluate(() => {
    window.debugWalker.cameraState.isMoving = true;
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log("Taking screenshot...");
  await page.screenshot({ path: 'scratch/app_debug_walk.png' });

  // Inspect the internal state of Walker if I can expose it
  // For now, let's just check console logs.
  
  await browser.close();
  console.log("Debug complete.");
})();
