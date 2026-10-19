const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const { VIEWS, resolveCameraView, CAMERA_VIEW_HEIGHT, CAMERA_VIEW_FOV } = load('src/features/scene/camera/cameraViews.ts', {
    '../wallData': { ROOM_W: 600, ROOM_D: 1000, WALL_H: 250 },
});

describe('Directions de caméra dans les deux projections', () => {
    it('propose dix directions sans les anciens presets perspective et top3d', () => {
        assert.equal(Object.keys(VIEWS).length, 10);
        assert.throws(() => resolveCameraView('perspective', 'persp'), /Unknown camera view/);
        assert.throws(() => resolveCameraView('top3d', 'ortho'), /Unknown camera view/);
    });
    for (const key of Object.keys(VIEWS)) {
        it(`${key} conserve cible, orientation et échelle sur le plan cible`, () => {
            const ortho = resolveCameraView(key, 'ortho');
            const persp = resolveCameraView(key, 'persp');
            assert.equal(ortho.projection, 'ortho');
            assert.equal(persp.projection, 'persp');
            assert.deepEqual(ortho.target, persp.target);
            const direction = view => view.pos.map((v, i) => v - view.target[i]);
            const a = direction(ortho), b = direction(persp);
            const lengthA = Math.hypot(...a), lengthB = Math.hypot(...b);
            a.forEach((value, i) => assert(Math.abs(value / lengthA - b[i] / lengthB) < 1e-12));
            const height = 2 * lengthB * Math.tan(CAMERA_VIEW_FOV * Math.PI / 360);
            assert(Math.abs(height - CAMERA_VIEW_HEIGHT / ortho.zoom) < 1e-9);
        });
    }
});

it('les commandes de vue conservent la projection active et recentrent la cible', () => {
    const previousDocument = global.document;
    const previousCustomEvent = global.CustomEvent;
    let detail, active;
    global.document = { dispatchEvent: event => { detail = event.detail; } };
    global.CustomEvent = class { constructor(type, options) { this.detail = options.detail; } };
    try {
        for (const projection of ['ortho', 'persp']) {
            const { dispatchView } = load('src/features/scene/sidepanel/types.ts', {
                '../camera/cameraViews': { VIEWS, resolveCameraView },
                '../store/useSceneStore': { useSceneStore: { getState: () => ({ cameraProjection: projection, layers: {}, setActiveCameraPos: key => { active = key; } }) } },
                '../inventoryGridCamera': { getInventoryGridCameraTarget: () => null },
            });
            for (const key of Object.keys(VIEWS)) {
                const preset = resolveCameraView(key, projection);
                dispatchView(key, [10, 20, 30], true);
                assert.equal(active, key);
                assert.equal(detail.projection, projection);
                assert.equal(detail.preserveFollow, true);
                assert.deepEqual(detail.target, [10, 20, 30]);
                detail.pos.forEach((v, i) => assert(Math.abs(v - detail.target[i] - preset.pos[i] + preset.target[i]) < 1e-9));
            }
        }
    } finally { global.document = previousDocument; global.CustomEvent = previousCustomEvent; }
});
