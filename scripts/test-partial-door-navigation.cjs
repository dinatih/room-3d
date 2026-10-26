const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const g=require('../src/features/scene/ai/navigation/geometry.ts');
const obstacles=require('../src/features/scene/ai/navigation/obstacles.ts');
const requests=require('../src/features/scene/ai/navigation/doorRequests.ts');
function load(file,deps){const exports={};new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,name=>{assert(name in deps,`Unexpected dependency: ${name}`);return deps[name];});return exports;}
const cameraState={positions:{}};
const doors=load('src/features/scene/doorObstacles.ts',{
  './cameraState':{cameraState},'./ai/navigation/obstacles':obstacles,'./ai/navigation/geometry':g,'./ai/navigation/doorRequests':requests,
  './wallData':{pX:()=>0,pZ:()=>0,BATH_WEST_WALL:0,SHOWER_SOUTH_WALL:0,DiagWall:{p:()=>({x:1000,z:1000}),door:{start:0,width:90},rotY:0}},
});
const architecture={architectureObstacles:[],walkableSurfaces:[[g.rectangle(0,0,600,600)]]};
const nav=load('src/features/scene/ai/navigation/service.ts',{
  '../../positionState':{positionState:{}},'../../furniturePositions':{movingFurniture:new Set()},'./architecture':architecture,'./obstacles':obstacles,'./geometry':g,
  '../../doorObstacles':doors,'./doorRequests':requests,'../agent/agentAvoidance':{limitAgentMovement:(id,start,proposed)=>proposed,isAgentDestinationFree:()=>true,getAgentObstacles:()=>[],beginActorBlockCheck:()=>{},endActorBlockCheck:()=>new Map(),actorBlocksUnchanged:()=>true},
  './comfort':require('../src/features/scene/ai/navigation/comfort.ts'),'./pathfindingClient':{requestPath:(graph,start,target)=>({graph,start,target,status:'ready',path:graph.find(start,target),cancel:()=>{}})},'../../cameraState':{cameraState},
});
function setup(active,gap){
  for(const [key,door]of Object.entries(doors.DOOR_CONFIGS)){
    requests.releaseAgentDoors('walker');requests.releaseAgentDoors('storage');
    door.pivot={x:1000,z:1000};doors.doorCollisionState[key].angle=0;
  }
  architecture.architectureObstacles.splice(0,architecture.architectureObstacles.length,
    {id:'left-wall',polygon:g.rectangle(-300,0,600-gap,4),yMin:0,yMax:250},
    {id:'right-wall',polygon:g.rectangle(300,0,600-gap,4),yMin:0,yMax:250});
  // A new registration invalidates the door limits after fixture changes.
  obstacles.registerObstacle({id:'revision-marker',polygon:g.rectangle(1000,1000,1,1),yMin:0,yMax:1});obstacles.unregisterObstacle('revision-marker');
  obstacles.removeAgentProfile('walker');obstacles.setAgentProfile('walker',{radius:13.3,height:170});
  for(const [key,config]of Object.entries(active))Object.assign(doors.DOOR_CONFIGS[key],config);
  requests.protectDoor('entry','revision',{x:1000,z:1000,y:0,radius:1,height:1});requests.releaseAgentDoors('revision');
}
function walk(start,target,keys,steer){
  const route=nav.createRouteState();let position=start;
  for(let i=0;i<1000&&g.distance(position,target)>g.GEOMETRY_EPSILON;i++){
    const before=position;position=nav.followRoute(route,'walker',position,target,3,steer);
    assert.equal(route.error,null,route.error||'');
    for(const key of keys)assert(g.segmentFree(before,position,[[g.inflate(nav.doorPolygon(key,doors.doorCollisionState[key].angle),13.3+doors.DOOR_CONFIGS[key].margin)]]),`Crossed ${key} leaf`);
  }
  assert(g.distance(position,target)<g.GEOMETRY_EPSILON,`Stopped at ${JSON.stringify(position)}: ${route.waitReason}`);
  nav.resetRoute(route,'walker');
}
const leaf={length:83,thickness:4,closedDir:{x:1,z:0},openNormal:{x:0,z:1},maxAngle:Math.PI/2,yMin:0,yMax:204,margin:1.5};
setup({living:{...leaf,pivot:{x:-41.5,z:0}}},83);
const storage={x:-1.5,z:60,y:0,radius:13.3,height:170};
requests.protectDoor('living','storage',storage);
const revision=requests.getDoorProtectionRevision();for(let i=0;i<100;i++)requests.protectDoor('living','storage',storage);
assert.equal(requests.getDoorProtectionRevision(),revision,'A stationary interaction must not invalidate the graph every frame');
const limit=doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.living);
assert(limit>0&&limit<Math.PI/2,`Expected partial opening, got ${limit}`);
requests.requestDoor('living','walker');assert(requests.doorRequested('living'));
assert(!g.pointInRing(storage,g.inflate(nav.doorPolygon('living',limit),storage.radius+leaf.margin)),'Door entered protected body');
doors.doorCollisionState.living.angle=limit;
walk({x:20,z:-50},{x:20,z:100},['living']);
const blockedRoute=nav.createRouteState();doors.doorCollisionState.living.angle=0;
const start={x:20,z:-50};let next=start;for(let i=0;i<100&&!blockedRoute.waitReason;i++)next=nav.followRoute(blockedRoute,'walker',next,{x:20,z:100},3);
assert.equal(blockedRoute.error,null);assert(/Battant/.test(blockedRoute.waitReason),'Must wait on the real closed leaf');
nav.resetRoute(blockedRoute,'walker');
requests.releaseAgentDoors('storage');assert.equal(doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.living),Math.PI/2);
console.log('Living door: partial protected opening passes; actual closed leaf still blocks; stable geometry cache passed',limit*180/Math.PI);
setup({glassLeft:{...leaf,length:75,thickness:5.5,margin:3,pivot:{x:-75,z:0}},glassRight:{...leaf,length:75,thickness:5.5,margin:3,pivot:{x:75,z:0},closedDir:{x:-1,z:0}}},150);
requests.protectDoor('glassRight','storage',{x:40,z:50,y:0,radius:13.3,height:170});
const left=doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.glassLeft),right=doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.glassRight);
assert.equal(left,Math.PI/2);assert(right>0&&right<Math.PI/2);
doors.doorCollisionState.glassLeft.angle=-left;doors.doorCollisionState.glassRight.angle=right;
walk({x:-30,z:-50},{x:-30,z:100},['glassLeft','glassRight']);
assert.equal([...requests.getDoorProtections('glassLeft')].length,1,'Glass leaves share the protected footprint');
requests.releaseAgentDoors('storage');
console.log('Double door: one protected partial leaf leaves the other passage usable',right*180/Math.PI);
// Coordinate resolution protects the interaction pose and retains it while exiting.
const coords=load('src/features/scene/ai/agent/agentInstructionCoords.ts',{
  '../aiTypes':{},'../navigation/service':nav,'../navigation/obstacles':obstacles,'../navigation/doorRequests':requests,'../../cameraState':{cameraState},
  '../navigation/destinations':{getZoneDestination:()=>({x:0,z:100})},'../smartObjectRegistry':{getSmartObject:()=>({id:'storage-fixture',name:'Storage',category:'storage',position:[0,0,100],rotationY:0,slots:[{slotId:'use',offset:[40,0,50]}]})},
  '../../animations/animationResolver':{resolveSlotAnimation:()=>null},'./agentTypes':{},
});
coords.resolveInstructionCoords({type:'MOVE_TO',smartObjectId:'storage-fixture',slotId:'use',protectedDoor:'glassRight'},null,'walker',{x:-30,z:100});
const protectedPoint=[...requests.getDoorProtections('glassRight')][0];assert.equal(protectedPoint.x,40);assert.equal(protectedPoint.z,50);
coords.resolveInstructionCoords({type:'MOVE_TO',smartObjectId:'storage-fixture',slotId:'use',doorKey:'glassRight',protectedDoor:'glassRight'},null,'walker',{x:-30,z:100});
assert.deepEqual([...requests.getDoorProtections('glassRight')][0],protectedPoint,'Exit must keep the interaction footprint until clear');
requests.releaseAgentDoors('walker');
console.log('Interaction coordinates: protected pose registered and retained through exit');

