/**
 * Laptop.tsx — Framework Laptop 13".
 * Coordonnées locales : X/Z centrés, Y=0 = surface du bureau.
 *
 * LaptopGlb : charge le GLB Draco (4.3 MB, ~3107 draw calls).
 * Overrides : bezel + cartes d'extension rouges, positions des slots.
 * DRACOLoader configuré en amont dans main.tsx (useGLTF.setDecoderPath).
 */
import { useLayoutEffect, useMemo } from 'react';
import { useTexture, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { removeGlbLines, mergeGlbByMaterial } from '@features/scene/glbUtils';

const BASE_W = 29.7, BASE_D = 22.8, BASE_H = 1.6;
const SCREEN_W = 29, SCREEN_D = 19.5, SCREEN_H = 0.8;
const BEZEL = 0.6;
const PORT_W = 1.2, PORT_H = 0.6, PORT_D = 3;

// source CAD : https://cad.onshape.com/documents/b17a72e361e72e3c5b6e7bb7/w/95ca42a57c78f484e8786505/e/db39482865fc64b9783df21f
const GLB_PATH = 'items/framework-laptop13/framework-laptop13.glb';

// GLB exporté Y-up. Z centré sur 0.41 cm → offset -0.41
const GLB_POS: [number, number, number] = [0, 0, -0.41];

const aluMat   = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6, roughness: 0.35 });
const bezelMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
const kbMat    = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const portMat  = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3, metalness: 0.5 });
const red      = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });

function moveOcc(root: THREE.Object3D, name: string, tx: number, ty: number, tz: number) {
  const occ = root.getObjectByName('occurrence of ' + name);
  if (!occ) return;
  occ.matrix.decompose(occ.position, occ.quaternion, occ.scale);
  occ.position.set(tx, ty, tz);
  occ.matrixAutoUpdate = true;
}

// ── Modèle procédural ─────────────────────────────────────────────────────────

export function LaptopProcedural({ onSize }: { onSize: SceneItemProps['onSize'] }) {
  const screenTex = useTexture('items/omarchy-screen/omarchy-screen.png');
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: screenTex, roughness: 0.1, metalness: 0.2,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }), [screenTex]);

  const { keyInst } = useMemo(() => {
    const KW = 1.28, KD = 1.22, KH = 0.18;
    const KPX = 1.64, KPZ = 1.56;
    const NCOLS = 14, NROWS = 5;
    const KB_CZ = -2.8;
    const KB_Z0 = KB_CZ - (NROWS - 1) * KPZ / 2;
    const geo = new THREE.BoxGeometry(KW, KH, KD);
    const inst = new THREE.InstancedMesh(geo, kbMat, NCOLS * NROWS);
    const dummy = new THREE.Object3D();
    let ki = 0;
    for (let r = 0; r < NROWS; r++) {
      for (let c = 0; c < NCOLS; c++) {
        dummy.position.set((-NCOLS / 2 + 0.5 + c) * KPX, BASE_H + KH / 2, KB_Z0 + r * KPZ);
        dummy.updateMatrix();
        inst.setMatrixAt(ki++, dummy.matrix);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    return { keyInst: inst };
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(BASE_W, BASE_H + SCREEN_D, BASE_D));
  }, []);

  return (
    <group>
      <mesh position={[0, BASE_H / 2, 0]} castShadow receiveShadow material={aluMat}>
        <boxGeometry args={[BASE_W, BASE_H, BASE_D]} />
      </mesh>
      <primitive object={keyInst} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_H + 0.01, 5.5]} material={kbMat}>
        <planeGeometry args={[10, 6]} />
      </mesh>
      <group position={[0, BASE_H, -BASE_D / 2]} rotation={[-1.92, 0, 0]}>
        <mesh position={[0, 0, SCREEN_D / 2]} castShadow material={aluMat}>
          <boxGeometry args={[SCREEN_W, SCREEN_H, SCREEN_D]} />
        </mesh>
        <mesh position={[0, -SCREEN_H / 2, BEZEL / 2]} material={bezelMat}>
          <boxGeometry args={[SCREEN_W, BEZEL, BEZEL]} />
        </mesh>
        <mesh position={[0, -SCREEN_H / 2, SCREEN_D - BEZEL / 2]} material={bezelMat}>
          <boxGeometry args={[SCREEN_W, BEZEL, BEZEL]} />
        </mesh>
        <mesh position={[-SCREEN_W / 2 + BEZEL / 2, -SCREEN_H / 2, SCREEN_D / 2]} material={bezelMat}>
          <boxGeometry args={[BEZEL, BEZEL, SCREEN_D]} />
        </mesh>
        <mesh position={[SCREEN_W / 2 - BEZEL / 2, -SCREEN_H / 2, SCREEN_D / 2]} material={bezelMat}>
          <boxGeometry args={[BEZEL, BEZEL, SCREEN_D]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -SCREEN_H / 2 - 0.01, SCREEN_D / 2]} material={screenMat}>
          <planeGeometry args={[SCREEN_W - BEZEL * 2, SCREEN_D - BEZEL * 2]} />
        </mesh>
      </group>
      <mesh position={[-BASE_W / 2 - PORT_W / 2 + 0.1, BASE_H * 0.6, -BASE_D / 2 + 5]} material={portMat}>
        <boxGeometry args={[PORT_W, PORT_H, PORT_D]} />
      </mesh>
      <mesh position={[BASE_W / 2 + PORT_W / 2 - 0.1, BASE_H * 0.6, -BASE_D / 2 + 5]} material={portMat}>
        <boxGeometry args={[PORT_W, PORT_H, PORT_D]} />
      </mesh>
    </group>
  );
}

// ── Modèle GLB ────────────────────────────────────────────────────────────────

