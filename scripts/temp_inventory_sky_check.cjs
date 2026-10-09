const assert = require('node:assert/strict');
const puppeteer = require('../node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    await page.setViewport({width:1100,height:900});
    await page.goto(`${process.argv[2] || 'http://127.0.0.1:5175'}/AGENTS.md`);
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const {createRoot} = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const {InventoryPreview} = await import('/src/features/inventory/InventoryPreview.tsx');
      const {INVENTORY} = await import('/src/features/inventory/inventoryData.ts');
      const {useSceneStore} = await import('/src/features/scene/store/useSceneStore.ts');
      const {_roots} = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      Object.defineProperty(window, 'preview', {get() { return [..._roots.values()][0]?.store.getState(); }});
      window.store = useSceneStore;
      document.body.replaceChildren();
      document.body.style.margin = '0';
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet'; stylesheet.href = '/node_modules/bootstrap/dist/css/bootstrap.min.css';
      document.head.append(stylesheet);
      const host = document.createElement('div'); document.body.append(host);
      useSceneStore.setState({cameraProjection:'perspective',hdriResolution:'8k'});
      createRoot(host).render(React.createElement(InventoryPreview,{item:INVENTORY.find(i=>i.id==='bollsidan30574370'),height:650,width:1000}));
    });
    await page.waitForFunction(() => window.preview?.scene.getObjectByName('SkySphere') && window.preview.scene.getObjectByName('BnfSkyMarker'), {timeout:15000}).catch(async error => { console.log(await page.evaluate(() => ({body:document.body.innerText, canvas:!!document.querySelector('canvas'), preview:!!window.preview, background:window.preview?.scene.background?.type, environment:window.preview?.scene.environment?.type}))); await page.screenshot({path:'/tmp/inventory-sky-debug.png'}); throw error; });
    const inspect = () => page.evaluate(() => {
      const {scene,camera} = window.preview;
      const grids = [];
      scene.traverse(object => { if(object.material?.uniforms?.cellSize) grids.push({uniforms:object.material.uniforms,position:object.position.toArray()}); });
      return {background:scene.background.isColor,backdrop:!!scene.getObjectByName('SkySphere')?.visible,bnf:!!scene.getObjectByName('BnfSkyMarker'),skyMesh:!!scene.getObjectByName('SkySphere'),grids:grids.length,far:camera.far,projection:camera.type};
    });
    let result = await inspect();
    console.log('preview inspection:', JSON.stringify(result));
    assert.equal(result.background,true); assert.equal(result.backdrop,true); assert.equal(result.bnf,true); assert.equal(result.skyMesh,true); assert.equal(result.grids,0);
    await new Promise(resolve => setTimeout(resolve,1500));
    await page.screenshot({path:'/tmp/inventory-sky-perspective.png'});
    await page.click('[aria-label="Afficher la grille sur fond neutre"]');
    await page.waitForFunction(() => !window.preview.scene.getObjectByName('SkySphere'));
    result = await inspect(); assert.equal(result.grids,1); assert.equal(result.backdrop,false);
    await page.click('[aria-label="Masquer la grille et afficher le ciel"]');
    await page.waitForFunction(() => window.preview.scene.getObjectByName('SkySphere') && window.preview.scene.getObjectByName('BnfSkyMarker'));
    await page.evaluate(() => window.store.setState({cameraProjection:'ortho'}));
    await page.waitForFunction(() => window.preview.camera.isOrthographicCamera);
    result = await inspect(); assert.equal(result.background,true); assert.equal(result.backdrop,true); assert.equal(result.bnf,true); assert.equal(result.skyMesh,true); assert.equal(result.grids,0);
    await page.screenshot({path:'/tmp/inventory-sky-ortho.png'});
    assert.deepEqual(errors,[]);
    console.log('OK: SkySphere et repère BNF d’origine, grille absente par défaut et projections perspective/orthographique.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
