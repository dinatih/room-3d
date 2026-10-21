const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = {
  exports: {}, URL, URLSearchParams,
  require: () => ({ findCharacterByIdOrName: () => null }),
  window: { location: {}, history: { replaceState: (_, __, href) => setUrl(href) } },
};
function setUrl(href) { context.window.location = new URL(href, 'http://localhost:5173'); }
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/scene/camera/cameraUrlParams.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
const api = context.exports;
for (const [query, mode, expected] of [
  ['?cameraTarget=studio&projection=ortho', 'orbit', null],
  ['?cameraPos=north-west&cameraElevation=45&projection=ortho', 'orbit', null],
  ['?cameraMovement=orbit', 'orbit', null],
  ['?cameraMovement=follow&cameraTarget=studio', 'orbit', 'orbit'],
  ['', 'orbit', 'orbit'],
  ['?cameraTarget=studio', 'fpv', 'fpv'],
  ['?cameraTarget=studio', 'follow', 'follow'],
]) {
  setUrl(query);
  api.updateUrlCameraMode(mode);
  assert.equal(context.window.location.searchParams.get('mode'), expected);
  assert.equal(api.parseUrlCameraMode(), mode);
}
setUrl('?perfGraph=1&cameraTarget=studio&cameraPos=north-west&cameraElevation=45&projection=ortho&mode=orbit');
api.updateUrlCameraMode('orbit');
assert.equal(api.parseUrlActiveCameraPosKey(), 'north-west');
assert.equal(api.parseUrlCameraElevation(), 45);
assert.equal(api.parseUrlCameraProjection(), 'ortho');
assert.equal(context.window.location.searchParams.get('perfGraph'), '1');
assert.equal(context.window.location.searchParams.has('mode'), false);
for (const [mode, elevation, position] of [['iso', 45, 'north-west'], ['top', 90, 'west']]) {
  setUrl(`?perfGraph=1&cameraTarget=studio&mode=${mode}&projection=persp&cameraElevation=0&cameraPosition=east`);
  assert.equal(api.parseUrlCameraMode(), 'orbit');
  assert.equal(api.parseUrlCameraProjection(), 'ortho');
  assert.equal(api.parseUrlCameraElevation(), elevation);
  assert.equal(api.parseUrlActiveCameraPosKey(), position);
  api.updateUrlCameraMode('orbit');
  assert.equal(context.window.location.searchParams.has('mode'), false);
  assert.equal(api.parseUrlCameraElevation(), elevation);
  assert.equal(api.parseUrlActiveCameraPosKey(), position);
  api.updateUrlCameraElevation(60);
  assert.equal(api.parseUrlCameraElevation(), 60);
}
setUrl('?mode=ortho');
assert.equal(api.parseUrlCameraMode(), 'fpv');
setUrl('');
api.updateUrlCameraMode('ortho');
assert.equal(context.window.location.searchParams.get('mode'), 'iso');
console.log('Camera URL checks passed');
