import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import { writeFileSync } from 'node:fs';
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule()}).read('public/characters/lara/lara_native.glb');
const meshes=[];
for(const n of doc.getRoot().listNodes())if(['body_torso','body_nude_torso'].includes(n.getName())){
 for(const [index,p] of n.getMesh().listPrimitives().entries()){
  meshes.push({name:n.getName(),index,material:p.getMaterial().getName(),positions:Array.from(p.getAttribute('POSITION').getArray()),uv:Array.from(p.getAttribute('TEXCOORD_0').getArray()),indices:Array.from(p.getIndices().getArray())});
 }
}
writeFileSync('/tmp/sara-nape-meshes.json',JSON.stringify(meshes));
console.log(meshes.map(({name,index,material})=>({name,index,material})));

if (process.argv.includes('--preview')) {
 const {default:puppeteer}=await import('puppeteer');
 const {default:launchBrowser}=await import('./browser-test-options.cjs');
 const browser=await puppeteer.launch(launchBrowser());
 try {
 const page=await browser.newPage();
 await page.setViewport({width:1000,height:800});
 page.on('pageerror',error=>{throw error;});
 await page.goto('http://127.0.0.1:5173');
 await page.evaluate(async()=>{
 const THREE=await import('/node_modules/three/build/three.module.js');
 const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
 const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
 const variants=await import('/src/features/scene/LaraVariants.ts');
 const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
 const {scene}=await loader.loadAsync('/characters/lara/lara_native.glb');
 variants.applyLaraVariantStyles(scene,'sara');
 scene.traverse(m=>{if(m.isMesh)m.visible=['body_torso','face','eyes'].includes(m.name);});
 const view=new THREE.Scene();view.add(scene,new THREE.HemisphereLight(0xffffff,0x777777,3));
 const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(0,2,-3);view.add(light);
 const target=new THREE.Vector3(.002,1.48,-.03);
 const camera=new THREE.OrthographicCamera(-.1,.1,.08,-.08,.01,10);camera.position.copy(target).add(new THREE.Vector3(0,0,-2));camera.lookAt(target);
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,800);renderer.setClearColor(0xf3f4f6);
 document.body.replaceChildren(renderer.domElement);
 window.renderSaraNape=(nude)=>{
 scene.traverse(m=>{if(m.isMesh){if(m.name==='body_torso')m.visible=!nude;if(m.name.startsWith('body_nude_torso'))m.visible=nude;}});
 renderer.render(view,camera);
 };
 window.saraNapeReady=()=>{
 let ready=true;
 scene.traverse(m=>{if(m.isMesh&&(m.name==='body_torso'||m.name.startsWith('body_nude_torso')))for(const mat of Array.isArray(m.material)?m.material:[m.material]){
 const ctx=mat.map.image.getContext('2d');
 const pixels=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data;
 let black=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]===0&&pixels[i+1]===0&&pixels[i+2]===0&&pixels[i+3]===255)black++;
 if(black===0)ready=false;
 }});return ready;
 };
 });
 await page.waitForFunction(()=>window.saraNapeReady());
 for(const nude of [false,true]){
 await page.evaluate(nude=>window.renderSaraNape(nude),nude);
 await page.screenshot({path:`/tmp/sara-nape-${nude?'nude':'dressed'}.png`});
 }
 console.log('Sara nape overlays loaded on dressed and nude torso; screenshots saved.');
 }finally{await browser.close();}
}
