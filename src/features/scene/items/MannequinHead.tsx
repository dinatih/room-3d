/**
 * MannequinHead.tsx — Tête de mannequin (GLB characters/accessories/wig_mannequin.glb).
 * Coordonnées locales : centré XZ, Y=0 = base épaules. Scale par hauteur (45 cm).
 * Ajoute une perruque aléatoire depuis hair_pack_part_2.glb (même logique que Character.tsx).
 *
 * Architecture :
 *  <group ref={ref}>        ← espace cm (1 unit = 1 cm), pas de scale
 *    <scene>                ← mannequin scalé × scaleFactor pour atteindre 45 cm
 *    <clonedHair>           ← perruque ajoutée DIRECTEMENT ici, pas dans scene
 *  </group>
 *
 * La perruque est ajoutée dans l'espace cm du group wrapper et non dans l'espace
 * GLB scalé de scene — évite l'effet de multiplication de scale.
 */
import { useLayoutEffect, useRef, useEffect, useState, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { LAYER_DECOR } from '@config';
import { Wig, HAIR_COLORS, LARA_WIG_PREVIEW_SCALE, LARA_WIG_HEAD_OFFSET } from './Wig';
import { WIGS_ITEMS } from '@features/inventory/inventoryData';
import { applyLaraVariantStyles, disposeLaraVariantMaterials, type LaraVariant } from '@features/scene/LaraVariants';
import { extractCharacterParts, isHeadMesh } from '@features/scene/characterParts';
import { CharacterPendant, type CharacterPendantHandle } from '@features/scene/character/CharacterPendant';

interface MannequinHeadProps extends SceneItemProps {
  mannequinId?: string;
  wigId?: string;
  wigIndex?: number;
  hairColor?: string;
  windEnabled?: boolean;
}

const TARGET_H = 45; // cm

// Keep track of used initial wigs to avoid duplicates on startup
let usedInitialWigs: number[] = [];
function getUniqueRandomWig(): number {
  if (usedInitialWigs.length >= WIGS_ITEMS.length) usedInitialWigs = [];
  let index;
  do {
    index = Math.floor(Math.random() * WIGS_ITEMS.length);
  } while (usedInitialWigs.includes(index));
  usedInitialWigs.push(index);
  return index;
}

let usedInitialColors: string[] = [];
function getUniqueRandomColor(): string {
  const colorKeys = [...Object.keys(HAIR_COLORS), 'arc-en-ciel'];
  if (usedInitialColors.length >= colorKeys.length) usedInitialColors = [];
  let color;
  do {
    color = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  } while (usedInitialColors.includes(color));
  usedInitialColors.push(color);
  return color;
}


export function MannequinHead({
  onSize,
  mannequinId = 'default',
  wigId,
  wigIndex: initialWigIndex,
  hairColor: initialHairColor,
  windEnabled: initialWindEnabled
}: MannequinHeadProps) {
  const ref = useRef<THREE.Group>(null!);
  const { scene } = useGLTFClone('characters/accessories/wig_mannequin.glb');

  const resolvedInitialIndex = wigId
    ? WIGS_ITEMS.findIndex(w => w.id === wigId || w.id.replace('hair_', '') === wigId.replace('hair_', ''))
    : initialWigIndex;

  const [wigIndex, setWigIndex] = useState<number>(resolvedInitialIndex !== undefined && resolvedInitialIndex >= 0 ? resolvedInitialIndex : getUniqueRandomWig());
  const [hairColor, setHairColor] = useState<string | undefined>(initialHairColor ?? (wigId ? undefined : getUniqueRandomColor()));
  const [windEnabled, setWindEnabled] = useState<boolean>(initialWindEnabled ?? false);

  useEffect(() => {
    if (wigId) {
      const idx = WIGS_ITEMS.findIndex(w => w.id === wigId || w.id.replace('hair_', '') === wigId.replace('hair_', ''));
      if (idx >= 0) setWigIndex(idx);
    } else if (initialWigIndex !== undefined) {
      setWigIndex(initialWigIndex);
    }
  }, [wigId, initialWigIndex]);

  useEffect(() => {
    if (initialHairColor !== undefined || wigId) {
      setHairColor(initialHairColor);
    }
  }, [initialHairColor, wigId]);

  useEffect(() => {
    if (initialWindEnabled !== undefined) {
      setWindEnabled(initialWindEnabled);
    }
  }, [initialWindEnabled]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key, value } = (e as CustomEvent).detail;
      if (key === `mannequin-${mannequinId}-random`) {
        const newWig = Math.floor(Math.random() * WIGS_ITEMS.length);
        setWigIndex(newWig);
        const colorKeys = Object.keys(HAIR_COLORS);
        colorKeys.push('arc-en-ciel');
        const newColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
        setHairColor(newColor);
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: `mannequin-${mannequinId}-wig`, value: newWig.toString() } }));
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: `mannequin-${mannequinId}-color`, value: newColor } }));
      }
      if (key === `mannequin-${mannequinId}-wig`) {
        setWigIndex(value === -1 || value === '-1' ? Math.floor(Math.random() * WIGS_ITEMS.length) : parseInt(value, 10));
      }
      if (key === `mannequin-${mannequinId}-color`) setHairColor(value);
      if (key === `mannequin-${mannequinId}-wind`) {
        if (value === undefined) setWindEnabled(v => !v);
        else setWindEnabled(value === true || value === 'true');
      }
    };
    document.addEventListener('furniture-toggle', handler);
    // Notify HoverMenu of the initial states so the selectboxes aren't empty
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: `mannequin-${mannequinId}-wig`, value: wigIndex.toString() } }));
    if (hairColor) document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: `mannequin-${mannequinId}-color`, value: hairColor } }));

    return () => document.removeEventListener('furniture-toggle', handler);
  }, [mannequinId, wigIndex, hairColor]);

  const activeWigId = WIGS_ITEMS[wigIndex]?.id || WIGS_ITEMS[0].id;

  useLayoutEffect(() => {
    // ── Tête de mannequin ─────────────────────────────────────────────────
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    const ownedMats: THREE.Material[] = [];
    scene.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.layers.set(LAYER_DECOR);
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(m => {
              const c = m.clone();
              if ('wireframe' in c) (c as THREE.MeshStandardMaterial).wireframe = false;
              ownedMats.push(c);
              return c;
            });
          } else {
            const c = mesh.material.clone();
            if ('wireframe' in c) (c as THREE.MeshStandardMaterial).wireframe = false;
            ownedMats.push(c);
            mesh.material = c;
          }
        }
      }
    });
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_H / raw.y);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
    return () => {
      ownedMats.forEach(m => m.dispose());
    };
  }, [scene, onSize]);

  // Offset d'alignement manuel pour la tête de Mannequin (45 cm).
  const cleanWigId = activeWigId.replace('hair_', '');
  const MANNEQUIN_WIG_OFFSET: [number, number, number] = [0, 31.0, 0];

  return (
    <group ref={ref} userData={{ sceneItemRoot: true, itemName: 'Tête de mannequin' }}>
      <primitive object={scene} />
      <Wig 
        id={cleanWigId}
        color={hairColor}
        windEnabled={windEnabled}
        offset={MANNEQUIN_WIG_OFFSET}
        scale={90}
      />
    </group>
  );
}

