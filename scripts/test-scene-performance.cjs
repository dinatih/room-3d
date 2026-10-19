const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const THREE = require('three');
require.extensions['.ts'] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
  }).outputText;
  module._compile(code, filename);
};
function load(source, filename, overrides) {
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  }, fileName: filename }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', compiled)(mod.exports, mod, name => {
    assert(name in overrides, `Unexpected dependency ${name} in ${filename}`);
    return overrides[name];
  });
  return mod.exports;
}
function drona() {
  let mode = 'high'; const requests = [];
  const high = new THREE.BoxGeometry(.33, .33, .38), low = new THREE.BoxGeometry(.32, .34, .37);
  const models = { 'items/dröna/DRÖNA_high.glb': { nodes: { box:new THREE.Mesh(high) } }, 'items/dröna/DRÖNA_low.glb': { nodes: { box:new THREE.Mesh(low) } } };
  const useGLTF = input => { const paths = Array.isArray(input) ? input : [input]; requests.push(...paths); const result = paths.map(p => models[p]); return Array.isArray(input) ? result : result[0]; };
  useGLTF.preload = () => {};
  const dependencies = { react: {useMemo: fn=>fn(),useLayoutEffect:()=>{}}, three:THREE, 'react/jsx-runtime':require('react/jsx-runtime'), '@react-three/drei':{useGLTF}, '../store/useSceneStore':{useSceneStore:selector=>selector({furniture:{dronaMode:mode}})} };
  const current=load(fs.readFileSync('src/features/scene/items/Drona.tsx','utf8'),'Drona.tsx',dependencies);
  const original=load(execFileSync('git',['show','becb2030:src/features/scene/items/Drona.tsx'],{encoding:'utf8'}),'Drona.tsx',dependencies);
  const originalVertices=[...high.attributes.position.array];
  const first=current.useDronaGeo(); assert.deepEqual(requests,['items/dröna/DRÖNA_high.glb']);
  for(let i=0;i<100;i++)assert.equal(current.useDronaGeo(),first);
  const expected=original.useDronaGeo();
  for(const name of Object.keys(expected.attributes)) assert.deepEqual(first.attributes[name].array,expected.attributes[name].array,`Exact transformed ${name}`);
  assert.deepEqual(first.index.array,expected.index.array);
  assert.deepEqual([...high.attributes.position.array],originalVertices,'Shared source must stay untouched');
  mode='low';requests.length=0;const reduced=current.useDronaGeo();assert.notEqual(reduced,first);assert.deepEqual(requests,['items/dröna/DRÖNA_low.glb']);
  mode='procedural';requests.length=0;const procedural=current.useDronaGeo();assert.equal(current.useDronaGeo(),procedural);assert.deepEqual(requests,[],'Procedural mode must not request either GLB');
  mode='high';assert.equal(current.useDronaGeo(),first);mode='low';assert.equal(current.useDronaGeo(),reduced);
  console.log('Dröna: exact geometry, immutable GLB source, 100 shared instances, lazy modes and reuse passed');
}
function navigation() {
  const obstacles=require('../src/features/scene/ai/navigation/obstacles.ts');
  const g=require('../src/features/scene/ai/navigation/geometry.ts');
  const profile={radius:13.3,height:170}, otherProfile={radius:20,height:170};
  const box={id:'cache-fixture',polygon:g.rectangle(10,20,30,40),yMin:0,yMax:100,owner:'box'};
  obstacles.registerObstacle(box);
  const first=obstacles.furnitureFootprint(box,profile);
  assert.deepEqual(first,g.inflate(box.polygon,obstacles.furnitureClearance(profile)));
  for(let i=0;i<10000;i++) assert.equal(obstacles.furnitureFootprint(box,profile),first);
  const wider=obstacles.furnitureFootprint(box,otherProfile);assert.notDeepEqual(wider,first);
  obstacles.setAgentProfile('first',profile);obstacles.setAgentProfile('second',profile);
  assert.equal(obstacles.getAgentProfile('first'),obstacles.getAgentProfile('second'));
  assert.equal(obstacles.furnitureFootprint(box,obstacles.getAgentProfile('first')),obstacles.furnitureFootprint(box,obstacles.getAgentProfile('second')));
  const moved={...box,polygon:g.rectangle(40,20,30,40)};obstacles.registerObstacle(moved);
  assert.notEqual(obstacles.furnitureFootprint(moved,profile),first);
  assert.deepEqual(obstacles.furnitureFootprint(moved,profile),g.inflate(moved.polygon,obstacles.furnitureClearance(profile)));
  obstacles.unregisterObstacle(box.id);assert.notEqual(obstacles.furnitureFootprint(box,profile),first);
  obstacles.removeAgentProfile('first');obstacles.removeAgentProfile('second');
  console.log('Navigation: exact footprints, profile sharing, 10,000 cache hits and movement/removal invalidation passed');
}
function robin() {
  const source=fs.readFileSync('src/features/scene/birdPerches.ts','utf8');
  const old=execFileSync('git',['show','becb2030:src/features/scene/birdPerches.ts'],{encoding:'utf8'});
  const contact=code=>load("import * as THREE from 'three';const ROBIN_HEIGHT=15;\n"+code.slice(code.indexOf('export class RobinFootContact')),'contact.ts',{three:THREE}).RobinFootContact;
  const Current=contact(source),Original=contact(old);
  const root=new THREE.Group(), parent=new THREE.Group();parent.add(root);parent.position.set(12,9,-30);parent.scale.set(1.3,.7,1.8);parent.rotation.set(.2,.4,-.3);
  const bones=Array.from({length:4},(_,i)=>{const b=new THREE.Bone();b.name=['L_Digit1','R_Digit1','L_Digit2','R_Digit2'][i];b.position.set(i,2+i,.2*i);root.add(b);return b;});
  const positions=[],skinIndices=[],weights=[],morph=[];
  for(let i=0;i<2000;i++) {
    positions.push((i%19)/19,(i%13)/13,(i%7)/7);morph.push(.02*Math.sin(i),.01*Math.cos(i),.03*Math.sin(i/3));
    const side=i%2;skinIndices.push(side,side+2,1-side,3-side);weights.push(.6,.25,.1,.05);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));geo.morphAttributes.position=[new THREE.Float32BufferAttribute(morph,3)];geo.morphTargetsRelative=true;
  const mesh=new THREE.SkinnedMesh(geo,new THREE.MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));
  const current=new Current(root),original=new Original(root);let maxError=0;
  for(let pose=0;pose<50;pose++) {
    for(const [i,bone] of bones.entries()){bone.rotation.set(.3*Math.sin(pose+i),.2*Math.cos(pose-i),.1*Math.sin(pose/3+i));bone.position.y=2+i+.2*Math.sin(pose+i);}
    mesh.morphTargetInfluences[0]=(pose%7)/7;root.position.set(pose/10,pose/17,-pose/13);root.rotation.y=pose/11;
    const a=original.measure(root),b=current.measure(root);
    maxError=Math.max(maxError,a.left.distanceTo(b.left),a.right.distanceTo(b.right),Math.abs(a.thickness-b.thickness),Math.abs(a.radius-b.radius));
  }
  assert(maxError<1e-10,`Foot skinning differs: ${maxError}`);
  const measure=contact=>{const start=performance.now();for(let i=0;i<150;i++)contact.measure(root);return performance.now()-start;};
  measure(current);measure(original);const before=measure(original),after=measure(current);
  console.log('Robin: 100,000 posed foot vertices with morphs/nonuniform parent transforms matched; maximum error',maxError,'benchmark ms',JSON.stringify({before,after}));
}
drona();navigation();robin();
