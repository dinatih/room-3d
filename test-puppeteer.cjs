const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching chrome...");
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Rendre les logs de la page visibles dans notre terminal
  page.on('console', msg => {
    if (msg.text().includes('UNMERGE') || msg.text().includes('COLLECTED')) {
      console.log('PAGE LOG:', msg.text());
    }
  });

  console.log("Navigating to local server...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  console.log("Waiting for 3D scene to load...");
  await page.waitForTimeout(5000); // laisser le temps de charger

  // Trouver le bouton "Tombée (Pro)" et cliquer dessus
  console.log("Clicking 'Tombée (Pro)'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.innerText.includes('Pro') || b.innerText.includes('Tombée'));
    if (btn) btn.click();
    else console.log("Bouton non trouvé!");
  });

  await page.waitForTimeout(2000); // attendre que l'animation commence
  
  await browser.close();
  console.log("Done.");
})();
