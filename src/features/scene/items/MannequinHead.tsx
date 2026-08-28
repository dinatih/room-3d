/**
 * MannequinHead.tsx — Tête de mannequin (GLB characters/accessories/wig_mannequin.glb).
 * Coordonnées locales : centré XZ, Y=0 = base épaules. Scale par hauteur (45 cm).
 * Ajoute une perruque aléatoire depuis hair_pack_part_2.glb (même logique que Walker.tsx).
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
import { useLayoutEffect, useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { Wig, HAIR_COLORS } from './Wig';
import { RiggedWig } from './RiggedWig';
import { WIGS_ITEMS, isRiggedWig } from '@features/inventory/inventoryData';

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
    if (initialHairColor !== undefined) {
      setHairColor(initialHairColor);
    }
  }, [initialHairColor]);

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
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_H / raw.y);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  // Offset d'alignement manuel pour la tête de Mannequin, car son crâne diffère de celui de Lara.
  const MANNEQUIN_WIG_OFFSET: [number, number, number] = [0, 31.0, 0]; // 31cm est environ TARGET_H * 0.69

  return (
    <group ref={ref}>
      <primitive object={scene} />
      {isRiggedWig(activeWigId) ? (
        <RiggedWig
          id={activeWigId.replace('hair_', '')}
          color={hairColor}
          windEnabled={windEnabled}
          offset={MANNEQUIN_WIG_OFFSET}
          scale={1}
        />
      ) : (
        <Wig 
          id={activeWigId.replace('hair_', '')}
          color={hairColor}
          windEnabled={windEnabled}
          offset={MANNEQUIN_WIG_OFFSET}
          scale={1}
        />
      )}
    </group>
  );
}

useGLTF.preload('characters/accessories/wig_mannequin.glb');
// The individual wigs are dynamically loaded by Wig.tsx

