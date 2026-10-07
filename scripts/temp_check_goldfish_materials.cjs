const fs = require('node:fs');
const assert = require('node:assert/strict');
global.ProgressEvent = class { constructor(type, data) { Object.assign(this, data); } };
(async () => {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  for (const species of ['jikin', 'tosakin']) {
    const metadata = JSON.parse(fs.readFileSync(`src/features/scene/items/${species === 'jikin' ? 'goldfish' : 'tosakin'}Model.json`));
    assert(metadata.radius < (38 - 4) / 2, 'fish fits below water');
    const b = fs.readFileSync(`public/characters/${species}-goldfish/${species}-goldfish.glb`);
    const n = b.readUInt32LE(12);
    const json = JSON.parse(b.subarray(20,20+n));
    const material = name => json.materials.find(m => m.name === name);
    const cornea = material('M_Cornea');
    assert.equal(cornea.alphaMode, 'BLEND');
    assert(Math.abs(cornea.pbrMetallicRoughness.baseColorFactor[3] - .06) < 1e-6);
    const iris = material('M_Iris').pbrMetallicRoughness;
    assert.deepEqual(iris.baseColorFactor.slice(0,3).map(x=>Math.round(x*1000)), [1000,766,336]);
    assert.equal(iris.metallicFactor, 0);
    assert.deepEqual(material('M_Lens').pbrMetallicRoughness.baseColorFactor.slice(0,3), [0,0,0]);
    assert(json.images.every(image => Number.isInteger(image.bufferView)));
    json.buffers[0].uri = 'data:application/octet-stream;base64,' + b.subarray(28+n).toString('base64');
    delete json.images; delete json.textures; delete json.samplers; delete json.materials;
    for (const mesh of json.meshes) for (const p of mesh.primitives) delete p.material;
    const gltf = await new GLTFLoader().parseAsync(JSON.stringify(json), '');
    assert.equal(gltf.animations.length, 1);
    for (const [name,[start,end]] of Object.entries(metadata.frames)) {
      const clip = THREE.AnimationUtils.subclip(gltf.animations[0],name,start,end+1,24);
      assert(clip.tracks.length > 0);
      assert(Math.abs(clip.duration - (end-start)/24) < 1e-5, `${species} ${name}`);
    }
    const mixer = new THREE.AnimationMixer(gltf.scene);
    mixer.clipAction(gltf.animations[0]).play();
    const center = new THREE.Vector3(...metadata.center);
    const box = new THREE.Box3();
    const corner = new THREE.Vector3();
    for (let frame = metadata.frames['turn-left'][0]; frame <= 251; frame++) {
      mixer.setTime(frame/24); gltf.scene.updateMatrixWorld(true); box.setFromObject(gltf.scene,true);
      for (const x of [box.min.x,box.max.x]) for(const y of [box.min.y,box.max.y]) for(const z of [box.min.z,box.max.z]) assert(corner.set(x,y,z).distanceTo(center)*metadata.scale <= metadata.radius+1e-4);
    }
    console.log(`${species}: clear cornea, yellow iris, black pupil, embedded textures, 5 animations and animated tub fit validated.`);
  }
})().catch(error => { console.error(error); process.exitCode=1; });