// Failed routes release their footprint without invalidating their own failure
// on every frame, and restore the footprint when a route can be retried.
setup({living:{...leaf,pivot:{x:-41.5,z:0}}},83);
requests.protectDoor('living','walker',storage);
const failedRoute=nav.createRouteState(),failedStart={x:20,z:-50},invalidGoal={x:1000,z:0};
nav.followRoute(failedRoute,'walker',failedStart,invalidGoal,3,undefined,undefined,false,'living');
assert(failedRoute.error);assert.equal(requests.getAgentDoorProtection('living','walker'),undefined);
const failure=failedRoute.failure;
nav.followRoute(failedRoute,'walker',failedStart,invalidGoal,3,undefined,undefined,false,'living');
assert.equal(failedRoute.failure,failure,'Released protection must not trigger its own route retry');
doors.doorCollisionState.living.angle=doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.living);
nav.followRoute(failedRoute,'walker',failedStart,{x:20,z:100},3,undefined,undefined,false,'living');
assert.equal(failedRoute.error,null);assert.deepEqual(requests.getAgentDoorProtection('living','walker'),storage);
nav.resetRoute(failedRoute,'walker');
console.log('Failed interaction route: stable failure cache, released protection restored on retry');

// Even with a lateral avoidance force, the actual route must finish its final
// step rather than orbit its waypoint forever in unobstructed space.
setup({},83);architecture.architectureObstacles.length=0;
for(let actor=0;actor<15;actor++){
  walk({x:0,z:actor},{x:50,z:actor},[],direction=>{
    const x=direction.x-direction.z,z=direction.z+direction.x,length=Math.hypot(x,z);
    return {x:x/length,z:z/length};
  });
}
console.log('15 open-space routes: persistent lateral steering still reaches each exact waypoint');

