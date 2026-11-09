const assert = require('node:assert/strict');
const fs = require('node:fs');
const {withBrowser} = require('../tests/support/browser.cjs');
process.env.ROOM_TEST_SUITE='perf';process.env.ROOM_TEST_OPTIONS='{}';process.env.ROOM_TEST_RESULTS=fs.mkdtempSync('/tmp/room-memory-preview-');
const fixture={...require('../tests/fixtures/cases.cjs').performance['studio-9-mid-day'],count:0,id:'preview-lifecycle',cancelledRequestPaths:['/items/dji-avata-2/dji-avata-2.glb']};
const path='/items/dji-avata-2/dji-avata-2.glb';
withBrowser(fixture,async(page,result)=>{
 for(let cycle=0;cycle<2;cycle++) {
  await page.evaluate(async()=>{const {openInventoryTarget}=await import('/src/features/ui/AppConsole.tsx');openInventoryTarget({type:'object',object:{id:'dji-avata-2',inventoryId:'dji-avata-2',label:'Drone DJI Avata 2'}});});
  await page.waitForFunction(path=>{let found=false;window.__THREE_SCENE__?.traverse(o=>{if(o.userData.loadedGltfPath===path)found=true;});return found;},{timeout:60000},path);
  const data=await page.evaluate(path=>{let max=0,model;window.__THREE_SCENE__.traverse(o=>{if(o.userData.loadedGltfPath===path)model=o;});if(!model)throw Error('Missing original drone model');model.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const t of Object.values(m))if(t?.isTexture)max=Math.max(max,t.image?.width??0,t.image?.height??0);});return {max};},path);
  assert.equal(data.max,2048,'HD drone preview must use original 2K textures');
  await page.screenshot({path:`${process.env.ROOM_TEST_RESULTS}/preview-${cycle}.png`});
  await page.click('button.btn-close[aria-label="Fermer"]');
  await page.waitForFunction(async path=>{const {cameraState}=await import('/src/features/scene/cameraState.ts');let full=false;window.__THREE_SCENE__?.traverse(o=>{if(o.userData.loadedGltfPath===path)full=true;});return !cameraState.isInventoryOpen&&!full;},{timeout:15000},path);
  console.log('PREVIEW CYCLE PASSED',cycle+1,data);
 }
 console.log('Artifacts:',process.env.ROOM_TEST_RESULTS);
}).catch(error=>{console.error(error);process.exitCode=1;});
