const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const THREE = require('three');
const root = path.resolve(__dirname, '..');
function evaluate(file, globals = {}, mockRequire = require, rewrite = s => s) {
  const exports = {};
  const source = rewrite(fs.readFileSync(path.join(root, file), 'utf8'));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, URL, URLSearchParams, require: mockRequire, ...globals });
  return exports;
}
const browser = { location: new URL('https://room.test/?flight=1&mirrorsHD=0&ui=0'), history: { replaceState(_, __, href) { browser.location = new URL(href); } } };
const params = evaluate('src/features/scene/camera/cameraUrlParams.ts', { window: browser });
for (const flag of ['', '=1', '=true', '=yes', '=on']) {
  browser.location = new URL('https://room.test/?flight' + flag);
  assert.equal(params.parseUrlFlightMode(), true);
}
for (const flag of ['=0', '=false', '=off', '=no']) {
  browser.location = new URL('https://room.test/?flight' + flag);
  assert.equal(params.parseUrlFlightMode(), false);
}
browser.location = new URL('https://room.test/?mirrorsHD=0&ui=0');
params.updateUrlFlightMode(true);
assert.equal(browser.location.searchParams.get('flight'), '1');
assert.equal(browser.location.searchParams.get('mirrorsHD'), '0');
assert.equal(browser.location.searchParams.get('ui'), '0');
params.updateUrlFlightMode(false);
assert.equal(params.parseUrlFlightMode(), false);
browser.location = new URL('https://room.test/#/studio?flight=1&ui=0');
assert.equal(params.parseUrlFlightMode(), true);
params.updateUrlFlightMode(false);
assert.equal(params.parseUrlFlightMode(), false);
assert.equal(browser.location.hash, '#/studio?ui=0');
const config = evaluate('src/features/scene/config.ts');
const mirrors = evaluate('src/features/scene/building/Mirrors.tsx', {}, name => {
  if (name === '@config') return config;
  if (name === 'react') return {};
  if (name === 'three') return THREE;
  if (name === 'react/jsx-runtime') return require(name);
  return {};
});
const aircraftLayers = new THREE.Layers();
aircraftLayers.set(config.LAYER_AIRCRAFT);
const mirrorLayers = new THREE.Layers();
mirrorLayers.mask = mirrors.MIRROR_BASE_MASK;
assert(mirrorLayers.test(aircraftLayers), 'LQ mirror includes aircraft layer');
const defaultLayers = new THREE.Layers();
assert(!mirrorLayers.test(defaultLayers), 'LQ does not include unrelated default helpers');
const skyBounds = evaluate('src/features/scene/skyBounds.ts');
let frame;
const state = { mode: 'plane', planeSkyContact: true };
const sky = evaluate('src/features/scene/SkySphere.tsx', {}, name => {
  if (name === 'react') return { useMemo: fn => fn(), useRef: value => ({ current: value }) };
  if (name === '@react-three/fiber') return { useFrame: fn => { frame = fn; } };
  if (name === 'three/examples/jsm/loaders/HDRLoader.js') return { HDRLoader: class {} };
  if (name === './cameraState') return { cameraState: state };
  if (name === './skyBounds') return skyBounds;
  if (name === 'three') return { ...THREE, TextureLoader: class {} };
  if (name === 'react/jsx-runtime') return require(name);
  return {};
}, source => source.replace('function CombinedSkyDome(', 'export function CombinedSkyDome('));
const dome = sky.CombinedSkyDome({ texture: new THREE.Texture() });
const children = dome.props.children;
children[0].props.children[1].ref.current = new THREE.MeshBasicMaterial();
for (const element of children.slice(1)) element.ref.current = new THREE.Mesh(new THREE.SphereGeometry(), element.props.material);
const camera = new THREE.PerspectiveCamera();
camera.position.set(150, 200, 150);
frame({ camera });
const wire = children[2].ref.current;
assert.equal(wire.visible, true, 'contact reveals grid inside dome');
assert.equal(wire.material.side, THREE.DoubleSide);
assert.equal(wire.material.opacity, .62);
state.planeSkyContact = false;
frame({ camera });
assert.equal(wire.visible, false, 'grid clears even with unchanged camera position');
console.log('Flight URL, LQ mirror mask and sky contact grid checks passed.');
