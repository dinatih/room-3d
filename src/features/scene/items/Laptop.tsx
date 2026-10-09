/**
 * Laptop.tsx — Framework Laptop 13".
 * Coordonnées locales : X/Z centrés, Y=0 = surface du bureau.
 *
 * Charge le GLB Draco (4.3 MB, ~3107 draw calls).
 * Overrides : bezel + cartes d'extension rouges, positions des slots.
 * DRACOLoader configuré en amont dans main.tsx (useGLTF.setDecoderPath).
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { removeGlbLines, mergeGlbByMaterial } from '@features/scene/glbUtils';
import { useDeskScreenVideo } from '@features/scene/utils/deskScreenVideo';

const BASE_W = 29.7, BASE_D = 22.8, BASE_H = 1.6;
const SCREEN_D = 19.5;

// source CAD : https://cad.onshape.com/documents/b17a72e361e72e3c5b6e7bb7/w/95ca42a57c78f484e8786505/e/db39482865fc64b9783df21f
const GLB_PATH = 'items/framework-laptop13/framework-laptop13.glb';

// GLB exporté Y-up. Z centré sur 0.41 cm → offset -0.41
const GLB_POS: [number, number, number] = [0, 0, -0.41];

const red = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });

function moveOcc(root: THREE.Object3D, name: string, tx: number, ty: number, tz: number) {
  const occ = root.getObjectByName('occurrence of ' + name);
  if (!occ) return;
  occ.matrix.decompose(occ.position, occ.quaternion, occ.scale);
  occ.position.set(tx, ty, tz);
  occ.matrixAutoUpdate = true;
}

// ── Export ────────────────────────────────────────────────────────────────────

export function Laptop({ onSize }: SceneItemProps) {
  const { scene } = useGLTF(GLB_PATH);
  const { isVideoActive, texture: videoTex } = useDeskScreenVideo();

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

  return (
    <group>
      <primitive object={clone} scale={100} position={GLB_POS} />
      {/* Écran d'ordinateur portable (dalle 13.5" ratio 3:2 avec overlay vidéo) */}
      <mesh
        position={[0, 10.24, -19.59]}
        rotation={[-0.5866, 0, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[28.5, 19.0]} />
        <meshStandardMaterial
          side={THREE.DoubleSide}
          map={isVideoActive ? videoTex : null}
          color={isVideoActive ? 0xffffff : 0x080808}
          emissive={isVideoActive ? new THREE.Color(0xffffff) : new THREE.Color(0x000000)}
          emissiveMap={isVideoActive ? videoTex : null}
          emissiveIntensity={isVideoActive ? 0.85 : 0}
          roughness={0.08}
          metalness={0.15}
        />
      </mesh>
    </group>
  );
}
