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
console.log('Camera URL checks passed');
