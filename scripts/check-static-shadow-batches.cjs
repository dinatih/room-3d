// Isolated framebuffer regression: no full Studio load and no external resources.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const launch=require('./browser-test-options.cjs');
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});
 const directory=fs.mkdtempSync(path.resolve('test-results/static-shadow-check-'));
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,cacheDir:path.join(directory,'vite'),root:process.cwd(),server:{host:'127.0.0.1',port:0},plugins:[{name:'empty-shadow-fixture',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url!=='/')return next();res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0"><canvas></canvas></body></html>');});}}]});
 let browser;
 try{
  await server.listen();browser=await launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage();await page.setViewport({width:800,height:600,deviceScaleFactor:1});
  await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);
  const result=await page.evaluate(async()=>{
   const T=await import('/node_modules/three/build/three.module.js');
   const {registerStaticShadowBatches,installStaticShadowBatching,staticShadowBatching}=await import('/tests/fixtures/static-shadow-batches.ts');
   const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),preserveDrawingBuffer:true,antialias:false});
   renderer.setSize(800,600);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
   const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),gpu=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null;
   const scene=new T.Scene();scene.background=new T.Color(.2,.2,.2);
   const camera=new T.PerspectiveCamera(45,4/3,.1,100);camera.position.set(9,10,13);camera.lookAt(0,0,0);
   scene.add(new T.AmbientLight(0xffffff,.3));
   const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0xaaaaaa}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
   const group=new T.Group();group.rotation.y=.3;scene.add(group);
   for(let i=0;i<12;i++){
    const g=new T.BoxGeometry(.8,1+i%3*.4,.8).translate((i%4-1.5)*1.4,1+i%3*.2,(Math.floor(i/4)-1)*1.4);
    const material=new T.MeshStandardMaterial({color:new T.Color().setHSL(i/12,.6,.5)});
    if(i%2===0){material.map=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);material.map.needsUpdate=true;}
    const mesh=new T.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
   }
   const dispose=registerStaticShadowBatches(scene,group.children),uninstall=installStaticShadowBatching(renderer,scene);
   let pass='main',counts;
   const shadow=renderer.shadowMap.render,direct=renderer.renderBufferDirect;
   renderer.shadowMap.render=function(...a){pass='shadow';try{return shadow.apply(this,a);}finally{pass='main';}};
   renderer.renderBufferDirect=function(...a){counts[pass]++;return direct.apply(this,a);};
   const pixels=()=>{const p=new Uint8Array(800*600*4);gl.readPixels(0,0,800,600,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;};
   const rows=[];
   for(const kind of ['directional','spot']){
    const light=kind==='directional'?new T.DirectionalLight(0xffffff,3):new T.SpotLight(0xffffff,600,40,Math.PI/4,.2,2);
    light.position.set(4,10,3);light.castShadow=true;light.shadow.mapSize.set(512,512);
    Object.assign(light.shadow.camera,kind==='directional'?{left:-8,right:8,top:8,bottom:-8,near:.1,far:40}:{near:.1,far:40});
    light.shadow.camera.updateProjectionMatrix();scene.add(light,light.target);
    for(const hidden of [false,true]){
     group.children[3].visible=!hidden;
     const records=[];
     for(const enabled of [false,true]){
      staticShadowBatching.enabled=enabled;counts={main:0,shadow:0};renderer.render(scene,camera);
      records.push({counts:{...counts},pixels:pixels()});
     }
     let different=0,maxDifference=0;
     for(let i=0;i<records[0].pixels.length;i++){const delta=Math.abs(records[0].pixels[i]-records[1].pixels[i]);if(delta)different++;maxDifference=Math.max(maxDifference,delta);}
     rows.push({kind,hidden,before:records[0].counts,after:records[1].counts,different,maxDifference});
    }
    scene.remove(light,light.target);light.shadow.dispose();
   }
   renderer.shadowMap.render=shadow;renderer.renderBufferDirect=direct;uninstall();dispose();renderer.dispose();
   return {gpu,rows};
  });
  for(const row of result.rows){assert(row.maxDifference<=1,JSON.stringify(row));assert.equal(row.before.main,row.after.main);if(!row.hidden)assert(row.after.shadow<row.before.shadow,JSON.stringify(row));}
  fs.writeFileSync(`${directory}/comparison.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));console.log(`Résultats : ${directory}/comparison.json`);
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
