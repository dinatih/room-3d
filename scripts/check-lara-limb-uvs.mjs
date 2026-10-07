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
assert.deepEqual(newNodes.filter(n=>!n.getName().startsWith('body_bare_feet_clothed')&&!n.getName().startsWith('body_legs_barefoot')).map(n => n.getName()).sort(), oldNodes.filter(n=>!n.getName().startsWith('body_bare_feet_clothed')&&!n.getName().startsWith('body_legs_barefoot')).map(n => n.getName()).sort());
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
for (const name of ['arms','body_legs','body_legs_barefoot','fingers','body_nude_legs','body_nude_hands','body_nude_feet']) {
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
        if (base && mat.map!==base && (m.name==='arms'||m.name==='body_legs'||m.name.startsWith('body_legs_barefoot')||mat.userData.lara_tattoo_projection||mat.userData.lara_sara_tattoo_projection)) {
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
    window.laraChecks={entries,THREE,variants,loader};
    window.laraChanges=()=>entries.flatMap(({style,materials})=>materials.map(({mesh,mat,base})=>{
      const canvas=document.createElement('canvas'); canvas.width=1024;canvas.height=512;
      const ctx=canvas.getContext('2d');ctx.drawImage(base.image,0,0);
      const original=ctx.getImageData(0,0,1024,512).data;
      ctx.clearRect(0,0,1024,512);ctx.drawImage(mat.map.image,0,0);
      const painted=ctx.getImageData(0,0,1024,512).data;
      const changes=[0,0];
      for(let i=0;i<original.length;i+=4) if(original[i]!==painted[i]||original[i+1]!==painted[i+1]||original[i+2]!==painted[i+2]) changes[((i/4)%1024)<512?0:1]++;
      return {style,mesh,projection:mat.userData.lara_tattoo_projection??mat.userData.lara_sara_tattoo_projection,changes};
    }));
  });
  await page.waitForFunction(() => ['marissa','delphina'].every(style => window.laraChanges().some(r=>r.style===style&&r.mesh.startsWith('body_nude_legs')&&r.changes[style==='marissa'?0:1]>0)));
  await page.waitForFunction(() => window.laraChanges().some(r=>r.style==='sara'&&r.mesh.startsWith('body_nude_torso')&&r.changes.some(n=>n>0)));
  const changes=await page.evaluate(()=>window.laraChanges());
  for(const row of changes) {
    if(row.style==='sara') {
      assert(row.mesh.startsWith('body_nude_torso'));
      assert(row.changes.reduce((sum,n)=>sum+n,0)>0, 'Sara nude neck tattoo missing');
      continue;
    }
    assert.equal(row.changes[row.style==='marissa'?1:0],0,`${row.style} ${row.mesh}: tattoo on opposite side`);
    if(row.mesh==='arms'||row.mesh==='body_legs'||row.mesh.startsWith('body_legs_barefoot')) assert(row.changes[row.style==='marissa'?0:1]>0);
  }
  console.log('Browser tattoo checks:',JSON.stringify(changes));
  await page.evaluate(() => {
    const {entries,THREE,variants}=window.laraChecks;
    document.body.innerHTML='';document.body.style.margin='0';
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    renderer.setSize(1100,800);renderer.setClearColor(0xf3f4f6);document.body.appendChild(renderer.domElement);
    const view=new THREE.Scene();view.add(new THREE.HemisphereLight(0xffffff,0x777777,3));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(1,3,4);view.add(light);
    const camera=new THREE.OrthographicCamera(-1.25,1.25,1,-.9,.01,10);camera.position.set(0,.9,4);camera.lookAt(0,.9,0);
    for(const [i,style] of ['marissa','delphina'].entries()) {
      const scene=entries.find(e=>e.style===style).scene;
      scene.position.x=i===0?-.62:.62;
      scene.updateMatrixWorld(true);
      scene.traverse(n=>{
        n.restLocalQuaternion=n.quaternion.clone();n.restWorldQuaternion=n.getWorldQuaternion(new THREE.Quaternion());
        n.restWorldPosition=n.getWorldPosition(new THREE.Vector3());
        if(n.isSkinnedMesh)n.frustumCulled=false;
      });
      scene.traverse(m=>{if(m.isMesh) m.visible=['arms','body_legs','fingers','gloves','face','eyes','body_torso','shirt','shorts','boots','hair_base','braid'].includes(m.name);});
      const maps=[];scene.traverse(m=>{if(m.isMesh) for(const mat of Array.isArray(m.material)?m.material:[m.material]) maps.push(mat.map);});
      variants.applyLaraRealisticTextures(scene,true);variants.applyLaraRealisticTextures(scene,false);
      let j=0;scene.traverse(m=>{if(m.isMesh) for(const mat of Array.isArray(m.material)?m.material:[m.material]) {if(mat.map!==maps[j++]) throw Error('Realistic mode replaced tattoo texture');}});
      view.add(scene);
    }
    window.renderLara=()=>renderer.render(view,camera);window.renderLara();
    window.turnLara=(x,z)=>{camera.position.set(x,.9,z);camera.lookAt(0,.9,0);renderer.render(view,camera);};
    window.detailLara=(side,height)=>{
      const characters=view.children.filter(n=>n.getObjectByName('arm_left_elbow'));
      characters.forEach((scene,i)=>{scene.visible=i===0;});
      const targetX=characters[0].position.x;
      camera.left=-.275;camera.right=.275;camera.top=.2;camera.bottom=-.2;
      camera.updateProjectionMatrix();
      camera.position.set(targetX+side*4,height,1);
      camera.lookAt(targetX,height,0);renderer.render(view,camera);
    };
    window.restoreLara=()=>{
      view.children.filter(n=>n.getObjectByName('arm_left_elbow')).forEach(scene=>{scene.visible=true;});
      camera.left=-1.25;camera.right=1.25;camera.top=1;camera.bottom=-.9;
      camera.updateProjectionMatrix();
    };
    window.crouchLara=()=>{
      for (const scene of view.children.filter(n=>n.getObjectByName('arm_left_elbow'))) {
        for (const side of ['left','right']) {
          scene.getObjectByName(`leg_${side}_thigh`).rotation.x=-Math.PI/2;
          scene.getObjectByName(`leg_${side}_knee`).rotation.x=Math.PI/2;
        }
        scene.getObjectByName('spine_lower').rotation.x=Math.PI/4;
        scene.getObjectByName('spine_upper').rotation.x=Math.PI/6;
        scene.updateMatrixWorld(true);
      }
      window.detailLara(1,1);
    };
    window.splitLara=async(frame=770)=>{
      const {loader}=window.laraChecks;
      const source=await loader.loadAsync('/animations/yoga/anim_yoga_split_pose_a.glb');
      const {retargetClip}=await import('/src/features/scene/retargeting/index.ts');
      const entry=entries.find(e=>e.style==='marissa');
      for(const [bone,position,quaternion,scale] of entry.restBones){bone.position.copy(position);bone.quaternion.copy(quaternion);bone.scale.copy(scale);}
      entry.scene.updateMatrixWorld(true);source.scene.updateMatrixWorld(true);
      const clip=retargetClip(source.animations[0],entry.scene,source.scene);
      const mixer=new THREE.AnimationMixer(entry.scene);mixer.clipAction(clip).play();mixer.setTime(frame/30);
      entry.scene.updateMatrixWorld(true);entry.scene.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update();});
      view.children.filter(n=>n.getObjectByName('arm_left_elbow')).forEach(n=>{n.visible=n===entry.scene;});
      const pelvis=entry.scene.getObjectByName('pelvis').getWorldPosition(new THREE.Vector3());
      camera.left=-.275;camera.right=.275;camera.top=.2;camera.bottom=-.2;camera.updateProjectionMatrix();
      camera.position.copy(pelvis).add(new THREE.Vector3(0,-1,3));camera.lookAt(pelvis);renderer.render(view,camera);
    };
    window.abductLara=()=>{
      const entry=entries.find(e=>e.style==='marissa');
      for(const [bone,position,quaternion,scale] of entry.restBones){bone.position.copy(position);bone.quaternion.copy(quaternion);bone.scale.copy(scale);}
      for(const [side,sign] of [['left',1],['right',-1]]) {
        entry.scene.getObjectByName(`leg_${side}_thigh`).quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),sign*Math.PI/2));
      }
      entry.scene.updateMatrixWorld(true);
      entry.scene.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update();});
      const pelvis=entry.scene.getObjectByName('pelvis').getWorldPosition(new THREE.Vector3());pelvis.y-=.1;
      camera.position.copy(pelvis).add(new THREE.Vector3(0,-1,3));camera.lookAt(pelvis);renderer.render(view,camera);
    };
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
    window.bareExtremitiesLara=()=>{
      view.traverse(m=>{if(m.isMesh){
        if(m.name.startsWith('body_bare_feet_clothed')||m.name.startsWith('body_legs_barefoot'))m.visible=true;
        if(m.name.startsWith('body_nude_feet'))m.visible=false;
        if(m.name==='body_legs'||m.name.includes('boots'))m.visible=false;
      }});renderer.render(view,camera);
    };
    window.extremityDetailLara=(part)=>{
      const scene=entries.find(e=>e.style==='marissa').scene;
      view.children.filter(n=>n.getObjectByName('arm_left_elbow')).forEach(n=>n.visible=n===scene);
      const mesh=scene.getObjectByName(part);
      const bounds=new THREE.Box3().setFromObject(mesh,true),target=bounds.getCenter(new THREE.Vector3());
      const extent=bounds.getSize(new THREE.Vector3()).length()/2;
      camera.left=-extent;camera.right=extent;camera.top=extent*800/1100;camera.bottom=-camera.top;camera.updateProjectionMatrix();
      camera.position.copy(target).add(new THREE.Vector3(0,1,3));camera.lookAt(target);renderer.render(view,camera);
    };
    window.nudeLara=()=>{view.traverse(m=>{if(m.isMesh) {if(m.name.startsWith('body_nude_legs')||m.name.startsWith('body_nude_feet')||m.name.startsWith('body_nude_torso')||m.name.startsWith('body_nude_panties')) m.visible=true; if(m.name.startsWith('body_bare_feet_clothed')||m.name.startsWith('body_legs_barefoot')||['body_legs','boots','shorts','body_torso','shirt'].includes(m.name)) m.visible=false;}});renderer.render(view,camera);};
  });
  await page.screenshot({path:'/tmp/lara-limbs-front.png'});
  await page.evaluate(()=>window.bareExtremitiesLara());
  await page.screenshot({path:'/tmp/lara-barefoot-gloves.png'});
  const extremities=await page.evaluate(()=>window.laraChecks.entries.find(e=>e.style==='marissa').scene.children.flatMap(n=>{const names=[];n.traverse(m=>{if(m.isMesh&&m.name.startsWith('body_bare_feet_clothed'))names.push(m.name);});return names;}));
  for(const part of extremities){
    await page.evaluate(part=>window.extremityDetailLara(part),part);
    await page.screenshot({path:`/tmp/lara-${part}-bare.png`});
  }
  await page.evaluate(()=>{window.restoreLara();window.turnLara(0,4);window.nudeLara();});
  await page.screenshot({path:'/tmp/lara-limbs-nude.png'});
  await page.evaluate(()=>window.turnLara(2,4));
  await page.screenshot({path:'/tmp/lara-limbs-three-quarter.png'});
  await page.evaluate(()=>window.turnLara(0,-4));
  await page.screenshot({path:'/tmp/lara-limbs-back.png'});
  for (const [part,height] of [['chest',1.35],['hip',1]]) {
    for (const side of [-1,1]) {
      await page.evaluate((side,height)=>window.detailLara(side,height),side,height);
      await page.screenshot({path:`/tmp/lara-${part}-${side===1?'left':'right'}.png`});
    }
  }
  await page.evaluate(()=>{window.restoreLara();window.turnLara(0,4);window.animateLara();});
  await page.screenshot({path:'/tmp/lara-limbs-animated.png'});
  await page.evaluate(()=>window.crouchLara());
  await page.screenshot({path:'/tmp/lara-crouch-deformation.png'});
  await page.evaluate(()=>{const scene=window.laraChecks.entries.find(e=>e.style==='marissa').scene;scene.traverse(m=>{if(m.isMesh){if(['body_legs','shorts'].includes(m.name))m.visible=true;if(m.name.startsWith('body_nude_legs')||m.name.startsWith('body_nude_panties'))m.visible=false;}});});
  await page.evaluate(()=>window.splitLara());
  await page.screenshot({path:'/tmp/lara-split-clothed-crotch.png'});
  await page.evaluate(()=>window.nudeLara());
  await page.evaluate(()=>window.splitLara());
  await page.screenshot({path:'/tmp/lara-split-crotch.png'});
  await page.evaluate(()=>window.splitLara(333));
  await page.screenshot({path:'/tmp/lara-split-333-crotch.png'});
  await page.evaluate(()=>window.abductLara());
  await page.screenshot({path:'/tmp/lara-abduction-crotch.png'});
  await page.evaluate(() => {
    const {entries,THREE,variants}=window.laraChecks;
    const scene=entries.find(e=>e.style==='sara').scene;
    scene.traverse(m=>{if(m.isMesh)m.visible=['face','eyes','arms','gloves','fingers'].includes(m.name)||m.name.startsWith('body_nude_torso');});
    const maps=[];scene.traverse(m=>{if(m.isMesh)for(const mat of Array.isArray(m.material)?m.material:[m.material])maps.push(mat.map);});
    variants.applyLaraRealisticTextures(scene,true);variants.applyLaraRealisticTextures(scene,false);
    let j=0;scene.traverse(m=>{if(m.isMesh)for(const mat of Array.isArray(m.material)?m.material:[m.material])if(mat.map!==maps[j++])throw Error('Realistic mode replaced Sara neck tattoo');});
    const view=new THREE.Scene();view.add(scene,new THREE.HemisphereLight(0xffffff,0x777777,3));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(1,3,4);view.add(light);
    scene.updateMatrixWorld(true);
    const target=scene.getObjectByName('head_neck_lower').getWorldPosition(new THREE.Vector3());
    const camera=new THREE.OrthographicCamera(-.18,.18,.13,-.13,.01,10);camera.position.copy(target).add(new THREE.Vector3(0,0,3));camera.lookAt(target);
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,800);renderer.setClearColor(0xf3f4f6);
    document.body.replaceChildren(renderer.domElement);renderer.render(view,camera);
    window.saraClothedNeck=()=>{scene.traverse(m=>{if(m.isMesh&&m.name.startsWith('body_nude_torso'))m.visible=false;if(m.isMesh&&m.name==='body_torso')m.visible=true;});renderer.render(view,camera);};
  });
  await page.screenshot({path:'/tmp/lara-sara-nude-neck.png'});
  await page.evaluate(()=>window.saraClothedNeck());
  await page.screenshot({path:'/tmp/lara-sara-clothed-neck.png'});
  assert.deepEqual(errors,[]);
  console.log('Local previews: /tmp/lara-chest-left.png, /tmp/lara-hip-left.png');
} finally { await browser.close(); }
