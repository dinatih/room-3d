/** Restore the retained IKEA triangles' raw attributes after Blender export. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const items = join(root, 'public/items');
const folder = readdirSync(items).find(name => name.startsWith('lagan réfrigérateur'));
const sourcePath = join(items, folder, readdirSync(join(items, folder)).find(name => name.endsWith('.glb')));
const outputPath = join(items, 'lagan_anim/LAGAN_anim.glb');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const source = await io.read(sourcePath);
const output = await io.read(outputPath);
const buffer = output.getRoot().listBuffers()[0];
const triangles = new Map();
const vertexKey = (primitive, index) => ['POSITION'].flatMap(semantic => {
  const attribute = primitive.getAttribute(semantic);
  const size = attribute.getElementSize();
  return Array.from(attribute.getArray().subarray(index * size, (index + 1) * size), n => Math.round(n * 1e5));
}).join(',');
const triangleKey = (primitive, indices) => primitive.getMaterial().getName() + ':'
  + indices.map(index => vertexKey(primitive, index)).sort().join('/');
for (const mesh of source.getRoot().listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const indices = primitive.getIndices().getArray();
    for (let i = 0; i < indices.length; i += 3) {
      const face = Array.from(indices.subarray(i, i + 3));
      triangles.set(triangleKey(primitive, face), { primitive, face });
    }
  }
}
const obsolete = new Set();
let count = 0;
for (const mesh of output.getRoot().listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const indices = primitive.getIndices().getArray();
    const remap = new Map(), attributes = new Map(), rebuilt = [];
    for (let i = 0; i < indices.length; i += 3) {
      const face = Array.from(indices.subarray(i, i + 3));
      const original = triangles.get(triangleKey(primitive, face));
      assert(original, `LAGAN: exported triangle ${i / 3} does not match source positions`);
      for (const index of face) {
        const key = vertexKey(primitive, index);
        const sourceIndex = original.face.find(idx => vertexKey(original.primitive, idx) === key);
        assert.notEqual(sourceIndex, undefined);
        const sourceKey = source.getRoot().listAccessors().indexOf(original.primitive.getAttribute('POSITION')) + ':' + sourceIndex;
        if (!remap.has(sourceKey)) {
          remap.set(sourceKey, remap.size);
          for (const semantic of original.primitive.listSemantics()) {
            const accessor = original.primitive.getAttribute(semantic);
            const values = attributes.get(semantic) ?? { type: accessor.getType(), values: [] };
            const size = accessor.getElementSize();
            values.values.push(...accessor.getArray().subarray(sourceIndex * size, (sourceIndex + 1) * size));
            attributes.set(semantic, values);
          }
        }
        rebuilt.push(remap.get(sourceKey));
      }
      count++;
    }
    for (const semantic of primitive.listSemantics()) obsolete.add(primitive.getAttribute(semantic));
    obsolete.add(primitive.getIndices());
    for (const [semantic, { type, values }] of attributes) {
      primitive.setAttribute(semantic, output.createAccessor().setType(type).setBuffer(buffer).setArray(new Float32Array(values)));
    }
    primitive.setIndices(output.createAccessor().setType('SCALAR').setBuffer(buffer).setArray(new Uint32Array(rebuilt)));
  }
}
for (const accessor of obsolete) accessor.dispose();
await io.write(outputPath, output);
console.log(`LAGAN: original positions, UVs, normals and tangents restored on ${count} retained triangles.`);
