import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { useSceneStore } from './store/useSceneStore';

const lineMat      = new THREE.LineBasicMaterial({ color: 0xff2200 });
const highlightMat = new THREE.LineBasicMaterial({ color: 0xffee00, depthTest: false });

function isWallMesh(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData?.brickType === 'wall') return true;
    cur = cur.parent;
  }
  return false;
}

// ── Shared module-level state ──────────────────────────────────────────────────

const edgeData = {
  line:      null as THREE.LineSegments | null,
  positions: null as Float32Array | null,
};

export const edgeHoverState = {
  visible: false,
  length:  0,
  x: 0, y: 0,
  onUpdate: null as (() => void) | null,
};

// ── WallEdgesLayer (R3F, inside Canvas) ───────────────────────────────────────

export function WallEdgesLayer() {
  const { scene, camera } = useThree();
  const layers = useSceneStore(state => state.layers);

  useEffect(() => {
    let timeout: any;
    
    const compute = () => {
      // Force update même si group parent .visible=false
      scene.updateMatrixWorld(true);
      const geos: THREE.BufferGeometry[] = [];

      scene.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh || (mesh as any).isSkinnedMesh) return;
        if (!isWallMesh(mesh)) return;
        
        // On respecte la visibilité effective.
        if (!mesh.visible) return;

        if (!camera.layers.test(mesh.layers)) return;

        const src = mesh.geometry;
        const tmp = new THREE.BufferGeometry();
        tmp.setAttribute('position', src.getAttribute('position').clone());
        if (src.index) tmp.setIndex(src.index.clone());

        const geo = tmp.index ? tmp.toNonIndexed() : tmp;
        if (geo !== tmp) tmp.dispose();

        geo.applyMatrix4(mesh.matrixWorld);
        geos.push(geo);
      });

      if (geos.length === 0) {
        // Si rien trouvé, on réessaie dans 200ms (attente de la fusion)
        timeout = setTimeout(compute, 200);
        return;
      }

      const merged = mergeGeometries(geos);
      geos.forEach(g => g.dispose());
      if (!merged) return;

      const deduped = mergeVertices(merged, 0.1);
      merged.dispose();

      const edges = new THREE.EdgesGeometry(deduped, 5);
      deduped.dispose();

      const line = new THREE.LineSegments(edges, lineMat);
      scene.add(line);

      edgeData.line      = line;
      edgeData.positions = edges.attributes.position.array as Float32Array;
    };

    // Premier essai rapide, puis retours si nécessaire
    timeout = setTimeout(compute, 100);

    return () => {
      clearTimeout(timeout);
      if (edgeData.line) {
        scene.remove(edgeData.line);
        edgeData.line.geometry.dispose();
      }
      edgeData.line      = null;
      edgeData.positions = null;
    };
  }, [scene, camera, layers]);

  return null;
}

// ── EdgeHoverRaycaster (R3F, inside Canvas) ───────────────────────────────────

export function EdgeHoverRaycaster() {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const canvas    = gl.domElement;
    const raycaster = new THREE.Raycaster();
    (raycaster.params as any).Line = { threshold: 5 };
    const pointer   = new THREE.Vector2();
    let lastMove    = 0;

    // Single-segment highlight overlay
    const hlPositions = new Float32Array(6);
    const hlGeo  = new THREE.BufferGeometry();
    hlGeo.setAttribute('position', new THREE.BufferAttribute(hlPositions, 3));
    const hlLine = new THREE.LineSegments(hlGeo, highlightMat);
    hlLine.visible    = false;
    hlLine.renderOrder = 1;
    scene.add(hlLine);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - lastMove < 32) return;
      lastMove = now;

      if (!edgeData.line || !edgeData.positions) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(edgeData.line, false);

      if (hits.length > 0) {
        const idx = (hits[0] as THREE.Intersection & { index?: number }).index;
        if (idx !== undefined) {
          const pos = edgeData.positions!;
          const ax = pos[idx * 3],     ay = pos[idx * 3 + 1], az = pos[idx * 3 + 2];
          const bx = pos[idx * 3 + 3], by = pos[idx * 3 + 4], bz = pos[idx * 3 + 5];

          const dx = bx - ax, dy = by - ay, dz = bz - az;
          const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Update highlight segment
          const attr = hlGeo.attributes.position as THREE.BufferAttribute;
          attr.setXYZ(0, ax, ay, az);
          attr.setXYZ(1, bx, by, bz);
          attr.needsUpdate = true;
          hlLine.visible = true;

          edgeHoverState.visible = true;
          edgeHoverState.length  = length;
          edgeHoverState.x       = e.clientX;
          edgeHoverState.y       = e.clientY;
        }
      } else {
        hlLine.visible         = false;
        edgeHoverState.visible = false;
      }
      edgeHoverState.onUpdate?.();
    };

    const onLeave = () => {
      hlLine.visible         = false;
      edgeHoverState.visible = false;
      edgeHoverState.onUpdate?.();
    };

    canvas.addEventListener('pointermove',  onMove);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      canvas.removeEventListener('pointermove',  onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      scene.remove(hlLine);
      hlGeo.dispose();
      edgeHoverState.visible = false;
    };
  }, [camera, gl, scene]);

  return null;
}

// ── EdgeHoverOverlay (HTML, outside Canvas) ───────────────────────────────────

export function EdgeHoverOverlay() {
  const [state, setState] = useState({ visible: false, length: 0, x: 0, y: 0 });

  useEffect(() => {
    edgeHoverState.onUpdate = () => setState({
      visible: edgeHoverState.visible,
      length:  edgeHoverState.length,
      x:       edgeHoverState.x,
      y:       edgeHoverState.y,
    });
    return () => { edgeHoverState.onUpdate = null; };
  }, []);

  if (!state.visible) return null;

  const label = state.length >= 100
    ? `${(state.length / 100).toFixed(2)} m`
    : `${Math.round(state.length)} cm`;

  return (
    <div style={{
      position:       'fixed',
      left:           state.x + 14,
      top:            state.y - 20,
      zIndex:         400,
      background:     'rgba(10,5,0,0.80)',
      backdropFilter: 'blur(8px)',
      border:         '1px solid rgba(255,80,0,0.55)',
      borderRadius:   5,
      padding:        '3px 10px',
      color:          '#ff8844',
      fontSize:       13,
      fontWeight:     700,
      fontFamily:     'monospace',
      pointerEvents:  'none',
      userSelect:     'none',
    }}>
      {label}
    </div>
  );
}