function LaptopGlb({ onSize }: { onSize: SceneItemProps['onSize'] }) {
  const { scene } = useGLTF(GLB_PATH);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    removeGlbLines(c);

    // Bezel → rouge
    c.getObjectByName('GFW00_3H_NB_ID_BEZEL_1_3')?.traverse(child => {
      if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = red;
    });

    // SD_CARD (USB-C) → rouge
    const sdMesh = c.getObjectByName('GFW00_3H_NB_ID_SD_CARD_1') as THREE.Mesh | undefined;
    if (sdMesh) sdMesh.material = red;

    // Placement cartes d'extension
    moveOcc(c, 'GFW00_3H_NB_ID_SD_CARD_1',   -0.2522,  0.01055, -0.18198);
    moveOcc(c, 'GFW00_3H_NB_ID_HDMI_CARD_1',  0.014,   0.01055, -0.07238);
    moveOcc(c, 'GFW00_3H_NB_ID_USBA_CARD_1',  0.2382,  0.01055, -0.12718);

    // USB-C clone → slot supérieur droit
    const sdOcc = c.getObjectByName('occurrence of GFW00_3H_NB_ID_SD_CARD_1');
    if (sdOcc?.parent) {
      const sdClone = sdOcc.clone(true);
      sdClone.matrix.decompose(sdClone.position, sdClone.quaternion, sdClone.scale);
      sdClone.position.set(0.0288, 0.00765, -0.16778);
      sdClone.matrixAutoUpdate = true;
      sdOcc.parent.add(sdClone);
    }
    const usbcOcc = c.getObjectByName('occurrence of GFW00_3H_NB_ID_USBC_CARD_1');
    if (usbcOcc) usbcOcc.visible = false;

    // Filtrage des géométries opposées et gestion des priorités (renderOrder + polygonOffset) :
    // - L'écran (BEZEL_1_1) ne doit avoir AUCUNE face orientée vers l'arrière (-Z) pour ne pas percer le capot
    // - Le logo (COVER_LOGO_1) ne doit avoir AUCUNE face orientée vers l'avant (+Z) pour ne pas percer l'écran
    const filterMeshFaces = (mesh: THREE.Mesh | undefined, keepPredicate: (avgZ: number) => boolean) => {
      if (!mesh || !mesh.geometry) return;
      const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      const posAttr = geo.getAttribute('position');
      const normAttr = geo.getAttribute('normal');
      const uvAttr = geo.getAttribute('uv');
      if (!posAttr) return;

      const newPos: number[] = [];
      const newNorm: number[] = [];
      const newUv: number[] = [];

      for (let i = 0; i < posAttr.count; i += 3) {
        const avgZ = normAttr ? (normAttr.getZ(i) + normAttr.getZ(i + 1) + normAttr.getZ(i + 2)) / 3 : 0;
        if (!keepPredicate(avgZ)) continue;

        for (let k = 0; k < 3; k++) {
          newPos.push(posAttr.getX(i + k), posAttr.getY(i + k), posAttr.getZ(i + k));
          if (normAttr) newNorm.push(normAttr.getX(i + k), normAttr.getY(i + k), normAttr.getZ(i + k));
          if (uvAttr) newUv.push(uvAttr.getX(i + k), uvAttr.getY(i + k));
        }
      }

      const filteredGeo = new THREE.BufferGeometry();
      filteredGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3));
      if (newNorm.length) filteredGeo.setAttribute('normal', new THREE.Float32BufferAttribute(newNorm, 3));
      if (newUv.length) filteredGeo.setAttribute('uv', new THREE.Float32BufferAttribute(newUv, 2));
      mesh.geometry = filteredGeo;
    };

    // 1. Écran : ne garder que les faces avant (normal.z > -0.5), priorité sur le fond du bezel
    const screenMesh = c.getObjectByName('GFW00_3H_NB_ID_BEZEL_1_1') as THREE.Mesh | undefined;
    if (screenMesh && screenMesh.material) {
      filterMeshFaces(screenMesh, avgZ => avgZ > -0.5);
      const origMat = Array.isArray(screenMesh.material) ? screenMesh.material[0] : screenMesh.material;
      const screenMat = (origMat as THREE.MeshStandardMaterial).clone();
      screenMat.side = THREE.FrontSide;
      screenMat.polygonOffset = true;
      screenMat.polygonOffsetFactor = -1;
      screenMat.polygonOffsetUnits = -1;
      screenMesh.material = screenMat;
      screenMesh.renderOrder = 1;
    }

    // 2. Logo au dos : ne garder que les faces arrière (normal.z < 0.5), priorité sur le capot
    const logoMesh = c.getObjectByName('GFW00_3H_NB_ID_COVER_LOGO_1') as THREE.Mesh | undefined;
    if (logoMesh && logoMesh.material) {
      filterMeshFaces(logoMesh, avgZ => avgZ < 0.5);
      const origMat = Array.isArray(logoMesh.material) ? logoMesh.material[0] : logoMesh.material;
      const logoMat = (origMat as THREE.MeshStandardMaterial).clone();
      logoMat.side = THREE.FrontSide;
      logoMat.polygonOffset = true;
      logoMat.polygonOffsetFactor = -1;
      logoMat.polygonOffsetUnits = -1;
      logoMesh.material = logoMat;
      logoMesh.renderOrder = 1;
    }

    mergeGlbByMaterial(c);
    return c;
  }, [scene]);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(BASE_W, BASE_H + SCREEN_D, BASE_D));
  }, []);

  return <primitive object={clone} scale={100} position={GLB_POS} />;
}

// ── Export ────────────────────────────────────────────────────────────────────

export function Laptop({ onSize }: SceneItemProps) {
  return <LaptopGlb onSize={onSize} />;
}
