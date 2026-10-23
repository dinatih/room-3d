const fs = require('node:fs');
const assert = require('node:assert/strict');
const launchBrowser = require('./browser-test-options.cjs');
if (process.argv.includes('--inspect-head')) {
  const THREE = require('three');
  const data = fs.readFileSync('public/characters/lara/lara_native.glb');
  const doc = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
  const nodes = doc.nodes.map(node => {
    const object = new THREE.Object3D();
    object.name = node.name;
    if (node.translation) object.position.fromArray(node.translation);
    if (node.rotation) object.quaternion.fromArray(node.rotation);
    if (node.scale) object.scale.fromArray(node.scale);
    if (node.matrix) new THREE.Matrix4().fromArray(node.matrix).decompose(object.position, object.quaternion, object.scale);
    return object;
  });
  doc.nodes.forEach((node, index) => node.children?.forEach(child => nodes[index].add(nodes[child])));
  nodes.filter(node => !node.parent).forEach(node => node.updateMatrixWorld(true));
  for (const node of nodes.filter(node => /^head_neck_(upper|lower)$/.test(node.name))) {
    console.log(node.name, 'position', node.getWorldPosition(new THREE.Vector3()).toArray(), 'rotation', node.getWorldQuaternion(new THREE.Quaternion()).toArray(), 'scale', node.getWorldScale(new THREE.Vector3()).toArray());
  }
  process.exit(0);
}
(async () => {
  const browser = await launchBrowser({args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage();
    await page.setViewport({width:1496, height:872});
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
    if (process.argv.includes('--fit') || process.argv.includes('--alignment') || process.argv.includes('--cap')) {
      await page.goto('http://localhost:5173/characters/wigs/lara_native_shading.png');
      await page.evaluate(async () => {
        const base = document.createElement('base');
        base.href = '/';
        document.head.appendChild(base);
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
      if (process.argv.includes('--cap')) {
        const result = await page.evaluate(async () => {
          const THREE = await import('/node_modules/.vite/deps/three.js');
          const { createBaseballCapMaterial } = await import('/src/features/scene/items/BaseballCap.tsx');
          const { applyLaraVariantStyles, applyLaraRealisticTextures } = await import('/src/features/scene/LaraVariants.ts');
          const material = createBaseballCapMaterial();
          const cap = new THREE.Mesh(new THREE.BoxGeometry(), material);
          cap.userData.isBaseballCap = true;
          for (const realistic of [true, false, true]) {
            applyLaraVariantStyles(cap, 'vivida');
            applyLaraRealisticTextures(cap, realistic);
          }
          return {sameMaterial:cap.material === material, color:cap.material.color.getHex(), specular:cap.material.specularIntensity, roughness:cap.material.roughness, toneMapped:cap.material.toneMapped};
        });
        assert.deepEqual(result, {sameMaterial:true, color:0xff0000, specular:0, roughness:1, toneMapped:false});
        console.log('Cap material survives Lara styling and realistic texture toggles:', result);
      }
      if (process.argv.includes('--alignment')) {
        await page.evaluate(async () => {
          const { default: React } = await import('/node_modules/.vite/deps/react.js');
          const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
          const { Canvas } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
          const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
          const THREE = await import('/node_modules/.vite/deps/three.js');
          const { Wig, LARA_WIG_PREVIEW_SCALE: scale, LARA_WIG_HEAD_OFFSET: offset } = await import('/src/features/scene/items/Wig.tsx');
          const { useWigFitStore } = await import('/src/features/inventory/useWigFitStore.ts');
          useGLTF.setDecoderPath('/draco/');
          useWigFitStore.getState().update('hair_110', {scale:0.85, x:2, y:-1, z:3, rx:5, ry:10, rz:-4});
          const head = new THREE.Group();
          head.name = 'alignment-attached';
          head.position.y = 31 - offset * scale;
          head.scale.setScalar(scale);
          const container = document.createElement('div');
          container.style.cssText = 'width:400px;height:400px';
          document.body.appendChild(container);
          ReactDOM.createRoot(container).render(React.createElement(Canvas, {
            onCreated: ({scene}) => { window.wigTestScene = scene; },
          }, React.createElement(React.Suspense, {fallback:null},
            React.createElement('group', {name:'alignment-preview'}, React.createElement(Wig, {id:'hair_110', scale, offset:[0,31,0], fitToLara:true})),
            React.createElement('primitive', {object:head}),
            React.createElement(Wig, {id:'hair_110', attachTo:head, fitToLara:true})
          )));
        });
        await page.waitForFunction(() => ['alignment-preview', 'alignment-attached'].every(name =>
          window.wigTestScene?.getObjectByName(name)?.getObjectsByProperty('isMesh', true).length > 0
        ));
        const comparison = await page.evaluate(async () => {
          const THREE = await import('/node_modules/.vite/deps/three.js');
          const scene = window.wigTestScene;
          scene.updateMatrixWorld(true);
          const meshes = name => scene.getObjectByName(name).getObjectsByProperty('isMesh', true);
          const preview = meshes('alignment-preview'), attached = meshes('alignment-attached');
          const a = new THREE.Vector3(), b = new THREE.Vector3();
          let maxDistance = 0, vertices = 0;
          preview.forEach((mesh, index) => {
            mesh.skeleton?.update(); attached[index].skeleton?.update();
            for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
              mesh.getVertexPosition(i, a).applyMatrix4(mesh.matrixWorld);
              attached[index].getVertexPosition(i, b).applyMatrix4(attached[index].matrixWorld);
              maxDistance = Math.max(maxDistance, a.distanceTo(b)); vertices++;
            }
          });
          return {maxDistance, vertices};
        });
        assert(comparison.vertices > 0);
        assert(comparison.maxDistance < 1e-5, `Attached and preview vertices differ: ${JSON.stringify(comparison)}`);
        console.log('Preview/attachment vertex comparison:', comparison);
      }
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
