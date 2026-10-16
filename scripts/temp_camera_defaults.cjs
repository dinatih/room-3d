const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

const browser = {
  location: new URL('http://localhost:5173/'),
  history: { replaceState(_, __, href) { browser.location = new URL(href); } },
};
const exportsObject = {};
const source = fs.readFileSync('src/features/scene/camera/cameraUrlParams.ts', 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, {
  exports: exportsObject, window: browser, URL, URLSearchParams,
  require: () => ({ findCharacterByIdOrName: () => undefined }),
});
const camera = exportsObject;
assert.equal(camera.parseUrlCameraMode(), 'fpv');
assert.equal(camera.parseUrlArrowControl(), 'character');
camera.updateUrlCameraMode('fpv');
camera.updateUrlArrowControl('character');
// The launch sets the human follow target internally, without serializing it in FPV.
camera.updateUrlCameraTarget(null);
assert.equal(browser.location.href, 'http://localhost:5173/');
for (const mode of ['orbit', 'follow', 'top', 'ortho']) {
  camera.updateUrlCameraMode(mode);
  camera.updateUrlArrowControl('camera');
  assert.equal(camera.parseUrlCameraMode(), mode);
  assert.equal(camera.parseUrlArrowControl(), 'camera');
  assert.equal(browser.location.searchParams.has('arrowControl'), false);
}
camera.updateUrlCameraMode('follow');
camera.updateUrlArrowControl('character');
assert.equal(camera.parseUrlArrowControl(), 'character');
assert.equal(browser.location.searchParams.get('arrowControl'), 'character');
camera.updateUrlCameraTarget(null);
camera.updateUrlCameraMode('fpv');
camera.updateUrlArrowControl('character');
assert.equal(browser.location.href, 'http://localhost:5173/');
for (const query of ['cameraTarget=studio', 'cameraPos=front', 'cameraMovement=orbit']) {
  browser.location = new URL(`http://localhost:5173/?${query}&ui=0`);
  assert.equal(camera.parseUrlCameraMode(), 'orbit');
  camera.updateUrlCameraMode('fpv');
  assert.equal(camera.parseUrlCameraMode(), 'fpv');
  assert.equal(browser.location.searchParams.get('ui'), '0');
}
console.log('Camera default URL and mode round-trip checks passed.');
