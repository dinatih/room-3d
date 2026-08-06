/**
 * MannequinHead.tsx — Tête de mannequin (GLB media/glb/wig_mannequin.glb).
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
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

interface MannequinHeadProps extends SceneItemProps {
  mannequinId?: string;
  wigIndex?: number;
  hairColor?: string;
  windEnabled?: boolean;
}

const HAIR_COLORS: Record<string, THREE.Color> = {
  naturel:  new THREE.Color(0.4, 0.25, 0.1),
  noir:     new THREE.Color(0.05, 0.03, 0.03),
  brun:     new THREE.Color(0.25, 0.12, 0.05),
  chatain:  new THREE.Color(0.35, 0.18, 0.07),
  blond:    new THREE.Color(0.85, 0.7,  0.3),
  roux:     new THREE.Color(0.7,  0.2,  0.05),
  rouge:    new THREE.Color(0.8,  0.05, 0.05),
  blanc:    new THREE.Color(0.95, 0.95, 0.95),
  bleu:     new THREE.Color(0.05, 0.2,  0.9),
  vert:     new THREE.Color(0.05, 0.7,  0.15),
  rose:     new THREE.Color(0.95, 0.3,  0.65),
  violet:   new THREE.Color(0.5,  0.05, 0.9),
};

const TARGET_H = 45; // cm

// Keep track of used initial wigs to avoid duplicates on startup
let usedInitialWigs: number[] = [];
function getUniqueRandomWig(): number {
  if (usedInitialWigs.length >= 13) usedInitialWigs = [];
  let index;
  do {
    index = Math.floor(Math.random() * 13);
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

// Préfixes des 13 coiffures dans hair_pack_part_2.glb
const HAIR_NUMBERS = ['100','101','102','103','104','105','106','107','108','109','110','111','112'];

export function MannequinHead({ onSize, mannequinId = 'default', wigIndex: initialWigIndex, hairColor: initialHairColor, windEnabled: initialWindEnabled }: MannequinHeadProps) {
  const ref = useRef<THREE.Group>(null!);
  const { scene } = useGLTFClone('media/glb/wig_mannequin.glb');
  const hairPack = useGLTF('media/hair_pack_part_2.glb');

  const [wigIndex, setWigIndex] = useState<number>(initialWigIndex ?? getUniqueRandomWig());
  const [hairColor, setHairColor] = useState<string | undefined>(initialHairColor ?? getUniqueRandomColor());
  const [windEnabled, setWindEnabled] = useState<boolean>(initialWindEnabled ?? false);
  const clonedHairRef = useRef<THREE.Object3D | null>(null);
  const hairBonesRef = useRef<{ bone: THREE.Bone; restQ: THREE.Quaternion; index: number }[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key, value } = (e as CustomEvent).detail;
      if (key === `mannequin-${mannequinId}-random`) {
        const newWig = Math.floor(Math.random() * 13);
        setWigIndex(newWig);
        const colorKeys = Object.keys(HAIR_COLORS);
        colorKeys.push('arc-en-ciel');
        const newColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
        setHairColor(newColor);
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: `mannequin-${mannequinId}-wig`, value: newWig.toString() } }));
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: `mannequin-${mannequinId}-color`, value: newColor } }));
      }
      if (key === `mannequin-${mannequinId}-wig`) {
        setWigIndex(value === -1 || value === '-1' ? Math.floor(Math.random() * 13) : parseInt(value, 10));
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
  }, [mannequinId]);

  useFrame((state) => {
    if (hairColor === 'arc-en-ciel' && clonedHairRef.current) {
      const hue = (state.clock.elapsedTime * 0.2) % 1;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
      clonedHairRef.current.traverse((child: THREE.Object3D) => {
        const m = child as THREE.Mesh;
        if (m.isMesh && m.material) {
          if (Array.isArray(m.material)) {
            m.material.forEach(mat => {
              if (mat && 'color' in mat) (mat as THREE.MeshStandardMaterial).color.copy(color);
            });
          } else if ('color' in m.material) {
            (m.material as THREE.MeshStandardMaterial).color.copy(color);
          }
        }
      });
    }

    if (windEnabled && hairBonesRef.current.length > 0) {
      const t = state.clock.elapsedTime * 3;
      hairBonesRef.current.forEach(({ bone, restQ, index }) => {
        const windX = Math.sin(t + index * 0.5) * 0.15;
        const windZ = Math.cos(t * 0.8 + index * 0.5) * 0.15;
        const windQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(windX, 0, windZ));
        bone.quaternion.copy(restQ).multiply(windQ);
      });
    } else if (!windEnabled && hairBonesRef.current.length > 0) {
      hairBonesRef.current.forEach(({ bone, restQ }) => {
        bone.quaternion.copy(restQ);
      });
    }
  });

  const activeWigNumber = HAIR_NUMBERS[wigIndex] || HAIR_NUMBERS[0];

  useLayoutEffect(() => {
    const group = ref.current;

    // Nettoyer les enfants précédents
    while (group.children.length > 0) group.remove(group.children[0]);

    // ── 1. Tête de mannequin ─────────────────────────────────────────────────
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
    group.add(scene);
    onSize(box.getSize(new THREE.Vector3()));

    // ── 2. Perruque (ajoutée au group wrapper, PAS à scene) ──────────────────
    if (!hairPack?.scene) return;

    // Trouver le nœud racine de la coiffure (ex: "Hair101_ARM_75")
    const prefix = `Hair${activeWigNumber}_ARM_`;
    let sourceGroup: THREE.Object3D | undefined;
    hairPack.scene.traverse(child => {
      if (!sourceGroup && child.name.startsWith(prefix)) sourceGroup = child;
    });
    if (!sourceGroup) return;

    // Cloner avec SkeletonUtils comme dans Walker.tsx
    const clonedHair = SkeletonUtils.clone(sourceGroup as THREE.Object3D);

    // Configurer les matériaux (identique à Walker.tsx)
    clonedHair.traverse((child: THREE.Object3D) => {
      child.frustumCulled = false;
      const m = child as THREE.Mesh;
      if (m.isMesh && m.material) {
        m.visible = true;
        m.renderOrder = 1;
        
        const targetColor = hairColor && HAIR_COLORS[hairColor] ? HAIR_COLORS[hairColor] : null;

        if (Array.isArray(m.material)) {
          m.material = m.material.map(mat => {
            if (!mat) return mat;
            const c = mat.clone();
            c.side = THREE.DoubleSide;
            c.alphaTest = 0.5;
            c.depthWrite = true;
            if (targetColor && 'color' in c) (c as THREE.MeshStandardMaterial).color.copy(targetColor);
            c.needsUpdate = true;
            return c;
          });
        } else if (m.material) {
          const c = m.material.clone() as THREE.MeshStandardMaterial;
          c.side = THREE.DoubleSide;
          c.alphaTest = 0.5;
          c.depthWrite = true;
          if (targetColor) c.color.copy(targetColor);
          c.needsUpdate = true;
          m.material = c;
        }
      }
    });

    hairBonesRef.current = [];
    clonedHair.traverse((child: THREE.Object3D) => {
      const b = child as THREE.Bone;
      if (b.isBone && b.name.toLowerCase().startsWith('bone')) {
        hairBonesRef.current.push({
          bone: b,
          restQ: b.quaternion.clone(),
          index: hairBonesRef.current.length,
        });
      }
    });

    // ── 3. Trouver l'os bip_head de la perruque (même logique que Walker.tsx) ──
    let hairHeadBone: THREE.Object3D | null = null;
    clonedHair.traverse((c: THREE.Object3D) => {
      const nLower = c.name.toLowerCase();
      if ((nLower.startsWith('bip_head') || nLower === 'head') && !hairHeadBone) {
        hairHeadBone = c;
      }
    });

    // ── 4. Calculer bbox des meshes uniquement (pour déterminer le scale) ─────
    clonedHair.scale.set(1, 1, 1);
    clonedHair.position.set(0, 0, 0);
    clonedHair.rotation.set(0, 0, 0);
    clonedHair.updateMatrixWorld(true);

    const hairBox = new THREE.Box3();
    clonedHair.traverse((child: THREE.Object3D) => {
      const m = child as THREE.Mesh;
      if (m.isMesh && m.geometry) {
        m.geometry.computeBoundingBox();
        if (m.geometry.boundingBox) {
          hairBox.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
        }
      }
    });

    if (hairBox.isEmpty()) return;

    // Scaler pour que la hauteur = 70% de TARGET_H (espace cm du wrapper group)
    const hairNativeH = hairBox.getSize(new THREE.Vector3()).y;
    const wigScale = (TARGET_H * 0.70) / hairNativeH;
    clonedHair.scale.setScalar(wigScale);

    // ── 5. Positionner via bip_head comme Walker.tsx ──────────────────────────
    // L'os bip_head de la perruque doit coïncider avec le sommet de la tête du mannequin.
    // TARGET_H * 0.82 = environ le niveau des oreilles/sommet dans l'espace cm du wrapper.
    if (hairHeadBone) {
      clonedHair.updateMatrixWorld(true);
      // Position locale de bip_head dans l'espace du clonedHair (avant scaling world)
      const headPos = (hairHeadBone as THREE.Object3D).position.clone();
      clonedHair.position.set(
        -headPos.x * wigScale,
        TARGET_H * 0.72 - headPos.y * wigScale,
        -headPos.z * wigScale,
      );
    } else {
      // Fallback : centrer XZ sur bbox et placer à 40% de la hauteur
      clonedHair.updateMatrixWorld(true);
      const scaledBox = new THREE.Box3();
      clonedHair.traverse((child: THREE.Object3D) => {
        const m = child as THREE.Mesh;
        if (m.isMesh && m.geometry?.boundingBox) {
          scaledBox.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
        }
      });
      const hairCenter = scaledBox.getCenter(new THREE.Vector3());
      clonedHair.position.set(-hairCenter.x, TARGET_H * 0.40 - scaledBox.min.y, -hairCenter.z);
    }

    clonedHairRef.current = clonedHair;
    group.add(clonedHair);

  }, [scene, hairPack, activeWigNumber, hairColor]);

  return <group ref={ref} />;
}

useGLTF.preload('media/glb/wig_mannequin.glb');
useGLTF.preload('media/hair_pack_part_2.glb');
