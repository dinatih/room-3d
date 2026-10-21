const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

function setup(mode = 'orbit', arrowControl = 'camera') {
  let frame;
  const state = { characterX: 0, characterZ: 0, followYaw: 0, positions: {}, recordUserControl() { this.isAIControlled = false; } };
  const constants = load('src/features/scene/camera/cameraConstants.ts', {
    three: THREE, '../wallData': { ROOM_W: 600, ROOM_D: 1000 }, '../cameraState': { cameraState: state },
  });
  const store = { arrowControl, layers: {} };
  const { useCameraFrameUpdate } = load('src/features/scene/camera/useCameraFrameUpdate.ts', {
    react: { useRef: value => ({ current: value }), useEffect() {} },
    '@react-three/fiber': { useFrame: callback => { frame = callback; } },
    three: THREE, './cameraConstants': constants, '../cameraState': { cameraState: state },
    '../store/useSceneStore': { useSceneStore: { getState: () => store } },
  });
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(100, 100, 100);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const controls = { object: camera, target: new THREE.Vector3(), update() { camera.lookAt(this.target); camera.updateMatrixWorld(); } };
  const ref = current => ({ current });
  const params = {
    camera, ctrlRef: ref(controls), modeRef: ref(mode), planeModeRef: ref(false), topFollowRef: ref(false),
    activeCharacterId: 'test', followPos: ref({ x: 0, y: 100, z: 0 }), followYaw: ref(0), followPitch: ref(0),
    orbitYaw: ref(0), orbitPitch: ref(0), orbitDistance: ref(440), keys: ref(new Set()),
    minimapThrottle: ref(0), updateFollowLook() {}, invalidate() {},
  };
  useCameraFrameUpdate(params);
  return { state, store, params, constants, tick: () => frame(null, 1 / 60) };
}

for (const mode of ['orbit', 'top', 'iso', 'follow', 'fpv']) {
  it(`${mode}: la croix PNJ déplace le personnage sans piloter la caméra`, () => {
    const { params, state, constants, tick } = setup(mode);
    const before = params.camera.position.clone();
    params.keys.current.add('character:ArrowUp');
    tick();
    assert.equal(state.characterZ, constants.WALK_SPEED);
    assert.equal(state.isMoving, true);
    assert.deepEqual(params.camera.position, before);
    assert.equal(params.orbitPitch.current, 0);
    params.keys.current.clear(); tick();
    assert.equal(state.isMoving, false);
    assert.equal(state.characterZ, constants.WALK_SPEED);
  });

  it(`${mode}: la croix caméra reste indépendante du contrôle clavier PNJ`, () => {
    const { params, state, tick } = setup(mode, 'character');
    const before = params.camera.position.clone();
    params.keys.current.add('camera:ArrowUp');
    tick();
    assert.equal(state.characterZ, 0);
    assert.equal(state.isMoving, false);
    if (mode === 'follow') assert(params.orbitPitch.current > 0);
    else if (mode === 'fpv') assert(params.followPitch.current > 0);
    else assert.notDeepEqual(params.camera.position, before);
  });
}

it('les deux croix peuvent être maintenues et relâchées séparément', () => {
  const { params, state, constants, tick } = setup('follow');
  params.keys.current.add('character:ArrowUp');
  params.keys.current.add('camera:ArrowRight');
  tick();
  assert.equal(state.characterZ, constants.WALK_SPEED);
  assert(params.orbitYaw.current > 0);
  const yaw = params.orbitYaw.current;
  params.keys.current.delete('camera:ArrowRight'); tick();
  assert.equal(state.characterZ, 2 * constants.WALK_SPEED);
  assert.equal(params.orbitYaw.current, yaw);
});
