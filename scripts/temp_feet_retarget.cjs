const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
const { spawn } = require('node:child_process');
(async () => {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5194','--strictPort']);
  server.stderr.pipe(process.stderr);
  let browser;
  try {
    await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve();});server.on('exit',c=>reject(Error('Vite '+c)));});
    browser = await launch({args:['--no-sandbox']});
    const page = await browser.newPage();
    page.on('pageerror',e=>console.error(e));
    await page.setViewport({width:1600,height:1000});
    await page.goto('http://127.0.0.1:5194/AGENTS.md');
    if (process.argv.includes('--native')) {
      await page.evaluate(async meshes => {
        const THREE=await import('/node_modules/three/build/three.module.js');
        document.body.innerHTML='';document.body.style.margin='0';
        const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
        renderer.setSize(1600,1000);renderer.setClearColor(0xe6e9ed);renderer.setScissorTest(true);document.body.append(renderer.domElement);
        const columns=meshes.length===2?2:3,rows=Math.ceil(meshes.length/columns),width=1600/columns,height=1000/rows;
        const camera=new THREE.PerspectiveCamera(35,width/height,.001,100);
        for (const [i,item] of meshes.entries()) {
          const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x777777,3));
          const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(2,3,3);scene.add(light);
          const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(item.vertices,3));geometry.setIndex(item.indices);geometry.computeVertexNormals();
          scene.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x92aec4,side:THREE.DoubleSide})));
          scene.add(new THREE.GridHelper(3,30));
          camera.position.set(columns===2?1.3:.7,.27,columns===2?1.3:.7);camera.lookAt(0,.07,0);
          const x=i%columns*width,y=1000-(Math.floor(i/columns)+1)*height;
          renderer.setViewport(x,y,width,height);renderer.setScissor(x,y,width,height);renderer.render(scene,camera);
          const label=document.createElement('div');label.textContent=`${item.recording} ${item.person} — frame ${item.frame}`;
          label.style.cssText=`position:absolute;left:${x+8}px;top:${1000-y-height+20}px;font:13px sans-serif`;document.body.append(label);
        }
      },JSON.parse(fs.readFileSync(process.argv.includes('--actorcore')?'/tmp/room-feet-actorcore-native-meshes.json':'/tmp/room-feet-native-meshes.json','utf8')));
      await page.screenshot({path:process.argv.includes('--actorcore')?'/tmp/room-feet-actorcore-native.png':'/tmp/room-feet-native.png'});
      return;
    }
    const result = await page.evaluate(async ({xbot,gaits}) => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const {GLTFLoader} = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const {DRACOLoader} = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const {retargetClip} = await import('/src/features/scene/retargeting/retargetClip.ts');
      const {resolveTargetBoneName} = await import('/src/features/scene/retargeting/boneResolver.ts');
      const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
      const target = (await loader.loadAsync(xbot?'/characters/xbot/Xbot_official.glb':'/characters/lara/lara_native.glb')).scene;
      target.scale.setScalar(100); target.updateMatrixWorld(true);
      const rest=[];
      target.traverse(o=>{rest.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);o.defaultPosition=o.position.clone();o.restLocalQuaternion=o.quaternion.clone();o.restWorldQuaternion=o.getWorldQuaternion(new THREE.Quaternion());o.restWorldPosition=o.getWorldPosition(new THREE.Vector3());});
      const reset=()=>{for(const [o,p,q,s] of rest){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}target.updateMatrixWorld(true);};
      const roles=['LeftLeg','LeftFoot','LeftToeBase','RightFoot','RightToeBase'];
      function describe(root){return roles.map(role=>{const o=root.getObjectByName(resolveTargetBoneName(root,role));return o&&{role,name:o.name,p:o.getWorldPosition(new THREE.Vector3()).toArray(),q:o.getWorldQuaternion(new THREE.Quaternion()).toArray(),local:o.quaternion.toArray(),children:o.children.map(c=>({name:c.name,p:c.getWorldPosition(new THREE.Vector3()).toArray()}))};});}
      const result={rest:describe(target,true),sources:[],poses:[],gaits:[]};
      function solePitch(bones, rests, side) {
        const foot=bones.find(b=>b?.role===side+'Foot'), rest=rests.find(b=>b?.role===side+'Foot'), toe=rests.find(b=>b?.role===side+'ToeBase');
        const forward=new THREE.Vector3().fromArray(toe.p).sub(new THREE.Vector3().fromArray(rest.p));forward.y=0;forward.normalize();
        forward.applyQuaternion(new THREE.Quaternion().fromArray(foot.q).multiply(new THREE.Quaternion().fromArray(rest.q).invert()));
        return THREE.MathUtils.radToDeg(Math.atan2(forward.y,Math.hypot(forward.x,forward.z)));
      }
      document.body.innerHTML='';document.body.style.margin='0';
      const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1600,1000);renderer.setClearColor(0xe6e9ed);renderer.setScissorTest(true);document.body.append(renderer.domElement);
      const scene=new THREE.Scene();scene.add(target,new THREE.HemisphereLight(0xffffff,0x777777,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(200,300,300);scene.add(light);
      const floor=new THREE.GridHelper(1000,100);scene.add(floor);
      const camera=new THREE.PerspectiveCamera(35,800/500,0.1,10000);
      const clips=[['fab/actorcore/dual-gun-muzdn-mov-cool-shoot-279383.glb',[27,92],'rest-meters'],['npz/interx/g019t006a000r024-p1.glb',[25,174],'world-meters'],['mixamo/anim_female_walk.glb',[],undefined],['mixamo/anim_running.glb',[],undefined]];
      let cell=0;
      for(const [path,frames,space] of clips.filter(([path])=>!gaits||path.startsWith('mixamo/'))){
        reset();const source=await loader.loadAsync('/animations/'+path);result.sources.push({path,rest:describe(source.scene)});
        if(gaits)frames.push(Math.floor(source.animations[0].duration*30/4),Math.floor(source.animations[0].duration*30*3/4));
        const clip=retargetClip(source.animations[0],target,source.scene,space);
        const sourceMixer=new THREE.AnimationMixer(source.scene);sourceMixer.clipAction(source.animations[0]).play();
        const mixer=new THREE.AnimationMixer(target);const action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1).play();action.clampWhenFinished=true;
        for(const frame of frames){mixer.setTime(frame/30);target.updateMatrixWorld(true);target.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});sourceMixer.setTime(frame/30);source.scene.updateMatrixWorld(true);result.poses.push({path,frame,bones:describe(target,true),source:describe(source.scene)});
          const feet=['LeftFoot','RightFoot'].map(r=>target.getObjectByName(resolveTargetBoneName(target,r)).getWorldPosition(new THREE.Vector3()));
          const look=feet[0].clone().add(feet[1]).multiplyScalar(.5);look.y=12;
          camera.position.copy(look).add(new THREE.Vector3(130,40,150));camera.lookAt(look);
          const x=(cell%2)*800,y=500-Math.floor(cell/2)*500;renderer.setViewport(x,y,800,500);renderer.setScissor(x,y,800,500);renderer.render(scene,camera);
          const label=document.createElement('div');label.textContent=path.split('/').pop()+' — frame '+frame;label.style.cssText=`position:absolute;left:${x+15}px;top:${1000-y-480}px;font:18px sans-serif;color:black`;document.body.append(label);cell++;
        }
        if(!frames.length){const samples=[];for(let f=0;f<=Math.floor(clip.duration*30);f++){mixer.setTime(f/30);target.updateMatrixWorld(true);samples.push(describe(target,true));}result.gaits.push({path,samples});}
        mixer.stopAllAction();mixer.uncacheRoot(target);sourceMixer.stopAllAction();sourceMixer.uncacheRoot(source.scene);
      }
      result.pitch=result.poses.map(p=>({path:p.path,frame:p.frame,feet:['Left','Right'].map(side=>({side,source:solePitch(p.source,result.sources.find(s=>s.path===p.path).rest,side),target:solePitch(p.bones,result.rest,side)}))}));
      if(!result.gaits.every(g=>g.samples.every(frame=>frame.every(b=>b.q.every(Number.isFinite)))))throw Error('Nonfinite gait rotation');
      return result;
    },{xbot:process.argv.includes('--xbot'),gaits:process.argv.includes('--gaits')});
    const name=(process.argv.includes('--baseline')?'before':'after')+(process.argv.includes('--xbot')?'-xbot':'')+(process.argv.includes('--gaits')?'-gaits':'');
    fs.writeFileSync('/tmp/room-feet-'+name+'.json',JSON.stringify(result,null,2));
    await page.screenshot({path:'/tmp/room-feet-'+name+'.png'});
    console.log(JSON.stringify(result.pitch,null,2));
  } finally {await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
