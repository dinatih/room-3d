import { resolveCameraView, dispatchView, CARDINAL_VIEWS, ELEVATION_VIEWS } from '/src/features/scene/sidepanel/types.ts';
import { useSceneStore } from '/src/features/scene/store/useSceneStore.ts';
import { resetAppIdle } from '/src/features/scene/idleState.ts';

export function prepare() {
    const gl = window.__THREE_GL__, scene = window.__THREE_SCENE__;
    const state = scene.__r3f.root.getState();
    // Keep animation time identical for the entire visual survey. Camera controls
    // still receive frames; characters and animals are disabled by the fixture.
    state.clock.stop();
    state.clock.elapsedTime = 0;
    state.clock.getDelta = () => 0;
    gl.domElement.dataset.visualCapture = '';
    const originalRender = gl.render;
    gl.render = function(renderScene, camera) {
        if (renderScene === scene && camera === scene.__r3f.root.getState().camera) window.__visualCamera = camera;
        return originalRender.call(this, renderScene, camera);
    };
    useSceneStore.getState().setCameraTarget('studio');
    useSceneStore.getState().setCameraMovement('fix');
    return CARDINAL_VIEWS.flatMap(({ key: direction, label }) => ELEVATION_VIEWS.map(({ angle: elevation, label: elevationLabel }) => ({
        key: `${direction}-${elevation}`, direction, elevation, label: `${label} · ${elevationLabel}`,
        preset: resolveCameraView(direction, 'ortho', undefined, elevation),
    })));
}

export async function applyView({ direction, elevation }, projection) {
    const preset = resolveCameraView(direction, projection, undefined, elevation);
    useSceneStore.getState().setCameraProjection(projection);
    dispatchView(direction, undefined, false, elevation);
    const expectedType = projection === 'ortho' ? 'OrthographicCamera' : 'PerspectiveCamera';
    // Wait for the real active camera and its projection to settle and render,
    // rather than sleeping for an assumed camera transition duration.
    let previous;
    await new Promise(resolve => {
        const tick = () => {
            resetAppIdle();
            const state = window.__THREE_SCENE__.__r3f.root.getState();
            state.invalidate();
            const camera = window.__visualCamera;
            if (camera?.type === expectedType && state.camera === camera && useSceneStore.getState().cameraProjection === projection) {
                const signature = [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements];
                // OrbitControls can retain floating-point jitter at the poles.
                if (previous && signature.every((value, index) => Math.abs(value - previous[index]) <= Math.sqrt(Number.EPSILON) * Math.max(1, Math.abs(value)))) { resolve(); return; }
                previous = signature;
            } else previous = undefined;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    const camera = window.__visualCamera;
    return { type: camera.type, position: camera.position.toArray(), quaternion: camera.quaternion.toArray(),
        projectionMatrix: camera.projectionMatrix.toArray(), zoom: camera.zoom,
        requested: { ...preset, projection }, elapsedTime: window.__THREE_SCENE__.__r3f.root.getState().clock.elapsedTime };
}
