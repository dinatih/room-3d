const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),THREE=require('three');
function load(file,deps){const exports={};new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(exports,name=>{assert(name in deps,`Unexpected dependency ${name}`);return deps[name];});return exports;}
const clips=load('src/features/scene/items/dogLifeClips.ts',{}),catalog=require('../src/features/inventory/dogAnimationOptions.json');
for(const id of ['animated-pitbull-dog','ushiro','dachshund-sculpt'])for(const name of Object.values(clips.PITBULL_LIFE_CLIPS))assert(catalog[id].some(c=>c.value===name),id+' missing '+name);
const choices=load('src/features/inventory/pitbullAnimationChoices.ts',{'./dogAnimationOptions.json':catalog});
assert.equal(choices.PITBULL_COMPARISON_CLIPS.length,16);
assert.equal(new Set(choices.pitbullAnimationChoices.map(c=>c.value)).size,119);
for(const name of ['pee 43','walk_fwd_sniff 46','idle_to_idle_lay 111','idle_lay_pose 2','idle_lay_to_idle 71'])assert(choices.PITBULL_COMPARISON_CLIPS.some(c=>c.value===name));
const dogs=require('../src/features/inventory/extraDogs.json');
for(const [idle,mapping]of Object.entries(clips.NATIVE_DOG_LIFE_CLIPS)){
 const dog=dogs.find(d=>d.idleClip===idle);assert(dog,idle);
 for(const name of Object.values(mapping))assert(catalog[dog.id].some(c=>c.value===name),dog.id+' missing '+name);
}
let budget;
const nav={createRouteState:()=>({}),resetRoute:()=>{},randomReachableTarget:()=>null,getNavigationGraph:()=>({canReach:()=>true}),followRoute:(route,id,start,target,step)=>{budget=step;return target;}};
const life=load('src/features/scene/items/dogBehavior.ts',{
 three:THREE,'./dogLifeClips':clips,'../ai/SpatialZone':{SpatialZoneManager:{getZoneAt:()=>null}},'../ai/navigation/service':nav,
 '../ai/navigation/groundElevation':{getWalkableGroundY:()=>0},'../ai/navigation/obstacles':{getAgentProfile:()=>({})},
 '../ai/agent/agentAvoidance':{reserveAgentDestination:()=>{},isAgentDestinationFree:()=>true,computeRotYStep:()=>0,computeSteeringVector:()=>({steerX:0,steerZ:1})},
 '@features/ui/AppConsole':{appLog:()=>{}},'./dogBowlData':{dogFeedingStation:{}},'../ai/navigation/navigationScope':{NavigationScope:class{clear(){}poll(f){f();}},navigationValue:(key,f)=>f()},'../camera/subjectControls':{SubjectDriver:class{}},
});
const root=new THREE.Group(),parent=new THREE.Group();parent.add(root);const calls=[];
const context={id:'test',root,walkSpeed:50,canSniff:true,lieTransitions:true,pauses:['lie'],play:(action,once=false)=>{calls.push({action,once});return 2;}};
let state=life.createDogBehavior();life.startDogPause(state,context);assert.equal(state.action,'layDown');assert.deepEqual(calls.at(-1),{action:'layDown',once:true});
life.updateDogBehavior(state,context,state.remaining);assert.equal(state.action,'lie');assert.deepEqual(calls.at(-1),{action:'lie',once:false});
life.updateDogBehavior(state,context,state.remaining);assert.equal(state.action,'getUp');assert.deepEqual(calls.at(-1),{action:'getUp',once:true});assert.equal(root.position.length(),0);
life.updateDogBehavior(state,{...context,pauses:['idle']},state.remaining);assert.equal(state.action,'idle');
for(const action of ['shake','shake2','pee','poop','bark']){
 state=life.createDogBehavior();life.startDogPause(state,{...context,pauses:[action]});assert.equal(state.action,action);assert.equal(state.remaining,2);assert.deepEqual(calls.at(-1),{action,once:true});
 life.updateDogBehavior(state,{...context,pauses:['idle']},2);assert.equal(state.action,'idle');
}
state=life.createDogBehavior();life.startDogTrip(state,context,{x:5,z:0},'sniff');assert.equal(calls.at(-1).action,'sniff');life.updateDogBehavior(state,context,0.1);assert.equal(budget,5);
state=life.createDogBehavior();life.startDogPause(state,{...context,lieTransitions:false});assert.deepEqual(calls.at(-1),{action:'lie',once:true});
console.log('PASS dog life: native catalogs, one-shot durations, lying transitions, stationary actions and sniff gait movement.');
