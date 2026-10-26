if (process.argv.includes('--mirror')) (async () => {
  const fs = require('node:fs');
  fs.mkdirSync('artifacts/mirror-diagnostic', { recursive: true });
  const browser = await require('./browser-test-options.cjs')({ pipe: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error('PAGE ERROR',error.message));
    await page.setViewport({ width: 1000, height: 700 });
    await page.setRequestInterception(true);
    page.on('request', request => request.url().includes('/src/main.tsx') ? request.respond({ status: 200, contentType: 'application/javascript', body: '' }) : request.continue());
    await page.goto('http://127.0.0.1:5173/', {waitUntil:'domcontentloaded'});
    await page.evaluate(async () => {
      const source = await (await fetch('/src/features/scene/items/NissedalMirror.tsx')).text();
      const version = source.match(/react.js(\?v=[^"']+)/)[1];
      const React = (await import('/node_modules/.vite/deps/react.js' + version)).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js' + version)).default;
      const { Canvas } = await import('/node_modules/.vite/deps/@react-three_fiber.js' + version);
      const { NissedalGlbFrame, GLB_40x150 } = await import('/src/features/scene/items/NissedalMirror.tsx');
      const host = document.createElement('div'); host.style.cssText='width:1000px;height:700px';document.body.replaceChildren(host);
      createRoot(host).render(React.createElement(Canvas,{camera:{position:[90,180,170], fov:45, near:0.1},onCreated:({camera,scene})=>{camera.lookAt(0,75,0);window.mirrorScene=scene;}},
        React.createElement('color',{attach:'background',args:['#949aa5']}),React.createElement('ambientLight',{intensity:2}),React.createElement('directionalLight',{position:[100,220,100],intensity:3}),
        React.createElement(React.Suspense,{fallback:null},React.createElement(NissedalGlbFrame,{glb:GLB_40x150}))));
    });
    await page.waitForFunction(()=>window.mirrorScene?.getObjectByProperty('isMesh',true),{timeout:60000});
    await new Promise(resolve=>setTimeout(resolve,1500));
    await page.screenshot({path:'artifacts/mirror-diagnostic/back.png'});
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
