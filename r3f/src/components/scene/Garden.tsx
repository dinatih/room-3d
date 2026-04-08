/**
 * Garden.tsx — mobilier de jardin / terrasse.
 * Port de js/furniture/garden.js (sans galerie GLB animée ni Lara — HIDE_LARA=true).
 */
import { useMemo, useLayoutEffect } from 'react';
import { RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines } from '../../utils/glbUtils';

// ── Matériaux ─────────────────────────────────────────────────────────────────

const redMat  = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });
const cbMat   = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6 });
const cbLidMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4 });
const tubMat  = new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: 0.4 });
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x1a6fa8, transparent: true, opacity: 0.80, depthWrite: false,
  roughness: 0.05, metalness: 0.15,
});

// ── Canapé de jardin 1 (160×60×90cm, avec accoudoirs) ────────────────────────

function Sofa1() {
  const W = 160, D = 60, H = 90, SEAT_H = 40, BACK_T = 10, ARM_W = 10, ARM_H = 60;
  const R = 6;
  return (
    <group position={[300 - D / 2, 0, -110]}>
      <RoundedBox args={[D, SEAT_H, W]} radius={R} smoothness={3}
        position={[0, SEAT_H / 2, 0]} castShadow receiveShadow material={redMat} />
      <RoundedBox args={[BACK_T, H, W]} radius={R} smoothness={3}
        position={[D / 2 - BACK_T / 2, H / 2, 0]} castShadow material={redMat} />
      {([-1, 1] as const).map(s => (
        <RoundedBox key={s} args={[D, ARM_H, ARM_W]} radius={R} smoothness={3}
          position={[0, ARM_H / 2, s * (W / 2 - ARM_W / 2)]} castShadow material={redMat} />
      ))}
    </group>
  );
}

// ── Canapé de jardin 2 (100×60×100cm, sans accoudoirs) ───────────────────────

function Sofa2() {
  const W = 100, D = 60, H = 100, SEAT_H = 40, BACK_T = 10;
  const R = 6;
  return (
    <group position={[100, 0, -90]} rotation={[0, Math.PI, 0]}>
      <RoundedBox args={[D, SEAT_H, W]} radius={R} smoothness={3}
        position={[0, SEAT_H / 2, 0]} castShadow receiveShadow material={redMat} />
      <RoundedBox args={[BACK_T, H, W]} radius={R} smoothness={3}
        position={[D / 2 - BACK_T / 2, H / 2, 0]} castShadow material={redMat} />
    </group>
  );
}

// ── Coffre banc YITAHOME (122×55×62cm) ───────────────────────────────────────

function ChestBench() {
  const L = 122, W = 55, H = 62, LID_H = 3;
  const cbX = 70 - W / 2;
  return (
    <group position={[cbX, 0, -90]}>
      <mesh position={[0, (H - LID_H) / 2, 0]} castShadow receiveShadow material={cbMat}>
        <boxGeometry args={[W, H - LID_H, L]} />
      </mesh>
      <mesh position={[0, H - LID_H / 2, 0]} castShadow material={cbLidMat}>
        <boxGeometry args={[W + 1.5, LID_H, L + 1.5]} />
      </mesh>
      {([-1, 1] as const).map(dz => (
        <mesh key={dz} position={[0, H * 0.55, dz * (L / 2 + 0.8)]} material={handleMat}>
          <boxGeometry args={[15, 3, 1.5]} />
        </mesh>
      ))}
    </group>
  );
}

// ── Desserte VIGGJA (GLB, déjà en cm) ────────────────────────────────────────

function Viggja() {
  const { scene } = useGLTF('media/viggja.glb');
  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.position.set(100, 0, -178);
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

// ── Palmier en pot ────────────────────────────────────────────────────────────

function PottedPalm() {
  const { scene } = useGLTF('media/potted_palm.glb');
  useLayoutEffect(() => {
    const raw = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(150 / Math.max(raw.x, raw.y, raw.z));
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      100 - (box.min.x + box.max.x) / 2,
      -box.min.y,
      -150 - (box.min.z + box.max.z) / 2,
    );
    removeGlbLines(scene);
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

// ── Baignoire extérieure ──────────────────────────────────────────────────────

function Bathtub() {
  const { wallGeo, botGeo, waterGeo } = useMemo(() => {
    const TUB_L = 150, TUB_W = 70, TUB_H = 50, T = 4, RC = 35;
    const RC_IN = Math.max(RC - T, 2);

    function rrTrace(p: THREE.Shape | THREE.Path, w: number, h: number, r: number) {
      p.moveTo(-w / 2 + r, -h / 2);
      p.lineTo( w / 2 - r, -h / 2);
      p.absarc( w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
      p.lineTo( w / 2,  h / 2 - r);
      p.absarc( w / 2 - r,  h / 2 - r, r, 0, Math.PI / 2, false);
      p.lineTo(-w / 2 + r,  h / 2);
      p.absarc(-w / 2 + r,  h / 2 - r, r, Math.PI / 2, Math.PI, false);
      p.lineTo(-w / 2, -h / 2 + r);
      p.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, -Math.PI / 2, false);
    }

    // Parois
    const outer = new THREE.Shape();
    rrTrace(outer, TUB_W, TUB_L, RC);
    const hole = new THREE.Path();
    rrTrace(hole, TUB_W - 2 * T, TUB_L - 2 * T, RC_IN);
    outer.holes.push(hole);
    const wg = new THREE.ExtrudeGeometry(outer, { depth: TUB_H, bevelEnabled: false });
    wg.rotateX(-Math.PI / 2);

    // Fond
    const botShape = new THREE.Shape();
    rrTrace(botShape, TUB_W - 2 * T, TUB_L - 2 * T, RC_IN);
    const bg = new THREE.ExtrudeGeometry(botShape, { depth: T, bevelEnabled: false });
    bg.rotateX(-Math.PI / 2);

    // Eau
    const waterShape = new THREE.Shape();
    rrTrace(waterShape, TUB_W - 2 * T - 1, TUB_L - 2 * T - 1, RC_IN);
    const wgeo = new THREE.ShapeGeometry(waterShape, 32);
    wgeo.rotateX(-Math.PI / 2);
    wgeo.translate(0, TUB_H - 12, 0);

    return { wallGeo: wg, botGeo: bg, waterGeo: wgeo };
  }, []);

  return (
    <group position={[120, 0, -250]} rotation={[0, -1, 0]}>
      <mesh geometry={wallGeo} material={tubMat} castShadow receiveShadow />
      <mesh geometry={botGeo} material={tubMat} castShadow receiveShadow />
      <mesh geometry={waterGeo} material={waterMat} />
    </group>
  );
}

// ── Tenue réaliste (rouge, près de la baignoire) ──────────────────────────────

function RealisticCloths() {
  const { scene } = useGLTF('media/realistic_human_cloths.glb');
  useLayoutEffect(() => {
    const raw = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(170 / Math.max(raw.x, raw.y, raw.z));
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      260 - (box.min.x + box.max.x) / 2,
      -box.min.y,
      -250 - (box.min.z + box.max.z) / 2,
    );
    removeGlbLines(scene);
    const red = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh) { m.material = red; m.castShadow = true; m.receiveShadow = true; }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Garden() {
  return (
    <>
      <Sofa1 />
      <Sofa2 />
      <ChestBench />
      <Viggja />
      <PottedPalm />
      <Bathtub />
      <RealisticCloths />
    </>
  );
}

useGLTF.preload('media/viggja.glb');
useGLTF.preload('media/potted_palm.glb');
useGLTF.preload('media/realistic_human_cloths.glb');
