// Run after converting upstream DAE meshes to /tmp/raph-{base,wheel,servo}.glb with assimp.
import fs from 'node:fs/promises';
import { Box3, Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { execFileSync } from 'node:child_process';

if (process.argv.includes('--download')) {
  const images = {
    'raph-rover': ['https://fictionlab.pl/wp-content/uploads/shop/raph-rover-1-0-1.webp', 'https://fictionlab.pl/wp-content/uploads/shop/raph-rover-1-0-2.webp'],
    'unitree-g1': ['https://www.unitree.com/images/39d02ea5ef314413855ae4790812e9ff_1920x1080.jpg', 'https://www.unitree.com/images/4a3dc51a7edb45bb9e9e0d1d240d8cd0_1920x1080.jpg'],
    'unitree-go2': ['https://www.unitree.com/images/c2555e3813074ba6a1f2e124ee7e90cf_3840x2160.jpg', 'https://www.unitree.com/images/b5fffd3e4fc04e6f9fcafedb9516b341_3840x2146.jpg'],
    'unitree-h2': ['https://www.unitree.com/images/cab91f8a6c024197a4641d342ec44895_3840x2160.jpg', 'https://www.unitree.com/images/32686742408341c5af3b5dc2f4c85b0e_3840x2160.jpg'],
    'unitree-as2w': ['https://www.unitree.com/images/5b5179f7c4b94252bd7af8aff533b5a5_1920x1080.jpg', 'https://www.unitree.com/images/db4fcc4a213f429ba4959a7d719379ef_1920x1080.jpg'],
    jumper: ['https://kingkong.tech/assets/products/robot/20261021/hero-desktop-real.webp', 'https://kingkong.tech/assets/products/robot/0929/look-01.webp'],
    'dji-neo': ['https://www-cdn.djiits.com/dps/3927484361e1d04c3c71005fa2cdde83@origin.jpg'],
    'dji-avata-2': ['https://www-cdn.djiits.com/dps/2f14c30392c1285e13e1ab166807ba6f.jpg', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/1e1ced1c9fc557b237068f683a067feb@retina_small.png'],
    'black-hornet': ['https://defense.flir.com/globalassets/defense/images/product-lync-images/black-hornet-32.jpg', 'https://defense.flir.com/globalassets/news/news-center/government--defense/flir---black-hornet---12.jpg'],
  };
  for (const [id, urls] of Object.entries(images)) {
    await fs.mkdir(`public/items/${id}`, { recursive: true });
    for (const [i, url] of urls.entries()) {
      const file = `presentation-${i + 1}.${url.split('.').pop()}`;
      execFileSync('curl', ['--fail', '-L', '-sS', url, '-o', `public/items/${id}/${file}`]);
      console.log(id, file);
    }
    await fs.writeFile(`public/items/${id}/presentation-sources.md`, `# Presentation images\n\nOfficial manufacturer images; rights remain with their respective owners.\n\n${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}\n`);
  }
  process.exit(0);
}
if (process.argv.includes('--render')) {
  const { default: launch } = await import('./browser-test-options.cjs');
  const browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 750 });
    await page.goto('http://127.0.0.1:5173/AGENTS.md');
    for (const id of ['raph-rover', 'dji-fpv']) {
      await page.evaluate(async id => {
        const THREE = await import('/node_modules/.vite/deps/three.js');
        const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
        const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#e8edf2');
        const draco = new DRACOLoader().setDecoderPath('/draco/');
        const { scene: model } = await new GLTFLoader().setDRACOLoader(draco).loadAsync(`/items/${id}/${id}.glb`);
        scene.add(model);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const radius = box.getSize(new THREE.Vector3()).length() / 2;
        const camera = new THREE.PerspectiveCamera(40, 1000 / 750, radius / 100, radius * 100);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x607080, 3));
        const light = new THREE.DirectionalLight(0xffffff, 3);
        light.position.copy(center).add(new THREE.Vector3(radius, radius * 2, radius));
        scene.add(light);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(1000, 750);
        document.body.innerHTML = '';
        document.body.style.margin = '0';
        document.body.append(renderer.domElement);
        window.renderView = side => {
          camera.position.copy(center).add(new THREE.Vector3(side, 0.65, 1).normalize().multiplyScalar(radius / Math.sin(THREE.MathUtils.degToRad(20))));
          camera.lookAt(center);
          renderer.render(scene, camera);
        };
        window.renderView(1);
      }, id);
      for (const [i, side] of [1, -1].entries()) {
        await page.evaluate(side => window.renderView(side), side);
        const path = id === 'raph-rover' ? `/tmp/raph-rover-corrected-${i + 1}.png` : `public/items/${id}/presentation-${i + 1}.png`;
        await page.screenshot({ path });
        console.log(path);
      }
    }
  } finally { await browser.close(); }
  process.exit(0);
}

