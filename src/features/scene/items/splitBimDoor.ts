import * as THREE from 'three';

export function splitBimDoor(originalScene: THREE.Group) {
  const frameGeos: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];
  const leftGeos: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];
  const rightGeos: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];

  originalScene.updateMatrixWorld(true);

  originalScene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    
    // Clone geometry and bake matrixWorld so we work in meter scale
    const geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);
    
    const pos = geo.attributes.position;
    const index = geo.index;
    if (!pos || !index) return;
    
    let mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat = mat.clone();
      if (mat.name.toLowerCase().includes('glass') || mat.name.toLowerCase().includes('vitr') || mat.name.toLowerCase().includes('verre') || mat.opacity < 1) {
        mat.transparent = true;
        mat.opacity = 0.35;
        mat.roughness = 0.1;
        mat.metalness = 0.1;
        mat.color = new THREE.Color('#aaccff');
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
      }
    }

    const fIndices: number[] = [];
    const lIndices: number[] = [];
    const rIndices: number[] = [];

    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();

    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);

      vA.fromBufferAttribute(pos, a);
      vB.fromBufferAttribute(pos, b);
      vC.fromBufferAttribute(pos, c);

      // Centroid
      const cx = (vA.x + vB.x + vC.x) / 3;
      const cy = (vA.y + vB.y + vC.y) / 3;

      // Note: Coordinates are in meters before our scale(100) is applied, or maybe they are already scaled if baked.
      // Wait, originalScene is just loaded. Scale is NOT baked yet.
      // bbox is 0 to 1.5 in X, 0 to 2.1 in Y.
      if (cx < 0.08 || cx > 1.42 || cy > 2.02 || cy < 0.05) {
        fIndices.push(a, b, c);
      } else if (cx < 0.75) {
        lIndices.push(a, b, c);
      } else {
        rIndices.push(a, b, c);
      }
    }

    if (fIndices.length > 0) {
      const fg = geo.clone();
      fg.setIndex(fIndices);
      frameGeos.push({ geo: fg, mat });
    }
    if (lIndices.length > 0) {
      const lg = geo.clone();
      lg.setIndex(lIndices);
      lg.translate(-0.08, 0, 0); // Pivot à X=0.08
      leftGeos.push({ geo: lg, mat });
    }
    if (rIndices.length > 0) {
      const rg = geo.clone();
      rg.setIndex(rIndices);
      rg.translate(-1.42, 0, 0); // Pivot à X=1.42
      rightGeos.push({ geo: rg, mat });
    }
  });

  const frameGroup = new THREE.Group();
  frameGroup.name = 'Frame';
  frameGeos.forEach(({ geo, mat }) => frameGroup.add(new THREE.Mesh(geo, mat)));

  const leftGroup = new THREE.Group();
  leftGroup.name = 'LeftDoor';
  leftGroup.position.set(0.08, 0, 0);
  leftGeos.forEach(({ geo, mat }) => leftGroup.add(new THREE.Mesh(geo, mat)));

  const rightGroup = new THREE.Group();
  rightGroup.name = 'RightDoor';
  rightGroup.position.set(1.42, 0, 0);
  rightGeos.forEach(({ geo, mat }) => rightGroup.add(new THREE.Mesh(geo, mat)));

  return { frameGroup, leftGroup, rightGroup };
}
