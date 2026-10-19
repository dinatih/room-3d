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
    const output = '/tmp/room-wig-opaque'; fs.mkdirSync(output, { recursive: true });
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
        await page.evaluate(() => window.setSelected(['hair_lara_native', 'hair_white_hair_with_bun']));
        await page.waitForFunction(() => { const wigs = window.inspectWigs(); return wigs.length === 4 && wigs.every(w => /lara_native|white_hair_with_bun/.test(w.path)); }, { timeout: 120000 });
        const result = { errors, materials: await page.evaluate(() => window.inspectWigs()), captures: [] };
        for (const wig of result.materials) for (const material of wig.materials) {
            assert.equal(material.transparent, false);
            assert.equal(material.alphaTest, 0.5);
        }
        for (const view of ['front', 'above']) {
            const render = await page.evaluate(async view => {
                window.wigCamera.position.set(0, view === 'above' ? 180 : 100, 210); window.wigCamera.lookAt(0, 25, 0);
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                return { ...window.wigRenderer.info.render };
            }, view);
            const filename = `${output}/${view}.png`; await page.screenshot({ path: filename });
            result.captures.push({ view, filename, render });
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(`${output}/result.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result.captures));
    }
    finally { await browser?.close(); await server.close(); }
}
