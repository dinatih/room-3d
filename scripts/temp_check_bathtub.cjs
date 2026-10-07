const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const THREE = require('three');
const filename = require('node:path').resolve('src/features/scene/items/Bathtub.tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const dataSource = fs.readFileSync('src/features/scene/bathtubData.ts', 'utf8');
const dataModule = new Module(filename);
dataModule._compile(ts.transpileModule(dataSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { BATHTUB } = dataModule.exports;
const mod = new Module(filename);
mod.paths = module.paths;
const frames = [];
mod.require = id => {
  if (id === 'react') return { useMemo: fn => fn(), useLayoutEffect: fn => fn() };
  if (id === '@react-three/fiber') return { useFrame: fn => frames.push(fn) };
  if (id === '../bathtubData') return { BATHTUB };
  return require(id);
};
mod._compile(compiled, filename);
let size;
const tub = mod.exports.Bathtub({ onSize: value => { size = value; } });
assert.deepEqual(size.toArray(), [BATHTUB.width, BATHTUB.height, BATHTUB.length]);
const wall = tub.props.children[0].props.geometry;
const wallPositions = wall.attributes.position;
const wallNormals = wall.attributes.normal;
const wallSegment = BATHTUB.length / 2 - BATHTUB.cornerRadius;
for (const group of wall.groups) {
  if (group.materialIndex !== 1) continue;
  for (let i = group.start; i < group.start + group.count; i++) {
    const x = wallPositions.getX(i);
    const z = wallPositions.getZ(i);
    const dz = z - THREE.MathUtils.clamp(z, -wallSegment, wallSegment);
    const r = Math.hypot(x, dz);
    const direction = r > BATHTUB.cornerRadius - BATHTUB.wallThickness / 2 ? 1 : -1;
    assert(Math.abs(wallNormals.getX(i) - direction * x / r) < 1e-6);
    assert(Math.abs(wallNormals.getZ(i) - direction * dz / r) < 1e-6);
    assert.equal(wallNormals.getY(i), 0);
  }
}
const rim = tub.props.children[3].props.geometry;
rim.computeBoundingBox();
assert(Math.abs(rim.boundingBox.max.y - BATHTUB.height) < 1e-5);
assert([...rim.attributes.normal.array].every(Number.isFinite));
const water = tub.props.children[2].props;
const shape = water.geometry.parameters.shapes;
const points = shape.getPoints(32);
const radius = (BATHTUB.width - 2 * BATHTUB.wallThickness - 1) / 2;
const segment = (BATHTUB.length - BATHTUB.width) / 2;
for (const p of points) {
  const distance = Math.hypot(p.x, Math.max(Math.abs(p.y) - segment, 0));
  assert(Math.abs(distance - radius) < 1e-8, 'Water contour must be a concentric capsule');
}
const positions = water.geometry.attributes.position;
const indices = water.geometry.index;
let area = 0;
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
for (let i = 0; i < indices.count; i += 3) {
  a.fromBufferAttribute(positions, indices.getX(i));
  b.fromBufferAttribute(positions, indices.getX(i + 1));
  c.fromBufferAttribute(positions, indices.getX(i + 2));
  const triangle = new THREE.Triangle(a, b, c);
  assert(triangle.getNormal(new THREE.Vector3()).y > 0, 'Water must face upwards');
  area += triangle.getArea();
}
assert(Math.abs(area - Math.abs(THREE.ShapeUtils.area(points))) < 0.01,
  'Water triangles must cover the contour without overlapping');
assert.equal(water.material.transparent, true);
assert.equal(water.material.depthWrite, false);
assert.equal(water.material.normalMap.wrapS, THREE.RepeatWrapping);
assert.equal(water.material.normalMap.generateMipmaps, true);
assert.equal(water.material.normalMap.minFilter, THREE.LinearMipmapLinearFilter);
frames[0]({ clock: { elapsedTime: 2 } });
assert.deepEqual(water.material.normalMap.offset.toArray(), [0.05, 0.03]);
console.log('Bathtub validated: smooth walls, rounded rim, non-overlapping water and animated ripples filtered at distance.');
