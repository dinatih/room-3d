import launchBrowser from './browser-test-options.cjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, EXTTextureWebP } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import puppeteer from 'puppeteer';

const io = new NodeIO().registerExtensions([KHRDracoMeshCompression, EXTTextureWebP])
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
const before = await io.readBinary(execFileSync('git', ['show', 'HEAD:public/characters/lara/lara_native.glb'], {maxBuffer:Infinity}));
const after = await io.read('public/characters/lara/lara_native.glb');
const oldNodes = before.getRoot().listNodes();
const newNodes = after.getRoot().listNodes();
assert.deepEqual(newNodes.filter(n=>!n.getName().startsWith('bikini_')&&!n.getName().startsWith('body_bare_feet_clothed')&&!n.getName().startsWith('body_legs_barefoot')).map(n => n.getName()).sort(), oldNodes.filter(n=>!n.getName().startsWith('bikini_')&&!n.getName().startsWith('body_bare_feet_clothed')&&!n.getName().startsWith('body_legs_barefoot')).map(n => n.getName()).sort());
for (const old of oldNodes) {
  const node = newNodes.find(n => n.getName() === old.getName() && Boolean(n.getMesh()) === Boolean(old.getMesh()));
  for (const method of ['getTranslation', 'getRotation', 'getScale']) {
    node[method]().forEach((value,i) => assert(Math.abs(value-old[method]()[i]) <= (2 ** -23)*Math.max(1,Math.abs(value)), `${old.getName()} ${method}`));
  }
  if (old.getSkin()) {
    assert.deepEqual(node.getSkin().listJoints().map(n => n.getName()), old.getSkin().listJoints().map(n => n.getName()));
  }
  if (old.getMesh()) {
    const count = m => m.listPrimitives().reduce((n,p) => n + p.getIndices().getCount(),0);
    if (old.getName() === 'body_nude_hands' || old.getName() === 'body_bare_feet_clothed') {
      assert(count(node.getMesh())>0, 'Bare hands lost all triangles');
    } else if (old.getName() === 'body_nude_torso') {
      assert(count(node.getMesh()) >= count(old.getMesh()), 'Rebuilt torso lost triangles');
    } else {
      assert.equal(count(node.getMesh()), count(old.getMesh()), `${old.getName()} triangles`);
    }
  }
}
for (const name of ['arms','body_legs','body_legs_barefoot','fingers','body_nude_legs','body_nude_hands','body_nude_feet','body_torso','body_nude_torso']) {
  const mesh = newNodes.find(n => n.getName() === name).getMesh();
  for (const primitive of mesh.listPrimitives()) {
    const pos = primitive.getAttribute('POSITION');
    const uv = primitive.getAttribute('TEXCOORD_0');
    const indices = primitive.getIndices().getArray();
    // UV quantization may move border vertices by one quantization step.
    const epsilon = 1 / (2 ** 12 - 1);
    for (let i=0;i<indices.length;i+=3) {
      const ids = indices.slice(i,i+3);
      const x = ids.reduce((n,j)=>n+pos.getElement(j,[])[0],0);
      const tile = x>0 ? 0 : 1;
      for (const j of ids) {
        const u = uv.getElement(j,[])[0];
        assert(u >= tile/2-epsilon && u <= (tile+1)/2+epsilon, `${name}: crossed anatomical UV tile; x=${x}, tile=${tile}, u=${u}, positions=${ids.map(k=>pos.getElement(k,[]))}`);
      }
    }
  }
}
const torso = newNodes.find(n => n.getName() === 'body_nude_torso').getMesh();
for (const primitive of torso.listPrimitives()) {
  for (const name of ['POSITION','NORMAL','TEXCOORD_0','WEIGHTS_0']) {
    const attribute = primitive.getAttribute(name);
    assert(attribute, `Torso missing ${name}`);
    assert(Array.from(attribute.getArray()).every(Number.isFinite), `Torso has invalid ${name}`);
    if (name === 'WEIGHTS_0') {
      for (let i=0;i<attribute.getCount();i++) {
        assert(attribute.getElement(i,[]).reduce((sum,value)=>sum+value,0)>0, 'Unbound torso vertex');
      }
    }
  }
}
console.log('GLB: transforms, joint order, topology, torso skin weights and independent UV tiles verified.');

