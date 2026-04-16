/**
 * GlbItems.tsx — objets GLB chargés via useGLTF.
 * Port de :
 *   js/decor/scooter.js
 *   js/furniture/chair.js (Smörkull)
 *   js/furniture/lamp.js  (OLA)
 *   js/furniture/sunnersta.js
 *   js/furniture/mackapar.js (+ mechanic_jumpsuit + salopette)
 *   js/decor/casquettes.js
 *   js/decor/sneakers.js
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines } from '../../utils/glbUtils';

// @ts-ignore
import { ROOM_W, ROOM_D, NICHE_DEPTH, KALLAX_DEPTH } from '@config';

const kallaxW2      = 75.5;
const KALLAX_SE_Z   = ROOM_D - 60 - 40.5 / 2;  // 319.75
const KALLAX_SE_TOP = 2 * kallaxW2;             // 151
// Position monde du meuble en T (Decor.tsx MeubleTV) — même formule que wx/wz dans Decor.tsx
const MEUBLE_T_D   = 27.5;
const MEUBLE_T_H   = 55;
const MEUBLE_T_X   = ROOM_W - MEUBLE_T_D / 2;  // 286.25 — centre monde X du meuble
const MEUBLE_T_Z   = KALLAX_SE_Z;              // 319.75 — centre monde Z du meuble
const MEUBLE_T_Y   = KALLAX_SE_TOP;            // 151    — base monde Y du meuble

// ── Trottinette Xiaomi ────────────────────────────────────────────────────────

function Scooter() {
  const { scene } = useGLTF('media/xiaomi_electric_scooter_4.glb');
  useLayoutEffect(() => {
    const raw = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const s = 113 / raw.y;
    scene.scale.setScalar(s);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      282 - (box.min.x + box.max.x) / 2,
      -box.min.y,
      460 - (box.min.z + box.max.z) / 2,
    );
    scene.rotation.y = Math.PI;
    removeGlbLines(scene);
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

// ── Chaise SMÖRKULL ───────────────────────────────────────────────────────────

function Chair() {
  const { scene } = useGLTF('media/smorkull.glb');
  // Default pos 1 : devant bureau 2, face mur B (world X≈-box.min.x, Z=151)
  useLayoutEffect(() => {
    const rawSize = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(128 / rawSize.y);
    scene.rotation.set(0, Math.PI / 2, 0);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const cz = (box.min.z + box.max.z) / 2;
    // smorkullGroup at (chairCX,0,151) + chair offset = net world (-box.min.x, 0, 151-cz)
    scene.position.set(-box.min.x, 0, 151 - cz);
    removeGlbLines(scene);
    scene.castShadow = true;
    scene.receiveShadow = true;
  }, [scene]);
  return <primitive object={scene} />;
}

// ── Lampe OLA ─────────────────────────────────────────────────────────────────

function Lamp() {
  const { scene } = useGLTF('media/ikea_lamp_ola.glb');
  useLayoutEffect(() => {
    scene.scale.setScalar(100);
    scene.position.set(0, 0, 0);  // reset pour bbox propre (sans offset baked du GLB)
    scene.rotation.set(0, 0, 0);
    // Remplacer les teintes jaunes par blanc
    scene.traverse(c => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.color) return;
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      if (hsl.h > 0.08 && hsl.h < 0.20 && hsl.s > 0.2) {
        mesh.material = mat.clone();
        (mesh.material as THREE.MeshStandardMaterial).color.set(0xffffff);
      }
    });
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    // Position relative au groupe ancré sur le dessus du meuble en T :
    // groupe à (MEUBLE_T_X, MEUBLE_T_Y + MEUBLE_T_H, MEUBLE_T_Z)
    // → scène centrée en XZ, posée sur le dessus (baseY = -box.min.y)
    scene.position.set(-cx, -box.min.y, -cz);
    // Orienter vers le centre du salon
    const dx = ROOM_W / 2 - MEUBLE_T_X;
    const dz = ROOM_D / 2 - MEUBLE_T_Z;
    scene.rotation.y = Math.atan2(dx, dz);
    removeGlbLines(scene);
  }, [scene]);
  // Groupe ancré sur le dessus du meuble en T
  return (
    <group position={[MEUBLE_T_X, MEUBLE_T_Y + MEUBLE_T_H, MEUBLE_T_Z]}>
      <primitive object={scene} />
    </group>
  );
}

// ── Desserte SUNNERSTA ────────────────────────────────────────────────────────

function Sunnersta() {
  const { scene } = useGLTF('media/sunnersta_trolley_ikea.glb');
  useLayoutEffect(() => {
    const rawSize = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const scaleF = 90 / Math.max(rawSize.x, rawSize.y, rawSize.z);
    scene.scale.setScalar(scaleF);
    scene.rotation.y = Math.PI / 2;
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const cz = (box.min.z + box.max.z) / 2;
    // Position 1 : face est contre mur B, centre Z=271.5
    scene.position.set(ROOM_W - box.max.x, -box.min.y, 271.5 - cz);
    removeGlbLines(scene);
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

// ── Portant MACKAPÄR ──────────────────────────────────────────────────────────

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6, side: THREE.DoubleSide });

function Mackapar() {
  const mackapar = useGLTF('media/mackapar_ikea.glb');
  const jumpsuit = useGLTF('media/mechanic_jumpsuit.glb');
  const salopette = useGLTF('media/salopette-noir.glb');

  useLayoutEffect(() => {
    const mack = mackapar.scene;
    // Scale : GLB en mètres, 193cm → 200cm en Y seulement
    const rawBox = new THREE.Box3().setFromObject(mack);
    const scaleY = 200 / (rawBox.max.y - rawBox.min.y);
    mack.scale.set(100, scaleY, 100);
    mack.rotation.y = Math.PI / 2;
    mack.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mack);
    const PLINTHE = 3.5;
    const kallaxEdgeZ = ROOM_D - kallaxW2;
    const mpZ = kallaxEdgeZ - 32 / 2;
    const posX = -NICHE_DEPTH + PLINTHE - box.min.x;
    const cz = (box.min.z + box.max.z) / 2;
    mack.position.set(posX, -box.min.y, mpZ - cz);
    mack.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    // Centre du mackapar pour positionner les habits
    const mackCX = posX + (box.max.x - box.min.x) / 2;
    const mackCZ = mpZ;
    const RAIL_Y = 165;

    // Combinaison mécanicien
    const suit = jumpsuit.scene;
    const suitRaw = new THREE.Box3().setFromObject(suit).getSize(new THREE.Vector3());
    suit.scale.setScalar(150 / suitRaw.y);
    suit.updateMatrixWorld(true);
    const suitBox = new THREE.Box3().setFromObject(suit);
    suit.rotation.y = Math.PI / 2;
    const suitPosX = mackCX - (suitBox.min.x + suitBox.max.x) / 2 - 100 + 20;
    suit.position.set(
      suitPosX,
      RAIL_Y - suitBox.max.y + 30 - 15,
      mackCZ - (suitBox.min.z + suitBox.max.z) / 2,
    );
    removeGlbLines(suit);
    suit.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh) { m.material = redMat; m.castShadow = true; m.receiveShadow = true; }
    });

    // Salopette
    const sal = salopette.scene;
    const salRaw = new THREE.Box3().setFromObject(sal).getSize(new THREE.Vector3());
    sal.scale.setScalar(150 / salRaw.y);
    sal.scale.z = 6 / salRaw.z;
    sal.updateMatrixWorld(true);
    const salBox = new THREE.Box3().setFromObject(sal);
    sal.rotation.y = Math.PI / 2;
    sal.position.set(
      suitPosX + 40 - 10,
      RAIL_Y - salBox.max.y + 30 - 15,
      mackCZ - (salBox.min.z + salBox.max.z) / 2,
    );
    removeGlbLines(sal);
    sal.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh) { m.material = redMat; m.castShadow = true; m.receiveShadow = true; }
    });
  }, [mackapar.scene, jumpsuit.scene, salopette.scene]);

  return (
    <>
      <primitive object={mackapar.scene} />
      <primitive object={jumpsuit.scene} />
      <primitive object={salopette.scene} />
    </>
  );
}

// ── Casquettes baseball (mur B + mannequin Sunnersta) ────────────────────────

const SUNNERSTA_HEAD_TOP = 90 + 8 + 8 + 8.9 * 1.15; // ≈ 125.2 (world Y)

function Caps() {
  const { scene } = useGLTF('media/baseball_cap.glb');

  const { wall, mannequin } = useMemo(() => {
    removeGlbLines(scene);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.65 });
    const rawBox = new THREE.Box3().setFromObject(scene);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const s20 = 20 / rawSize.x;

    function makeCap(scale: number) {
      const c = scene.clone(true);
      c.scale.setScalar(scale);
      c.traverse(obj => { if ((obj as THREE.Mesh).isMesh) (obj as THREE.Mesh).material = redMat; });
      c.castShadow = true;
      return c;
    }

    // Cap 1 — mur B au-dessus du lit (rx=π/2, rz=π/2)
    const wall = makeCap(s20);
    wall.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    wall.updateMatrixWorld(true);
    const wallBox = new THREE.Box3().setFromObject(wall);
    wall.position.set(
      297 - (wallBox.min.x + wallBox.max.x) / 2,
      144 - (wallBox.min.y + wallBox.max.y) / 2,
      173.5 - (wallBox.min.z + wallBox.max.z) / 2,
    );

    // Cap 2 — tête mannequin Sunnersta (ry=π, scale×0.9)
    const mannequin = makeCap(s20 * 0.9);
    mannequin.rotation.set(0, Math.PI, 0);
    mannequin.updateMatrixWorld(true);
    const mannBox = new THREE.Box3().setFromObject(mannequin);
    mannequin.position.set(
      282 - (mannBox.min.x + mannBox.max.x) / 2,
      SUNNERSTA_HEAD_TOP + 2 - (mannBox.min.y + mannBox.max.y) / 2,
      271.5 - (mannBox.min.z + mannBox.max.z) / 2,
    );

    return { wall, mannequin };
  }, [scene]);

  return (
    <>
      <primitive object={wall} />
      <primitive object={mannequin} />
    </>
  );
}

// ── Sneakers (2 paires devant mur D) ─────────────────────────────────────────

const MIRROR_CX = (130 + 190) / 2; // KITCHEN_X1=130, DOOR_START=190

function Sneakers() {
  const { scene } = useGLTF('media/sneaker.glb');

  // Build 4 clones (L+R for pair1, L+R for pair2) from the template
  const clones = useMemo(() => {
    removeGlbLines(scene);
    const rawBox = new THREE.Box3().setFromObject(scene);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const longestH = Math.max(rawSize.x, rawSize.z);
    const s = 28 / longestH;
    const redM = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });

    function makeShoe() {
      const c = scene.clone(true);
      c.scale.setScalar(s);
      c.rotation.y = Math.PI / 2;
      c.traverse(m => {
        if ((m as THREE.Mesh).isMesh) {
          (m as THREE.Mesh).material = redM;
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      return c;
    }

    // Compute shoe width in world space after rotation (local Z → world X)
    const shoeWid = rawSize.z * s;
    const GAP = 1;
    const localCX = (rawBox.min.x + rawBox.max.x) / 2 * s;
    const floorY = -rawBox.min.y * s;

    // pair1
    const l1 = makeShoe();
    l1.position.set(shoeWid / 2 + GAP / 2, floorY, localCX);
    const r1 = makeShoe();
    r1.scale.z *= -1;
    r1.position.set(-(shoeWid / 2 + GAP / 2), floorY, localCX);

    // pair2 — clone pair1 and offset by measured pair width + 3cm
    const l2 = makeShoe();
    l2.position.set(shoeWid / 2 + GAP / 2, floorY, localCX);
    const r2 = makeShoe();
    r2.scale.z *= -1;
    r2.position.set(-(shoeWid / 2 + GAP / 2), floorY, localCX);

    return { l1, r1, l2, r2, pairW: shoeWid * 2 + GAP };
  }, [scene]);

  const px = MIRROR_CX + 40 - 50;
  return (
    <>
      <group position={[px, 0, ROOM_D - 15]}>
        <primitive object={clones.l1} />
        <primitive object={clones.r1} />
      </group>
      <group position={[px + clones.pairW + 3, 0, ROOM_D - 15]}>
        <primitive object={clones.l2} />
        <primitive object={clones.r2} />
      </group>
    </>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function GlbItems() {
  return (
    <>
      <Scooter />
      <Chair />
      <Lamp />
      <Sunnersta />
      <Mackapar />
      <Caps />
      <Sneakers />
    </>
  );
}

useGLTF.preload('media/xiaomi_electric_scooter_4.glb');
useGLTF.preload('media/smorkull.glb');
useGLTF.preload('media/ikea_lamp_ola.glb');
useGLTF.preload('media/sunnersta_trolley_ikea.glb');
useGLTF.preload('media/mackapar_ikea.glb');
useGLTF.preload('media/mechanic_jumpsuit.glb');
useGLTF.preload('media/salopette-noir.glb');
useGLTF.preload('media/baseball_cap.glb');
useGLTF.preload('media/sneaker.glb');
