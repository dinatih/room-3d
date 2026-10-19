const fs = require('node:fs');
const path = require('node:path');
const directory = 'public/characters/wigs';
if (process.argv.includes('--wigs')) wigs().catch(error => { console.error(error); process.exitCode = 1; });
else for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.glb'))) {
    const buffer = fs.readFileSync(path.join(directory, name));
    const json = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
    console.log(JSON.stringify({ name, bytes: buffer.length,
        vertices: (json.meshes ?? []).flatMap(mesh => mesh.primitives).reduce((sum, p) => sum + json.accessors[p.attributes.POSITION].count, 0),
        joints: (json.skins ?? []).map(skin => skin.joints.length),
        materials: (json.materials ?? []).map(m => ({ name: m.name, alpha: m.alphaMode ?? 'OPAQUE', cutoff: m.alphaCutoff,
            opacity: m.pbrMetallicRoughness?.baseColorFactor?.[3], doubleSided: m.doubleSided,
            transmission: m.extensions?.KHR_materials_transmission?.transmissionFactor })),
    }));
}

async function wigs() {
    const { createServer } = await import('vite');
    const assert = require('node:assert/strict');
    const output = '/tmp/room-wig-depth'; fs.mkdirSync(output, { recursive: true });
    const server = await createServer({ server: { host: '127.0.0.1', port: 5196, strictPort: true },
        plugins: [{ name: 'wig-test-camera', enforce: 'pre', transform(source, id) {
            if (id.endsWith('/scripts/temp_wig_alignment.tsx')) return source.replace('const { scene, camera } = useThree();',
                'const { scene, camera, gl } = useThree(); Object.assign(window, { wigScene: scene, wigCamera: camera, wigRenderer: gl });');
        } }],
    });
    let browser;
    try {
        await server.listen();
        browser = await require('./browser-test-options.cjs')({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'] });
        const page = await browser.newPage(); await page.setViewport({ width: 1200, height: 800 });
        const errors = []; page.on('pageerror', error => errors.push(String(error)));
        await page.setRequestInterception(true);
        page.on('request', request => request.isNavigationRequest() ? request.respond({ contentType: 'text/html', body: '<div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/scripts/temp_wig_alignment.tsx"></script>' }) : request.continue());
        await page.goto('http://127.0.0.1:5196', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.inspectWigs?.().length === 4, { timeout: 120000 });
        await page.evaluate(() => window.setSelected(['hair_white_hair_with_bun', 'hair_wavy_ponytails']));
        await page.waitForFunction(() => { const wigs = window.inspectWigs(); return wigs.length === 4 && wigs.every(w => /white_hair_with_bun|white_long_wavy_ponytails/.test(w.path)); }, { timeout: 120000 });
        const result = { errors, materials: await page.evaluate(() => window.inspectWigs()), captures: [] };
        for (const mode of ['before', 'after']) for (const view of ['front', 'above']) {
            const render = await page.evaluate(async ({ mode, view }) => {
                window.wigScene.traverse(mesh => {
                    if (mesh.userData.wigOpaqueDepth) mesh.visible = mode === 'after';
                    else if (mesh.userData.isCustomHair && mesh.isMesh) {
                        mesh.renderOrder = mode === 'after' ? 0 : 1;
                        for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) mat.forceSinglePass = mode === 'after';
                    }
                });
                window.wigCamera.position.set(0, view === 'above' ? 180 : 100, 210); window.wigCamera.lookAt(0, 25, 0);
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                return { ...window.wigRenderer.info.render };
            }, { mode, view });
            const filename = `${output}/${mode}-${view}.png`; await page.screenshot({ path: filename });
            result.captures.push({ mode, view, filename, render });
        }
        result.occlusion = await page.evaluate(async () => {
            const THREE = await import('/node_modules/.vite/deps/three.js');
            const { updateWigDepth } = await import('/src/features/scene/utils/wigDepth.ts');
            const geo = new THREE.BufferGeometry(), positions = [], colors = [], uvs = [];
            for (const [z, color] of [[2, [1, 0, 0]], [1, [0, 0, 1]]]) for (const [x, y, u, v] of [[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,-1,0,0],[1,1,1,1],[-1,1,0,1]]) {
                positions.push(x,y,z); colors.push(...color); uvs.push(u,v);
            }
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            const map = new THREE.DataTexture(new Uint8Array([255,255,255,255,255,255,255,128]),2,1); map.needsUpdate = true;
            const material = new THREE.MeshBasicMaterial({ map, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geo, material), scene = new THREE.Scene(); scene.background = new THREE.Color('white'); scene.add(mesh);
            const camera = new THREE.OrthographicCamera(-1.2,1.2,1.2,-1.2,.1,10); camera.position.z = 5; camera.updateMatrixWorld(true);
            const renderer = window.wigRenderer, target = new THREE.WebGLRenderTarget(128,128), prior = renderer.getRenderTarget();
            const read = () => { renderer.setRenderTarget(target); renderer.render(scene,camera); const core = new Uint8Array(4), edge = new Uint8Array(4); renderer.readRenderTargetPixels(target,32,64,1,1,core); renderer.readRenderTargetPixels(target,96,64,1,1,edge); return { core:[...core], edge:[...edge] }; };
            try { const before = read(); updateWigDepth(mesh); material.forceSinglePass = true; const after = read(); return { before, after }; }
            finally { renderer.setRenderTarget(prior); target.dispose(); map.dispose(); geo.dispose(); material.dispose(); for (const child of mesh.children) for (const mat of Array.isArray(child.material) ? child.material : [child.material]) mat.dispose(); }
        });
        assert(result.occlusion.before.core[2] > 200 && result.occlusion.before.core[0] < 20, 'Reference must reproduce rear-card occlusion');
        assert(result.occlusion.after.core[0] > 200 && result.occlusion.after.core[2] < 20, 'Opaque front hair must hide the rear card');
        assert.deepEqual(result.occlusion.after.edge, result.occlusion.before.edge, 'Continuous wisps must keep their blended alpha');
        assert.deepEqual(errors, []);
        fs.writeFileSync(`${output}/result.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result.occlusion));
    }
    finally { await browser?.close(); await server.close(); }
}
