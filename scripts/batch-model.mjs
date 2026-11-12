import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { flatten, join } from '@gltf-transform/functions';

// Audited opaque assets only: preserve animation targets without simplifying triangles.
const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Usage: node scripts/batch-model.mjs path/to/model.glb');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const path of paths) {
  const document = await io.read(path);
  const primitives = () => document.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().length, 0);
  const before = primitives();
  await document.transform(flatten(), join({ filter: node =>
    node.getMesh()?.listPrimitives().every(primitive => primitive.getMaterial()?.getAlphaMode() !== 'BLEND') ?? false,
  }));
  await io.write(path, document);
  console.log(`${path}: ${before} → ${primitives()} primitives`);
}
