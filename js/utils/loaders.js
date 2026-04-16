import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
draco.preload();

export const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(draco);

// Registre : path → [gltf.scene, ...] — une entrée par appel load()
export const glbRegistry = new Map();
const _origLoad = gltfLoader.load.bind(gltfLoader);
gltfLoader.load = (url, onLoad, onProgress, onError) => {
  _origLoad(url, (gltf) => {
    if (!glbRegistry.has(url)) glbRegistry.set(url, []);
    glbRegistry.get(url).push(gltf.scene);
    onLoad?.(gltf);
  }, onProgress, onError);
};