if (process.argv.includes('--preview')) {
  const { default: launch } = await import('./browser-test-options.cjs');
  const browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error(error));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:5173/AGENTS.md');
    await page.evaluate(async () => {
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      history.replaceState({}, '', '/?inventory=robots&item=raph-rover');
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      await import('/scss/app.scss'); await import('/src/index.css');
      const { Inventory } = await import('/src/features/inventory/Inventory.tsx');
      document.body.innerHTML = '<div id="test-root"></div>';
      createRoot(document.getElementById('test-root')).render(React.createElement(Inventory, { initialCategory: 'robots', onClose: () => {} }));
    });
    await page.waitForSelector('canvas', { timeout: 60000 });
    await page.waitForSelector('[data-item-id="unitree-h2"]');
    const verified = await page.evaluate(async () => {
      const { INVENTORY } = await import('/src/features/inventory/inventoryData.ts');
      const robots = INVENTORY.filter(item => item.photos?.some(path => path.includes('/presentation-')));
      for (const item of robots) {
        if (!item.url || !item.photos.length) throw new Error(`Incomplete presentation: ${item.id}`);
        await Promise.all(item.photos.map(async src => {
          const image = new Image();
          image.src = src;
          await image.decode();
        }));
      }
      return robots.map(item => item.id);
    });
    console.log('Verified product links and image decoding:', verified);
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: '/tmp/raph-rover-corrected.png' });
    await page.click('img[title="Voir cette photo"]');
    await page.waitForSelector('img[src*="raph-rover/presentation-1.webp"][style*="contain"]');
    await page.screenshot({ path: '/tmp/raph-rover-gallery.png' });
    console.log('Preview saved: /tmp/raph-rover-corrected.png');
  } finally { await browser.close(); }
  process.exit(0);
}
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result = result; this.onloadend(); });
  }
};
const root = new Group();
root.name = 'Raph Rover';
// ROS Z-up meters to glTF Y-up centimeters; forward becomes +Z.
root.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
root.scale.setScalar(100);
const loader = new GLTFLoader();
const models = {};
for (const name of ['base', 'wheel', 'servo']) {
  const bytes = await fs.readFile(`/tmp/raph-${name}.glb`);
  models[name] = (await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
}
function part(model, name, position, yaw = 0, parent = root) {
  const joint = new Group();
  joint.name = name;
  joint.position.set(...position);
  joint.rotation.z = yaw;
  const visual = new Group();
  // Assimp already converted COLLADA Z-up to glTF Y-up. Restore ROS axes
  // before applying the URDF visual yaw, without overwriting imported transforms.
  visual.rotation.set(Math.PI / 2, 0, Math.PI / 2, 'ZXY');
  visual.add(models[model].clone(true));
  joint.add(visual);
  parent.add(joint);
  return joint;
}
part('base', 'base_link', [-0.074211, 0, -0.031076]);
part('wheel', 'wheel_fl_joint', [0, 0.19402, -0.144756]);
part('wheel', 'wheel_fr_joint', [0, -0.19402, -0.144756], Math.PI);
for (const [side, y, yaw] of [['l', 0.1899, 0], ['r', -0.1899, Math.PI]]) {
  const servo = part('servo', `servo_${side}_joint`, [-0.37943, y, -0.022433], yaw);
  part('wheel', `wheel_r${side}_joint`, [0, 0, -0.12392], 0, servo);
}
const box = new Box3().setFromObject(root);
root.traverse(node => {
  if (!node.isMesh) return;
  for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
    if (['Plastic White', '3D PLA gray, Z', 'Led_silicone_strip'].includes(material.name)) {
      material.color.setRGB(0.65, 0.012, 0.02);
    }
  }
});
const center = box.getCenter(new Vector3());
root.position.set(-center.x, -box.min.y, -center.z);
const output = 'public/items/raph-rover';
await fs.mkdir(output, { recursive: true });
await fs.writeFile(`${output}/raph-rover.glb`, Buffer.from(await new GLTFExporter().parseAsync(root, { binary: true })));
const size = new Box3().setFromObject(root).getSize(new Vector3());
await fs.writeFile(`${output}/dimensions.json`, JSON.stringify({ w: size.x, d: size.z, h: size.y }, null, 2) + '\n');
await fs.copyFile('/tmp/raph_common-main/LICENSE', `${output}/LICENSE`);
console.log('Dimensions (cm):', size);
