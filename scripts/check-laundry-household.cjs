// One isolated headless Canvas, using the project's browser launcher.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const launch = require('./browser-test-options.cjs');
const ROOT = path.join(__dirname, '..');
const manifest = require('./laundry-household-manifest.json');
const ids = ['calecon-rouge', 'chaussette-rouge', 'cons-cure-dents', 'magic-sponge', 'rowenta-dr8250', 'temu-sock-dryer-20', 'ikea-plogsvaeng'];
// Count actual suspended garment groups in the exported asset, not just stock.
const loadedBytes = fs.readFileSync(path.join(ROOT, 'public/items/temu-sock-dryer-20/SockDryer20Loaded.glb'));
const loadedGlb = JSON.parse(loadedBytes.subarray(20, 20 + loadedBytes.readUInt32LE(12)).toString());
for (const slug of ['red-socks', 'red-boxers']) {
  const clips = new Set(loadedGlb.nodes.map(n => n.name?.match(new RegExp(`^${slug} clip (\\d{2})`))?.[1]).filter(Boolean));
  assert.equal(clips.size, 10, `ten distinct clips carrying ${slug}`);
}
(async () => {
  const browser = await launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width: 1000, height: 950 });
    await page.setRequestInterception(true);
    page.on('request', r => ['localhost', '127.0.0.1'].includes(new URL(r.url()).hostname) ? r.continue() : r.abort());
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
    await page.evaluate(async ids => {
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => t => t;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      await import('/src/dracoSetup.ts');
      const { INVENTORY } = await import('/src/features/inventory/inventoryData.ts');
      const { SockDryer20Loaded, MagicSponge, RowentaDR8250 } = await import('/src/features/scene/items/LaundryHousehold.tsx');
      const { Plogsvaeng } = await import('/src/features/scene/items/CleaningProducts.tsx');
      const { Mackapar50530988 } = await import('/src/features/scene/items/Mackapar50530988.tsx');
      const { createStaticGlbItem } = await import('/src/features/scene/items/createStaticGlbItem.tsx');
      window.testInventory = ids.map(id => INVENTORY.find(item => item.id === id));
      const h = React.createElement;
      document.body.innerHTML = '<div id="fixture" style="width:1000px;height:950px"></div>';
      const fixtures = [
        h('group', {name:'rack',position:[32,0,0],rotation:[0,Math.PI/2,0]}, h(Mackapar50530988)),
        h('group', {name:'loaded',position:[40.0406,122.42,-4.6]}, h(SockDryer20Loaded)),
        h('group', {name:'sponge',position:[110,0,0]}, h(MagicSponge)),
        h('group', {name:'steamer',position:[100,0,-30]}, h(RowentaDR8250)),
        h('group', {name:'basket',position:[100,0,30]}, h(Plogsvaeng), h('group',{position:[0,.4,0]},h(MagicSponge))),
      ];
      for (const [id, position] of [['calecon-rouge',[145,0,20]],['chaussette-rouge',[155,0,-20]],['cons-cure-dents',[125,0,-40]]]) {
        const item = INVENTORY.find(i => i.id === id);
        fixtures.push(h('group',{name:id,position},h(createStaticGlbItem('/'+item.glbPath))));
      }
      createRoot(document.querySelector('#fixture')).render(h(Canvas, {
        camera: {position:[310,240,340],near:.1,far:2000,fov:38},
        onCreated: ({scene,camera}) => { window.testScene=scene;window.THREE=THREE;camera.lookAt(75,90,0); },
      },h('color',{attach:'background',args:['#6b7079']}),h('ambientLight',{intensity:1.8}),
      h('directionalLight',{position:[100,220,180],intensity:3}),h(React.Suspense,{fallback:null},...fixtures)));
    }, ids);
    const names = ['rack','loaded','sponge','steamer','basket','calecon-rouge','chaussette-rouge','cons-cure-dents'];
    await page.waitForFunction(names => names.every(name => {
      let ready = false;window.testScene?.getObjectByName(name)?.traverse(o=>{if(o.isMesh)ready=true;});return ready;
    }), {timeout:60000}, names);
    const result = await page.evaluate(names => ({ inventory:window.testInventory, models:Object.fromEntries(names.map(name=>{
      const o=window.testScene.getObjectByName(name);o.updateWorldMatrix(true,true);
      const b=new window.THREE.Box3().setFromObject(o);
      return [name,{min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new window.THREE.Vector3()).toArray()}];
    }))}), names);
    for (const item of result.inventory) {
      assert(item,'inventory entry exists');
      assert.equal(result.inventory.filter(i=>i.id===item.id).length,1,'unique entry');
      for(const file of [item.glbPath,...item.photos])assert(fs.existsSync(path.join(ROOT,'public',file)),file);
    }
    assert.equal(result.inventory.find(i=>i.id==='chaussette-rouge').qty,10);
    assert.equal(result.inventory.find(i=>i.id==='calecon-rouge').qty,20,'preserve existing stock');
    assert.equal(result.inventory.find(i=>i.id==='magic-sponge').qty,3);
    assert.equal(result.inventory.find(i=>i.id==='temu-sock-dryer-20').qty,1);
    assert.equal(result.inventory.find(i=>i.id==='ikea-plogsvaeng').qty,2);
    assert(result.models.loaded.min[0]>0,'laundry clears west wall');
    assert(Math.abs(result.models.loaded.max[1]-122.42)<.01,'hook on measured lower rail');
    assert(result.models.loaded.min[1]>0,'laundry clears ground');
    for (const [name,file] of [['sponge','MagicSponge.glb'],['steamer','RowentaDR8250.glb'],['calecon-rouge','RedBoxers.glb'],['chaussette-rouge','RedSocksPair.glb'],['cons-cure-dents','PolyesterToothpicks.glb']]) {
      const dims=manifest[file].dimensionsCm;
      for(const [axis,value] of [dims.w,dims.h,dims.d].entries())assert(Math.abs(result.models[name].size[axis]-value)<.05,`${name} scale ${axis}`);
    }
    assert.deepEqual(errors,[]);
    await page.screenshot({path:'/tmp/laundry-household-check.png'});
    console.log(JSON.stringify(result,null,2));
    console.log('PASS: assets, inventory counts, dimensions, hook alignment and isolated R3F rendering.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
