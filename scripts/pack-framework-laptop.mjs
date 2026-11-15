/** Join static CAD primitives by material, then compress the Blender export. */
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,flatten,join,prune,draco} from '@gltf-transform/functions';
import draco3d from 'draco3d';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const [input,output]=process.argv.slice(2);
assert(input && output,'Usage: node scripts/pack-framework-laptop.mjs input.glb output.glb');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
 'draco3d.decoder':await draco3d.createDecoderModule(),'draco3d.encoder':await draco3d.createEncoderModule(),
});
const document=await io.read(input);
assert.equal(document.getRoot().listAnimations().length,0,'Only a static laptop may be flattened');
await document.transform(dedup(),flatten(),join({keepNamed:false}),prune());
// Lossless compression: preserve silhouette, normals and exact Blender coordinates.
await document.transform(draco({method:'sequential',quantizePosition:0,quantizeNormal:0,quantizeColor:0,quantizeTexcoord:0,quantizeGeneric:0}));
const bytes=await io.writeBinary(document),decoded=await io.readBinary(bytes);
const expected=document.getRoot().listMeshes(),actual=decoded.getRoot().listMeshes();
assert.equal(actual.length,expected.length);
let triangles=0,drawCalls=0;
for(let i=0;i<expected.length;i++){
 const a=expected[i].listPrimitives(),b=actual[i].listPrimitives();assert.equal(a.length,b.length);
 for(let j=0;j<a.length;j++){
  assert.deepEqual(b[j].getIndices()?.getArray(),a[j].getIndices()?.getArray());
  for(const semantic of a[j].listSemantics())assert.deepEqual(b[j].getAttribute(semantic).getArray(),a[j].getAttribute(semantic).getArray());
  triangles+=(b[j].getIndices()?.getCount()??b[j].getAttribute('POSITION').getCount())/3;drawCalls++;
 }
}
await fs.writeFile(output,bytes);
console.log(JSON.stringify({output,bytes:bytes.length,triangles,drawCalls,materials:decoded.getRoot().listMaterials().map(m=>({name:m.getName(),color:m.getBaseColorFactor(),roughness:m.getRoughnessFactor(),alpha:m.getAlphaMode()}))},null,2));
