const fs = require('node:fs');
const assert = require('node:assert/strict');
const launchBrowser = require('./browser-test-options.cjs');
(async () => {
  const browser = await launchBrowser({args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage();
    await page.setViewport({width:1496, height:872});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (process.argv.includes('--fit')) {
      await page.goto('http://localhost:5173/characters/wigs/lara_native_shading.png');
      await page.evaluate(async () => {
        const { default: RefreshRuntime } = await import('/@react-refresh');
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => type => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        const { default: React } = await import('/node_modules/.vite/deps/react.js');
        const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
        const fit = {scale:0.9, x:2, y:-1, z:0, rx:0, ry:10, rz:0};
        localStorage.setItem('room-3d-wig-fitting', JSON.stringify({version:0, state:{fits:{hair_100:fit, hair_lara_native:fit}}}));
        const { WigFitPanel } = await import('/src/features/inventory/WigFitPanel.tsx');
        document.body.innerHTML = '<div id="fit-test"></div>';
        ReactDOM.createRoot(document.getElementById('fit-test')).render(React.createElement(WigFitPanel, {wigId:'hair_100'}));
      });
      await page.waitForSelector('input[aria-label="Taille (%)"]');
      const input = await page.$('input[aria-label="Taille (%)"]');
      assert.equal(await input.evaluate(el => el.value), '100');
      const migrated = await page.evaluate(async () => {
        const { useWigFitStore } = await import('/src/features/inventory/useWigFitStore.ts');
        return useWigFitStore.getState().fits;
      });
      assert.equal(migrated.hair_lara_native.scale, 1);
      assert.equal(migrated.hair_100.x, 2);
      assert.equal(migrated.hair_100.ry, 10);
      await input.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await input.type('85');
      const result = await page.evaluate(async () => {
        const { useWigFitStore } = await import('/src/features/inventory/useWigFitStore.ts');
        await useWigFitStore.persist.rehydrate();
        return {fit:useWigFitStore.getState().fits.hair_100, saved:JSON.parse(localStorage.getItem('room-3d-wig-fitting'))};
      });
      assert.equal(result.fit.scale, 0.85);
      assert.equal(result.saved.state.fits.hair_100.scale, 0.85);
      await page.click('button');
      assert.equal(await input.evaluate(el => el.value), '100');
      assert.deepEqual(errors, []);
      console.log('Fitting panel: one-time scale reset, preserved alignment, new saved edits and reset passed');
      return;
    }
    await page.goto('http://localhost:5173/?inventory=wigs&item=hair_lara_native', {waitUntil: 'domcontentloaded'});
    if (process.argv.includes('--verify')) {
      await page.waitForSelector('canvas');
      await page.waitForFunction(() => document.body.innerText.includes('Coupe Native (Lara Croft)'), {timeout:180000});
      await page.screenshot({path:'/tmp/native-red-verification.png'});
      assert.deepEqual(errors, [], 'Preview must render without JavaScript errors');
      console.log('Preview rendered without JavaScript errors');
      return;
    }
    const result = await page.evaluate(async () => {
      const textures = [];
      for (const name of ['lara_native_hair', 'wig_100']) {
        const data = await (await fetch(`/characters/wigs/${name}.glb`)).arrayBuffer();
        const length = new DataView(data).getUint32(12, true);
        const doc = JSON.parse(new TextDecoder().decode(data.slice(20, 20 + length)));
        const texture = doc.textures[doc.materials[0].pbrMetallicRoughness.baseColorTexture.index];
        const source = doc.images[texture.source ?? texture.extensions.EXT_texture_webp.source];
        const view = doc.bufferViews[source.bufferView];
        const start = 28 + length + (view.byteOffset || 0);
        const image = await createImageBitmap(new Blob([data.slice(start, start + view.byteLength)], {type:source.mimeType}));
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, image.width, image.height);
        const histogram = new Float64Array(256);
        let count = 0;
        for (let i = 0; i < pixels.data.length; i += 4) {
          if (pixels.data[i+3] < 128) continue;
          histogram[pixels.data[i]]++; count++;
        }
        let cumulative = 0;
        const cdf = Array.from(histogram, value => (cumulative += value / count));
        textures.push({canvas, ctx, pixels, cdf});
      }
      // Match visible red-channel quantiles to the Bob reference, retaining native UV details and alpha.
      const [native, bob] = textures;
      const mapping = native.cdf.map(quantile => {
        let value = 0;
        while (value < 255 && bob.cdf[value] < quantile) value++;
        return value;
      });
      let sum = 0, count = 0;
      const pixels = native.pixels.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const value = mapping[pixels[i]];
        pixels[i] = pixels[i+1] = pixels[i+2] = value;
        if (pixels[i+3] >= 128) { sum += value; count++; }
      }
      native.ctx.putImageData(native.pixels, 0, 0);
      return {png:native.canvas.toDataURL('image/png').split(',')[1], mean:sum/count};
    });
    assert(result.mean > 150 && result.mean < 190, 'Matched texture must have Bob reference brightness');
    fs.writeFileSync('public/characters/wigs/lara_native_shading.png', Buffer.from(result.png, 'base64'));
    console.log('Native red shading mean:', result.mean, '(Bob reference: 166.62)');
  } finally { await browser.close(); }
})();
