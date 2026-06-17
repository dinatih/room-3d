const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser for animation comparison...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(msg.text());
  });

  // Load lara_xbot_debug.html served by Vite
  await page.goto('http://localhost:5175/lara_xbot_debug.html', { waitUntil: 'load', timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log("Injecting comparison script in page module context...");
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

      console.log("=== BROWSER MODULE: STARTING COMPARISON ===");
      
      const loader = new GLTFLoader();
      
      async function run() {
        try {
          // 1. Load X-Bot official (containing native/embedded animations)
          const xbot = await new Promise((res, rej) => {
            loader.load('media/sandbox/Xbot_official.glb', res, undefined, rej);
          });
          
          // 2. Load Mixamo walking (containing external animations)
          const externalWalk = await new Promise((res, rej) => {
            loader.load('media/sandbox/anim_walking.glb', res, undefined, rej);
          });

          console.log("");
          console.log("--- EMBEDDED ANIMATIONS IN X-Bot official (" + xbot.animations.length + " clips) ---");
          xbot.animations.forEach((clip, index) => {
            console.log("Clip " + index + ": name=\\"" + clip.name + "\\", duration=" + clip.duration.toFixed(2) + "s, tracks=" + clip.tracks.length);
            
            // Look at hips tracks
            const hipsPos = clip.tracks.find(t => t.name.includes('Hips.position'));
            const hipsRot = clip.tracks.find(t => t.name.includes('Hips.quaternion'));
            const hipsScale = clip.tracks.find(t => t.name.includes('Hips.scale'));
            
            console.log("  - Hips position: " + (hipsPos ? "found (length=" + hipsPos.values.length + ", first=[" + hipsPos.values[0].toFixed(3) + ", " + hipsPos.values[1].toFixed(3) + ", " + hipsPos.values[2].toFixed(3) + "])" : "NOT found"));
            console.log("  - Hips rotation: " + (hipsRot ? "found (length=" + hipsRot.values.length + ")" : "NOT found"));
            console.log("  - Hips scale: " + (hipsScale ? "found (length=" + hipsScale.values.length + ")" : "NOT found"));
            
            // Count track types
            let posTracks = 0, rotTracks = 0, scaleTracks = 0;
            clip.tracks.forEach(t => {
              if (t.name.endsWith('.position')) posTracks++;
              else if (t.name.endsWith('.quaternion')) rotTracks++;
              else if (t.name.endsWith('.scale')) scaleTracks++;
            });
            console.log("  - Tracks by type: position=" + posTracks + ", quaternion=" + rotTracks + ", scale=" + scaleTracks);
          });

          console.log("");
          console.log("--- EXTERNAL MIXAMO WALKING (anim_walking.glb) (" + externalWalk.animations.length + " clips) ---");
          externalWalk.animations.forEach((clip, index) => {
            console.log("Clip " + index + ": name=\\"" + clip.name + "\\", duration=" + clip.duration.toFixed(2) + "s, tracks=" + clip.tracks.length);
            
            const hipsPos = clip.tracks.find(t => t.name.includes('Hips.position') || t.name.includes('Hips_position'));
            const hipsRot = clip.tracks.find(t => t.name.includes('Hips.quaternion') || t.name.includes('Hips_quaternion'));
            const hipsScale = clip.tracks.find(t => t.name.includes('Hips.scale'));
            
            console.log("  - Hips position: " + (hipsPos ? "found (length=" + hipsPos.values.length + ", first=[" + hipsPos.values[0].toFixed(3) + ", " + hipsPos.values[1].toFixed(3) + ", " + hipsPos.values[2].toFixed(3) + "])" : "NOT found"));
            console.log("  - Hips rotation: " + (hipsRot ? "found (length=" + hipsRot.values.length + ")" : "NOT found"));
            console.log("  - Hips scale: " + (hipsScale ? "found (length=" + hipsScale.values.length + ")" : "NOT found"));
            
            let posTracks = 0, rotTracks = 0, scaleTracks = 0;
            clip.tracks.forEach(t => {
              if (t.name.endsWith('.position') || t.name.includes('_position')) posTracks++;
              else if (t.name.endsWith('.quaternion') || t.name.includes('_quaternion')) rotTracks++;
              else if (t.name.endsWith('.scale') || t.name.includes('_scale')) scaleTracks++;
            });
            console.log("  - Tracks by type: position=" + posTracks + ", quaternion=" + rotTracks + ", scale=" + scaleTracks);
          });

          console.log("");
          console.log("=== BROWSER MODULE: COMPARISON COMPLETED ===");
          window.comparisonDone = true;
        } catch (e) {
          console.error("Error in browser module run:", e);
          window.comparisonDone = true;
        }
      }
      run();
    `;
    document.body.appendChild(script);
  });

  // Wait for window.comparisonDone to be true
  await page.waitForFunction(() => window.comparisonDone === true, { timeout: 15000 });

  await browser.close();
})();