export function LaraWigBust({
  wigId,
  hairColor,
  laraVariant = 'native',
  windEnabled = false,
}: {
  wigId: string;
  hairColor?: string;
  laraVariant?: LaraVariant;
  windEnabled?: boolean;
}) {
  const { scene: laraScene } = useGLTFClone('characters/lara/lara_native.glb');
  const LARA_SCALE = LARA_WIG_PREVIEW_SCALE;
  const pendantRef = useRef<CharacterPendantHandle>(null);

  const parts = useMemo(() => {
    removeGlbLines(laraScene);
    laraScene.scale.set(1, 1, 1);
    laraScene.position.set(0, 0, 0);
    laraScene.rotation.set(0, 0, 0);
    laraScene.updateMatrixWorld(true);
    return extractCharacterParts(laraScene);
  }, [laraScene]);

  const torsoMeshes = useMemo(
    () => [...parts.torsoClothed, ...parts.torsoNude, ...parts.bikiniTop].map(item => item.mesh),
    [parts],
  );

  useLayoutEffect(() => {
    laraScene.scale.set(1, 1, 1);
    laraScene.position.set(0, 0, 0);
    laraScene.rotation.set(0, 0, 0);

    const hb = laraScene.getObjectByName('head_neck_upper') || laraScene.getObjectByName('head') || laraScene.getObjectByName('Head');
    if (hb) {
      hb.children = hb.children.filter(c => c.name !== 'MarissaCupidPiercing' && c.name !== 'MarissaNostrilPiercing');
    }
    laraScene.userData.hasMarissaPiercings = false;

    applyLaraVariantStyles(laraScene, laraVariant);
    const nativeHairSet = new Set(parts.nativeHairMeshes.map(item => item.mesh));
    const torsoClothedSet = new Set(parts.torsoClothed.map(item => item.mesh));

    const ownedGeometries: THREE.BufferGeometry[] = [];
    const BUST_MIN_Y = 1.22;

    laraScene.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.layers.set(LAYER_DECOR);
      const isPiercing = mesh.name === 'MarissaCupidPiercing' || mesh.name === 'MarissaNostrilPiercing';
      const isNecklace = Boolean(mesh.userData?.isNecklaceCord || mesh.userData?.isPendant);
      const keepVisible = isPiercing || isNecklace || (isHeadMesh(mesh) && !nativeHairSet.has(mesh)) || torsoClothedSet.has(mesh);
      mesh.visible = keepVisible;

      if (keepVisible && !isPiercing && !isNecklace && mesh.geometry) {
        const posAttr = mesh.geometry.attributes.position;
        if (posAttr) {
          let hasLowVertex = false;
          for (let i = 0; i < posAttr.count; i++) {
            if (posAttr.getY(i) < BUST_MIN_Y) {
              hasLowVertex = true;
              break;
            }
          }
          if (hasLowVertex) {
            const cleanGeo = mesh.geometry.clone();
            const cleanPos = cleanGeo.attributes.position;

            if (cleanGeo.index) {
              const oldIdx = cleanGeo.index;
              const keptIndices: number[] = [];
              for (let i = 0; i < oldIdx.count; i += 3) {
                const i0 = oldIdx.getX(i);
                const i1 = oldIdx.getX(i + 1);
                const i2 = oldIdx.getX(i + 2);
                if (cleanPos.getY(i0) >= BUST_MIN_Y && cleanPos.getY(i1) >= BUST_MIN_Y && cleanPos.getY(i2) >= BUST_MIN_Y) {
                  keptIndices.push(i0, i1, i2);
                }
              }
              cleanGeo.setIndex(keptIndices);
            }

            // Clamp unreferenced stray low vertices so computeBoundingBox() ignores them
            let anchorX = 0, anchorY = 1.35, anchorZ = 0;
            for (let i = 0; i < cleanPos.count; i++) {
              if (cleanPos.getY(i) >= BUST_MIN_Y) {
                anchorX = cleanPos.getX(i);
                anchorY = cleanPos.getY(i);
                anchorZ = cleanPos.getZ(i);
                break;
              }
            }
            for (let i = 0; i < cleanPos.count; i++) {
              if (cleanPos.getY(i) < BUST_MIN_Y) {
                cleanPos.setXYZ(i, anchorX, anchorY, anchorZ);
              }
            }
            cleanPos.needsUpdate = true;
            cleanGeo.computeBoundingBox();
            cleanGeo.computeBoundingSphere();
            if ((mesh as THREE.SkinnedMesh).boundingBox && cleanGeo.boundingBox) {
              (mesh as THREE.SkinnedMesh).boundingBox!.copy(cleanGeo.boundingBox);
            }
            mesh.geometry = cleanGeo;
            ownedGeometries.push(cleanGeo);
          }
        }
      }
    });

    const headBone = laraScene.getObjectByName('head_neck_upper') ?? parts.bones.head;
    const headLocal = new THREE.Vector3(0, 1.505, 0);
    if (headBone) {
      const m = new THREE.Matrix4();
      let cur: THREE.Object3D | null = headBone;
      while (cur && cur !== laraScene) {
        cur.updateMatrix();
        m.premultiply(cur.matrix);
        cur = cur.parent;
      }
      headLocal.setFromMatrixPosition(m);
    }

    laraScene.scale.setScalar(LARA_SCALE);
    laraScene.position.set(
      -headLocal.x * LARA_SCALE,
      31.0 - (headLocal.y + LARA_WIG_HEAD_OFFSET) * LARA_SCALE,
      -headLocal.z * LARA_SCALE,
    );
    laraScene.updateMatrixWorld(true);

    return () => {
      disposeLaraVariantMaterials(laraScene);
      ownedGeometries.forEach(g => g.dispose());
    };
  }, [laraScene, parts, laraVariant]);

  // The bust never animates: solve necklace contact once, after its layout effects.
  useEffect(() => {
    pendantRef.current?.update(0, true);
  }, [laraScene, laraVariant]);

  return (
    <group userData={{ sceneItemRoot: true, itemName: 'Buste Lara' }}>
      <primitive object={laraScene} />
      {parts.bones.neck && laraVariant !== 'romana' && (
        <CharacterPendant
          ref={pendantRef}
          neck={parts.bones.neck}
          scene={laraScene}
          torso={torsoMeshes}
          visible={true}
          shadows={false}
          resetKey={`bust:${laraVariant}`}
          variant={laraVariant}
        />
      )}
      <Wig id={wigId} color={hairColor} windEnabled={windEnabled} scale={LARA_SCALE} offset={[0, 31, 0]} fitToLara />
    </group>
  );
}

useGLTF.preload('characters/accessories/wig_mannequin.glb');
// The individual wigs are dynamically loaded by Wig.tsx

