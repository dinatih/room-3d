/**
 * Bollsidan30574370.tsx — Bureau réglable IKEA BOLLSIDAN (procédural + GLB dynamique assis/debout).
 * Dimensions réelles : 68×36×70-105 cm.
 * Price: 39,99
 * URL: https://www.ikea.com/fr/fr/p/bollsidan-table-pour-ordinateur-portable-blanc-30574370/
 */
import { useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';

const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const DEFAULT_H = 70;
const GLB_PATH = 'items/bollsidan30574370/Bollsidan30574370.glb';

function DeskTop() {
  const geo = useMemo(() => {
    const w = 68, d = 36, r = 6;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -d / 2);
    shape.lineTo( w / 2 - r, -d / 2);
    shape.absarc( w / 2 - r, -d / 2 + r, r, -Math.PI / 2, 0, false);
    shape.lineTo( w / 2,      d / 2 - r);
    shape.absarc( w / 2 - r,  d / 2 - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-w / 2 + r,  d / 2);
    shape.absarc(-w / 2 + r,  d / 2 - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-w / 2,      -d / 2 + r);
    shape.absarc(-w / 2 + r,  -d / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return <mesh geometry={geo} material={whiteMat} castShadow receiveShadow />;
}

export function BollsidanProcedural({ onSize, height = DEFAULT_H }: SceneItemProps & { height?: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const footHgt = 2.5, colSize = 4.2, w = 68;
  const refEastX = w / 2 - 8;
  const colX = refEastX - colSize;

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, [height]);

  return (
    <group ref={groupRef}>
      <group position={[0, height, 0]}><DeskTop /></group>
      <mesh position={[refEastX,        footHgt / 2, 0]} castShadow material={whiteMat}><boxGeometry args={[5, footHgt, 32]} /></mesh>
      <mesh position={[refEastX - 55,   footHgt / 2, 0]} castShadow material={whiteMat}><boxGeometry args={[5, footHgt, 32]} /></mesh>
      <mesh position={[refEastX - 27.5, footHgt / 2, 0]} castShadow material={whiteMat}><boxGeometry args={[55, footHgt, 5]} /></mesh>
      <mesh position={[colX, footHgt + (height - footHgt) / 2, 0]} castShadow material={whiteMat}>
        <boxGeometry args={[colSize, height - footHgt, colSize]} />
      </mesh>
    </group>
  );
}

// Y zones (cm, post scale×100). Source: inspection of GLB vertex histogram.
// Two empty gaps (59→76 cm above lower tube; below table-top chamfer) make these limits non-destructive.
// Lower tube + base feet (with black screws): fixed.
// Upper post (attached to table-top): stretches.
// Table-top: rigid translate (preserves thickness).
const NATURAL_H = 84.77;
const LOWER_TOP = 59.4;   // top of lower telescoping tube cap (dense verts 57.2-59.3)
const TOP_BOT   = 76.0;   // table-top assembly starts (chamfer + slab)
const TOP_THICK = NATURAL_H - TOP_BOT;
const NATURAL_COL_H = TOP_BOT - LOWER_TOP;

function BollsidanGlb({ onSize, height = DEFAULT_H }: { onSize?: SceneItemProps['onSize'], height?: number }) {
  const { scene } = useGLTF(GLB_PATH);
  const { invalidate } = useThree();

  const targetHRef = useRef(height);
  const currHRef = useRef(height);
  const basePosRef = useRef<Float32Array | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    removeGlbLines(c);
    c.scale.set(1, 1, 1);
    c.scale.setScalar(100);
    mergeGlbByMaterial(c);

    let m: THREE.Mesh | null = null;
    c.traverse(node => {
      if ((node as THREE.Mesh).isMesh && !m) m = node as THREE.Mesh;
    });

    if (m) {
      meshRef.current = m;
      const pos = (m as THREE.Mesh).geometry.attributes.position as THREE.BufferAttribute;
      basePosRef.current = new Float32Array(pos.array);
    }

    return c;
  }, [scene]);

  const applyHeight = useCallback((h: number) => {
    const mesh = meshRef.current;
    const base = basePosRef.current;
    if (!mesh || !base) return;

    const newColH = Math.max(0.1, h - LOWER_TOP - TOP_THICK);
    const stretch = newColH / NATURAL_COL_H;
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 1; i < arr.length; i += 3) {
      const y = base[i];
      if (y <= LOWER_TOP)     arr[i] = y;
      else if (y >= TOP_BOT)  arr[i] = LOWER_TOP + newColH + (y - TOP_BOT);
      else                    arr[i] = LOWER_TOP + (y - LOWER_TOP) * stretch;
    }
    pos.needsUpdate = true;
    mesh.geometry.computeBoundingBox();

    const box = glbLocalBBox(clone);
    clone.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
  }, [clone]);

  useLayoutEffect(() => {
    targetHRef.current = height;
    applyHeight(currHRef.current);
    const box = glbLocalBBox(clone);
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [height, applyHeight, clone, onSize]);

  useFrame(() => {
    if (currHRef.current === targetHRef.current) return;
    const diff = targetHRef.current - currHRef.current;
    if (Math.abs(diff) > 0.05) {
      currHRef.current += diff * 0.15;
      applyHeight(currHRef.current);
      invalidate();
    } else if (currHRef.current !== targetHRef.current) {
      currHRef.current = targetHRef.current;
      applyHeight(currHRef.current);
      const box = glbLocalBBox(clone);
      onSize?.(box.getSize(new THREE.Vector3()));
      invalidate();
    }
  });

  return <primitive object={clone} />;
}

export function Bollsidan30574370({ onSize, height, actionState, ...props }: SceneItemProps & { height?: number }) {
  const isStanding = Boolean(
    actionState?.['desk-toggle'] ??
    actionState?.['desk1-toggle'] ??
    actionState?.['desk2-toggle'] ??
    actionState?.['standing'] ??
    false
  );
  const effectiveHeight = height ?? (isStanding ? 105 : 70);

  return (
    <group {...props}>
      <BollsidanGlb onSize={onSize} height={effectiveHeight} />
    </group>
  );
}

useGLTF.preload(GLB_PATH);
