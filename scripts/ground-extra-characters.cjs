// Bake the standing floor into the mesh, pelvis rest position and skin bind pose.
const fs = require('node:fs');
const THREE = require('three');
(async () => {
  const { NodeIO } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const { draco } = await import('@gltf-transform/functions');
  const draco3d = require('draco3d');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule(),
  });
  for (const id of ['lewis', 'david', 'alex', 'mannequin']) {
    const filename = `public/characters/${id}/${id}.glb`, doc = await io.read(filename);
    const nodes = doc.getRoot().listNodes(), positions = new Set();
    for (const node of nodes.filter(node => node.getMesh())) {
      if (!node.getSkin() || !new THREE.Matrix4().fromArray(node.getWorldMatrix()).equals(new THREE.Matrix4())) throw Error(`Unsupported mesh transform: ${id}/${node.getName()}`);
      for (const primitive of node.getMesh().listPrimitives()) positions.add(primitive.getAttribute('POSITION'));
    }
    const floor = Math.min(...[...positions].map(attribute => {
      const a = attribute.getArray(); let min = Infinity;
      for (let i = 1; i < a.length; i += 3) min = Math.min(min, a[i]);
      return min;
    }));
    if (!Number.isFinite(floor)) throw Error(`Invalid floor: ${id}`);
    if (Math.abs(floor) < 1e-5) { console.log(`${id}: already grounded`); continue; }
    for (const attribute of positions) {
      const a = attribute.getArray().slice();
      for (let i = 1; i < a.length; i += 3) a[i] -= floor;
      attribute.setArray(a);
    }
    const hips = nodes.find(node => node.getName().replace(/[:_]/g, '') === 'mixamorigHips');
    const position = hips.getTranslation(); position[1] -= floor; hips.setTranslation(position);
    const shift = new THREE.Matrix4().makeTranslation(0, floor, 0);
    for (const accessor of new Set(doc.getRoot().listSkins().map(skin => skin.getInverseBindMatrices()))) {
      const a = accessor.getArray().slice();
      for (let i = 0; i < a.length; i += 16) new THREE.Matrix4().fromArray(a, i).multiply(shift).toArray(a, i);
      accessor.setArray(a);
    }
    await doc.transform(draco({ quantizePosition: 20, quantizeNormal: 20, quantizeTexcoord: 20, quantizeGeneric: 20 }));
    fs.writeFileSync(filename, await io.writeBinary(doc));
    console.log(`${id}: baked ${(-floor * 100).toFixed(3)} cm into geometry and bind pose`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
