import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import {
  HEATMAP_CELL_CM,
  HEATMAP_VOXEL_CM,
  type AnimationHeatmapData,
  type HeatmapCollisionResult,
} from './animationHeatmap';

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const CLASH_COLOR = new THREE.Color('#ff0055');

function densityToHeatColor(t: number, roleMask: number, out: THREE.Color) {
  const clamped = Math.max(0, Math.min(1, t));
  if (roleMask === 2) {
    // Role B (partner): teal -> amber -> magenta-orange tint for clear visual distinction in Duo
    if (clamped < 0.5) {
      out.setRGB(0.15 + clamped * 1.4, 0.85, 0.9 - clamped * 1.1);
    } else {
      const k = (clamped - 0.5) * 2;
      out.setRGB(0.85 + 0.15 * k, 0.85 - 0.55 * k, 0.35 - 0.35 * k);
    }
    return;
  }
  if (roleMask === 3) {
    // Shared overlap between A and B: bright violet-magenta gradient
    out.setRGB(0.85 + 0.15 * clamped, 0.15 + 0.45 * clamped, 0.95 - 0.3 * clamped);
    return;
  }
  // Classic thermal gradient: Cyan -> Green -> Yellow -> Red
  if (clamped < 0.33) {
    const k = clamped / 0.33;
    out.setRGB(0.0, 0.68 + 0.32 * k, 1.0 - 0.55 * k);
  } else if (clamped < 0.66) {
    const k = (clamped - 0.33) / 0.33;
    out.setRGB(k, 1.0, 0.45 * (1 - k));
  } else {
    const k = (clamped - 0.66) / 0.34;
    out.setRGB(1.0, 1.0 - 0.78 * k, 0.05);
  }
}

export interface AnimationHeatmapMeshProps {
  data: AnimationHeatmapData | null;
  collisions?: HeatmapCollisionResult | null;
  anchorPos?: [number, number, number];
  anchorRotY?: number;
  showGround?: boolean;
  show3D?: boolean;
  clashOnly3D?: boolean;
}

