const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
 const browser = await launch({args:['--no-sandbox']});
 try {
  const page = await browser.newPage();
  await page.setViewport({width:1440,height:1100});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request',r=>{const u=new URL(r.url()); return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
  await page.goto(`${process.env.LARA_COMPARISON_URL || 'http://127.0.0.1:5174'}/lara-outfit-comparison.html`);
  await page.waitForFunction(()=>document.body.innerText.includes('4 tenues'));
  await page.evaluate(async()=>{
   const {_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
   window.bodyTestScene = () => _roots.get(document.querySelector('canvas')).store.getState().scene;
   window.bodyTestSelect = (label,value) => {
    const select=[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith(label)).querySelector('select');
    select.value=value; select.dispatchEvent(new Event('change',{bubbles:true}));
   };
   window.bodyTestSelect('Haut / robe / maillot','body-native-red');
   const extras=[...document.querySelectorAll('label')].find(l=>l.textContent.trim()==='Accessoires natifs');
   if(extras?.querySelector('input').checked)extras.querySelector('input').click();
  });
  await page.waitForFunction(()=>{
   const scene=window.bodyTestScene();let count=0;
   scene.traverse(o=>{if(o.name==='lara_custom_clothing_body-native-red')count++;});
   return count===1;
  },{timeout:60000});
  await page.evaluate(async()=>{
   const {Vector3,Box3}=await import('/node_modules/.vite/deps/three.js');
   const {_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
   const store=_roots.get(document.querySelector('canvas')).store.getState();
   let garment;store.scene.traverse(o=>{if(o.name==='lara_custom_clothing_body-native-red')garment=o;});
   const box=new Box3().setFromObject(garment),center=box.getCenter(new Vector3());
   store.camera.position.set(center.x+90,center.y+15,center.z+190);
   store.camera.lookAt(center);
   if(store.controls){store.controls.target.copy(center);store.controls.update();}
  });
  const state=await page.evaluate(()=>{
   const scene=window.bodyTestScene();let garment;
   scene.traverse(o=>{if(o.name==='lara_custom_clothing_body-native-red')garment=o;});
   const native=garment.parent;
   const visible=name=>{let found=false,shown=false;native.getObjectByName(name)?.traverse(o=>{if(o.isMesh){found=true;shown ||= o.visible;}});if(!found)throw new Error(`Missing mesh ${name}`);return shown;};
   return {shirt:visible('shirt'),skin:visible('body_torso'),nude:visible('body_nude_torso'),shorts:visible('shorts'),bottom:[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Bas')).querySelector('select').value};
  });
  assert.deepEqual(state,{shirt:false,skin:true,nude:false,shorts:true,bottom:'native'});
  for (const bottom of ['none','native']) {
   await page.evaluate(v=>window.bodyTestSelect('Bas',v),bottom);
   await page.waitForFunction(expected=>{
    let garment;window.bodyTestScene().traverse(o=>{if(o.name==='lara_custom_clothing_body-native-red')garment=o;});
    return garment.getObjectByName('native_body_gusset')?.visible===expected;
   },{},bottom!=='native');
   for (const animation of ['idle','walking','sitting-idle']) {
    await page.evaluate(v=>window.bodyTestSelect('Animation commune',v),animation);
    await new Promise(r=>setTimeout(r,2500));
    await page.screenshot({path:`/tmp/native-body-browser-${bottom}-${animation}.png`});
    const valid=await page.evaluate(()=>{
     let valid=true,count=0,garment;
     window.bodyTestScene().traverse(o=>{if(o.name==='lara_custom_clothing_body-native-red')garment=o;});
     garment.traverse(o=>{
      if(o.isSkinnedMesh){
       count++;
       const a=o.geometry.attributes.position, p=o.position.clone();
       for(let i=0;i<a.count;i++){
        o.getVertexPosition(i,p);
        if(!Number.isFinite(p.x+p.y+p.z))valid=false;
       }
       for(const bone of o.skeleton.bones)if(!garment.parent.getObjectByName(bone.name))valid=false;
      }
     });return valid && count>0;
    });
    assert.ok(valid,'Finite animated coordinates and bones mapped to Lara');
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: native body loads, retains native skin and short, and plays idle/walking/sitting with both bottoms');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
