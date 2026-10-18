import launchBrowser from './browser-test-options.cjs';
const browser = await launchBrowser({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/characters/lara/textures/LIMB_UVS.md');
  console.log(await page.evaluate(async () => {
    const refresh = await import('/@react-refresh');
    refresh.default.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    const {GLTFLoader} = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const {DRACOLoader} = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
    const {extractCharacterParts,applyClothingAndAccessoriesVisibility} = await import('/src/features/scene/characterParts.ts');
    const {useSceneStore} = await import('/src/features/scene/store/useSceneStore.ts');
    const {parseUrlLaraClothing} = await import('/src/features/scene/store/layerUrlParams.ts');
    const draco = new DRACOLoader().setDecoderPath('/draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const {scene} = await loader.loadAsync('/characters/lara/lara_native.glb');
    const parts=extractCharacterParts(scene);
    for(const key of ['bikiniTop','bikiniBottom','torsoClothed','torsoNude','legsNude']) if(!parts[key].length) throw Error(`Missing ${key}`);
    let checked=0;
    for(const laraTop of ['native','bikini','none']) for(const laraBottom of ['native','bikini','none']) for(const laraShoes of [true,false]) {
      applyClothingAndAccessoriesVisibility(parts,{laraTop,laraBottom,laraShoes,showAccessories:false,laraPistols:false,equipment:{holster:false,pistols:false,backpack:false}});
      const expected={bikiniTop:laraTop==='bikini',bikiniBottom:laraBottom==='bikini',torsoClothed:laraTop==='native',torsoNude:laraTop!=='native',legsNude:laraBottom!=='native',boots:laraShoes,feet:!laraShoes&&laraBottom!=='native',feetClothed:!laraShoes&&laraBottom==='native',legsBarefoot:!laraShoes&&laraBottom==='native'};
      for(const [key,visible] of Object.entries(expected)) if(parts[key].some(({mesh})=>mesh.visible!==visible)) throw Error(`${laraTop}/${laraBottom}/${laraShoes}: ${key}`);
      const store=useSceneStore.getState(); store.setLaraClothing('laraTop',laraTop); store.setLaraClothing('laraBottom',laraBottom);
      const state=useSceneStore.getState().layers, url=parseUrlLaraClothing();
      if(state.laraTop!==laraTop||state.laraBottom!==laraBottom||url.laraTop!==laraTop||url.laraBottom!==laraBottom)throw Error('Independent state / URL mismatch');
      checked++;
    }
    if(scene.getObjectByName('onepiece_bottom'))throw Error('Unwanted one-piece remains');
    draco.dispose();
    return {checked, result:'All clothing combinations and URL state passed'};
  }));
} finally { await browser.close(); }