export function AnimationHeatmapMesh({
  data,
  collisions,
  anchorPos = [0, 0, 0],
  anchorRotY = 0,
  showGround = true,
  show3D = true,
  clashOnly3D = false,
}: AnimationHeatmapMeshProps) {
  const groundMeshRef = useRef<THREE.InstancedMesh>(null);
  const freeVoxelMeshRef = useRef<THREE.InstancedMesh>(null);
  const clashVoxelMeshRef = useRef<THREE.InstancedMesh>(null);

  const groundGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(HEATMAP_CELL_CM * 0.94, HEATMAP_CELL_CM * 0.94);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const voxelGeom = useMemo(
    () => new THREE.BoxGeometry(HEATMAP_VOXEL_CM * 0.92, HEATMAP_VOXEL_CM * 0.92, HEATMAP_VOXEL_CM * 0.92),
    [],
  );
  const groundMat = useMemo(
    () => new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    }),
    [],
  );
  const freeVoxelMat = useMemo(
    () => new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    }),
    [],
  );
  const clashVoxelMat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: '#ff1744',
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      depthTest: false,
    }),
    [],
  );

  useLayoutEffect(() => {
    return () => {
      groundGeom.dispose();
      voxelGeom.dispose();
      groundMat.dispose();
      freeVoxelMat.dispose();
      clashVoxelMat.dispose();
    };
  }, [groundGeom, voxelGeom, groundMat, freeVoxelMat, clashVoxelMat]);

  const voxelSplit = useMemo(() => {
    if (!data) return { freeIndices: [] as number[], clashIndices: [] as number[] };
    const clashSet = collisions?.collidingVoxelIndices;
    const freeIndices: number[] = [];
    const clashIndices: number[] = [];
    for (let i = 0; i < data.voxels.length; i++) {
      if (clashSet?.has(i)) clashIndices.push(i);
      else if (!clashOnly3D) freeIndices.push(i);
    }
    return { freeIndices, clashIndices };
  }, [data, collisions, clashOnly3D]);

  useLayoutEffect(() => {
    const mesh = groundMeshRef.current;
    if (!mesh || !data || !showGround) return;
    const clashSet = collisions?.collidingCellIndices;
    for (let i = 0; i < data.groundCells.length; i++) {
      const cell = data.groundCells[i];
      const isClash = clashSet?.has(i) ?? false;
      _dummy.position.set(cell.x, isClash ? 1.1 : 0.6, cell.z);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
      if (isClash) {
        mesh.setColorAt(i, CLASH_COLOR);
      } else {
        densityToHeatColor(cell.count / data.maxCellCount, cell.roleMask, _color);
        mesh.setColorAt(i, _color);
      }
    }
    mesh.count = data.groundCells.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data, collisions, showGround]);

  useLayoutEffect(() => {
    const freeMesh = freeVoxelMeshRef.current;
    if (freeMesh && data && show3D) {
      const { freeIndices } = voxelSplit;
      for (let k = 0; k < freeIndices.length; k++) {
        const v = data.voxels[freeIndices[k]];
        _dummy.position.set(v.x, v.y, v.z);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        freeMesh.setMatrixAt(k, _dummy.matrix);
        densityToHeatColor(v.count / data.maxVoxelCount, v.roleMask, _color);
        freeMesh.setColorAt(k, _color);
      }
      freeMesh.count = freeIndices.length;
      freeMesh.instanceMatrix.needsUpdate = true;
      if (freeMesh.instanceColor) freeMesh.instanceColor.needsUpdate = true;
    }

    const clashMesh = clashVoxelMeshRef.current;
    if (clashMesh && data && show3D) {
      const { clashIndices } = voxelSplit;
      for (let k = 0; k < clashIndices.length; k++) {
        const v = data.voxels[clashIndices[k]];
        _dummy.position.set(v.x, v.y, v.z);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.setScalar(1.04);
        _dummy.updateMatrix();
        clashMesh.setMatrixAt(k, _dummy.matrix);
      }
      clashMesh.count = clashIndices.length;
      clashMesh.instanceMatrix.needsUpdate = true;
    }
  }, [data, voxelSplit, show3D]);

  const boxSegments = useMemo(() => {
    if (!data) return null;
    const { minX, maxX, minY, maxY, minZ, maxZ } = data.bounds;
    const y0 = Math.max(0.8, minY);
    const groundLoop: [number, number, number][] = [
      [minX, 0.8, minZ],
      [maxX, 0.8, minZ],
      [maxX, 0.8, maxZ],
      [minX, 0.8, maxZ],
      [minX, 0.8, minZ],
    ];
    const topLoop: [number, number, number][] = [
      [minX, maxY, minZ],
      [maxX, maxY, minZ],
      [maxX, maxY, maxZ],
      [minX, maxY, maxZ],
      [minX, maxY, minZ],
    ];
    const pillars: [number, number, number][][] = [
      [[minX, y0, minZ], [minX, maxY, minZ]],
      [[maxX, y0, minZ], [maxX, maxY, minZ]],
      [[maxX, y0, maxZ], [maxX, maxY, maxZ]],
      [[minX, y0, maxZ], [minX, maxY, maxZ]],
    ];
    return { groundLoop, topLoop, pillars };
  }, [data]);

  if (!data) return null;

  const hasClash = Boolean(collisions && (collisions.collidingVoxelIndices.size > 0 || collisions.collidingCellIndices.size > 0));
  const outlineColor = hasClash ? '#ff1744' : '#00e5ff';

  return (
    <group position={anchorPos} rotation={[0, anchorRotY, 0]} name="animation-space-heatmap">
      {showGround && data.groundCells.length > 0 && (
        <instancedMesh
          key={`ground-${data.groundCells.length}`}
          ref={groundMeshRef}
          args={[groundGeom, groundMat, data.groundCells.length]}
          renderOrder={99980}
          frustumCulled={false}
        />
      )}

      {show3D && voxelSplit.freeIndices.length > 0 && (
        <instancedMesh
          key={`free-${voxelSplit.freeIndices.length}`}
          ref={freeVoxelMeshRef}
          args={[voxelGeom, freeVoxelMat, voxelSplit.freeIndices.length]}
          renderOrder={99981}
          frustumCulled={false}
        />
      )}

      {show3D && voxelSplit.clashIndices.length > 0 && (
        <instancedMesh
          key={`clash-${voxelSplit.clashIndices.length}`}
          ref={clashVoxelMeshRef}
          args={[voxelGeom, clashVoxelMat, voxelSplit.clashIndices.length]}
          renderOrder={99985}
          frustumCulled={false}
        />
      )}

      {boxSegments && (
        <>
          <Line points={boxSegments.groundLoop} color={outlineColor} lineWidth={2} depthTest={false} renderOrder={99986} />
          {show3D && (
            <>
              <Line points={boxSegments.topLoop} color={outlineColor} lineWidth={1.2} transparent opacity={0.45} depthTest={false} renderOrder={99986} />
              {boxSegments.pillars.map((pts, idx) => (
                <Line key={idx} points={pts} color={outlineColor} lineWidth={1.2} transparent opacity={0.45} depthTest={false} renderOrder={99986} />
              ))}
            </>
          )}
        </>
      )}

      {data.trails.map((trail, idx) =>
        trail.points.length >= 2 ? (
          <Line
            key={idx}
            points={trail.points}
            color={trail.roleMask === 2 ? '#ffab00' : '#ffffff'}
            lineWidth={1.8}
            transparent
            opacity={0.75}
            depthTest={false}
            renderOrder={99987}
          />
        ) : null,
      )}
    </group>
  );
}
