const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { OrbitControls } = require('three-stdlib');
const { load } = require('../support/load-ts.cjs');

for (const projection of ['ortho', 'persp']) {
    for (const elevation of [90, -90]) {
        it(`orbite ${projection} depuis ${elevation}° sans roulis après inclinaison et rotation`, () => {
            let frame;
            const { computeCameraPreset } = load('src/features/scene/camera/cameraViews.ts', {
                '../wallData': { ROOM_W: 600, ROOM_D: 1000, WALL_H: 250 },
            });
            const preset = computeCameraPreset(-3 * Math.PI / 4, elevation);
            const camera = projection === 'ortho' ? new THREE.OrthographicCamera() : new THREE.PerspectiveCamera();
            camera.position.set(...preset.pos);
            if (preset.up) camera.up.set(...preset.up);
            const controls = new OrbitControls(camera);
            controls.target.set(...preset.target);
            controls.update();
            const target = controls.target.clone();
            const constants = { WALK_SPEED: 2.7, ORBIT_CAMERA_LERP: 0.15, _tmpSph: new THREE.Spherical() };
            for (const name of ['_tmpOffset', '_tmpCamDir', '_tmpCamRight', '_tmpCamForward', '_tmpPanDelta', '_tmpDollyDir']) constants[name] = new THREE.Vector3();
            const { useCameraFrameUpdate } = load('src/features/scene/camera/useCameraFrameUpdate.ts', {
                react: { useRef: current => ({ current }), useEffect: () => {} },
                '@react-three/fiber': { useFrame: callback => { frame = callback; } },
                three: THREE,
                './cameraConstants': constants,
                '../cameraState': { cameraState: { positions: {} } },
                '../store/useSceneStore': { useSceneStore: { getState: () => ({ arrowControl: 'camera', layers: {} }) } },
            });
            const keys = new Set();
            useCameraFrameUpdate({
                camera, ctrlRef: { current: controls }, modeRef: { current: 'orbit' },
                planeModeRef: { current: false }, topFollowRef: { current: false }, activeCharacterId: '',
                followPos: { current: { x: 0, y: 0, z: 0 } }, minimapThrottle: { current: 0 },
                keys: { current: keys }, invalidate() {},
            });
            const tick = () => frame({}, 1 / 60);
            keys.add(elevation === 90 ? 'camera:ArrowDown' : 'camera:ArrowUp');
            for (let i = 0; i < 30; i++) tick();
            keys.clear();
            keys.add('camera:ArrowRight');
            const before = camera.position.clone().sub(target);
            for (let i = 0; i < 30; i++) tick();
            keys.clear();
            for (let i = 0; i < 120; i++) tick();
            const after = camera.position.clone().sub(target);
            assert(controls.target.equals(target), 'le centre reste fixé au studio');
            assert(Math.abs(after.length() - 1500) < 1e-4, 'le rayon orbital est conservé après amortissement');
            assert(Math.abs(Math.atan2(after.x, after.z) - Math.atan2(before.x, before.z)) > 0.5, 'la caméra tourne autour du studio');
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            assert(Math.abs(right.y) < 1e-10, 'l’axe horizontal de l’image reste horizontal dans le monde');
            controls.dispose();
        });
    }
}
