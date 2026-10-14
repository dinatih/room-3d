import launchBrowser from './browser-test-options.cjs';
import puppeteer from 'puppeteer';
const browser=await launchBrowser({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage();await page.setViewport({width:1200,height:900});
 await page.goto('http://127.0.0.1:5173/?npcNb=2');
 await page.evaluate(async()=>{const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');useSceneStore.setState(s=>({layers:{...s.layers,laraShoes:false,laraGloves:false}}));});
 await new Promise(r=>setTimeout(r,4000));
 await page.waitForFunction(()=>{let found=false;window.threeScene?.traverse(n=>{if(n.name==='body_legs'&&n.isSkinnedMesh)found=true;});return found;},{timeout:120000});
 await new Promise(r=>setTimeout(r,3000));
 console.log(JSON.stringify(await page.evaluate(async()=>{let scene;window.threeScene.traverse(n=>{if(n.name==='body_legs'&&n.isMesh)scene=n.parent.parent;});const {extractCharacterParts,applyClothingAndAccessoriesVisibility}=await import('/src/features/scene/characterParts.ts');const p=extractCharacterParts(scene);const groups=Object.fromEntries(['boots','feet','feetClothed','gloves','hands','otherAccessories'].map(k=>[k,p[k].map(v=>[v.mesh.name,v.mesh.visible])]));applyClothingAndAccessoriesVisibility(p,{laraNude:false,laraTopOff:false,laraBottomOff:false,laraShoes:false,laraGloves:false,showAccessories:true,laraPistols:true,equipment:{holster:true,pistols:true,backpack:true}});return {groups,after:Object.fromEntries(['feetClothed','hands'].map(k=>[k,p[k].map(v=>[v.mesh.name,v.mesh.visible])]))};})));
 await page.screenshot({path:'/tmp/lara-runtime-bare.png'});
}catch(e){console.error(e);process.exitCode=1;}finally{await browser.close();}
