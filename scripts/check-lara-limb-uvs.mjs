import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, EXTTextureWebP } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import puppeteer from 'puppeteer';

const io = new NodeIO().registerExtensions([KHRDracoMeshCompression, EXTTextureWebP])
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
const before = await io.readBinary(execFileSync('git', ['show', 'HEAD:public/characters/lara/lara_native.glb']));
const after = await io.read('public/characters/lara/lara_native.glb');
const oldNodes = before.getRoot().listNodes();
const newNodes = after.getRoot().listNodes();
assert.deepEqual(newNodes.map(n => n.getName()).sort(), oldNodes.map(n => n.getName()).sort());
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
    assert.equal(count(node.getMesh()), count(old.getMesh()), `${old.getName()} triangles`);
  }
}
for (const name of ['arms','body_legs','fingers','body_nude_legs','body_nude_hands','body_nude_feet']) {
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
        assert(u >= tile/2-epsilon && u <= (tile+1)/2+epsilon, `${name}: crossed anatomical UV tile`);
      }
    }
  }
}
console.log('GLB: node transforms, joint order, triangle counts and independent UV tiles verified.');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'] });
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
    const entries=[];
    for (const style of ['native','marissa','delphina','sara']) {
      const {scene}=await loader.loadAsync('/characters/lara/lara_native.glb');
      const bases=new Map();
      scene.traverse(m=>{if(m.isMesh) for(const mat of Array.isArray(m.material)?m.material:[m.material]) bases.set(mat.map,mat.map?.image);});
      variants.applyLaraVariantStyles(scene,style);
      const materials=[];
      scene.traverse(m=>{if(m.isMesh) for(const mat of Array.isArray(m.material)?m.material:[m.material]) {
        if (!mat.map || !mat.userData.__ownedCharacterMaterial) continue;
        const base=m.userData.__baseVariantMaterials?.find(b=>b.name===mat.name)?.map;
        if (base && mat.map!==base && (m.name==='arms'||m.name==='body_legs'||mat.userData.lara_tattoo_projection)) {
          materials.push({mesh:m.name,mat,base});
        }
      }});
      entries.push({style,scene,materials});
    }
    window.laraChecks={entries,THREE,variants};
    window.laraChanges=()=>entries.flatMap(({style,materials})=>materials.map(({mesh,mat,base})=>{
      const canvas=document.createElement('canvas'); canvas.width=1024;canvas.height=512;
      const ctx=canvas.getContext('2d');ctx.drawImage(base.image,0,0);
      const original=ctx.getImageData(0,0,1024,512).data;
      ctx.clearRect(0,0,1024,512);ctx.drawImage(mat.map.image,0,0);
      const painted=ctx.getImageData(0,0,1024,512).data;
      const changes=[0,0];
      for(let i=0;i<original.length;i+=4) if(original[i]!==painted[i]||original[i+1]!==painted[i+1]||original[i+2]!==painted[i+2]) changes[((i/4)%1024)<512?0:1]++;
      return {style,mesh,projection:mat.userData.lara_tattoo_projection,changes};
    }));
  });
  await page.waitForFunction(() => ['marissa','delphina'].every(style => window.laraChanges().some(r=>r.style===style&&r.mesh.startsWith('body_nude_legs')&&r.changes[style==='marissa'?0:1]>0)));
  const changes=await page.evaluate(()=>window.laraChanges());
  for(const row of changes) {
    assert.equal(row.changes[row.style==='marissa'?1:0],0,`${row.style} ${row.mesh}: tattoo on opposite side`);
    if(row.mesh==='arms'||row.mesh==='body_legs') assert(row.changes[row.style==='marissa'?0:1]>0);
  }
  console.log('Browser tattoo checks:',JSON.stringify(changes));
  await page.evaluate(() => {
    const {entries,THREE,variants}=window.laraChecks;
    document.body.innerHTML='';document.body.style.margin='0';
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    renderer.setSize(1100,800);renderer.setClearColor(0xf3f4f6);document.body.appendChild(renderer.domElement);
    const view=new THREE.Scene();view.add(new THREE.HemisphereLight(0xffffff,0x777777,3));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(1,3,4);view.add(light);
    const camera=new THREE.OrthographicCamera(-1.25,1.25,1.1,-.72,.01,10);camera.position.set(0,.9,4);camera.lookAt(0,.9,0);
    for(const [i,style] of ['marissa','delphina'].entries()) {
      const scene=entries.find(e=>e.style===style).scene;
      scene.position.x=i===0?-.62:.62;
      scene.traverse(m=>{if(m.isMesh) m.visible=['arms','body_legs','fingers','face','eyes','body_torso','shirt','shorts','boots','hair_base','braid'].includes(m.name);});
      const maps=[];scene.traverse(m=>{if(m.isMesh) for(const mat of Array.isArray(m.material)?m.material:[m.material]) maps.push(mat.map);});
      variants.applyLaraRealisticTextures(scene,true);variants.applyLaraRealisticTextures(scene,false);
      let j=0;scene.traverse(m=>{if(m.isMesh) for(const mat of Array.isArray(m.material)?m.material:[m.material]) {if(mat.map!==maps[j++]) throw Error('Realistic mode replaced tattoo texture');}});
      view.add(scene);
    }
    window.renderLara=()=>renderer.render(view,camera);window.renderLara();
    window.turnLara=(x,z)=>{camera.position.set(x,.9,z);camera.lookAt(0,.9,0);renderer.render(view,camera);};
    window.animateLara=()=>{
      for(const scene of view.children.filter(n=>n.getObjectByName('arm_left_elbow'))) {
        const arm=scene.getObjectByName('arms');
        if (!arm.isSkinnedMesh) throw Error('Lara arms lost skinning');
        const positions=arm.geometry.attributes.position;
        let index=0;
        for(let i=1;i<positions.count;i++) if(positions.getX(i)>positions.getX(index)) index=i;
        scene.updateMatrixWorld(true);arm.skeleton.update();
        const rest=new THREE.Vector3().fromBufferAttribute(positions,index);
        const before=arm.applyBoneTransform(index,rest.clone());
        const elbow=scene.getObjectByName('arm_left_elbow');
        elbow.rotation.z+=Math.PI/6;
        scene.getObjectByName('leg_left_thigh').rotation.x+=Math.PI/12;
        scene.updateMatrixWorld(true);arm.skeleton.update();
        const after=arm.applyBoneTransform(index,rest.clone());
        if(before.distanceTo(after)<=Number.EPSILON) throw Error('Lara limb skinning does not respond to bone animation');
      }
      renderer.render(view,camera);
    };
    window.nudeLara=()=>{view.traverse(m=>{if(m.isMesh) {if(m.name.startsWith('body_nude_legs')||m.name.startsWith('body_nude_feet')||m.name.startsWith('body_nude_torso')) m.visible=true; if(['body_legs','boots','shorts','body_torso','shirt'].includes(m.name)) m.visible=false;}});renderer.render(view,camera);};
  });
  await page.screenshot({path:'/tmp/lara-limbs-front.png'});
  await page.evaluate(()=>window.nudeLara());
  await page.screenshot({path:'/tmp/lara-limbs-nude.png'});
  await page.evaluate(()=>window.turnLara(2,4));
  await page.screenshot({path:'/tmp/lara-limbs-three-quarter.png'});
  await page.evaluate(()=>window.turnLara(0,-4));
  await page.screenshot({path:'/tmp/lara-limbs-back.png'});
  await page.evaluate(()=>{window.turnLara(0,4);window.animateLara();});
  await page.screenshot({path:'/tmp/lara-limbs-animated.png'});
  assert.deepEqual(errors,[]);
  console.log('WebGL previews: /tmp/lara-limbs-front.png, /tmp/lara-limbs-nude.png');
} finally { await browser.close(); }
