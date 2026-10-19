const launchBrowser = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await launchBrowser({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage();
    await page.setViewport({width:1000,height:700});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5174/characters/lara/textures/LIMB_UVS.md');
    console.log(JSON.stringify(await page.evaluate(async()=>{
      const THREE=await import('/node_modules/three/build/three.module.js');
      const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const variants=await import('/src/features/scene/LaraVariants.ts');
      const {extractCharacterParts,applyClothingAndAccessoriesVisibility}=await import('/src/features/scene/characterParts.ts');
      const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
      const {scene:model}=await loader.loadAsync('/characters/lara/lara_native.glb');
      variants.applyLaraVariantStyles(model,'cha');
      const parts=extractCharacterParts(model);
      const scene=new THREE.Scene();scene.add(model,new THREE.HemisphereLight(0xffffff,0x777777,3));
      const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(0,3,-4);scene.add(light);
      const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,700);renderer.setClearColor(0x222326);
      document.body.style.margin='0';document.body.replaceChildren(renderer.domElement);
      model.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model,true);const size=bounds.getSize(new THREE.Vector3());
      const target=new THREE.Vector3(0,bounds.min.y+size.y*.79,0);
      const extent=size.y*.10;
      const camera=new THREE.OrthographicCamera(-extent*1000/700,extent*1000/700,extent,-extent,.01,100);
      camera.position.copy(target).add(new THREE.Vector3(0,0,-size.y*2));camera.lookAt(target);
      window.renderCha=(top)=>{
        applyClothingAndAccessoriesVisibility(parts,{laraShoes:true,laraTop:top,laraBottom:'native',showAccessories:false,laraPistols:false,equipment:{holster:false,pistols:false,backpack:false}});
        model.traverse(m=>{if(m.isMesh&&(m.name.includes('hair')||m.name==='braid'))m.visible=false;});
        renderer.render(scene,camera);
      };
      window.renderCha('bikini');
      await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
      window.chaModel=model;
      const inkBounds=[];model.traverse(m=>{if(m.isMesh&&m.geometry.hasAttribute('chaBackInkPosition')){
        const a=m.geometry.getAttribute('chaBackInkPosition');const b=new THREE.Box3();for(let i=0;i<a.count;i++)b.expandByPoint(new THREE.Vector3(a.getX(i),a.getY(i),a.getZ(i)));
        inkBounds.push({name:m.name,min:b.min.toArray(),max:b.max.toArray(),materials:(Array.isArray(m.material)?m.material:[m.material]).map(v=>v.name)});
      }});
      return {min:bounds.min.toArray(),max:bounds.max.toArray(),inkBounds};
    })));
    await new Promise(r=>setTimeout(r,1500));
    await page.evaluate(()=>window.renderCha('bikini'));
    await page.screenshot({path:'/tmp/cha-omoplates-bikini.png'});
    await page.evaluate(()=>window.renderCha('native'));
    await page.screenshot({path:'/tmp/cha-omoplates-habillee.png'});
    await page.evaluate(async()=>{
      const {applyLaraVariantStyles}=await import('/src/features/scene/LaraVariants.ts');
      const materials=()=>{const result=[];window.chaModel.traverse(m=>{if(m.isMesh&&m.name.startsWith('body_nude_torso'))result.push(...(Array.isArray(m.material)?m.material:[m.material]));});return result;};
      const ink=materials();
      if(ink.some(m=>!m.userData.__ownedCharacterMaterial||m.customProgramCacheKey()!=='cha-back-tattoo'))throw Error('Missing independent tattoo material');
      applyLaraVariantStyles(window.chaModel,'native');
      if(materials().some(m=>m.customProgramCacheKey()==='cha-back-tattoo'))throw Error('Cha tattoo leaked into Native');
      applyLaraVariantStyles(window.chaModel,'cha');
      if(materials().some(m=>m.customProgramCacheKey()!=='cha-back-tattoo'))throw Error('Cha tattoo lost on variant change');
    });
    assert.deepEqual(errors,[]);
    console.log('Cha back previews rendered without browser errors.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
