import { getUnusedShadows as before } from '/tests/fixtures/visible-shadow-reference.ts';
import { getUnusedShadows as after } from '/src/features/scene/utils/visibleShadowReceivers.ts';
import { useSceneStore } from '/src/features/scene/store/useSceneStore.ts';
import { resetAppIdle } from '/src/features/scene/idleState.ts';

const summary = values => {
    const sorted = [...values].sort((a, b) => a - b);
    return { samples: values.length, median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.ceil((sorted.length - 1) * .95)], max: sorted.at(-1),
        total: values.reduce((sum, value) => sum + value, 0) };
};
export async function compareShadows(fixture) {
    const scene = window.__THREE_SCENE__;
    const originalMirrors = useSceneStore.getState().layers.mirrors;
    const results = [];
    try {
        for (const mirrors of [originalMirrors, false]) {
            useSceneStore.setState(state => ({ layers: { ...state.layers, mirrors } }));
            // Wait for React to apply the layer change, not a guessed sleep.
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const samples = { before: [], after: [] }, decisions = [];
            const original = scene.onBeforeRender;
            try {
                await new Promise((resolve, reject) => {
                    scene.onBeforeRender = function (...args) {
                        const [renderer, currentScene, camera] = args;
                        if (renderer.getRenderTarget() === null && decisions.length < fixture.framesPerMode) {
                            try {
                                resetAppIdle();
                                const outputs = {};
                                const order = decisions.length % 2 ? [['after', after], ['before', before]] : [['before', before], ['after', after]];
                                for (const [label, operation] of order) {
                                    const start = performance.now(); outputs[label] = operation(currentScene, camera);
                                    samples[label].push(performance.now() - start);
                                }
                                const ids = value => value.shadows.map(shadow => shadow.camera.uuid).join(',');
                                if (outputs.before.allUnused !== outputs.after.allUnused || ids(outputs.before) !== ids(outputs.after)) throw Error('Shadow coverage changed');
                                decisions.push({ skipped: outputs.after.shadows.length, allUnused: outputs.after.allUnused });
                                if (decisions.length === fixture.framesPerMode) resolve();
                            }
                            catch (error) { reject(error); }
                        }
                        return original.apply(this, args);
                    };
                    resetAppIdle();
                });
            }
            finally { scene.onBeforeRender = original; }
            results.push({ mirrors, before: summary(samples.before), after: summary(samples.after), decisions });
        }
    }
    finally { useSceneStore.setState(state => ({ layers: { ...state.layers, mirrors: originalMirrors } })); }
    return { count: fixture.count, preset: fixture.preset, framesPerMode: fixture.framesPerMode, results };
}