if(process.argv.includes('--browser'))(async()=>{
  const {createServer}=await import('vite');const launch=require('./browser-test-options.cjs');
  const server=await createServer({server:{host:'127.0.0.1',port:5198,strictPort:true}});let browser;
  try{
    await server.listen();browser=await launch({args:['--no-sandbox','--enable-gpu','--use-angle=vulkan','--enable-features=Vulkan,VulkanFromANGLE','--disable-vulkan-surface']});
    const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
    await page.goto('http://127.0.0.1:5198/?characterCount=0&skipIntro=1&preset=low&target=studio&projection=ortho&cameraPos=west&cameraElevation=90',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(async()=>{const {cameraState}=await import('/src/features/scene/cameraState.ts');return cameraState.isSceneLaunched;},{timeout:180000});
    const result=await page.evaluate(async()=>{
      const nav=await import('/src/features/scene/ai/navigation/service.ts');
      const profiles=await import('/src/features/scene/ai/navigation/obstacles.ts');
      const requests=await import('/src/features/scene/ai/navigation/doorRequests.ts');
      const doors=await import('/src/features/scene/doorObstacles.ts');
      const registry=await import('/src/features/scene/ai/smartObjectRegistry.ts');
      const {resolveInstructionCoords}=await import('/src/features/scene/ai/agent/agentInstructionCoords.ts');
      const {getZoneDestination}=await import('/src/features/scene/ai/navigation/destinations.ts');
      const {cameraState}=await import('/src/features/scene/cameraState.ts');
      const avoidance=await import('/src/features/scene/ai/agent/agentAvoidance.ts');
      const geometry=await import('/src/features/scene/ai/navigation/geometry.ts');
      const id='partial-door-holder',walker='partial-door-walker';profiles.setAgentProfile(id,{radius:13.3,height:170});profiles.setAgentProfile(walker,{radius:13.3,height:170});
      const results=[];
      try{for(const objectId of ['drona-se-linen','drona-ne-catchall']){
        const obj=registry.getSmartObject(objectId);if(!obj)throw Error('Missing '+objectId);
        const sequence=registry.buildSmartObjectInstructionSequence(objectId,obj.slots[0].slotId);
        if(sequence.some(i=>i.type==='WAIT'&&i.doorKey))throw Error('Sequence still requires complete closure');
        const step=sequence.find(i=>i.type==='MOVE_TO'&&i.protectedDoor&&!i.doorKey);if(!step)throw Error('Missing protected approach for '+objectId);
        const target=resolveInstructionCoords(step,null,id);const key=step.protectedDoor;
        const limit=doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS[key]);
        if(!(limit>0&&limit<Math.PI/2))throw Error('Expected a physical partial opening for '+objectId+', got '+limit);
        requests.requestDoor(key,walker);
        const start=getZoneDestination(key==='living'?'corridor':'garden',walker);
        const end=getZoneDestination('living',walker,start);
        const graph=nav.getNavigationGraph(profiles.getAgentProfile(walker));
        if(!graph.canReach(start,end))throw Error('Actual apartment passage blocked for '+objectId);
        results.push({objectId,target,angleDegrees:limit*180/Math.PI,obstacles:profiles.furnitureObstacles.size,passage:true});
        requests.releaseAgentDoors(id);requests.releaseAgentDoors(walker);
      }}finally{requests.releaseAgentDoors(id);requests.releaseAgentDoors(walker);profiles.removeAgentProfile(id);profiles.removeAgentProfile(walker);}
      // Exercise the real planner, worker and steering together in the loaded
      // garden. Fifteen routes converge on a target occupied by a stationary NPC.
      const ids=Array.from({length:15},(_,i)=>'arrival-test-'+i),blocker='arrival-test-blocker';
      try{
        for(const id of [...ids,blocker])profiles.setAgentProfile(id,{radius:13.3,height:170});
        const start=getZoneDestination('garden',ids[0]);
        const graph=nav.getNavigationGraph(profiles.getAgentProfile(ids[0]));
        const target=[{x:50,z:0},{x:-50,z:0},{x:0,z:50},{x:0,z:-50}]
          .map(d=>({x:start.x+d.x,z:start.z+d.z}))
          .find(point=>geometry.segmentFree(start,point,graph.obstacles));
        if(!target)throw Error('No clear garden segment for arrival test');
        cameraState.positions[blocker]={...target,y:0,yaw:0};
        const actors=ids.map(id=>({id,route:nav.createRouteState(),position:{...start},yaw:0,turn:0,arrived:false}));
        const deadline=performance.now()+30000;let frames=0;
        while(actors.some(actor=>!actor.arrived)){
          if(performance.now()>deadline)throw Error('Garden arrivals timed out: '+JSON.stringify(actors.map(a=>({id:a.id,position:a.position,error:a.route.error}))));
          for(const actor of actors){
            if(actor.arrived)continue;
            cameraState.positions[actor.id]={...actor.position,y:0,yaw:actor.yaw};
            const before=actor.position;
            actor.position=nav.followRoute(actor.route,actor.id,before,target,3,(direction,remaining)=>{
              const s=avoidance.computeSteeringVector(actor.id,before.x,before.z,direction.x,direction.z,remaining);
              return {x:s.steerX,z:s.steerZ};
            });
            if(actor.route.error)throw Error(actor.id+': '+actor.route.error);
            if(geometry.distance(before,actor.position)>0){
              const yaw=avoidance.computeRotYStep(actor.yaw,Math.atan2(actor.position.x-before.x,actor.position.z-before.z),Math.PI,1/30);
              actor.turn+=Math.abs(yaw-actor.yaw);actor.yaw=yaw;
            }
            actor.arrived=geometry.distance(actor.position,target)<1e-6;
          }
          frames++;await new Promise(resolve=>setTimeout(resolve,0));
        }
        if(actors.some(a=>a.turn>Math.PI))throw Error('Unexpected rotation on a straight garden route');
        results.push({test:'15 concurrent garden arrivals at occupied target',arrived:actors.length,frames,maxTurnDegrees:Math.max(...actors.map(a=>a.turn))*180/Math.PI});
        for(const actor of actors)nav.resetRoute(actor.route,actor.id);
      }finally{for(const id of [...ids,blocker]){delete cameraState.positions[id];profiles.removeAgentProfile(id);}}
      return results;
    });
    assert.deepEqual(errors,[]);fs.writeFileSync('/tmp/room-partial-door-check.json',JSON.stringify({result,errors},null,2));console.log('Actual apartment partial doors:',JSON.stringify(result));
  }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
