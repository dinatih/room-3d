import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('[HairPhysics]')) {
      console.log('PAGE LOG:', msg.text());
    }
  });

  await page.goto('http://localhost:5173');
  
  // Wait for React and Three to render
  await new Promise(r => setTimeout(r, 5000));
  
  // Try to find the bones in Three.js by exposing window.__THREE_SCENE__ or similar
  // The app might not expose it, but let's try
  const res = await page.evaluate(() => {
    // We added a global exposed in Walker.tsx earlier: customHairChainRef
    // Oh wait, we didn't expose it. Let's look for Three.js objects
    let hairMesh = null;
    let valid = false;
    // We can't easily traverse without a root, unless there's a global.
    return "Check complete";
  });
  
  await browser.close();
})();
