const assert = require('node:assert/strict');
const fs = require('node:fs');
const { withBrowser } = require('../tests/support/browser.cjs');
process.env.ROOM_TEST_SUITE = 'perf'; process.env.ROOM_TEST_OPTIONS = '{}';
process.env.ROOM_TEST_RESULTS = fs.mkdtempSync('/tmp/room-light-pixels-');
const fixture = { ...require('../tests/fixtures/cases.cjs').performance['studio-9-mid-night'], count: 0, id: 'light-pixels', reproduction: 'node scripts/test-zero-light-shader.cjs --hardware-gpu' };
withBrowser(fixture, async page => {
    const differences = await page.evaluate(async () => {
        const T = await import('/node_modules/three/build/three.module.js');
        const { originalDirectLightShader, optimizeDirectLightShader } = await import('/src/features/scene/utils/zeroEnergyLights.ts');
        const original = originalDirectLightShader, optimized = optimizeDirectLightShader(original);
        const scene = new T.Scene(), camera = new T.PerspectiveCamera(45, 1, .1, 100);
        camera.position.set(3, 2.5, 4); camera.lookAt(0, .5, 0);
        scene.background = new T.Color('#353535'); scene.add(new T.AmbientLight('white', .3));
        const dir = new T.DirectionalLight('white', 0), point = new T.PointLight('#ffd1a0', 0, 8), spot = new T.SpotLight('#a0c8ff', 0, 10);
        for (const [light, x] of [[dir, -2], [point, 2], [spot, 0]]) { light.position.set(x, 4, 2); light.castShadow = true; light.shadow.mapSize.set(128, 128); scene.add(light); }
        const sphere = new T.Mesh(new T.SphereGeometry(1, 16, 8)); sphere.name = 'probe-sphere'; sphere.position.y = 1; sphere.castShadow = sphere.receiveShadow = true; scene.add(sphere);
        const floor = new T.Mesh(new T.PlaneGeometry(10, 10), new T.MeshStandardMaterial({ color: '#777777' })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
        const scenes = [scene, scene.clone(true)];
        const lightSets = scenes.map(scene => scene.children.filter(light => light.isDirectionalLight || light.isPointLight || light.isSpotLight));
        const renderers = [new T.WebGLRenderer(), new T.WebGLRenderer()];
        const targets = renderers.map(() => new T.WebGLRenderTarget(64, 64));
        renderers.forEach((renderer, i) => { renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap; renderer.setSize(64, 64); renderer.setRenderTarget(targets[i]); });
        const differences = [];
        try {
            for (const Type of [T.MeshStandardMaterial, T.MeshPhysicalMaterial, T.MeshPhongMaterial, T.MeshLambertMaterial]) {
                sphere.material = new Type({ color: '#cc8866' });
                scenes[1].getObjectByName('probe-sphere').material = sphere.material;
                if (sphere.material.isMeshPhysicalMaterial) { sphere.material.clearcoat = .8; sphere.material.roughness = .25; }
                for (const intensities of [[0, 0, 0], [1, 25, 0], [.25, 0, 20]]) {
                    lightSets.forEach(lights => lights.forEach((light, i) => { light.intensity = intensities[i]; }));
                    const pixels = renderers.map((renderer, i) => {
                        T.ShaderChunk.lights_fragment_begin = i ? optimized : original;
                        renderer.render(scenes[i], camera);
                        const pixels = new Uint8Array(64 * 64 * 4);
                        renderer.readRenderTargetPixels(targets[i], 0, 0, 64, 64, pixels);
                        return pixels;
                    });
                    let maxByteDifference = 0;
                    for (let i = 0; i < pixels[0].length; i++) maxByteDifference = Math.max(maxByteDifference, Math.abs(pixels[0][i] - pixels[1][i]));
                    differences.push({ material: Type.name, intensities, maxByteDifference });
                }
                sphere.material.dispose();
            }
        } finally {
            T.ShaderChunk.lights_fragment_begin = original;
            targets.forEach(target => target.dispose());
            lightSets.flat().forEach(light => light.shadow.map?.dispose());
            renderers.forEach(renderer => { renderer.dispose(); renderer.forceContextLoss(); });
            sphere.geometry.dispose(); floor.geometry.dispose(); floor.material.dispose();
        }
        return differences;
    });
    for (const sample of differences) assert(sample.maxByteDifference <= 1, `Pixel difference exceeds one 8-bit quantization step: ${JSON.stringify(sample)}`);
    fs.writeFileSync(`${process.env.ROOM_TEST_RESULTS}/pixels.json`, JSON.stringify(differences, null, 2));
    console.log('Pixel comparison passed', differences);
    console.log('Artifacts:', process.env.ROOM_TEST_RESULTS);
}).catch(error => { console.error(error); process.exitCode = 1; });
