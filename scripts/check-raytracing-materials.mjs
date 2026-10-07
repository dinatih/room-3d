import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
import { PathTracingSceneGenerator } from 'three-gpu-pathtracer';

const source = readFileSync(new URL('../src/features/scene/photo/splitMultiMaterialMeshes.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  .replace("'three'", JSON.stringify(import.meta.resolve('three')));
const { splitMultiMaterialMeshes } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const red = new THREE.MeshStandardMaterial({ color: 'red' });
const white = new THREE.MeshStandardMaterial({ color: 'white' });
const black = new THREE.MeshStandardMaterial({ color: 'black' });
const transparent = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
red.map = new THREE.Texture();

function generate(scene) {
  scene.updateMatrixWorld(true);
  const generator = new PathTracingSceneGenerator(scene);
  generator.generateBVH = false;
  return generator.generate();
}

// Demonstrate the installed engine's regression before applying the adapter.
{
  const scene = new THREE.Scene();
  const multi = new THREE.Mesh(new THREE.BoxGeometry(), [red, white, red, white, red, white]);
  multi.uuid = 'a';
  const single = new THREE.Mesh(new THREE.BoxGeometry(), black);
  single.uuid = 'b';
  scene.add(multi, single);
  const { geometry, materials } = generate(scene);
  assert.notEqual(materials[geometry.attributes.materialIndex.getX(24)], black);
  geometry.dispose();
}

for (const indexed of [true, false]) {
  for (const reverseOrder of [true, false]) {
    const scene = new THREE.Scene();
    const parent = new THREE.Group();
    parent.position.set(10, 20, 30);
    parent.rotation.y = Math.PI / 3;
    parent.scale.set(2, 3, -1);
    scene.add(parent);
    const geometry = indexed ? new THREE.BoxGeometry() : new THREE.BoxGeometry().toNonIndexed();
    geometry.setDrawRange(3, 30);
    const originalGroups = structuredClone(geometry.groups);
    const materials = [red, white, transparent, black, red, white];
    const multi = new THREE.Mesh(geometry, materials);
    multi.uuid = reverseOrder ? 'z' : 'a';
    multi.position.set(2, 4, 6);
    multi.rotation.x = .25;
    multi.layers.set(2);
    const child = new THREE.Mesh(new THREE.BoxGeometry(), black);
    multi.add(child);
    parent.add(multi);
    const single = new THREE.Mesh(new THREE.BoxGeometry(), black);
    single.uuid = reverseOrder ? 'a' : 'z';
    scene.add(single);
    const hidden = new THREE.Mesh(new THREE.BoxGeometry(), materials);
    hidden.visible = false;
    scene.add(hidden);
    scene.updateMatrixWorld(true);
    const originalWorld = multi.matrixWorld.clone();
    let originalDisposed = false;
    geometry.addEventListener('dispose', () => { originalDisposed = true; });

    for (let iteration = 0; iteration < 3; iteration++) {
      const restore = splitMultiMaterialMeshes(scene);
      const parts = parent.children.filter(mesh => mesh.isMesh);
      assert.equal(parts.length, 6);
      assert.equal(parts.reduce((sum, part) => sum + part.geometry.index.count, 0), 30);
      for (const [i, part] of parts.entries()) {
        assert.equal(part.material, materials[i]);
        assert.equal(part.layers.mask, multi.layers.mask);
        assert.deepEqual(part.matrixWorld.elements, originalWorld.elements);
        assert.equal(part.geometry.attributes.uv.count, geometry.attributes.uv.count);
      }
      assert.equal(parts[0].material.map, red.map);
      assert.equal(child.parent, multi);
      assert.equal(hidden.material, materials);
      assert.equal(hidden.visible, false);

      const meshes = [];
      scene.traverseVisible(mesh => { if (mesh.isMesh) meshes.push(mesh); });
      meshes.sort((a, b) => a.uuid.localeCompare(b.uuid));
      const result = generate(scene);
      for (const group of result.geometry.groups) {
        const expected = meshes[group.materialIndex].material;
        for (let i = group.start; i < group.start + group.count; i++) {
          const vertex = result.geometry.index.getX(i);
          const materialIndex = result.geometry.attributes.materialIndex.getX(vertex);
          assert.equal(result.materials[materialIndex], expected);
        }
      }
      result.geometry.dispose();
      let disposed = 0;
      for (const part of parts) part.geometry.addEventListener('dispose', () => disposed++);
      restore();
      restore(); // Error cleanup followed by React cleanup must be harmless.
      assert.equal(disposed, 6);
      assert.equal(originalDisposed, false);
      assert.equal(multi.geometry, geometry);
      assert.equal(multi.material, materials);
      assert.deepEqual(geometry.groups, originalGroups);
      assert.deepEqual(geometry.drawRange, { start: 3, count: 30 });
      assert.deepEqual(parent.children, [multi]);
      assert.equal(child.parent, multi);
    }
  }
}

// Invalid groups must restore earlier replacements before reporting the error.
{
  const scene = new THREE.Scene();
  const good = new THREE.Mesh(new THREE.BoxGeometry(), [red, white, red, white, red, white]);
  const badGeometry = new THREE.BoxGeometry();
  badGeometry.groups[0].materialIndex = 6;
  const bad = new THREE.Mesh(badGeometry, [red, white]);
  scene.add(good, bad);
  const geometry = good.geometry;
  const materials = good.material;
  assert.throws(() => splitMultiMaterialMeshes(scene), /Invalid material 6/);
  assert.equal(good.geometry, geometry);
  assert.equal(good.material, materials);
  assert.deepEqual(scene.children, [good, bad]);
  badGeometry.groups[0].materialIndex = 0;
  badGeometry.setDrawRange(1, 2);
  assert.throws(() => splitMultiMaterialMeshes(scene), /Incomplete triangle/);
  assert.equal(good.geometry, geometry);
}

// The temporary parts retain skinning and morph targets without moving bones.
{
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry();
  const count = geometry.attributes.position.count;
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  const weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  const morph = geometry.attributes.position.clone();
  for (let i = 0; i < count; i++) morph.setXYZ(i, .5, 0, 0);
  geometry.morphAttributes.position = [morph];
  geometry.morphTargetsRelative = true;
  const mesh = new THREE.SkinnedMesh(geometry, [red, white, red, white, red, white]);
  const bone = new THREE.Bone();
  mesh.add(bone);
  mesh.bind(new THREE.Skeleton([bone]));
  bone.position.y = 2;
  mesh.morphTargetInfluences[0] = .5;
  scene.add(mesh);
  scene.updateMatrixWorld(true);
  const expectedBox = new THREE.Box3();
  for (let i = 0; i < count; i++) expectedBox.expandByPoint(mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
  const restore = splitMultiMaterialMeshes(scene);
  for (const part of scene.children) {
    assert.equal(part.skeleton, mesh.skeleton);
    assert.deepEqual(part.morphTargetInfluences, [.5]);
  }
  const result = generate(scene);
  result.geometry.computeBoundingBox();
  assert(result.geometry.boundingBox.min.distanceTo(expectedBox.min) < 1e-6);
  assert(result.geometry.boundingBox.max.distanceTo(expectedBox.max) < 1e-6);
  result.geometry.dispose();
  restore();
  assert.equal(bone.parent, mesh);
  assert.equal(mesh.geometry, geometry);
}

// No groups on an array material draws nothing, but its children stay visible.
{
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry();
  geometry.clearGroups();
  const mesh = new THREE.Mesh(geometry, [red]);
  const child = new THREE.Mesh(new THREE.BoxGeometry(), black);
  mesh.add(child);
  scene.add(mesh);
  const restore = splitMultiMaterialMeshes(scene);
  assert.equal(mesh.geometry.attributes.position.count, 0);
  assert.equal(generate(scene).geometry.index.count, child.geometry.index.count);
  restore();
  assert.equal(mesh.geometry, geometry);
  assert.equal(child.parent, mesh);
}

console.log('Raytracing: material indices, textures, transparency, geometry groups, transforms and repeated/error cleanup verified.');
