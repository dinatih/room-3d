const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
 const browser = await launch({args:['--no-sandbox','--enable-gpu','--ignore-gpu-blocklist']});
 try {
 const page = await browser.newPage();
 page.setDefaultTimeout(60000);
 const errors=[];
 page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE ERROR',error.message);});
 await page.setViewport({width:1440,height:1000});
 async function mount() {
 await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
 await page.evaluate(async()=>{
 window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
 await import('/scss/app.scss');await import('/src/index.css');await import('/node_modules/bootstrap-icons/font/bootstrap-icons.css');
 const {Inventory}=await import('/src/features/inventory/Inventory.tsx');
 window.catalog=await import('/src/features/inventory/animationStudioCatalog.ts');
 window.resolver=await import('/src/features/scene/animations/animationResolver.ts');
 document.body.innerHTML='<div id="test-root"></div>';
 window.inventoryClosedCount=0;
 createRoot(document.getElementById('test-root')).render(React.createElement(Inventory,{initialCategory:'animations',onClose:()=>{window.inventoryClosedCount++;}}));
 });
 await page.waitForSelector('[role="option"][aria-selected="true"]');
 await page.waitForFunction(()=>{
  const canvas=document.querySelector('.animation-studio canvas');
  const wrap=document.querySelector('.inventory-preview-canvas-wrap');
  return canvas && wrap && Math.abs(canvas.getBoundingClientRect().width-wrap.getBoundingClientRect().width)<1
   && Math.abs(canvas.getBoundingClientRect().height-wrap.getBoundingClientRect().height)<1;
 });
 }
 const selected=()=>page.$eval('[role="option"][aria-selected="true"]',e=>e.dataset.animationId);
 const ids=()=>page.$$eval('.animation-studio__results [role="option"]',es=>es.map(e=>e.dataset.animationId));
 const click=async label=>page.$eval(`[aria-label="${label}"]`,e=>e.click());
 const waitSelected=async id=>page.waitForFunction(id=>document.querySelector('[role="option"][aria-selected="true"]')?.dataset.animationId===id,{},id);
 const setInput=async(label,value)=>page.$eval(`[aria-label="${label}"]`,(e,value)=>{
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  setter.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));
 },value);
 async function check(label) {
 const result=await page.evaluate(()=>{
 const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height}};
 return {preview:rect('.animation-studio__preview'), toolbar:rect('.animation-studio .view-control-bar-inline'),transport:rect('.animation-studio__transport'),annotations:rect('.animation-studio__annotations'),workspace:rect('.animation-studio__workspace'), canvas:rect('.animation-studio canvas'),modal:rect('.inventory-modal')};
 });
 console.log(label,JSON.stringify(result));
 assert(result.canvas.height>0,'canvas visible');
 assert(result.toolbar.bottom<=result.transport.top+1,'toolbar overlaps timeline');
 assert(result.transport.bottom<=result.annotations.top+1,'timeline overlaps annotations');
 assert(result.preview.top>=result.workspace.top,'actors remain above preview');
 assert(Math.abs((result.canvas.right-result.canvas.left)/result.canvas.height-4/3)<0.01,'canvas aspect ratio 4:3');
 }
 await mount();
 // Verify shortcuts inside the modal despite its propagation boundary.
 await page.$eval('[data-category-id="tech"]',e=>e.click());
 await page.focus('[data-category-id="tech"]');
 await page.keyboard.down('Shift');await page.keyboard.press('i');await page.keyboard.up('Shift');
 await page.waitForSelector('.animation-studio');
 assert.equal(await page.evaluate(()=>window.inventoryClosedCount),0);
 await page.focus('[aria-label="Rechercher une animation"]');
 await page.keyboard.down('Shift');await page.keyboard.press('i');await page.keyboard.up('Shift');
 assert.equal(await page.evaluate(()=>window.inventoryClosedCount),0);
 await setInput('Rechercher une animation','');
 await page.focus('[data-category-id="animations"]');
 await page.keyboard.press('i');
 assert.equal(await page.evaluate(()=>window.inventoryClosedCount),1);
 console.log('Shortcuts: Shift+I switches to animations, typing is preserved, plain I closes: PASS');
 const model=await page.evaluate(()=>{
  const {STUDIO_CATALOG:c,EMPTY_STUDIO_FILTERS:f,filterStudioAnimations:filter,adjacentStudioAnimation:adj}=window.catalog;
  for(const mode of ['solo','duo']) {
   for(const source of new Set(c[mode].flatMap(a=>a.sources))) {
    const rows=filter(c[mode],{...f,source},{});
    if(!rows.length || adj(rows,rows.at(-1).id,1).id!==rows[0].id || adj(rows,rows[0].id,-1).id!==rows.at(-1).id) throw Error('source wrap '+source);
   }
  }
  const item=c.solo.find(a=>a.sources.includes('behave'));
  const annotations={[item.annotationId]:{tags:['glitch-pied'],notes:'Décalage évident',status:'issue',updatedAt:1}};
  const found=filter(c.solo,{...f,source:'behave',status:'issue',tag:'glitch-pied',search:'decalage evident'},annotations);
  if(found.length!==1 || found[0].id!==item.id) throw Error('combined annotations search');
  if(filter(c.solo,{...f,minDuration:'10',maxDuration:'1'},{}).length) throw Error('contradictory durations');
  return {solo:c.solo.length,duo:c.duo.length,interxSolo:c.solo.filter(a=>a.sources.includes('interx')).length,behave:c.solo.filter(a=>a.sources.includes('behave')).length,interxDuo:c.duo.filter(a=>a.sources.includes('interx')).length};
 });
 console.log('Source counts',model); assert(model.interxSolo>0 && model.behave>0 && model.interxDuo>0);
 console.log('Catalog/filter assertions',model);
 for(const mode of ['solo','duo']) {
  if(mode==='solo') { await page.select('[aria-label="Source d’animation"]','behave'); await page.waitForFunction(()=>document.querySelectorAll('[role="option"]').length===60); }
  if(mode==='duo') await page.$$eval('[aria-label="Type d’animation"] button',buttons=>buttons[1].click());
  await page.select('[aria-label="Source d’animation"]','interx');
  await page.waitForFunction(()=>[...document.querySelectorAll('[role="option"]')].every(e=>e.dataset.animationId.includes('interx')));
  const rows=await ids(); assert(rows.length>1);
  await page.$eval(`[data-animation-id="${rows.at(-1)}"]`,e=>e.click());
  await waitSelected(rows.at(-1));
  await click('Animation suivante');await waitSelected(rows[0]);
  await click('Animation précédente');await waitSelected(rows.at(-1));
  await page.focus('[aria-label="Rechercher une animation"]');
  await page.keyboard.press('ArrowDown');await waitSelected(rows[0]);
  await page.keyboard.press('ArrowUp');await waitSelected(rows.at(-1));
  await click('Animation aléatoire filtrée');
  await page.waitForFunction(last=>document.querySelector('[aria-selected="true"]').dataset.animationId!==last,{},rows.at(-1));
  assert(rows.includes(await selected()));
  await check(mode+' filtered');
  console.log(mode+' filtered buttons, keyboard and random: PASS');
 }
 // Saving and restoring duo B transforms must survive a reload via annotations.
 const duoId=await selected();
 await page.evaluate(id=>window.resolver.setDuoAnimationTransformOverride(id,{offsetB:[12,34,56],rotB:0.5}),duoId);
 await page.$$eval('.animation-studio__annotations button',buttons=>buttons.find(b=>b.textContent.includes('Mémoriser le calage')).click());
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('room3d_dev_annotations_v1'))['duo:'+id]?.customOffsets?.y===34,{},duoId);
 await page.evaluate(id=>window.resolver.setDuoAnimationTransformOverride(id,{offsetB:[0,0,0],rotB:0}),duoId);
 await page.$$eval('.animation-studio__annotations button',buttons=>buttons.find(b=>b.textContent.includes('Appliquer le calage')).click());
 assert.deepEqual(await page.evaluate(id=>window.resolver.getDuoAnimationTransformOverride(id),duoId),{offsetB:[12,34,56],rotB:0.5});
 // The same splitter and saved width are used by the whole inventory.
 const splitter=await page.$('[aria-label="Redimensionner la liste des animations"]');
 const box=await splitter.boundingBox();
 const before=await page.$eval('.animation-studio__list',e=>e.getBoundingClientRect().width);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.down();await page.mouse.move(box.x+120,box.y+box.height/2,{steps:4});await page.mouse.up();
 const after=await page.$eval('.animation-studio__list',e=>e.getBoundingClientRect().width);
 assert(after>before+100);assert.equal(await page.evaluate(()=>Number(localStorage.getItem('inventory_list_width'))),Math.round(after));
 await page.$eval('.animation-studio__workspace',e=>e.scrollTop=0);
 await check('after resize');
 await page.screenshot({path:'/tmp/inventory-studio-desktop.png'});
 await setInput('Rechercher une animation','zz_no_result_zz');
 await page.waitForSelector('.animation-studio__transport button[disabled]');
 assert.equal((await ids()).length,0);
 await page.focus('[aria-label="Rechercher une animation"]');await page.keyboard.press('ArrowDown');
 assert.equal((await ids()).length,0);
 await setInput('Rechercher une animation','');
 await page.waitForSelector('[role="option"][aria-selected="true"]');
 await page.$$eval('.animation-studio__annotations button',buttons=>buttons.find(b=>b.textContent.includes('Favori')).click());
 await page.$eval('.animation-studio__annotations textarea',e=>{
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Test persistance duo');
  e.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.waitForFunction(()=>Object.entries(JSON.parse(localStorage.getItem('room3d_dev_annotations_v1'))).some(([k,v])=>k.startsWith('duo:')&&v.notes==='Test persistance duo'&&v.status==='favorite'));
 await mount();
 assert.equal(await page.$eval('.animation-studio__list',e=>Math.round(e.getBoundingClientRect().width)),Math.round(after));
 assert(await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('room3d_dev_annotations_v1'))).some(v=>v.notes==='Test persistance duo')));
 await page.setViewport({width:390,height:844});await mount();
 await check('mobile');
 await page.$eval('.animation-studio__workspace',e=>e.scrollTop=0);
 await page.screenshot({path:'/tmp/inventory-studio-mobile.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: filters, both wraps, buttons, search keyboard, random, empty results, resize persistence, annotation persistence, layouts');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
