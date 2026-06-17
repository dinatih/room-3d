const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(msg.text());
  });

  await page.goto('http://localhost:5175/lara_xbot_debug.html', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

      const loader = new GLTFLoader();
      
      async function run() {
        try {
          const xbot = await new Promise((res) => {
            loader.load('media/sandbox/Xbot_official.glb', res);
          });
          
          const lara = await new Promise((res) => {
            loader.load('media/sandbox/lara_native.glb', res);
          });

          const xbotBones = [];
          xbot.scene.traverse(o => {
            if (o.isBone) xbotBones.push(o.name);
          });

          const laraBones = [];
          lara.scene.traverse(o => {
            if (o.isBone) laraBones.push(o.name);
          });

          console.log("XBOT_BONES_COUNT: " + xbotBones.length);
          console.log("XBOT_BONES_LIST: " + JSON.stringify(xbotBones));
          console.log("LARA_BONES_COUNT: " + laraBones.length);
          console.log("LARA_BONES_LIST: " + JSON.stringify(laraBones));
          
          window.namesDone = true;
        } catch (e) {
          console.error(e);
          window.namesDone = true;
        }
      }
      run();
    `;
    document.body.appendChild(script);
  });

  await page.waitForFunction(() => window.namesDone === true, { timeout: 15000 });
  await browser.close();
})();
