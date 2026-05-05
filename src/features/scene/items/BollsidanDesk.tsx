/**
 * BollsidanDesk.tsx — Bureau réglable IKEA BOLLSIDAN (procédural + GLB).
 * Coordonnées locales : centré XZ, Y=0 = sol, hauteur assis 70cm.
 *
 * Action 'deskGlb' : bascule entre modèle procédural et GLB IKEA officiel.
 */
import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { removeGlbLines, glbLocalBBox } from '@shared/utils/glbUtils';

const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const DEFAULT_H = 70;
const GLB_PATH = 'media/BOLLSIDAN Table pour ordinateur portable blanc 68x36 cm.glb';

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

function BollsidanProcedural({ onSize, height = DEFAULT_H }: SceneItemProps & { height?: number }) {
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

function BollsidanGlb({ onSize, height = DEFAULT_H }: { onSize: SceneItemProps['onSize'], height?: number }) {
  const { scene } = useGLTF(GLB_PATH);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    removeGlbLines(c);
    c.traverse(child => {
      if ((child as THREE.Mesh).isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    return c;
  }, [scene]);

  useLayoutEffect(() => {
    clone.scale.set(1, 1, 1);
    clone.scale.setScalar(100);
    const boxBase = glbLocalBBox(clone);
    const naturalH = boxBase.max.y - boxBase.min.y;
    clone.scale.y = (height / naturalH) * 100;
    const box = glbLocalBBox(clone);
    clone.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [clone, height]);

  return <primitive object={clone} />;
}

export function BollsidanDesk({ onSize, height = DEFAULT_H }: SceneItemProps & { height?: number }) {
  const [useGlb, setUseGlb] = useState(true);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.key !== 'deskGlb') return;
      setUseGlb(v => !v);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  return useGlb
    ? <BollsidanGlb onSize={onSize} height={height} />
    : <BollsidanProcedural item={{} as any} actionState={{}} onSize={onSize} height={height} />;
}

useGLTF.preload(GLB_PATH);
