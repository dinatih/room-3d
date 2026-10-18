import launchBrowser from './browser-test-options.cjs';
const browser=await launchBrowser({args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const page=await browser.newPage();
 await page.setViewport({width:1100,height:900});
 page.on('pageerror',error=>{throw error;});
 await page.goto('http://127.0.0.1:5173/characters/lara/textures/LIMB_UVS.md');
 await page.evaluate(async()=>{
 const THREE=await import('/node_modules/three/build/three.module.js');
 const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
 const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
 const {applyLaraVariantStyles}=await import('/src/features/scene/LaraVariants.ts');
 const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
 const {scene}=await loader.loadAsync('/characters/lara/lara_native.glb');
 window.marissaLegBones=[];scene.traverse(n=>{if(n.isBone&&n.name.includes('leg_'))window.marissaLegBones.push(n.name);});
 applyLaraVariantStyles(scene,'marissa');
 scene.traverse(m=>{if(m.isMesh)m.visible=m.name==='arms'||m.name==='face'||m.name.startsWith('body_nude_');});
 const view=new THREE.Scene();view.add(scene,new THREE.HemisphereLight(0xffffff,0x777777,3));
 const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(0,3,4);view.add(light);
 const camera=new THREE.OrthographicCamera(-.35,.35,.286,-.286,.01,10);
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,900);renderer.setClearColor(0xf3f4f6);
 document.body.replaceChildren(renderer.domElement);
 window.marissaTattooView=(part)=>{
 const target=part==='legs'?new THREE.Vector3(0,.57,0):scene.getObjectByName('arm_left_wrist').getWorldPosition(new THREE.Vector3()).lerp(scene.getObjectByName('arm_left_elbow').getWorldPosition(new THREE.Vector3()),.5);
 const span=part==='legs'?.55:.2;camera.left=-span;camera.right=span;camera.top=span*900/1100;camera.bottom=-camera.top;camera.updateProjectionMatrix();
 camera.position.copy(target).add(new THREE.Vector3(0,part==='arm'?3:0,3));camera.lookAt(target);renderer.render(view,camera);
 };
 window.marissaArmReady=()=>{
 const mesh=scene.getObjectByName('arms');
 const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
 return material.map.version>1;
 };
 });
 await page.waitForFunction(()=>window.marissaArmReady());
 console.log('Leg bones',await page.evaluate(()=>window.marissaLegBones));
 for(const part of ['arm','legs']){
 await page.evaluate(part=>window.marissaTattooView(part),part);
 await page.screenshot({path:`/tmp/marissa-tattoos-${part}.png`});
 }
 console.log('Marissa lion loaded; arm and leg previews saved.');
}finally{await browser.close();}
