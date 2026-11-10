import * as THREE from 'three';

/** Thin glass approximation: keep the transmission mask, without a scene-wide refraction pass. */
export function simplifySceneGlass(root: THREE.Object3D): () => void {
  const replacements = new Map<THREE.Material, THREE.MeshPhysicalMaterial>();
  const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const textures: THREE.Texture[] = [];
  const replace = (source: THREE.Material) => {
    const physical = source as THREE.MeshPhysicalMaterial;
    if (!physical.isMeshPhysicalMaterial || physical.transmission === 0) return source;
    const cached = replacements.get(source);
    if (cached) return cached;
    const material = physical.clone();
    if (material.alphaMap) throw new Error(`Scene glass already has an alpha mask: ${material.name}`);
    // Normal-incidence Fresnel reflectance keeps clear glass faintly visible.
    const reflectance = ((material.ior - 1) / (material.ior + 1)) ** 2;
    const transmission = material.transmission * (1 - reflectance);
    if (material.transmissionMap) {
      const map = material.transmissionMap;
      const sourceImage = map.image as CanvasImageSource & { width: number; height: number };
      const canvas = document.createElement('canvas');
      canvas.width = sourceImage.width;
      canvas.height = sourceImage.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Cannot prepare scene glass alpha mask');
      context.drawImage(sourceImage, 0, 0);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < image.data.length; i += 4) {
        const alpha = Math.round(255 - image.data[i] * transmission);
        image.data[i] = image.data[i + 1] = image.data[i + 2] = alpha;
        image.data[i + 3] = 255;
      }
      context.putImageData(image, 0, 0);
      const alphaMap = map.clone();
      // Texture.clone shares its Source; never overwrite the original GLB image.
      alphaMap.source = new THREE.TextureSource(canvas);
      alphaMap.colorSpace = THREE.NoColorSpace;
      alphaMap.needsUpdate = true;
      material.alphaMap = alphaMap;
      textures.push(alphaMap);
    } else {
      material.opacity *= 1 - transmission;
    }
    material.transmission = 0;
    material.transmissionMap = null;
    material.transparent = true;
    material.depthWrite = false;
    replacements.set(source, material);
    return material;
  };
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const original = mesh.material;
    const next = Array.isArray(original) ? original.map(replace) : replace(original);
    if (Array.isArray(original) ? original.some((material, i) => material !== (next as THREE.Material[])[i]) : original !== next) {
      originals.set(mesh, original);
      mesh.material = next;
    }
  });
  return () => {
    originals.forEach((material, mesh) => { mesh.material = material; });
    replacements.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
  };
}