const browser = await launchBrowser({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  await page.setViewport({width:1100,height:800});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/characters/lara/textures/LIMB_UVS.md');
  await page.evaluate(async () => {
    const base = document.createElement('base'); base.href = '/'; document.head.appendChild(base);
    const variants=await import('/src/features/scene/LaraVariants.ts');
    const THREE=await import('/node_modules/.vite/deps/three.js');
    const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
    const draco=new DRACOLoader().setDecoderPath('/draco/');
    const loader=new GLTFLoader().setDRACOLoader(draco);
    const {clone}=await import('/node_modules/three/examples/jsm/utils/SkeletonUtils.js');
    const shared=await loader.loadAsync('/characters/lara/lara_native.glb');
    const native=clone(shared.scene),marissa=clone(shared.scene);
    variants.applyLaraVariantStyles(marissa,'marissa');
    native.traverse(m=>{if(m.isMesh)for(const mat of Array.isArray(m.material)?m.material:[m.material]){
      if(mat.customProgramCacheKey()==='marissa-reference-ink')throw Error(`Marissa tattoo leaked to native: ${m.name}`);
    }});
    const entries=[];
    for (const style of ['native','marissa','delphina','sara']) {
      const {scene}=await loader.loadAsync('/characters/lara/lara_native.glb');
      const bases=new Map();
      scene.traverse(m=>{if(m.isMesh) for(const mat of Array.isArray(m.material)?m.material:[m.material]) bases.set(mat.map,mat.map?.image);});
      if(style==='marissa') {
        // Character.tsx scales Lara from metres to centimetres before styling.
        scene.scale.setScalar(100); scene.updateMatrixWorld(true);
        // Character.tsx recentres the hips after updating the world matrices.
        scene.position.set(30,0,-100);
      }
      variants.applyLaraVariantStyles(scene,style);
      if(style==='marissa') {
        const {scene:reference}=await loader.loadAsync('/characters/lara/lara_native.glb');
        variants.applyLaraVariantStyles(reference,style);
        for(const name of ['body_legs','body_legs_barefoot','body_nude_legs001','body_nude_feet001']) {
          const actual=scene.getObjectByName(name),expected=reference.getObjectByName(name);
          const a=actual.geometry.getAttribute('marissaSurfaceInkPosition').array;
          const b=expected.geometry.getAttribute('marissaSurfaceInkPosition').array;
          if(a.some((v,i)=>Math.abs(v-b[i])>1e-4))throw Error(`Marissa ink coordinates changed after recentring: ${name}`);
          if(actual.material.customProgramCacheKey()!=='marissa-reference-ink')throw Error(`Missing ink shader: ${name}`);
        }
        scene.scale.setScalar(1);scene.position.set(0,0,0);scene.updateMatrixWorld(true);
      }
      const materials=[];
      scene.traverse(m=>{if(m.isMesh) for(const mat of Array.isArray(m.material)?m.material:[m.material]) {
        if (!mat.map || !mat.userData.__ownedCharacterMaterial) continue;
        const base=m.userData.__baseVariantMaterials?.find(b=>b.name===mat.name)?.map;
        if (base && mat.map!==base && (m.name==='arms'||m.name==='body_legs'||m.name.startsWith('body_legs_barefoot')||mat.userData.lara_tattoo_projection||mat.userData.lara_sara_tattoo_projection||(style==='delphina'&&mat.userData.lara_delphina_shoulder_projection))) {
          materials.push({mesh:m.name,mat,base});
        }
      }});
      const restBones=[];scene.traverse(n=>{if(n.isBone) restBones.push([n,n.position.clone(),n.quaternion.clone(),n.scale.clone()]);});
      entries.push({style,scene,materials,restBones});
    }
    const {extractCharacterParts,applyClothingAndAccessoriesVisibility}=await import('/src/features/scene/characterParts.ts');
    for (const {style,scene} of entries) {
      const parts=extractCharacterParts(scene);
      for(const key of ['boots','feet','feetClothed','legsBarefoot','gloves','hands']) if(!parts[key].length) throw Error(`${style}: missing ${key}`);
      for(const laraShoes of [true,false])
      for(const [laraNude,laraTopOff,laraBottomOff] of [[false,false,false],[false,true,false],[false,false,true],[true,false,false]]) {
        applyClothingAndAccessoriesVisibility(parts,{laraShoes,laraNude,laraTopOff,laraBottomOff,showAccessories:false,laraPistols:false,equipment:{holster:false,pistols:false,backpack:false}});
        for(const [key,visible] of [['boots',laraShoes],['feet',!laraShoes&&(laraNude||laraBottomOff)],['feetClothed',!laraShoes&&!laraNude&&!laraBottomOff],['legsBarefoot',!laraShoes&&!laraNude&&!laraBottomOff],['gloves',true],['hands',false],['torsoClothed',!laraNude&&!laraTopOff],['torsoNude',laraNude||laraTopOff],['legsNude',laraNude||laraBottomOff]]) {
          if(parts[key].some(({mesh})=>mesh.visible!==visible)) throw Error(`${style}: incorrect ${key} visibility`);
        }
        if(parts.legsClothed.some(({mesh})=>mesh.visible!==(mesh.name==='body_legs'?!laraNude&&!laraBottomOff&&laraShoes:!laraNude&&!laraBottomOff))) throw Error(`${style}: clothed legs visibility`);
      }
    }
    for(const {style,scene} of entries){
      const parts=extractCharacterParts(scene);
      if(!parts.bikiniTop.length||!parts.bikiniBottom.length)throw Error(`Missing bikini: ${style}`);
      const options={laraBikini:true,laraNude:false,laraTopOff:false,laraBottomOff:false,laraShoes:false,showAccessories:false,laraPistols:false,equipment:{holster:false,pistols:false,backpack:false}};
      applyClothingAndAccessoriesVisibility(parts,options);
      if(parts.bikiniTop.some(p=>!p.mesh.visible)||parts.bikiniBottom.some(p=>!p.mesh.visible))throw Error('Bikini hidden');
      if(parts.torsoClothed.some(p=>p.mesh.visible)||parts.legsClothed.some(p=>p.mesh.visible))throw Error('Clothes overlap bikini');
      applyClothingAndAccessoriesVisibility(parts,{...options,laraTopOff:true});
      if(parts.bikiniTop.some(p=>p.mesh.visible)||parts.bikiniBottom.some(p=>!p.mesh.visible))throw Error('Bikini top-off failed');
      applyClothingAndAccessoriesVisibility(parts,{...options,laraNude:true});
      if([...parts.bikiniTop,...parts.bikiniBottom].some(p=>p.mesh.visible))throw Error('Bikini remained in nude mode');
    }
    window.laraChecks={entries,THREE,variants,loader};
    window.laraChanges=()=>entries.flatMap(({style,materials})=>materials.map(({mesh,mat,base})=>{
      const canvas=document.createElement('canvas'); canvas.width=1024;canvas.height=512;
      const ctx=canvas.getContext('2d');ctx.drawImage(base.image,0,0);
      const original=ctx.getImageData(0,0,1024,512).data;
      ctx.clearRect(0,0,1024,512);ctx.drawImage(mat.map.image,0,0);
      const painted=ctx.getImageData(0,0,1024,512).data;
      const changes=[0,0];
      for(let i=0;i<original.length;i+=4) if(original[i]!==painted[i]||original[i+1]!==painted[i+1]||original[i+2]!==painted[i+2]) changes[((i/4)%1024)<512?0:1]++;
      const shoulder=style==='delphina'&&Boolean(mat.userData.lara_delphina_shoulder_projection);
      return {style,mesh,shoulder,projection:shoulder?mat.userData.lara_delphina_shoulder_projection:mat.userData.lara_tattoo_projection??mat.userData.lara_sara_tattoo_projection,changes};
    }));
  });
  await page.waitForFunction(() => ['delphina'].every(style => window.laraChanges().some(r=>r.style===style&&r.mesh.startsWith('body_nude_legs')&&r.changes[style==='marissa'?0:1]>0)));
  await page.waitForFunction(() => window.laraChanges().some(r=>r.style==='sara'&&r.mesh.startsWith('body_nude_torso')&&r.changes.some(n=>n>0)));
  await page.waitForFunction(() => ['body_torso','body_nude_torso'].every(name=>window.laraChanges().some(r=>r.style==='delphina'&&r.mesh.startsWith(name)&&r.changes.some(n=>n>0))));
  const changes=await page.evaluate(()=>window.laraChanges());
  for(const row of changes) {
    if(row.style==='sara') {
      assert(row.mesh.startsWith('body_nude_torso'));
      assert(row.changes.reduce((sum,n)=>sum+n,0)>0, 'Sara nude neck tattoo missing');
      continue;
    }
    if(row.shoulder&&row.mesh.includes('torso')) {
      assert(row.changes[1]>0, 'Delphina shoulder flower missing');
      assert.equal(row.changes[0],0, 'Delphina shoulder flower on the left');
      continue;
    }
    if(row.style!=='marissa') assert.equal(row.changes[0],0,`${row.style} ${row.mesh}: tattoo on opposite side`);
    if(row.mesh==='arms'||row.mesh==='body_legs'||row.mesh.startsWith('body_legs_barefoot')) assert(row.changes[row.style==='marissa'?0:1]>0);
  }
  console.log('Browser tattoo checks:',JSON.stringify(changes));
  console.log(await page.evaluate(()=>{const names=[];window.laraChecks.entries.find(e=>e.style==='marissa').scene.traverse(m=>{if(m.isMesh)names.push(m.name)});return names}));
  await page.evaluate(()=>{
    const {entries,THREE}=window.laraChecks;
    const scene=entries.find(e=>e.style==='marissa').scene;
    scene.traverse(m=>{if(m.isMesh)m.visible=['face','eyes','arms','hair_base','braid'].includes(m.name)||m.name.startsWith('body_nude_legs')||m.name.startsWith('body_nude_feet')||m.name.startsWith('body_nude_torso')||m.name.startsWith('body_nude_panties');});
    const view=new THREE.Scene();view.add(scene,new THREE.HemisphereLight(0xffffff,0x777777,3));
    const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(800,1100);renderer.setClearColor(0xdddddd);document.body.replaceChildren(renderer.domElement);
    const camera=new THREE.OrthographicCamera(-.65,.65,1.8,0,.01,10);camera.position.set(0,0,4);camera.lookAt(0,0,0);renderer.render(view,camera);
    window.marissaView=async(angle,bikini)=>{
      const {extractCharacterParts,applyClothingAndAccessoriesVisibility}=await import('/src/features/scene/characterParts.ts');
      const parts=extractCharacterParts(scene);
      applyClothingAndAccessoriesVisibility(parts,{laraBikini:bikini,laraNude:!bikini,laraTopOff:false,laraBottomOff:false,laraShoes:false,showAccessories:false,laraPistols:false,equipment:{holster:false,pistols:false,backpack:false}});
      camera.position.set(Math.sin(angle)*4,0,Math.cos(angle)*4);camera.lookAt(0,0,0);renderer.render(view,camera);
    };
  });
  console.log(await page.evaluate(()=>{const {entries,THREE}=window.laraChecks;const s=entries.find(e=>e.style==='marissa').scene;return ['face','body_legs','body_nude_torso001','body_nude_feet001'].map(name=>{const m=s.getObjectByName(name);const b=new THREE.Box3().setFromObject(m);return [name,b.min.toArray(),b.max.toArray()];});}));
  await page.setViewport({width:800,height:1100});
  await page.screenshot({path:'/tmp/marissa-tattoos.png'});
  await page.evaluate(()=>window.marissaView(.9,false));
  await page.screenshot({path:'/tmp/marissa-tattoos-side.png'});
  await page.evaluate(()=>window.marissaView(0,true));
  await page.screenshot({path:'/tmp/marissa-bikini-front.png'});
  await page.evaluate(()=>window.marissaView(.9,true));
  await page.screenshot({path:'/tmp/marissa-bikini-side.png'});
  await page.evaluate(()=>window.marissaView(Math.PI,true));
  await page.screenshot({path:'/tmp/marissa-bikini-back.png'});
  await page.evaluate(()=>{
    const {entries,THREE}=window.laraChecks;const entry=entries.find(e=>e.style==='marissa');
    const ink=entry.scene.getObjectByName('body_legs').geometry.getAttribute('marissaSurfaceInkPosition');
    const before=Array.from(ink.array);
    entry.scene.getObjectByName('leg_left_thigh').rotation.x=-Math.PI/3;
    entry.scene.updateMatrixWorld(true);
    if(before.some((v,i)=>v!==ink.array[i]))throw Error('Animation moved the tattoo coordinates');
    const {variants}=window.laraChecks;
    variants.applyLaraRealisticTextures(entry.scene,true);variants.applyLaraRealisticTextures(entry.scene,false);
    if(entry.scene.getObjectByName('body_legs').material.customProgramCacheKey()!=='marissa-reference-ink')throw Error('Realistic mode removed ink shader');
  });
  assert.deepEqual(errors,[]);
} finally { await browser.close(); }
