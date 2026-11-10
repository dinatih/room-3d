const {it}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('three');
const {load}=require('../support/load-ts.cjs');
const source=THREE.ShaderChunk.lights_fragment_begin;
const chunks={lights_fragment_begin:source};
const {optimizeDirectLightShader}=load('src/features/scene/utils/zeroEnergyLights.ts',{three:{ShaderChunk:chunks}},source=>source.replaceAll('import.meta.hot','undefined'));
it('guards all five direct-light loops while preserving their complete computations and sampler declarations',()=>{
 assert.equal(THREE.ShaderChunk.lights_fragment_begin,source,'the test must not mutate global shader chunks');
 const guarded=chunks.lights_fragment_begin;
 for(const name of ['pointLight','spotLight','sunLight','directionalLight','rectAreaLight'])assert(guarded.includes(`notEqual( ${name}.color, vec3( 0.0 ) )`));
 assert.equal(guarded.replace(/\n\t\tif \( any\( notEqual\( \w+Light.color, vec3\( 0.0 \) \) \) \) \{/g,'').replace(/\n\t\t}\n(?=\n\t}\n\t#pragma unroll_loop_end)/g,'').replace(/if \( directLight.visible \) { (RE_Direct\([^;]+;) }/g,'$1'),source);
 assert.equal((guarded.match(/#pragma unroll_loop_start/g)||[]).length,(source.match(/#pragma unroll_loop_start/g)||[]).length);
});
it('fails explicitly when a dependency update changes the expected shader layout',()=>{
 assert.throws(()=>optimizeDirectLightShader('changed shader'),/Unexpected Three.js/);
});
